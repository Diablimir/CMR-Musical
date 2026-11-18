<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET' && $action === 'me') {
    $u = current_user();
    if (!$u) respond(['error' => 'Sesión no iniciada.'], 401);
    respond(['user' => $u]);
}

if ($method === 'POST' && $action === 'login') {
    require_csrf_header();
    $in = body();
    $username = strtolower(trim((string)($in['username'] ?? '')));
    $password = (string)($in['password'] ?? '');
    if ($username === '' || $password === '') respond(['error' => 'Completa todos los campos.'], 400);

    // Límite de intentos: 10 fallos cada 15 minutos por usuario + IP
    $ident = substr($username . '|' . ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 190);
    $pdo = db();
    $pdo->prepare('DELETE FROM login_attempts WHERE ts < ?')->execute([time() - 900]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ident = ?');
    $st->execute([$ident]);
    if ((int)$st->fetchColumn() >= 10) respond(['error' => 'Demasiados intentos. Espera unos minutos.'], 429);

    $st = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $st->execute([$username]);
    $row = $st->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        $pdo->prepare('INSERT INTO login_attempts (ident, ts) VALUES (?, ?)')->execute([$ident, time()]);
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
