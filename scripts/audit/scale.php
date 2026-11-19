<?php
// Evidencia reproducible de la auditoría. Requiere MySQL/MariaDB local con BD `flamo_audit` y usuario `flamo`/`flamo-pass`.
declare(strict_types=1);
require '/home/user/CMR-Musical/public/api/schema.php'; require '/home/user/CMR-Musical/public/api/entities.php';
$pdo = new PDO('mysql:host=127.0.0.1;dbname=flamo_audit;charset=utf8mb4', 'flamo', 'flamo-pass', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
ensure_schema($pdo);
$T = '2026-01-01T00:00:00Z'; mt_srand(7);
$N = ['artists' => 300, 'venues' => 1000, 'events' => 30000];
$ch = ['Rock','Pop','Indie','Urbano','Jazz','Cumbia'];
$changes = ['artists' => ['upserts' => []], 'venues' => ['upserts' => []], 'events' => ['upserts' => []]];
for ($i = 1; $i <= $N['artists']; $i++) $changes['artists']['upserts'][] = ['id' => "art-$i", 'artisticName' => "Artista $i", 'legalName' => "Artista $i SA", 'genre' => $ch[$i % 6], 'stage' => 'Emergente', 'bio' => str_repeat('Biografía ', 40), 'subgenres' => ['Indie'], 'socialMedia' => ['instagram' => "@a$i"], 'pipeline' => [['id' => 'p', 'name' => 'x', 'category' => 'Branding', 'completed' => true]], 'history' => [], 'created_at' => $T, 'updated_at' => $T, 'deleted_at' => null];
for ($i = 1; $i <= $N['venues']; $i++) $changes['venues']['upserts'][] = ['id' => "ven-$i", 'name' => "Foro $i", 'city' => ['CDMX','GDL','MTY'][$i % 3], 'state' => 'X', 'country' => 'México', 'lat' => 19 + $i / 1000, 'lng' => -99, 'rating' => 4.5, 'hours' => ['L-V'], 'created_at' => $T, 'updated_at' => $T, 'deleted_at' => null];
for ($i = 1; $i <= $N['events']; $i++) $changes['events']['upserts'][] = ['id' => "evt-$i", 'name' => "Show $i", 'artistId' => 'art-' . (1 + $i % 300), 'venueId' => 'ven-' . (1 + $i % 1000), 'date' => date('Y-m-d', strtotime('2024-01-01') + ($i % 1000) * 86400), 'capacity' => 500, 'attendance' => 300, 'ticketPrice' => 200, 'totalIncome' => 60000, 'expenses' => 20000, 'profit' => 40000, 'status' => ['Draft','Confirmed','Completed'][$i % 3], 'setlist' => [['id' => 's', 'songTitle' => 'Canción']], 'created_at' => $T, 'updated_at' => $T, 'deleted_at' => null];
$t = microtime(true);
// carga por lotes: artistas y venues primero, luego eventos
apply_changes($pdo, ['artists' => $changes['artists'], 'venues' => $changes['venues']]);
foreach (array_chunk($changes['events']['upserts'], 3000) as $part) apply_changes($pdo, ['events' => ['upserts' => $part]]);
printf("Datos de prueba: %d artistas, %d venues, %d eventos (carga: %.1f s)\n", $N['artists'], $N['venues'], $N['events'], microtime(true) - $t);
// Lo que hace hoy la interfaz al abrir: cargar TODO
$t = microtime(true); $all = load_all($pdo); $json = json_encode($all); $dt = microtime(true) - $t;
printf("GET /api/data.php (carga completa): %.2f s · %.1f MB de JSON · %d MB de memoria PHP\n", $dt, strlen($json) / 1048576, memory_get_peak_usage(true) / 1048576);
$pdo->exec('ANALYZE TABLE eventos, artistas, venues');
$ex = function (string $label, string $sql) use ($pdo) { $r = $pdo->query("EXPLAIN $sql")->fetch(); printf("%-52s tipo=%-6s índice=%-26s filas≈%s\n", $label, $r['type'], $r['key'] ?? 'NINGUNO', $r['rows']); };
echo "\nEXPLAIN de consultas representativas (30 000 eventos):\n";
$ex('Eventos de un artista',                      "SELECT * FROM eventos WHERE artista_id='art-5'");
$ex('Eventos de un venue',                        "SELECT * FROM eventos WHERE venue_id='ven-5'");
$ex('Eventos de un mes (rango de fecha)',         "SELECT * FROM eventos WHERE fecha BETWEEN '2025-03-01' AND '2025-03-31'");
$ex('Eventos de un artista en un año',            "SELECT * FROM eventos WHERE artista_id='art-5' AND fecha BETWEEN '2025-01-01' AND '2025-12-31'");
$ex('Eventos por estado',                         "SELECT * FROM eventos WHERE estado='Completed'");
$ex("Búsqueda de artista por prefijo ('Artista 1%')", "SELECT * FROM artistas WHERE nombre_artistico LIKE 'Artista 1%'");
$ex("Búsqueda de artista por contenido ('%tista 1%')", "SELECT * FROM artistas WHERE nombre_artistico LIKE '%tista 1%'");
$ex('Búsqueda de venue por ciudad',               "SELECT * FROM venues WHERE ciudad='GDL'");
$ex('Contratos de un evento',                     "SELECT * FROM contratos WHERE evento_id='evt-5'");
