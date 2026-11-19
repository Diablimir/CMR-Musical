<?php
// Genera, a partir de una base MIGRADA (la fuente de verdad), la documentación del esquema:
//   docs/database/schema.sql, docs/database/DATA_DICTIONARY.md, docs/database/er.mmd,
//   y src/data/schemaSql.ts (lo que muestra la pestaña «Esquema & DB»).
// Uso:  FLAMO_TEST_DSN=... php scripts/db/generate-docs.php     (crea una base limpia, migra y documenta)
declare(strict_types=1);
require __DIR__ . '/../../tests/db/lib.php';
require API . '/schema.php';

$pdo = t_pdo();
t_reset($pdo);
migrate_up($pdo);
$pdo->exec("INSERT INTO schema_migrations (version, nombre, aplicada_en, checksum) SELECT 0, 'noop', NOW(3), '' FROM DUAL WHERE FALSE");

// ───────── Documentación manual: propósito, cardinalidad y dependencias funcionales ─────────
const TABLES = [
    'cat_etapas_desarrollo' => ['Catálogo cerrado de etapas de carrera de un artista (Desarrollo … Internacional).', '1 etapa — N artistas', 'id → nombre; nombre → id (clave candidata)'],
    'cat_generos' => ['Catálogo abierto de géneros musicales. Evita guardar listas de géneros separadas por comas.', '1 género — N artistas (vía artista_generos)', 'id → nombre, descripcion; nombre → id (clave candidata, sin distinguir mayúsculas)'],
    'cat_roles_contacto' => ['Catálogo abierto de roles que una persona puede tener en una entidad (Manager, Booking, Promotor…). Unifica «Booking» y «booking».', '1 rol — N vínculos de contacto', 'id → nombre; nombre → id'],
    'cat_monedas' => ['Catálogo de monedas (ISO 4217) para honorarios.', '1 moneda — N participaciones en eventos', 'codigo → nombre'],
    'artistas' => ['Entidad principal: perfil del artista o agrupación. Bio, sello y ajustes de foto son columnas; redes, idiomas, integrantes, pipeline e hitos viven en tablas hijas (Fase 3).', '1 artista — N géneros, contactos, giras, eventos, proyectos, contratos', 'id → todas las columnas. Dependencia transitiva ciudad → estado → pais aceptada como excepción de 3FN (dirección postal como valor; ver DATABASE_AUDIT §3).'],
    'artista_generos' => ['Géneros de un artista (N:M). Un género es el principal; el resto, secundarios.', 'N artistas — M géneros', '(artista_id, genero_id) → es_principal, orden. Un solo principal por artista (UNIQUE sobre es_principal con NULL).'],
    'venues' => ['Recintos, foros, teatros y bares, con coordenadas, calificación y puntajes. Sitio web, reseñas y demás datos de ficha son columnas; horarios y bandas locales viven en tablas hijas (Fase 3).', '1 venue — N contactos, eventos, contratos; N:M proveedores', 'id → todas las columnas. codigo_postal/ciudad/estado/pais: misma excepción de 3FN que artistas.'],
    'contactos' => ['Persona (o empresa) independiente de cualquier entidad. Sus medios de contacto y vínculos viven en tablas propias.', '1 contacto — N correos, N teléfonos, N vínculos con venues/artistas/proveedores', 'id → nombre, apellidos, version, created_at, updated_at. 1FN: nombre completo = nombre + apellidos.'],
    'contacto_correos' => ['Correos electrónicos de un contacto (uno principal).', '1 contacto — N correos', 'id → todas; (contacto_id, correo) clave candidata; un solo principal por contacto.'],
    'contacto_telefonos' => ['Teléfonos de un contacto (uno principal).', '1 contacto — N teléfonos', 'id → todas; (contacto_id, telefono) clave candidata; un solo principal por contacto.'],
    'venue_contactos' => ['Vínculo contacto ↔ venue con su rol; marca al contacto principal del venue. Reemplaza `venues.contacto_principal_id` y elimina la dependencia circular.', 'N venues — M contactos', '(venue_id, contacto_id, rol_id) → es_principal. Un solo principal por venue (garantiza que el principal pertenece al venue).'],
    'artista_contactos' => ['Vínculo contacto ↔ artista con rol (Manager, Booking…). Sustituye a los textos `manager` y `booking_agent`.', 'N artistas — M contactos', '(artista_id, contacto_id, rol_id) → es_principal. Un principal por (artista, rol).'],
    'proveedor_contactos' => ['Vínculo contacto ↔ proveedor con rol. Sustituye a las columnas contacto/telefono/correo del proveedor.', 'N proveedores — M contactos', '(proveedor_id, contacto_id, rol_id) → es_principal. Un solo principal por proveedor.'],
    'proveedores' => ['Proveedores técnicos y de servicios (sonido, iluminación, catering…).', '1 proveedor — N venues (vía venue_proveedores), N contactos', 'id → todas las columnas. La categoría es un dominio cerrado (CHECK).'],
    'venue_proveedores' => ['Relación N:M entre venues y proveedores.', 'N venues — M proveedores', '(venue_id, proveedor_id) clave compuesta; sin atributos dependientes.'],
    'tours' => ['Giras con fechas y estatus. Los artistas participantes están en tour_artistas (una gira puede ser compartida).', '1 gira — N artistas (tour_artistas), N eventos', 'id → nombre, fechas, status. CHECK fecha_fin ≥ fecha_inicio.'],
    'tour_artistas' => ['Artistas de una gira (N:M); uno es el principal.', 'N giras — M artistas', '(tour_id, artista_id) → es_principal. Regla en PHP: los artistas de cada evento deben pertenecer a la gira del evento.'],
    'eventos' => ['Shows y conciertos. El ingreso se captura (puede diferir de asistencia × precio); la utilidad se calcula y un CHECK impide que se desajuste. Los artistas están en evento_artistas.', '1 evento — N artistas (evento_artistas), N contratos; N:1 venue, N:1 gira (opcional)', 'id → todas las columnas. utilidad = ingreso_total − gastos_totales (verificada por CHECK). Setlist y bandas invitadas viven en tablas hijas; el feedback son columnas (Fase 3).'],
    'evento_artistas' => ['Alineación del evento: qué artistas participan, con rol, orden, horario, honorarios y confirmación. Un artista puede presentarse más de una vez (distinto orden).', 'N eventos — M artistas', '(evento_id, artista_id, orden_presentacion) clave candidata → rol, horario, honorarios, moneda, estado. Un solo artista principal por evento.'],
    'contratos' => ['Contratos con su archivo y estado. Las relaciones son RESTRICT: no se pierde el historial contractual por borrados en cascada.', 'N contratos — M artistas, venues, proveedores, eventos y giras (tablas contrato_*)', 'id → todas las columnas. Las partes (artistas, venues, proveedores) y el objeto (eventos, giras) viven en tablas contrato_* (Fase 3); se eliminó la redundancia transitiva evento_id → artista/venue/gira.'],
    'proyectos_grabacion' => ['Proyectos de grabación de un artista. Canciones, costos, pagos, etapas e instrumentos viven en tablas hijas (Fase 3): costos y pagos se pueden sumar en SQL.', '1 artista — N proyectos', 'id → todas las columnas.'],
    'artista_redes' => ['Redes sociales de un artista: una fila por plataforma, con enlace y estado de conexión.', 'N redes — 1 artista', '(artista_id, plataforma) → enlace, conectado, usuario_conectado. Plataforma en dominio cerrado por CHECK.'],
    'artista_idiomas' => ['Idiomas en que canta o trabaja un artista (sin duplicados por mayúsculas).', 'N idiomas — 1 artista', '(artista_id, idioma) clave compuesta; orden conserva el orden de captura.'],
    'artista_integrantes' => ['Integrantes de una agrupación, con rol, fechas de ingreso/salida y si siguen activos (historial).', 'N integrantes — 1 artista', '(artista_id, integrante_id) → nombre, rol, fechas, activo. Los «miembros actuales» se derivan de aquí, no se guardan aparte.'],
    'artista_pipeline' => ['Pasos del plan de carrera de un artista (checklist por categoría).', 'N pasos — 1 artista', '(artista_id, item_id) → nombre, categoría, completado.'],
    'artista_hitos' => ['Hitos y logros en la trayectoria de un artista.', 'N hitos — 1 artista', '(artista_id, hito_id) → fecha, título, descripción, tipo.'],
    'venue_horarios' => ['Horarios de operación del venue (una línea por renglón de texto).', 'N horarios — 1 venue', '(venue_id, orden) → descripción.'],
    'venue_bandas_locales' => ['Bandas locales asociadas a un venue.', 'N bandas — 1 venue', '(venue_id, orden) → nombre.'],
    'evento_setlist' => ['Repertorio de un evento: canciones en orden, con duración en segundos (sumable) y notas de transición.', 'N canciones — 1 evento', '(evento_id, item_id) → título, duracion_seg, tempo, notas_transicion.'],
    'evento_bandas_invitadas' => ['Bandas invitadas o teloneras de un evento (texto libre; las que son artistas del CRM van en evento_artistas).', 'N bandas — 1 evento', '(evento_id, orden) → nombre.'],
    'proyecto_canciones' => ['Canciones de un proyecto de grabación, con duración, compositor, estado y avance.', 'N canciones — 1 proyecto', '(proyecto_id, cancion_id) → título, duracion_seg, compositor, estado, progreso (0–100 por CHECK).'],
    'proyecto_costos' => ['Costos del proyecto (concepto, categoría, monto ≥ 0). Se suman con SUM(monto).', 'N costos — 1 proyecto', '(proyecto_id, costo_id) → concepto, categoría, monto, notas.'],
    'proyecto_pagos' => ['Pagos del proyecto con fecha de vencimiento y estado (Pendiente/Pagado…).', 'N pagos — 1 proyecto', '(proyecto_id, pago_id) → concepto, monto, fecha_vencimiento, estado.'],
    'proyecto_etapas' => ['Etapas de producción del proyecto (pre-producción, grabación, mezcla…).', 'N etapas — 1 proyecto', '(proyecto_id, etapa_id) → nombre, estado, fechas, notas.'],
    'proyecto_instrumentos' => ['Instrumentos y músicos asignados a una etapa del proyecto.', 'N instrumentos — 1 etapa', '(proyecto_id, etapa_id, instrumento_id) → nombre, estado, músico.'],
    'contrato_artistas' => ['Artistas que son parte de un contrato (N:M). Los contratos se conservan aunque el artista se archive.', 'N contratos — M artistas', '(contrato_id, artista_id) clave compuesta, sin atributos dependientes parciales. Borrar un artista con contratos está bloqueado (RESTRICT).'],
    'contrato_venues' => ['Venues que son parte de un contrato (N:M).', 'N contratos — M venues', '(contrato_id, venue_id) clave compuesta.'],
    'contrato_proveedores' => ['Proveedores que son parte de un contrato (N:M).', 'N contratos — M proveedores', '(contrato_id, proveedor_id) clave compuesta.'],
    'contrato_eventos' => ['Eventos a los que se refiere un contrato (N:M).', 'N contratos — M eventos', '(contrato_id, evento_id) clave compuesta.'],
    'contrato_tours' => ['Giras a las que se refiere un contrato (N:M). La gira de un evento no se duplica: se deduce de contrato_eventos.', 'N contratos — M giras', '(contrato_id, tour_id) clave compuesta.'],
    'schema_migrations' => ['Registro de migraciones aplicadas (versión, nombre, fecha, checksum y notas).', '—', 'version → nombre, aplicada_en, checksum, notas.'],
    'users' => ['Cuentas de acceso a la aplicación (contraseña con hash).', '—', 'id → todas; username clave candidata.'],
    'login_attempts' => ['Intentos fallidos de inicio de sesión (límite anti fuerza bruta).', '—', 'Sin clave primaria; se purga a los 15 minutos.'],
];
const COLS = [
    '*.id' => 'Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).',
    '*.version' => 'Número de versión del registro: base del bloqueo optimista (sube en cada guardado).',
    '*.created_at' => 'Fecha y hora de creación (UTC, milisegundos).', '*.updated_at' => 'Fecha y hora de la última modificación (UTC).',
    '*.deleted_at' => 'Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial).',
    '*.extra' => 'Documento JSON con campos anidados que aún no se consultan ni relacionan por separado.',
    '*.es_principal' => 'Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal.',
    '*.nombre' => 'Nombre.', '*.contacto_id' => 'Contacto (persona).', '*.artista_id' => 'Artista.', '*.venue_id' => 'Venue.', '*.evento_id' => 'Evento.', '*.tour_id' => 'Gira.', '*.proveedor_id' => 'Proveedor.',
    '*.rol_id' => 'Rol del contacto en la entidad (catálogo cat_roles_contacto).', '*.genero_id' => 'Género (catálogo cat_generos).',
    'artistas.nombre_artistico' => 'Nombre artístico.', 'artistas.nombre_legal' => 'Nombre legal o razón social.', 'artistas.genero' => 'OBSOLETO (v1): género como texto. Sustituido por artista_generos.', 'artistas.etapa_id' => 'Etapa de carrera (catálogo).',
    'artistas.manager' => 'OBSOLETO (v1): texto. Sustituido por artista_contactos (rol Manager).', 'artistas.booking_agent' => 'OBSOLETO (v1): texto. Sustituido por artista_contactos (rol Booking).',
    'artistas.isrc_default' => 'Código ISRC por defecto.', 'artistas.iswc_default' => 'Código ISWC por defecto.', 'artistas.sociedad_gestion' => 'Sociedad de gestión (SACM, ASCAP, BMI…).', 'artistas.rfc' => 'RFC fiscal.',
    'artistas.ciudad' => 'Ciudad de origen.', 'artistas.estado' => 'Estado o provincia.', 'artistas.pais' => 'País.', 'artistas.foto' => 'URL de la foto de perfil.',
    'artista_generos.es_principal' => 'Género principal del artista (1) o secundario (NULL).', 'artista_generos.orden' => 'Posición del género en la lista del artista (1 = primero).',
    'venues.nombre' => 'Nombre del recinto.', 'venues.direccion' => 'Dirección completa.', 'venues.ciudad' => 'Ciudad.', 'venues.estado' => 'Estado o provincia.', 'venues.pais' => 'País.', 'venues.codigo_postal' => 'Código postal.',
    'venues.latitud' => 'Latitud (−90 a 90).', 'venues.longitud' => 'Longitud (−180 a 180).', 'venues.rating' => 'Calificación 0–5.',
    'venues.score_rentabilidad' => 'Puntaje 0–100 de rentabilidad.', 'venues.score_respuesta' => 'Puntaje 0–100 de tiempo de respuesta.', 'venues.score_puntualidad_pago' => 'Puntaje 0–100 de puntualidad de pago.',
    'venues.score_negociacion' => 'Puntaje 0–100 de negociación.', 'venues.score_produccion' => 'Puntaje 0–100 de producción.', 'venues.score_hospitalidad' => 'Puntaje 0–100 de hospitalidad.',
    'venues.contacto_principal_id' => 'OBSOLETO (v1): contacto principal. Sustituido por venue_contactos.es_principal.',
    'contactos.nombre' => 'Nombre (o nombre completo en registros migrados).', 'contactos.apellidos' => 'Apellidos (opcional).',
    'contacto_correos.correo' => 'Dirección de correo.', 'contacto_correos.etiqueta' => 'Etiqueta (trabajo, personal…).', 'contacto_telefonos.telefono' => 'Número de teléfono.', 'contacto_telefonos.etiqueta' => 'Etiqueta (móvil, WhatsApp, oficina…).',
    'proveedores.categoria' => 'Categoría (dominio cerrado por CHECK).', 'proveedores.contacto' => 'OBSOLETO (v1): nombre del contacto. Sustituido por proveedor_contactos.', 'proveedores.telefono' => 'OBSOLETO (v1).', 'proveedores.correo' => 'OBSOLETO (v1).',
    'proveedores.rating' => 'Calificación 0–5.', 'proveedores.costo_por_show' => 'Costo base por show (MXN).', 'proveedores.notas' => 'Notas internas.',
    'tours.artista_id' => 'OBSOLETO (v1): artista de la gira. Sustituido por tour_artistas.', 'tours.fecha_inicio' => 'Fecha de inicio.', 'tours.fecha_fin' => 'Fecha de fin (≥ inicio).', 'tours.status' => 'Estatus: Planning, Active, Completed, Cancelled.',
    'tour_artistas.es_principal' => 'Artista principal de la gira (1) o NULL.',
    'eventos.nombre' => 'Nombre comercial del evento.', 'eventos.artista_id' => 'OBSOLETO (v1): artista del evento. Sustituido por evento_artistas.', 'eventos.venue_id' => 'Recinto donde se realiza.', 'eventos.fecha' => 'Fecha del evento.',
    'eventos.estado' => 'Estatus: Draft, Confirmed, Completed, Cancelled.', 'eventos.capacidad' => 'Aforo.', 'eventos.asistencia' => 'Asistencia (boletos pagados y cortesías).', 'eventos.precio_boleto' => 'Precio promedio del boleto.',
    'eventos.ingreso_total' => 'Ingreso real capturado (puede diferir de asistencia × precio).', 'eventos.gastos_totales' => 'Gastos de producción, rider y viáticos.', 'eventos.utilidad' => 'Utilidad = ingreso_total − gastos_totales (la fuerza un CHECK).',
    'evento_artistas.rol' => 'Rol en el cartel: Artista, Invitado, Telonero, Soporte, Otro.', 'evento_artistas.orden_presentacion' => 'Orden en que se presenta (1 = primero).', 'evento_artistas.hora_inicio' => 'Hora de inicio.', 'evento_artistas.hora_fin' => 'Hora de fin.',
    'evento_artistas.honorarios' => 'Honorarios acordados (≥ 0).', 'evento_artistas.moneda' => 'Moneda de los honorarios (cat_monedas).', 'evento_artistas.estado_confirmacion' => 'Pendiente, Confirmado o Cancelado.', 'evento_artistas.es_principal' => 'Artista principal del evento (1) o NULL.',
    'contratos.titulo' => 'Título del contrato.', 'contratos.tipo' => 'Tipo (dominio cerrado por CHECK).', 'contratos.estado' => 'Estado: Draft, Pending, Signed, Rejected, Active.', 'contratos.nombre_archivo' => 'Nombre del archivo adjunto.',
    'contratos.tamano_bytes' => 'Tamaño del archivo en bytes.', 'contratos.fecha_subida' => 'Fecha y hora de carga.', 'contratos.notas' => 'Notas internas.',
    'proyectos_grabacion.titulo' => 'Título del proyecto.', 'proyectos_grabacion.estado' => 'Estado del proyecto (dominio cerrado por CHECK).', 'proyectos_grabacion.fecha_lanzamiento' => 'Fecha de lanzamiento prevista.', 'proyectos_grabacion.estudio' => 'Estudio.', 'proyectos_grabacion.productor' => 'Productor.',
    'cat_monedas.codigo' => 'Código ISO 4217 (MXN, USD, EUR).', 'cat_generos.descripcion' => 'Descripción opcional.',
    'schema_migrations.version' => 'Número de la migración.', 'schema_migrations.aplicada_en' => 'Cuándo se aplicó.', 'schema_migrations.checksum' => 'MD5 del archivo de la migración al aplicarla.', 'schema_migrations.notas' => 'Resumen de lo migrado.',
    'users.username' => 'Usuario de acceso (único).', 'users.name' => 'Nombre completo.', 'users.role' => 'Rol de acceso (Super Admin, Gestor de Contenido…).', 'users.password_hash' => 'Hash de la contraseña (password_hash).',
    'login_attempts.ident' => 'Clave del intento (usuario o «*» global).', 'login_attempts.ts' => 'Marca de tiempo (epoch).',
];
const OBSOLETE = ['artistas.genero', 'artistas.manager', 'artistas.booking_agent', 'venues.contacto_principal_id', 'proveedores.contacto', 'proveedores.telefono', 'proveedores.correo', 'tours.artista_id', 'eventos.artista_id'];
$isObsolete = fn(string $t, string $c) => $t === 'contactos_legacy' || in_array("$t.$c", OBSOLETE, true);
$colDoc = function (string $t, string $c): string { return COLS["$t.$c"] ?? COLS["*.$c"] ?? ''; };

