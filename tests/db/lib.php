<?php
declare(strict_types=1);
// Utilidades de las pruebas de base de datos. Requiere MySQL/MariaDB.
//   FLAMO_TEST_DSN  (por defecto mysql:host=127.0.0.1;dbname=flamo_test;charset=utf8mb4)
//   FLAMO_TEST_USER / FLAMO_TEST_PASS (por defecto flamo / flamo-pass)
define('API', dirname(__DIR__, 2) . '/public/api');

function t_pdo(): PDO {
    $dsn = getenv('FLAMO_TEST_DSN') ?: 'mysql:host=127.0.0.1;dbname=flamo_test;charset=utf8mb4';
    return new PDO($dsn, getenv('FLAMO_TEST_USER') ?: 'flamo', getenv('FLAMO_TEST_PASS') ?: 'flamo-pass', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
    ]);
}
/** Vacía la base de pruebas (borra todas las tablas). */
function t_reset(PDO $pdo): void {
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
    foreach ($pdo->query("SELECT table_name n FROM information_schema.tables WHERE table_schema = DATABASE()")->fetchAll() as $r) $pdo->exec('DROP TABLE IF EXISTS `' . $r['n'] . '`');
    $pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
}

$GLOBALS['t_pass'] = 0; $GLOBALS['t_fail'] = []; $GLOBALS['t_section'] = '';
function t_section(string $s): void { $GLOBALS['t_section'] = $s; echo "\n── $s\n"; }
function t_ok(bool $cond, string $name, string $detail = ''): void {
    if ($cond) { $GLOBALS['t_pass']++; echo "  ✓ $name\n"; }
    else { $GLOBALS['t_fail'][] = $GLOBALS['t_section'] . ' · ' . $name; echo "  ✗ $name" . ($detail ? "  [$detail]" : '') . "\n"; }
}
function t_eq(mixed $actual, mixed $expected, string $name): void {
    t_ok($actual === $expected, $name, 'esperado ' . json_encode($expected, JSON_UNESCAPED_UNICODE) . ' · obtenido ' . json_encode($actual, JSON_UNESCAPED_UNICODE));
}
/** La operación debe fallar (excepción). Devuelve el mensaje. */
function t_throws(callable $f, string $name, ?string $contains = null): ?string {
    try { $f(); t_ok(false, $name, 'no lanzó excepción'); return null; }
    catch (Throwable $e) { $m = $e->getMessage(); t_ok($contains === null || stripos($m, $contains) !== false, $name, "mensaje: $m"); return $m; }
}
function t_done(): void {
    $f = $GLOBALS['t_fail'];
    echo "\n══ " . $GLOBALS['t_pass'] . ' pruebas correctas, ' . count($f) . " fallidas\n";
    foreach ($f as $x) echo "   ✗ $x\n";
    exit($f ? 1 : 0);
}
function t_scalar(PDO $pdo, string $sql, array $args = []): mixed { $st = $pdo->prepare($sql); $st->execute($args); $v = $st->fetchColumn(); return $v === false ? null : $v; }
