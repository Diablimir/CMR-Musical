<?php
declare(strict_types=1);

// Utilidades comunes: conexión, sesión, respuestas JSON y comprobaciones de acceso.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function config(): array {
    static $cfg = null;
    if ($cfg === null) {
        $file = __DIR__ . '/config.php';
        if (!is_file($file)) {
            respond(['error' => 'Falta api/config.php (copia config.sample.php).'], 500);
        }
        $cfg = require $file;
    }
    return $cfg;
}

function respond($data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        try {
            $pdo = new PDO($c['db_dsn'], $c['db_user'] ?? null, $c['db_pass'] ?? null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite') $pdo->exec('PRAGMA foreign_keys = ON');
        } catch (Throwable $e) {
            respond(['error' => 'No se pudo conectar a la base de datos.'], 500);
        }
    }
    return $pdo;
}

// Caducidad de sesión: 2 h sin actividad y 12 h en total.
const SESSION_IDLE = 7200;
const SESSION_ABSOLUTE = 43200;
// Roles válidos (el servidor rechaza cualquier otro texto).
const ALLOWED_ROLES = ['Super Admin', 'Administrador', 'Director de Booking', 'Director de Finanzas', 'Gestor de Contenido', 'Abogado Legal CRM'];

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode', '1');   // no acepta identificadores de sesión inventados por el cliente
    ini_set('session.use_only_cookies', '1');
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('flamo_sid');
    session_start();
}

/** Rechaza (413) cuerpos más grandes que $max bytes ANTES de leerlos en memoria. */
function limit_body(int $max): void {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > $max) respond(['error' => 'La solicitud es demasiado grande.'], 413);
}

function body(): array {
    limit_body(2 * 1024 * 1024);
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Protección CSRF: las escrituras exigen una cabecera personalizada
// (un sitio externo no puede enviarla sin permiso CORS).
function require_csrf_header(): void {
    if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE', 'PATCH'], true)
        && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'flamo') {
        respond(['error' => 'Solicitud no válida.'], 403);
    }
}

/** Huella de la contraseña guardada en la sesión: si se cambia la contraseña, las sesiones anteriores dejan de valer. */
function pw_stamp(string $hash): string { return substr(hash('sha256', $hash), 0, 20); }

function current_user(): ?array {
    start_session();
    if (empty($_SESSION['uid'])) return null;
    $now = time();
    if ($now - (int)($_SESSION['t0'] ?? 0) > SESSION_ABSOLUTE || $now - (int)($_SESSION['seen'] ?? 0) > SESSION_IDLE) { $_SESSION = []; session_destroy(); return null; }
    $st = db()->prepare('SELECT id, username, name, role, created_at, password_hash FROM users WHERE id = ?');
    $st->execute([$_SESSION['uid']]);
    $u = $st->fetch();
    if (!$u || !hash_equals((string)($_SESSION['pw'] ?? ''), pw_stamp((string)$u['password_hash']))) { $_SESSION = []; session_destroy(); return null; }
    $_SESSION['seen'] = $now;
    unset($u['password_hash']);
    return $u;
}

function require_login(): array {
    require_csrf_header();
    $u = current_user();
    if (!$u) respond(['error' => 'Sesión no iniciada.'], 401);
    return $u;
}

function require_admin(): array {
    $u = require_login();
    if ($u['role'] !== 'Super Admin') respond(['error' => 'Requiere rol Super Admin.'], 403);
    return $u;
}

// Petición HTTP saliente con cURL. Devuelve [código, cuerpo, cabeceras] (código 0 si falla).
function http_request(string $url, string $method = 'GET', ?string $body = null, array $headers = [], int $timeout = 20): array {
    if (!function_exists('curl_init')) return [0, '', []];
    $ch = curl_init($url);
    $respHeaders = [];
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$respHeaders) {
            $parts = explode(':', $line, 2);
            if (count($parts) === 2) $respHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
            return strlen($line);
        },
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $out = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return [$out === false ? 0 : $code, $out === false ? '' : (string)$out, $respHeaders];
}

function apify_token(): string {
    $t = trim((string)(config()['apify_token'] ?? ''));
    return strlen($t) > 5 ? $t : '';
}

/** IP del cliente (primer salto de X-Forwarded-For si es válido; detrás de la red de entrega del hosting REMOTE_ADDR cambia). */
function client_ip(): string {
    $xff = trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
    if ($xff !== '' && filter_var($xff, FILTER_VALIDATE_IP)) return $xff;
    return (string)($_SERVER['REMOTE_ADDR'] ?? '0');
}

/** Límite de uso para acciones costosas (Apify, Meta, mapas, subidas): máx. $max llamadas por $window s (≤ 900) por clave. Responde 429 si se excede. */
function rate_limit(string $key, int $max, int $window = 600): void {
    $pdo = db(); $now = time(); $ident = 'rl:' . substr($key, 0, 150);
    $pdo->prepare('DELETE FROM login_attempts WHERE ident = ? AND ts < ?')->execute([$ident, $now - $window]);
    $c = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ident = ?'); $c->execute([$ident]);
    if ((int)$c->fetchColumn() >= $max) respond(['error' => 'Demasiadas solicitudes seguidas. Espera unos minutos e inténtalo de nuevo.', 'code' => 'rate_limited'], 429);
    $pdo->prepare('INSERT INTO login_attempts (ident, ts) VALUES (?, ?)')->execute([$ident, $now]);
}
