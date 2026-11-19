<?php
declare(strict_types=1);
// Banco de pruebas de escalabilidad: llena una base con volumen alto y mide carga completa, escritura por registro y tamaño de la respuesta.
// Uso: FLAMO_TEST_DSN='mysql:host=127.0.0.1;dbname=flamo_bench;charset=utf8mb4' php scripts/db/bench.php [eventos=20000] [artistas=500] [venues=2000]
const API = __DIR__ . '/../../public/api';
require API . '/schema.php'; require API . '/entities.php';
$pdo = new PDO(getenv('FLAMO_TEST_DSN') ?: 'mysql:host=127.0.0.1;dbname=flamo_bench;charset=utf8mb4', getenv('FLAMO_TEST_USER') ?: 'flamo', getenv('FLAMO_TEST_PASS') ?: 'flamo-pass', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$nE = (int)($argv[1] ?? 20000); $nA = (int)($argv[2] ?? 500); $nV = (int)($argv[3] ?? 2000);
migrate_up($pdo);
$seq = fn(int $n) => "(SELECT a.N + b.N*10 + c.N*100 + d.N*1000 + e.N*10000 + f.N*100000 + 1 n FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) d, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) e, (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) f) s WHERE n <= $n";
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
foreach (['evento_artistas', 'eventos', 'venues', 'artistas'] as $t) $pdo->exec("DELETE FROM $t");
$pdo->exec("INSERT INTO artistas (id, nombre_artistico, etapa_id) SELECT CONCAT('a', n), CONCAT('Artista ', n), 1 FROM {$seq($nA)}");
$pdo->exec("INSERT INTO venues (id, nombre, latitud, longitud, score_rentabilidad) SELECT CONCAT('v', n), CONCAT('Foro ', n), 19 + (n % 100) / 10, -99 - (n % 100) / 10, n % 101 FROM {$seq($nV)}");
$pdo->exec("INSERT INTO eventos (id, nombre, venue_id, fecha, estado, capacidad, asistencia, ingreso_total, gastos_totales, utilidad) SELECT CONCAT('e', n), CONCAT('Show ', n), CONCAT('v', 1 + n % $nV), DATE_ADD('2020-01-01', INTERVAL n % 2000 DAY), 'Completed', 500, 400, 100000, 40000, 60000 FROM {$seq($nE)}");
$pdo->exec("INSERT INTO evento_artistas (evento_id, artista_id, es_principal, orden_presentacion) SELECT CONCAT('e', n), CONCAT('a', 1 + n % $nA), 1, 1 FROM {$seq($nE)}");
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
echo "Datos: $nE eventos · $nA artistas · $nV venues\n";
$t = microtime(true); $m0 = memory_get_peak_usage(true);
$q0 = 0; $all = load_all($pdo); $json = json_encode($all, JSON_UNESCAPED_UNICODE);
printf("Carga completa (GET data.php): %.0f ms · JSON %.1f MB · %.1f MB comprimido (gzip) · memoria pico PHP %.0f MB\n", (microtime(true) - $t) * 1000, strlen($json) / 1048576, strlen(gzencode($json, 6)) / 1048576, (memory_get_peak_usage(true) - $m0) / 1048576);
// escritura de un registro (el cliente sincroniza por diferencias)
$ev = $all['events'][100]; $ev['name'] = 'Editado'; $t = microtime(true);
$r = apply_changes($pdo, ['events' => ['upserts' => [$ev]]]);
printf("Guardar 1 evento (sync por diferencias): %.0f ms\n", (microtime(true) - $t) * 1000);
$t = microtime(true); $n = 0; for ($i = 0; $i < 50; $i++) { $e = $all['events'][200 + $i]; $e['name'] = "Lote $i"; apply_changes($pdo, ['events' => ['upserts' => [$e]]]); $n++; }
printf("50 guardados seguidos: %.0f ms en total (%.0f ms c/u)\n", (microtime(true) - $t) * 1000, (microtime(true) - $t) * 1000 / $n);
