<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$me = require_login();
$pdo = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query('SELECT id, username, name, role, created_at FROM users ORDER BY created_at, username')->fetchAll();
    respond(['users' => $rows]);
}

require_admin();
$in = body();

if ($method === 'POST') {
    $username = strtolower(trim((string)($in['username'] ?? '')));
    $name = trim((string)($in['name'] ?? ''));
    $role = trim((string)($in['role'] ?? ''));
    $password = (string)($in['password'] ?? '');
    if (!preg_match('/^[a-z0-9._-]{3,64}$/', $username)) respond(['error' => 'Usuario inválido (3-64 letras, números, . _ -).'], 400);
    if ($name === '' || $role === '') respond(['error' => 'Nombre y rol son obligatorios.'], 400);
    if (!in_array($role, ALLOWED_ROLES, true)) respond(['error' => 'Rol no válido.'], 400);
    if (strlen($password) < 8) respond(['error' => 'La contraseña debe tener al menos 8 caracteres.'], 400);

    $st = $pdo->prepare('SELECT COUNT(*) FROM users WHERE username = ?');
    $st->execute([$username]);
    if ((int)$st->fetchColumn() > 0) respond(['error' => 'Ese usuario ya existe.'], 409);

    $id = 'usr-' . bin2hex(random_bytes(6));
    $pdo->prepare('INSERT INTO users (id, username, name, role, password_hash, created_at) VALUES (?,?,?,?,?,?)')
        ->execute([$id, $username, $name, $role, password_hash($password, PASSWORD_DEFAULT), date('Y-m-d')]);
    respond(['ok' => true, 'id' => $id], 201);
}

$id = (string)($_GET['id'] ?? '');
$st = $pdo->prepare('SELECT * FROM users WHERE id = ?');
$st->execute([$id]);
$target = $st->fetch();
if (!$target) respond(['error' => 'Usuario no encontrado.'], 404);

function other_admins(PDO $pdo, string $excludeId): int {
    $st = $pdo->prepare("SELECT COUNT(*) FROM users WHERE role = 'Super Admin' AND id <> ?");
    $st->execute([$excludeId]);
    return (int)$st->fetchColumn();
}

if ($method === 'PUT') {
    $pdo->beginTransaction();
    try {
        // Primero se bloquean los Super Admin y la fila objetivo; DESPUÉS se relee (si no, un cambio simultáneo podría restaurar datos viejos).
        $pdo->query("SELECT id FROM users WHERE role = 'Super Admin'" . for_update($pdo))->fetchAll();
        $st = $pdo->prepare('SELECT * FROM users WHERE id = ?' . for_update($pdo)); $st->execute([$id]);
        $target = $st->fetch();
        if (!$target) { $pdo->rollBack(); respond(['error' => 'Usuario no encontrado.'], 404); }
        $name = trim((string)($in['name'] ?? $target['name']));
        $role = trim((string)($in['role'] ?? $target['role']));
        if ($name === '' || $role === '') { $pdo->rollBack(); respond(['error' => 'Nombre y rol son obligatorios.'], 400); }
        if (!in_array($role, ALLOWED_ROLES, true)) { $pdo->rollBack(); respond(['error' => 'Rol no válido.'], 400); }
        if ($target['role'] === 'Super Admin' && $role !== 'Super Admin' && other_admins($pdo, $id) === 0) { $pdo->rollBack(); respond(['error' => 'Debe quedar al menos un Super Admin.'], 400); }
        $newHash = null;
        if (isset($in['password']) && $in['password'] !== '') {
            if (strlen((string)$in['password']) < 8) { $pdo->rollBack(); respond(['error' => 'La contraseña debe tener al menos 8 caracteres.'], 400); }
            $newHash = password_hash((string)$in['password'], PASSWORD_DEFAULT);
        }
        // El hash solo se toca si se pidió cambiar la contraseña (un PUT simultáneo sin contraseña no puede reactivar sesiones viejas).
        if ($newHash !== null) $pdo->prepare('UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?')->execute([$name, $role, $newHash, $id]);
        else $pdo->prepare('UPDATE users SET name = ?, role = ? WHERE id = ?')->execute([$name, $role, $id]);
        $pdo->commit();
    } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
    if ($newHash !== null && $id === $me['id']) { start_session(); $_SESSION['pw'] = pw_stamp($newHash); }   // quien cambia su propia contraseña sigue dentro; las demás sesiones se cierran
    respond(['ok' => true]);
}

if ($method === 'DELETE') {
    if ($id === $me['id']) respond(['error' => 'No puedes eliminar tu propia cuenta.'], 400);
    $pdo->beginTransaction();
    try {
        $pdo->query("SELECT id FROM users WHERE role = 'Super Admin'" . for_update($pdo))->fetchAll();
        $st = $pdo->prepare('SELECT * FROM users WHERE id = ?' . for_update($pdo)); $st->execute([$id]);
        $t = $st->fetch();
        if (!$t) { $pdo->rollBack(); respond(['error' => 'Usuario no encontrado.'], 404); }
        if ($t['role'] === 'Super Admin' && other_admins($pdo, $id) === 0) { $pdo->rollBack(); respond(['error' => 'Debe quedar al menos un Super Admin.'], 400); }
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
        $pdo->commit();
    } catch (Throwable $e) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $e; }
    respond(['ok' => true]);
}

respond(['error' => 'Método no permitido.'], 405);
