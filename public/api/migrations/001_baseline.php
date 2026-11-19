<?php
declare(strict_types=1);

// Migración 001 — Línea base (esquema v1): tablas originales del CRM tal como se publicaron.
// Si la base ya tiene estas tablas (instalaciones anteriores) solo se registra como aplicada.

const ETAPAS_V1 = ['Desarrollo', 'Aficionado', 'Emergente', 'Media carrera', 'Consolidado', 'Consagrado', 'Internacional'];

return [
    'id' => 1,
    'name' => 'baseline_v1',
    'description' => 'Esquema original: artistas, venues, contactos, proveedores, tours, eventos, contratos, proyectos_grabacion',
    'up' => function (PDO $pdo): void {
        $opts = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $tables = [
"CREATE TABLE IF NOT EXISTS schema_meta (
    id INT NOT NULL PRIMARY KEY,
    version INT NOT NULL,
    updated_at VARCHAR(32) NOT NULL
){$opts}",

"CREATE TABLE IF NOT EXISTS cat_etapas_desarrollo (
    id TINYINT NOT NULL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
){$opts}",

"CREATE TABLE IF NOT EXISTS artistas (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    nombre_artistico VARCHAR(255) NOT NULL,
    nombre_legal VARCHAR(255),
    genero VARCHAR(150),
    etapa_id TINYINT NOT NULL DEFAULT 1,
    manager VARCHAR(255),
    booking_agent VARCHAR(255),
    isrc_default VARCHAR(40),
    iswc_default VARCHAR(40),
    sociedad_gestion VARCHAR(80),
    rfc VARCHAR(40),
    ciudad VARCHAR(150),
    estado VARCHAR(150),
    pais VARCHAR(150),
    foto TEXT,
    extra LONGTEXT,
    created_at VARCHAR(32),
    updated_at VARCHAR(32),
    deleted_at VARCHAR(32) NULL DEFAULT NULL,
    FOREIGN KEY (etapa_id) REFERENCES cat_etapas_desarrollo(id)
){$opts}",

"CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    ciudad VARCHAR(150),
    estado VARCHAR(150),
    pais VARCHAR(150),
    codigo_postal VARCHAR(20),
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    rating DECIMAL(3,1) DEFAULT 0,
    score_rentabilidad SMALLINT DEFAULT 0,
    score_respuesta SMALLINT DEFAULT 0,
    score_puntualidad_pago SMALLINT DEFAULT 0,
    score_negociacion SMALLINT DEFAULT 0,
    score_produccion SMALLINT DEFAULT 0,
    score_hospitalidad SMALLINT DEFAULT 0,
    contacto_principal_id VARCHAR(40) NULL,
    extra LONGTEXT,
    created_at VARCHAR(32),
    updated_at VARCHAR(32),
    deleted_at VARCHAR(32) NULL DEFAULT NULL
){$opts}",

"CREATE TABLE IF NOT EXISTS contactos (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    venue_id VARCHAR(40) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255),
    telefono VARCHAR(60),
    rol VARCHAR(150),
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
){$opts}",

"CREATE TABLE IF NOT EXISTS proveedores (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(80),
    contacto VARCHAR(255),
    telefono VARCHAR(60),
    correo VARCHAR(255),
    rating DECIMAL(3,1) DEFAULT 0,
    costo_por_show DECIMAL(12,2) DEFAULT 0,
    notas TEXT,
    created_at VARCHAR(32)
){$opts}",

"CREATE TABLE IF NOT EXISTS venue_proveedores (
    venue_id VARCHAR(40) NOT NULL,
    proveedor_id VARCHAR(40) NOT NULL,
    PRIMARY KEY (venue_id, proveedor_id),
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
){$opts}",

"CREATE TABLE IF NOT EXISTS tours (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    artista_id VARCHAR(40) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    status VARCHAR(50) DEFAULT 'Planning',
    created_at VARCHAR(32),
    updated_at VARCHAR(32),
    deleted_at VARCHAR(32) NULL DEFAULT NULL,
    FOREIGN KEY (artista_id) REFERENCES artistas(id)
){$opts}",

