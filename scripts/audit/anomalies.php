<?php
// Evidencia reproducible de la auditoría. Requiere MySQL/MariaDB local con BD `flamo_audit` y usuario `flamo`/`flamo-pass`.
declare(strict_types=1);
require '/home/user/CMR-Musical/public/api/schema.php'; require '/home/user/CMR-Musical/public/api/entities.php';
$pdo = new PDO('mysql:host=127.0.0.1;dbname=flamo_audit;charset=utf8mb4', 'flamo', 'flamo-pass', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
ensure_schema($pdo);
$T = '2026-01-01T00:00:00Z';
$pdo->exec("INSERT INTO artistas (id,nombre_artistico,genero,etapa_id,created_at) VALUES ('A','Banda A','Indie Rock, Pop, Urbano',1,'$T'),('B','Banda B','Pop Rock',1,'$T'),('C','Banda C','Pop',1,'$T')");
$pdo->exec("INSERT INTO venues (id,nombre,ciudad,created_at) VALUES ('V1','Foro 1','CDMX','$T'),('V2','Foro 2','GDL','$T')");
$pdo->exec("INSERT INTO tours (id,artista_id,nombre,created_at) VALUES ('T-B','B','Gira de B','$T')");
$test = function (string $n, callable $f) { try { $f(); echo "ANOMALÍA PERMITIDA  · $n\n"; } catch (Throwable $e) { echo "bloqueada           · $n\n"; } };
$test('1. Evento del artista A dentro de la gira del artista B', fn() => $pdo->exec("INSERT INTO eventos (id,nombre,artista_id,venue_id,tour_id,created_at) VALUES ('E1','Show','A','V1','T-B','$T')"));
$test('2. Contrato ligado al evento E1 pero con otro artista y otro venue', fn() => $pdo->exec("INSERT INTO contratos (id,titulo,artista_id,venue_id,evento_id) VALUES ('K1','Contrato','C','V2','E1')"));
$test('3. Ingreso total que no corresponde a asistencia × precio', fn() => $pdo->exec("UPDATE eventos SET asistencia=100, precio_boleto=10, ingreso_total=99999 WHERE id='E1'"));
$test('4. Puntaje de venue = 500 (el rango válido es 0–100)', fn() => $pdo->exec("UPDATE venues SET score_rentabilidad=500 WHERE id='V1'"));
$test('5. Rating de venue = 9.9 (el rango válido es 0–5)', fn() => $pdo->exec("UPDATE venues SET rating=9.9 WHERE id='V1'"));
$test("6. Estado de evento inventado: 'Cualquier cosa'", fn() => $pdo->exec("UPDATE eventos SET estado='Cualquier cosa' WHERE id='E1'"));
$test('7. Evento con fecha de fin anterior al inicio (gira)', fn() => $pdo->exec("UPDATE tours SET fecha_inicio='2026-12-01', fecha_fin='2026-01-01' WHERE id='T-B'"));
$pdo->exec("DELETE FROM eventos WHERE id='E1'");
$pdo->exec("DELETE FROM venues WHERE id='V2'");
echo "8. Historial contractual: tras borrar el venue V2, contrato K1 → venue_id = ", var_export($pdo->query("SELECT venue_id FROM contratos WHERE id='K1'")->fetchColumn(), true), " (se perdió la parte contractual sin dejar rastro)\n";
echo "9. Consulta por género 'Pop':  LIKE '%Pop%' devuelve ", $pdo->query("SELECT COUNT(*) FROM artistas WHERE genero LIKE '%Pop%'")->fetchColumn(), " artistas (A, B y C; solo C es 'Pop' exacto → falsos positivos)\n";
$r = $pdo->query("SELECT COUNT(*) c FROM information_schema.table_constraints WHERE constraint_schema='flamo_audit' AND constraint_type='CHECK'")->fetchColumn();
echo "10. Restricciones CHECK existentes en el esquema: $r\n";