// ───────── Lectura del esquema real ─────────
$tables = array_column($pdo->query("SELECT table_name n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' ORDER BY table_name")->fetchAll(), 'n');
$cols = []; foreach ($pdo->query("SELECT table_name t, column_name c, column_type ct, is_nullable nl, column_default d, column_key k, extra e FROM information_schema.columns WHERE table_schema = DATABASE() ORDER BY table_name, ordinal_position")->fetchAll() as $r) $cols[$r['t']][] = $r;
$fks = []; foreach ($pdo->query("SELECT k.table_name t, k.column_name c, k.referenced_table_name rt, k.referenced_column_name rc, r.delete_rule dr, k.constraint_name cn FROM information_schema.key_column_usage k JOIN information_schema.referential_constraints r ON r.constraint_schema = k.constraint_schema AND r.constraint_name = k.constraint_name AND r.table_name = k.table_name WHERE k.table_schema = DATABASE() AND k.referenced_table_name IS NOT NULL ORDER BY k.table_name, k.ordinal_position")->fetchAll() as $r) $fks[$r['t']][] = $r;
$checks = []; foreach ($pdo->query("SELECT table_name t, constraint_name n FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND constraint_type = 'CHECK' ORDER BY 1, 2")->fetchAll() as $r) {
    $def = $pdo->query("SELECT check_clause FROM information_schema.check_constraints WHERE constraint_schema = DATABASE() AND constraint_name = '{$r['n']}'")->fetchColumn();
    $checks[$r['t']][] = [$r['n'], (string)$def];
}
$uniques = []; foreach ($pdo->query("SELECT table_name t, index_name i, GROUP_CONCAT(column_name ORDER BY seq_in_index) c, non_unique nu FROM information_schema.statistics WHERE table_schema = DATABASE() GROUP BY table_name, index_name, non_unique ORDER BY 1, 2")->fetchAll() as $r) $uniques[$r['t']][] = $r;