"CREATE TABLE IF NOT EXISTS eventos (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    artista_id VARCHAR(40) NOT NULL,
    venue_id VARCHAR(40) NOT NULL,
    tour_id VARCHAR(40) NULL,
    fecha DATE NULL,
    estado VARCHAR(30) DEFAULT 'Draft',
    capacidad INT DEFAULT 0,
    asistencia INT DEFAULT 0,
    precio_boleto DECIMAL(10,2) DEFAULT 0,
    ingreso_total DECIMAL(12,2) DEFAULT 0,
    gastos_totales DECIMAL(12,2) DEFAULT 0,
    utilidad DECIMAL(12,2) DEFAULT 0,
    extra LONGTEXT,
    created_at VARCHAR(32),
    updated_at VARCHAR(32),
    deleted_at VARCHAR(32) NULL DEFAULT NULL,
    FOREIGN KEY (artista_id) REFERENCES artistas(id),
    FOREIGN KEY (venue_id) REFERENCES venues(id),
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL
){$opts}",

"CREATE TABLE IF NOT EXISTS contratos (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    artista_id VARCHAR(40) NULL,
    venue_id VARCHAR(40) NULL,
    tour_id VARCHAR(40) NULL,
    evento_id VARCHAR(40) NULL,
    tipo VARCHAR(60),
    estado VARCHAR(30),
    nombre_archivo VARCHAR(255),
    tamano VARCHAR(40),
    fecha_subida VARCHAR(32),
    notas TEXT,
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
){$opts}",

"CREATE TABLE IF NOT EXISTS proyectos_grabacion (
    id VARCHAR(40) NOT NULL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    artista_id VARCHAR(40) NULL,
    estado VARCHAR(40),
    fecha_lanzamiento DATE NULL,
    estudio VARCHAR(255),
    productor VARCHAR(255),
    extra LONGTEXT,
    created_at VARCHAR(32),
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL
){$opts}",
        ];
        foreach ($tables as $sql) $pdo->exec($sql);
        if ((int)$pdo->query('SELECT COUNT(*) FROM cat_etapas_desarrollo')->fetchColumn() === 0) {
            $ins = $pdo->prepare('INSERT INTO cat_etapas_desarrollo (id, nombre) VALUES (?, ?)');
            foreach (ETAPAS_V1 as $i => $n) $ins->execute([$i + 1, $n]);
        }
        try { $pdo->exec('ALTER TABLE venues ADD CONSTRAINT fk_venues_principal_contact FOREIGN KEY (contacto_principal_id) REFERENCES contactos(id) ON DELETE SET NULL'); } catch (Throwable $e) { /* ya existe */ }
        $indexes = [
        'idx_artistas_nombre ON artistas(nombre_artistico)',
        'idx_artistas_deleted ON artistas(deleted_at)',
        'idx_venues_nombre ON venues(nombre)',
        'idx_venues_ciudad ON venues(ciudad)',
        'idx_venues_contacto_principal ON venues(contacto_principal_id)',
        'idx_contactos_venue ON contactos(venue_id)',
        'idx_contactos_correo ON contactos(correo)',
        'idx_tours_artista ON tours(artista_id)',
        'idx_eventos_artista ON eventos(artista_id)',
        'idx_eventos_venue ON eventos(venue_id)',
        'idx_eventos_tour ON eventos(tour_id)',
        'idx_eventos_fecha ON eventos(fecha)',
        'idx_eventos_artista_fecha ON eventos(artista_id, fecha)',
        'idx_contratos_artista ON contratos(artista_id)',
        'idx_contratos_evento ON contratos(evento_id)',
        'idx_proyectos_artista ON proyectos_grabacion(artista_id)',
    ];
        foreach ($indexes as $i) { try { $pdo->exec('CREATE INDEX ' . $i); } catch (Throwable $e) { /* ya existe */ } }
    },
    'down' => function (PDO $pdo): void {
        throw new RuntimeException('La línea base no se revierte (eliminaría todos los datos). Restaura un respaldo.');
    },
];
