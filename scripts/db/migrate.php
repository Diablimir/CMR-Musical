<?php
// Administración de migraciones desde la terminal (SSH o local).
//   php scripts/db/migrate.php status
//   php scripts/db/migrate.php up
//   php scripts/db/migrate.php down <versión_destino>     (ej.: down 1 revierte 3 y 2; HAZ UN RESPALDO ANTES)
// Usa la conexión de public/api/config.php.
declare(strict_types=1);
$api = dirname(__DIR__, 2) . '/public/api';
require $api . '/schema.php';
$cfg = require $api . '/config.php';
$pdo = new PDO($cfg['db_dsn'], $cfg['db_user'] ?? null, $cfg['db_pass'] ?? null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$cmd = $argv[1] ?? 'status';
switch ($cmd) {
    case 'status':
        foreach (migration_status($pdo) as $m) printf("  %s %03d  %-26s %s\n", $m['applied'] ? '✓' : '·', $m['id'], $m['name'], $m['description']);
        break;
    case 'up':
        $done = migrate_up($pdo); echo $done ? 'Aplicadas: ' . implode(', ', $done) . "\n" : "Nada pendiente.\n";
        break;
    case 'down':
        $to = (int)($argv[2] ?? 0);
        if ($to < 1) { fwrite(STDERR, "Indica la versión destino (≥ 1). Ej.: down 1\n"); exit(2); }
        echo 'Revertidas: ' . implode(', ', migrate_down($pdo, $to)) . "\n";
        break;
    default: fwrite(STDERR, "Comandos: status | up | down <versión>\n"); exit(2);
}
