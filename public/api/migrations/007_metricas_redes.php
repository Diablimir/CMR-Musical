<?php
declare(strict_types=1);

// Migración 007 — Historial de redes sociales del artista (tipo Metricool) y bitácora de acciones.
//   artista_metricas_redes: una captura por artista + red + día (seguidores, siguiendo, publicaciones, interacción) con su fuente (manual / apify).
//   artista_acciones: lo que se hizo y cuándo (lanzamiento, campaña, publicación, colaboración, prensa, gira, otro). Los shows NO se duplican:
//   se toman de `eventos` al cruzar. Con ambas se mide cuánto cambió cada red después de cada acción.
// down() elimina ambas tablas (el historial capturado después de aplicarla se pierde al revertir; el resto no cambia).

const MIG007_NETS = ['instagram', 'tiktok', 'facebook', 'youtube', 'spotify', 'appleMusic', 'twitter', 'threads'];
const MIG007_TIPOS = ['Lanzamiento', 'Campaña', 'Publicación', 'Colaboración', 'Prensa', 'Gira', 'Otro'];

return [
    'id' => 7,
    'name' => 'metricas_redes',
    'description' => 'Historial de métricas de redes por artista (capturas por día) y bitácora de acciones',
    'up' => function (PDO $pdo): string {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $in = fn(array $a) => "'" . implode("','", $a) . "'";
        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_metricas_redes (
            artista_id VARCHAR(40) NOT NULL,
            plataforma VARCHAR(20) NOT NULL,
            fecha DATE NOT NULL,
            seguidores INT UNSIGNED NOT NULL,
            siguiendo INT UNSIGNED NULL,
            publicaciones INT UNSIGNED NULL,
            interaccion DECIMAL(6,2) NULL,
            fuente VARCHAR(10) NOT NULL,
            capturado_en DATETIME(3) NOT NULL,
            PRIMARY KEY (artista_id, plataforma, fecha),
            CONSTRAINT fk_amr_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT chk_amr_plataforma CHECK (plataforma IN ({$in(MIG007_NETS)})),
            CONSTRAINT chk_amr_fuente CHECK (fuente IN ('manual','apify')),
            CONSTRAINT chk_amr_interaccion CHECK (interaccion IS NULL OR (interaccion >= 0 AND interaccion <= 100))
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_acciones (
            artista_id VARCHAR(40) NOT NULL,
            accion_id VARCHAR(40) NOT NULL,
            fecha DATE NOT NULL,
            tipo VARCHAR(20) NOT NULL,
            titulo VARCHAR(255) NOT NULL,
            notas TEXT NULL,
            plataforma VARCHAR(20) NULL,
            creado_en DATETIME(3) NOT NULL,
            PRIMARY KEY (artista_id, accion_id),
            KEY idx_aa_artista_fecha (artista_id, fecha),
            CONSTRAINT fk_aa_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT chk_aa_tipo CHECK (tipo IN ({$in(MIG007_TIPOS)})),
            CONSTRAINT chk_aa_plataforma CHECK (plataforma IS NULL OR plataforma IN ({$in(MIG007_NETS)})),
            CONSTRAINT chk_aa_titulo CHECK (CHAR_LENGTH(TRIM(titulo)) > 0)
        ){$o}");
        return 'creadas artista_metricas_redes y artista_acciones';
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec('DROP TABLE IF EXISTS artista_acciones');
        $pdo->exec('DROP TABLE IF EXISTS artista_metricas_redes');
    },
];
