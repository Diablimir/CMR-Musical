<?php
declare(strict_types=1);

// Ejecutor de migraciones de esquema (MySQL / MariaDB).
// Cada migración vive en migrations/NNN_nombre.php y devuelve ['id','name','description','up','down'].
// Se aplican en orden, una sola vez, con un candado para que dos peticiones no migren a la vez.
// El DDL de MySQL no es transaccional: por eso cada paso es idempotente (se puede reanudar).

const ETAPAS = ['Desarrollo', 'Aficionado', 'Emergente', 'Media carrera', 'Consolidado', 'Consagrado', 'Internacional'];

function db_col_exists(PDO $pdo, string $table, string $col): bool {
    $st = $pdo->prepare('SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?');
    $st->execute([$table, $col]);
    return (bool)$st->fetchColumn();
}
function db_col_type(PDO $pdo, string $table, string $col): ?string {
    $st = $pdo->prepare('SELECT data_type FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?');
    $st->execute([$table, $col]);
    $v = $st->fetchColumn();
    return $v === false ? null : strtolower((string)$v);
}
function db_table_exists(PDO $pdo, string $table): bool {
    $st = $pdo->prepare('SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?');
    $st->execute([$table]);
    return (bool)$st->fetchColumn();
}
function db_index_exists(PDO $pdo, string $table, string $index): bool {
    $st = $pdo->prepare('SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?');
    $st->execute([$table, $index]);
    return (bool)$st->fetchColumn();
}
function db_constraint_exists(PDO $pdo, string $table, string $name): bool {
    $st = $pdo->prepare('SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ?');
    $st->execute([$table, $name]);
    return (bool)$st->fetchColumn();
}
/** Nombres de las llaves foráneas de una tabla que apuntan a $refTable. */
function db_fk_names(PDO $pdo, string $table, ?string $refTable = null): array {
    $sql = 'SELECT constraint_name FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND table_name = ?';
    $args = [$table];
    if ($refTable !== null) { $sql .= ' AND referenced_table_name = ?'; $args[] = $refTable; }
    $st = $pdo->prepare($sql);
    $st->execute($args);
    return array_column($st->fetchAll(), 'constraint_name');
}
function db_exec_ignore(PDO $pdo, string $sql): void {
    try { $pdo->exec($sql); } catch (Throwable $e) { /* ya aplicado */ }
}

/** @return array<int,array> migraciones ordenadas por id */
function load_migrations(): array {
    static $cache = null;           // los archivos declaran funciones/constantes: solo se cargan una vez
    if ($cache !== null) return $cache;
    $out = [];
    foreach (glob(__DIR__ . '/migrations/[0-9][0-9][0-9]_*.php') ?: [] as $file) {
        $m = require $file;
        $m['file'] = $file;
        $m['checksum'] = md5((string)file_get_contents($file));
        $out[$m['id']] = $m;
    }
    ksort($out);
    return $cache = $out;
}

function migrations_table(PDO $pdo): void {
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
        version INT NOT NULL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        aplicada_en DATETIME(3) NOT NULL,
        checksum CHAR(32) NOT NULL,
        notas TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
    if (!db_col_exists($pdo, 'schema_migrations', 'notas')) $pdo->exec('ALTER TABLE schema_migrations ADD COLUMN notas TEXT NULL');
    // Instalaciones anteriores a este ejecutor: ya tienen el esquema v1.
    if (db_table_exists($pdo, 'artistas') && (int)$pdo->query('SELECT COUNT(*) FROM schema_migrations')->fetchColumn() === 0) {
        $pdo->prepare('INSERT INTO schema_migrations (version, nombre, aplicada_en, checksum) VALUES (1, ?, NOW(3), ?)')
            ->execute(['baseline_v1 (preexistente)', str_repeat('0', 32)]);
    }
}

function applied_versions(PDO $pdo): array {
    return array_map('intval', array_column($pdo->query('SELECT version FROM schema_migrations ORDER BY version')->fetchAll(), 'version'));
}

function migration_status(PDO $pdo): array {
    migrations_table($pdo);
    $applied = applied_versions($pdo);
    $out = [];
    foreach (load_migrations() as $id => $m) $out[] = ['id' => $id, 'name' => $m['name'], 'description' => $m['description'], 'applied' => in_array($id, $applied, true)];
    return $out;
}

/** Aplica migraciones pendientes (hasta $to, si se indica). Devuelve los ids aplicados. */
function migrate_up(PDO $pdo, ?int $to = null): array {
    migrations_table($pdo);
    $lock = (int)$pdo->query("SELECT GET_LOCK('flamo_migrations', 60)")->fetchColumn();
    if ($lock !== 1) throw new RuntimeException('Otra actualización de la base de datos está en curso.');
    $done = [];
    try {
        $applied = applied_versions($pdo);
        foreach (load_migrations() as $id => $m) {
            if (in_array($id, $applied, true) || ($to !== null && $id > $to)) continue;
            $nota = ($m['up'])($pdo);
            $pdo->prepare('INSERT INTO schema_migrations (version, nombre, aplicada_en, checksum, notas) VALUES (?, ?, NOW(3), ?, ?)')
                ->execute([$id, $m['name'], $m['checksum'], is_string($nota) ? $nota : null]);
            $done[] = $id;
        }
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('flamo_migrations')")->fetchAll();
    }
    return $done;
}

/** Revierte migraciones aplicadas con id > $to, de la más reciente a la más antigua. */
function migrate_down(PDO $pdo, int $to): array {
    migrations_table($pdo);
    $lock = (int)$pdo->query("SELECT GET_LOCK('flamo_migrations', 60)")->fetchColumn();
    if ($lock !== 1) throw new RuntimeException('Otra actualización de la base de datos está en curso.');
    $undone = [];
    try {
        $migs = load_migrations();
        foreach (array_reverse(applied_versions($pdo)) as $id) {
            if ($id <= $to) break;
            if (!isset($migs[$id])) throw new RuntimeException("No existe el archivo de la migración $id.");
            ($migs[$id]['down'])($pdo);
            $pdo->prepare('DELETE FROM schema_migrations WHERE version = ?')->execute([$id]);
            $undone[] = $id;
        }
    } finally {
        $pdo->query("SELECT RELEASE_LOCK('flamo_migrations')")->fetchAll();
    }
    return $undone;
}

/** Garantiza que el esquema esté al día. Ruta rápida: una sola consulta. */
function ensure_schema(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $latest = max(array_keys(load_migrations()));
    try {
        if ((int)$pdo->query('SELECT MAX(version) FROM schema_migrations')->fetchColumn() >= $latest) { $done = true; return; }
    } catch (Throwable $e) { /* aún no existe schema_migrations */ }
    migrate_up($pdo);
    require_once __DIR__ . '/entities.php';
    migrate_legacy_collections($pdo);
    $done = true;
}