// ───────── schema.sql ─────────
$dump = shell_exec('mariadb-dump --no-data --skip-comments --skip-add-drop-table --skip-set-charset -u ' . escapeshellarg(getenv('FLAMO_TEST_USER') ?: 'flamo') . ' -p' . escapeshellarg(getenv('FLAMO_TEST_PASS') ?: 'flamo-pass') . ' -h 127.0.0.1 flamo_test 2>/dev/null') ?: '';
$dump = preg_replace('/\/\*!.*?\*\/;?\n/s', '', $dump);
$dump = preg_replace('/ AUTO_INCREMENT=\d+/', '', $dump);
$seed = "\n-- Datos de referencia (catálogos)\nINSERT INTO cat_etapas_desarrollo (id, nombre) VALUES " . implode(', ', array_map(fn($n, $i) => '(' . ($i + 1) . ", '$n')", ETAPAS, array_keys(ETAPAS))) . ";\n"
    . "INSERT INTO cat_roles_contacto (nombre) VALUES ('Manager'), ('Booking'), ('Promotor'), ('Técnico'), ('Hospitalidad'), ('Producción'), ('Administración'), ('Contacto comercial'), ('Contacto');\n"
    . "INSERT INTO cat_monedas (codigo, nombre) VALUES ('MXN', 'Peso mexicano'), ('USD', 'Dólar estadounidense'), ('EUR', 'Euro');\n"
    . "INSERT INTO schema_migrations (version, nombre, aplicada_en, checksum) VALUES (1, 'baseline_v1', NOW(3), ''), (2, 'integridad_fase1', NOW(3), ''), (3, 'nucleo_relacional_fase2', NOW(3), ''), (4, 'grupos_y_contratos', NOW(3), ''), (5, 'contraccion_fase4', NOW(3), '');\n";
