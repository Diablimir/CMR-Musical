<?php
declare(strict_types=1);
// Administración de migraciones (solo Super Admin).
//   GET  /api/migrate.php                          → estado
//   POST /api/migrate.php?action=down&to=N&confirm=yes → revierte hasta la versión N (haz un respaldo antes)
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';

require_admin();
$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') respond(['migrations' => migration_status($pdo)]);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_GET['action'] ?? '') === 'down') {
    if (($_GET['confirm'] ?? '') !== 'yes') respond(['error' => 'Confirma con confirm=yes. Esto revierte la estructura de la base de datos.'], 400);
    $to = (int)($_GET['to'] ?? -1);
    if ($to < 1) respond(['error' => 'Indica la versión destino (to ≥ 1).'], 400);
    try { respond(['ok' => true, 'revertidas' => migrate_down($pdo, $to)]); }
    catch (Throwable $e) { respond(['error' => $e->getMessage()], 409); }
}
respond(['error' => 'Acción no válida.'], 400);
