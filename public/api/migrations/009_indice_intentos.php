<?php
declare(strict_types=1);

// Migración 009 — Índice para login_attempts (límites de intentos y de uso).
// Cada login y cada llamada a una integración costosa cuenta filas por `ident`; sin índice, bajo un ataque (decenas de miles de filas)
// esa cuenta recorrería toda la tabla. La tabla la crea install.php (no es parte del esquema relacional), así que si no existe no se hace nada.

return [
    'id' => 9,
    'name' => 'indice_intentos',
    'description' => 'Índice (ident, ts) en login_attempts para que los límites de uso escalen',
    'up' => function (PDO $pdo): string {
        if (!db_table_exists($pdo, 'login_attempts')) return 'login_attempts no existe en esta base: sin cambios';
        if (!db_index_exists($pdo, 'login_attempts', 'idx_la_ident_ts')) $pdo->exec('CREATE INDEX idx_la_ident_ts ON login_attempts (ident, ts)');
        if (!db_index_exists($pdo, 'login_attempts', 'idx_la_ts')) $pdo->exec('CREATE INDEX idx_la_ts ON login_attempts (ts)');
        return 'índices creados en login_attempts';
    },
    'down' => function (PDO $pdo): void {
        if (!db_table_exists($pdo, 'login_attempts')) return;
        foreach (['idx_la_ident_ts', 'idx_la_ts'] as $i) if (db_index_exists($pdo, 'login_attempts', $i)) $pdo->exec("DROP INDEX $i ON login_attempts");
    },
];