$header = "-- ==========================================================================\n-- FLAMO CRM — esquema relacional (MySQL / MariaDB, InnoDB, utf8mb4)\n-- Generado por scripts/db/generate-docs.php desde una base migrada (v3). No editar a mano.\n-- Para instalar: ejecutar este archivo en una base vacía. Para actualizar una base existente\n-- usa las migraciones (public/api/migrations), que conservan los datos.\n-- ==========================================================================\n\n";
file_put_contents(__DIR__ . '/../../docs/database/schema.sql', $header . $dump . $seed);

// ───────── Mermaid ER ─────────
$mm = "erDiagram\n";
foreach ($fks as $t => $list) foreach ($list as $f) {
    if ($isObsolete($t, $f['c']) || $f['rt'] === 'contactos_legacy') continue;
    $nullable = false; foreach ($cols[$t] as $c) if ($c['c'] === $f['c'] && $c['nl'] === 'YES') $nullable = true;
    $isPk = false; foreach ($cols[$t] as $c) if ($c['c'] === $f['c'] && $c['k'] === 'PRI') $isPk = true;
    // el hijo está en el lado «muchos»; el padre es 1 (obligatorio) o 0..1 (opcional)
    $parent = $nullable ? '|o' : '||'; $rel = $f['dr'] === 'SET NULL' || $f['dr'] === 'RESTRICT' || $f['dr'] === 'NO ACTION' ? '--' : '--';
    $mm .= "    {$f['rt']} {$parent}{$rel}o{ {$t} : \"{$f['c']} ({$f['dr']})\"\n";
}
foreach ($tables as $t) {
    if (in_array($t, ['schema_migrations', 'login_attempts', 'contactos_legacy'], true)) continue;
    $mm .= "    $t {\n";
    foreach ($cols[$t] as $c) {
        $type = preg_replace('/[^a-z0-9]/i', '_', preg_replace('/\(.*\)/', '', $c['ct']));
        $isFk = false; foreach ($fks[$t] ?? [] as $f) if ($f['c'] === $c['c']) $isFk = true;
        $key = ($c['k'] === 'PRI' ? 'PK' : '') . ($isFk ? ($c['k'] === 'PRI' ? ',FK' : 'FK') : '');
        if ($isObsolete($t, $c['c']) || $c['c'] === 'extra' || in_array($c['c'], ['created_at', 'updated_at', 'deleted_at', 'version'], true)) continue;
        $mm .= "        $type {$c['c']}" . ($key ? " $key" : '') . "\n";
    }
    $mm .= "    }\n";
}
file_put_contents(__DIR__ . '/../../docs/database/er.mmd', $mm);

