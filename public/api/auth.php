<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'me') {
    respond(['user' => current_user()]);   // null si no hay sesión (sin error 401 en la consola)
}

if ($method === 'POST' && $action === 'login') {
    require_csrf_header();
    $in = body();
    $username = strtolower(trim((string)($in['username'] ?? '')));
    $password = (string)($in['password'] ?? '');
    if ($username === '' || $password === '') respond(['error' => 'Completa todos los campos.'], 400);

    // Límite de intentos SIN bloqueo global (un anónimo no puede dejar fuera a todos):
    //   10 fallos / 15 min por cuenta+IP · 60 por cuenta (tope si alguien rota su IP) · 40 por IP.
    // La clave usa el ID de la cuenta RESUELTA (así «admín» y «admin» comparten cuota) y los intentos rechazados NO se registran.
    $pdo = db();
    $ip = client_ip();
    $pdo->prepare('DELETE FROM login_attempts WHERE ts < ?')->execute([time() - 900]);
    $st = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $st->execute([$username]);
    $row = $st->fetch();
    $acct = $row ? (string)$row['id'] : 'x:' . $username;
    $idUser = 'ui:' . substr(sha1($acct . '|' . $ip), 0, 40);
    $idAcct = 'ua:' . substr(sha1($acct), 0, 40);
    $idIp = 'ip:' . substr(sha1($ip), 0, 40);
    $count = function (string $id) use ($pdo): int { $c = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ident = ?'); $c->execute([$id]); return (int)$c->fetchColumn(); };
    if ($count($idUser) >= 10 || $count($idAcct) >= 60 || $count($idIp) >= 40) respond(['error' => 'Demasiados intentos. Espera unos minutos.'], 429);
    $ins = $pdo->prepare('INSERT INTO login_attempts (ident, ts) VALUES (?, ?)');   // el intento se cuenta ANTES de verificar (las simultáneas también cuentan)
    foreach ([$idUser, $idAcct, $idIp] as $id) $ins->execute([$id, time()]);

    // Se verifica SIEMPRE contra un hash (aunque el usuario no exista) para que el tiempo de respuesta no revele qué usuarios existen.
    $ok = password_verify($password, $row ? (string)$row['password_hash'] : '$2y$10$yH8amJLvgZy7TZZi6ETGXeQri.QrlUd7I8JNziD6ZAM5KQ29hHxNm');
    if (!$row || !$ok) {
        usleep(300000);
        respond(['error' => 'Usuario o contraseña incorrectos.'], 401);
    }
    $pdo->prepare('DELETE FROM login_attempts WHERE ident IN (?, ?)')->execute([$idUser, $idAcct]);   // éxito: se limpian los fallos de esa cuenta

    start_session();
    session_regenerate_id(true);
    unset($_SESSION['meta_oauth']);   // un flujo de Meta pendiente no se hereda entre cuentas
    $_SESSION['uid'] = $row['id'];
    $_SESSION['t0'] = time();
    $_SESSION['seen'] = time();
    $_SESSION['pw'] = pw_stamp((string)$row['password_hash']);
    unset($row['password_hash']);
    respond(['user' => $row]);
}

if ($method === 'POST' && $action === 'logout') {
    require_csrf_header();
    start_session();
    $_SESSION = [];
    session_destroy();
    respond(['ok' => true]);
}

respond(['error' => 'Acción no válida.'], 400);
