<?php
// Genera src/data/schemaSql.ts a partir del esquema real (public/api/schema.php).
// Uso: php scripts/export-schema.php
declare(strict_types=1);
require __DIR__ . '/../public/api/schema.php';

$desc = [
    'cat_etapas_desarrollo' => 'Catálogo de etapas de desarrollo (reemplaza un ENUM frágil).',
    'artistas' => 'Entidad principal del CRM. Perfil artístico, etapa de desarrollo y datos de gestión. Los campos anidados (bio, redes, pipeline, historial) van en `extra` (JSON).',
    'venues' => 'Recintos, bares, teatros y foros, con coordenadas, rating y puntajes. Enlace directo al contacto principal.',
    'contactos' => 'Agentes, promotores y personal de cada recinto. Se eliminan en cascada con su venue.',
    'proveedores' => 'Proveedores técnicos (sonido, iluminación, catering…).',
    'venue_proveedores' => 'Relación N:M entre venues y proveedores.',
    'tours' => 'Giras de un artista, con fechas y estatus.',
    'eventos' => 'Shows y conciertos. Relaciona artista, venue y gira, con el detalle financiero.',
    'contratos' => 'Contratos ligados (opcionalmente) a artista, venue, gira y evento.',
    'proyectos_grabacion' => 'Proyectos de grabación de un artista. Canciones, costos, pagos y etapas van en `extra` (JSON).',
];

$tables = []; $ddl = [];
foreach (schema_tables('mysql') as $sql) {
    if (!preg_match('/CREATE TABLE IF NOT EXISTS (\w+) \(/', $sql, $m) || $m[1] === 'schema_meta') continue;
    $name = $m[1];
    $body = substr($sql, strpos($sql, '(') + 1, strrpos($sql, ')') - strpos($sql, '(') - 1);
    $fks = []; $cols = []; $pk = [];
    foreach (preg_split('/\n/', $body) as $line) {
        $line = trim(rtrim(trim($line), ','));
        if ($line === '') continue;
        if (preg_match('/^FOREIGN KEY \((\w+)\) REFERENCES (\w+)\((\w+)\)(?: ON DELETE ([A-Z ]+))?$/', $line, $f)) {
            $fks[$f[1]] = "Llave foránea → {$f[2]}({$f[3]})" . (isset($f[4]) ? ", al borrar: {$f[4]}" : ', sin borrado en cascada (protege la integridad)');
            continue;
        }
        if (preg_match('/^PRIMARY KEY \(([^)]+)\)$/', $line, $p)) { $pk = array_map('trim', explode(',', $p[1])); continue; }
        if (!preg_match('/^(\w+) ([A-Z]+(?:\(\d+(?:,\d+)?\))?)(.*)$/', $line, $c)) continue;
        $rest = $c[3]; $notes = [];
        if (str_contains($rest, 'NOT NULL')) $notes[] = 'Obligatorio';
        if (preg_match('/DEFAULT (\S+)/', $rest, $d) && $d[1] !== 'NULL') $notes[] = 'Valor por defecto: ' . trim($d[1], "'");
        if (str_contains($rest, 'UNIQUE')) $notes[] = 'Único';
        $cols[] = ['name' => $c[1], 'type' => $c[2], 'key' => str_contains($rest, 'PRIMARY KEY') ? 'PK' : null, 'notes' => implode(' · ', $notes)];
    }
    foreach ($cols as &$c) {
        if (in_array($c['name'], $pk, true)) $c['key'] = 'PK';
        if (isset($fks[$c['name']])) { $c['key'] = $c['key'] ?? 'FK'; $c['notes'] = trim(($c['notes'] ? $c['notes'] . ' · ' : '') . $fks[$c['name']]); }
        if ($c['name'] === 'contacto_principal_id') { $c['key'] = 'FK'; $c['notes'] = trim(($c['notes'] ? $c['notes'] . ' · ' : '') . 'Llave foránea → contactos(id), al borrar: SET NULL (se añade con ALTER por la dependencia circular)'); }
        if ($c['name'] === 'extra') $c['notes'] = 'JSON con los campos anidados que no se consultan como columnas';
        if ($c['name'] === 'deleted_at') $c['notes'] = 'Borrado lógico: NULL = activo';
        if ($c['key'] === null) unset($c['key']);
    }
    unset($c);
    $idx = [];
    foreach (schema_indexes() as $i) if (preg_match('/ ON ' . $name . '\(/', $i)) $idx[] = 'CREATE INDEX ' . $i . ';';
    $tables[] = ['name' => $name, 'description' => $desc[$name] ?? '', 'columns' => $cols, 'indexes' => $idx];
    $ddl[] = preg_replace('/ IF NOT EXISTS/', '', $sql) . ';';
}
$etapas = "INSERT INTO cat_etapas_desarrollo (id, nombre) VALUES\n" . implode(",\n", array_map(fn($n, $i) => "(" . ($i + 1) . ", '$n')", ETAPAS, array_keys(ETAPAS))) . ';';
$alter = 'ALTER TABLE venues ADD CONSTRAINT fk_venues_principal_contact FOREIGN KEY (contacto_principal_id) REFERENCES contactos(id) ON DELETE SET NULL;';
$idxAll = implode("\n", array_map(fn($i) => 'CREATE INDEX ' . $i . ';', schema_indexes()));
$header = "-- ==========================================\n-- FLAMO CRM · ESQUEMA RELACIONAL (MySQL / InnoDB)\n-- Generado desde public/api/schema.php. No editar a mano:\n-- ejecuta `php scripts/export-schema.php` para regenerarlo.\n-- ==========================================\n";
$sqlText = $header . "\n" . implode("\n\n", $ddl) . "\n\n-- Catálogo\n" . $etapas . "\n\n-- Llave circular venues → contactos\n" . $alter . "\n\n-- Índices\n" . $idxAll . "\n";

$ts = "// ARCHIVO GENERADO por scripts/export-schema.php — no editar a mano.\n"
    . "export interface SchemaTableDef { name: string; description: string; columns: { name: string; type: string; key?: 'PK' | 'FK'; notes: string }[]; indexes: string[]; }\n"
    . "export const SCHEMA_TABLES: SchemaTableDef[] = " . json_encode($tables, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . ";\n"
    . "export const SCHEMA_SQL = " . json_encode($sqlText, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
file_put_contents(__DIR__ . '/../src/data/schemaSql.ts', $ts);
echo "OK: " . count($tables) . " tablas, " . count(schema_indexes()) . " índices\n";
