<?php
// Evidencia reproducible de la auditoría. Requiere MySQL/MariaDB local con BD `flamo_audit` y usuario `flamo`/`flamo-pass`.
$pdo = new PDO('mysql:host=127.0.0.1;dbname=flamo_audit;charset=utf8mb4', 'flamo', 'flamo-pass', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true]);
$pdo->query('ANALYZE TABLE eventos, artistas, venues')->fetchAll();
$ex = function (string $label, string $sql) use ($pdo) { $r = $pdo->query("EXPLAIN $sql")->fetchAll()[0]; printf("%-54s tipo=%-6s índice=%-26s filas≈%s\n", $label, $r['type'], $r['key'] ?? 'NINGUNO', $r['rows']); };
echo "EXPLAIN de consultas representativas (30 000 eventos, 1 000 venues, 300 artistas):\n";
$ex('Eventos de un artista',                           "SELECT * FROM eventos WHERE artista_id='art-5'");
$ex('Eventos de un venue',                             "SELECT * FROM eventos WHERE venue_id='ven-5'");
$ex('Eventos de un mes (rango de fecha)',              "SELECT * FROM eventos WHERE fecha BETWEEN '2025-03-01' AND '2025-03-31'");
$ex('Eventos de un artista en un año',                 "SELECT * FROM eventos WHERE artista_id='art-5' AND fecha BETWEEN '2025-01-01' AND '2025-12-31'");
$ex("Eventos por estado ('Completed')",                "SELECT * FROM eventos WHERE estado='Completed'");
$ex("Artista por prefijo ('Artista 1%')",              "SELECT * FROM artistas WHERE nombre_artistico LIKE 'Artista 1%'");
$ex("Artista por contenido ('%tista 1%')",             "SELECT * FROM artistas WHERE nombre_artistico LIKE '%tista 1%'");
$ex("Venues por ciudad ('GDL')",                       "SELECT * FROM venues WHERE ciudad='GDL'");
$ex('Contratos de un evento',                          "SELECT * FROM contratos WHERE evento_id='evt-5'");
$ex('Carga completa de eventos (lo que hace hoy la app)', "SELECT * FROM eventos ORDER BY id");
echo "\nSelectividad de índices (valores distintos / filas):\n";
foreach ([['eventos','estado'],['eventos','fecha'],['eventos','artista_id'],['eventos','venue_id'],['artistas','deleted_at'],['venues','ciudad']] as [$t,$c]) {
  $r = $pdo->query("SELECT COUNT(DISTINCT $c) d, COUNT(*) n FROM $t")->fetchAll()[0]; printf("  %-9s.%-12s %6d distintos de %6d filas (%.2f%%)\n", $t, $c, $r['d'], $r['n'], 100*$r['d']/$r['n']);
}
echo "\nÍndices por tabla (hoy):\n"; foreach ($pdo->query("SELECT table_name t, COUNT(DISTINCT index_name) n FROM information_schema.statistics WHERE table_schema='flamo_audit' GROUP BY table_name ORDER BY n DESC")->fetchAll() as $r) printf("  %-22s %d\n", $r['t'], $r['n']);