// ───────── Diccionario de datos ─────────
$md = "# FLAMO CRM — Diccionario de datos\n\n> Generado por `scripts/db/generate-docs.php` desde la base migrada (esquema v3). No editar a mano.\n> Motor: MySQL/MariaDB (InnoDB, utf8mb4). Convención: «PK» llave primaria · «FK» llave foránea · «UQ» única · «NN» no nula.\n> Las columnas marcadas **OBSOLETO** existen solo en bases actualizadas desde v1 y se retiran en la Fase 4.\n\n";
$md .= "## Índice\n\n";
foreach ($tables as $t) if (isset(TABLES[$t])) $md .= "- [`$t`](#$t) — " . TABLES[$t][0] . "\n";
$md .= "\n";
foreach ($tables as $t) {
    if (!isset(TABLES[$t]) || $t === 'contactos_legacy') continue;
    [$purpose, $card, $fd] = TABLES[$t];
    $md .= "---\n\n## $t\n\n**Propósito:** $purpose\n\n**Cardinalidad:** $card\n\n**Dependencias funcionales:** $fd\n\n";
    $md .= "| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |\n|---|---|---|---|---|---|\n";
    $pkCols = array_column(array_filter($cols[$t], fn($c) => $c['k'] === 'PRI'), 'c');
    $fkCols = array_column($fks[$t] ?? [], 'c');
    foreach ($cols[$t] as $c) {
        $key = []; if (in_array($c['c'], $pkCols, true)) $key[] = 'PK'; if (in_array($c['c'], $fkCols, true)) $key[] = 'FK';
        $def = $c['d'] === null ? '' : '`' . trim((string)$c['d'], "'") . '`';
        $md .= "| `{$c['c']}` | `{$c['ct']}` | " . ($c['nl'] === 'YES' ? 'sí' : 'NN') . " | $def | " . implode(', ', $key) . ' | ' . $colDoc($t, $c['c']) . " |\n";
    }
    if (!empty($fks[$t])) {
        $md .= "\n**Llaves foráneas:**\n\n";
        foreach ($fks[$t] as $f) $md .= "- `{$f['c']}` → `{$f['rt']}({$f['rc']})` · al borrar el padre: **{$f['dr']}**" . ($f['dr'] === 'CASCADE' ? ' (el dependiente carece de sentido sin su padre)' : ($f['dr'] === 'RESTRICT' ? ' (protege el historial)' : '')) . "\n";
    }
    $uq = array_filter($uniques[$t] ?? [], fn($u) => (int)$u['nu'] === 0 && $u['i'] !== 'PRIMARY');
    if ($uq) { $md .= "\n**Unicidad:**\n\n"; foreach ($uq as $u) $md .= "- `{$u['i']}` sobre (`" . str_replace(',', '`, `', $u['c']) . "`)\n"; }
    if (!empty($checks[$t])) { $md .= "\n**Restricciones CHECK:**\n\n"; foreach ($checks[$t] as [$n, $d]) $md .= "- `$n`: `$d`\n"; }
    $ix = array_filter($uniques[$t] ?? [], fn($u) => (int)$u['nu'] === 1);
    if ($ix) { $md .= "\n**Índices:** " . implode('; ', array_map(fn($u) => "`{$u['i']}` (" . $u['c'] . ')', $ix)) . "\n"; }
    $md .= "\n";
}
file_put_contents(__DIR__ . '/../../docs/database/DATA_DICTIONARY.md', $md);

