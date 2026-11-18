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

    // Límite de intentos (no depende de la IP: detrás de la red de entrega del hosting varía en cada petición):
    // 10 fallos / 15 min por usuario y 60 fallos / 15 min en total.
    $pdo = db();
    $pdo->prepare('DELETE FROM login_attempts WHERE ts < ?')->execute([time() - 900]);
    $ident = 'u:' . substr($username, 0, 100);
    $count = function (string $id) use ($pdo): int {
        $c = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ident = ?');
        $c->execute([$id]);
        return (int)$c->fetchColumn();
    };
    if ($count($ident) >= 10 || $count('*') >= 60) respond(['error' => 'Demasiados intentos. Espera unos minutos.'], 429);

    $st = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $st->execute([$username]);
    $row = $st->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        $ins = $pdo->prepare('INSERT INTO login_attempts (ident, ts) VALUES (?, ?)');
        $ins->execute([$ident, time()]);
        $ins->execute(['*', time()]);
        usleep(400000);
        respond(['error' => 'Usuario o contraseña incorrectos.'], 401);
    }
    $pdo->prepare('DELETE FROM login_attempts WHERE ident = ?')->execute([$ident]);

    start_session();
    session_regenerate_id(true);
    $_SESSION['uid'] = $row['id'];
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
