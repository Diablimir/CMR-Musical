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
        } catch (Throwable $e) {
            respond(['error' => 'No se pudo conectar a la base de datos.'], 500);
        }
    }
    return $pdo;
}

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
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

function body(): array {
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

function current_user(): ?array {
    start_session();
    if (empty($_SESSION['uid'])) return null;
    $st = db()->prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?');
    $st->execute([$_SESSION['uid']]);
    return $st->fetch() ?: null;
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