// ───────── src/data/schemaSql.ts (pestaña «Esquema & DB») ─────────
$out = [];
foreach ($tables as $t) {
    if (!isset(TABLES[$t]) || in_array($t, ['contactos_legacy', 'schema_migrations', 'login_attempts', 'users'], true)) continue;
    $pkCols = array_column(array_filter($cols[$t], fn($c) => $c['k'] === 'PRI'), 'c');
    $fkMap = []; foreach ($fks[$t] ?? [] as $f) $fkMap[$f['c']] = $f;
    $cl = [];
    foreach ($cols[$t] as $c) {
        $notes = []; if ($c['nl'] === 'NO') $notes[] = 'Obligatorio';
        if (isset($fkMap[$c['c']]) && !$isObsolete($t, $c['c'])) { $f = $fkMap[$c['c']]; $notes[] = "Llave foránea → {$f['rt']}({$f['rc']}), al borrar: {$f['dr']}"; }
        $d = $colDoc($t, $c['c']); if ($d) $notes[] = $d;
        $row = ['name' => $c['c'], 'type' => strtoupper($c['ct']), 'notes' => implode(' · ', $notes)];
        if (in_array($c['c'], $pkCols, true)) $row['key'] = 'PK'; elseif (isset($fkMap[$c['c']]) && !$isObsolete($t, $c['c'])) $row['key'] = 'FK';
        $cl[] = $row;
    }
    $idx = []; foreach ($uniques[$t] ?? [] as $u) if ($u['i'] !== 'PRIMARY') $idx[] = ((int)$u['nu'] === 0 ? 'CREATE UNIQUE INDEX ' : 'CREATE INDEX ') . "{$u['i']} ON $t(" . $u['c'] . ');';
    $out[] = ['name' => $t, 'description' => TABLES[$t][0], 'columns' => $cl, 'indexes' => $idx];
}
$ts = "// ARCHIVO GENERADO por scripts/db/generate-docs.php — no editar a mano.\n"
    . "export interface SchemaTableDef { name: string; description: string; columns: { name: string; type: string; key?: 'PK' | 'FK'; notes: string }[]; indexes: string[]; }\n"
    . 'export const SCHEMA_TABLES: SchemaTableDef[] = ' . json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . ";\n"
    . 'export const SCHEMA_SQL = ' . json_encode($header . $dump . $seed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ";\n";
file_put_contents(__DIR__ . '/../../src/data/schemaSql.ts', $ts);
echo 'OK: ' . count($out) . " tablas documentadas · schema.sql · DATA_DICTIONARY.md · er.mmd · schemaSql.ts\n";
