<?php
declare(strict_types=1);
// Instalador de un solo uso. Abre: /api/install.php?token=TU_TOKEN
// Crea las tablas y el usuario "admin". DESPUÉS BORRA ESTE ARCHIVO del servidor.
require __DIR__ . '/bootstrap.php';

$cfg = config();
$token = (string)($cfg['install_token'] ?? '');
if ($token === '' || str_starts_with($token, 'CAMBIA') || !hash_equals($token, (string)($_GET['token'] ?? ''))) {
    respond(['error' => 'Token inválido.'], 403);
}
$adminPass = (string)($cfg['admin_initial_password'] ?? '');
if (strlen($adminPass) < 8 || str_starts_with($adminPass, 'CAMBIA')) {
    respond(['error' => 'Define admin_initial_password (mínimo 8 caracteres) en config.php.'], 400);
}

$pdo = db();
$pdo->exec('CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    role VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at VARCHAR(20) NOT NULL
)');
$pdo->exec('CREATE TABLE IF NOT EXISTS login_attempts (
    ident VARCHAR(190) NOT NULL,
    ts INT NOT NULL
)');

$exists = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
if ($exists === 0) {
    $st = $pdo->prepare('INSERT INTO users (id, username, name, role, password_hash, created_at) VALUES (?,?,?,?,?,?)');
    $st->execute(['usr-' . bin2hex(random_bytes(6)), 'admin', 'Administrador Principal', 'Super Admin',
        password_hash($adminPass, PASSWORD_DEFAULT), date('Y-m-d')]);
    respond(['ok' => true, 'message' => 'Tablas creadas y usuario admin generado. BORRA api/install.php ahora.']);
}
respond(['ok' => true, 'message' => 'Tablas verificadas (ya existían usuarios). BORRA api/install.php.']);
