<?php
declare(strict_types=1);

// Migración 008 — Conexión OFICIAL con Instagram (API de Meta): alcance, demografía y publicaciones.
//   artista_conexiones   : cuenta conectada por OAuth. El token se guarda CIFRADO (AES-256-GCM) y jamás se envía al navegador.
//   artista_alcance      : alcance diario (reach) de la cuenta.
//   artista_demografia   : foto de la audiencia por edad, género, ciudad y país (una por fecha de captura).
//   artista_publicaciones: cada publicación con sus números (me gusta, comentarios, alcance, guardados, compartidos, interacción).
//   artista_metricas_redes.fuente admite además 'meta' (seguidores leídos de la API oficial).
// down() elimina las 4 tablas nuevas y deja las capturas con fuente 'meta' marcadas como 'manual' (no se pierden, pero pierden su origen).

const MIG008_DIM = ['edad', 'genero', 'ciudad', 'pais'];

return [
    'id' => 8,
    'name' => 'meta_oficial',
    'description' => 'Conexión oficial con Instagram: conexiones (token cifrado), alcance diario, demografía y publicaciones',
    'up' => function (PDO $pdo): string {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $in = fn(array $a) => "'" . implode("','", $a) . "'";
        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_conexiones (
            artista_id VARCHAR(40) NOT NULL,
            plataforma VARCHAR(20) NOT NULL,
            cuenta_id VARCHAR(40) NOT NULL,
            usuario VARCHAR(100) NULL,
            token_cifrado TEXT NOT NULL,
            expira_en DATETIME(3) NULL,
            conectado_en DATETIME(3) NOT NULL,
            ultima_sync DATETIME(3) NULL,
            ultimo_error VARCHAR(255) NULL,
            PRIMARY KEY (artista_id, plataforma),
            CONSTRAINT fk_ac_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT chk_ac_plataforma CHECK (plataforma IN ('instagram'))
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_alcance (
            artista_id VARCHAR(40) NOT NULL, plataforma VARCHAR(20) NOT NULL, fecha DATE NOT NULL, alcance INT UNSIGNED NOT NULL,
            PRIMARY KEY (artista_id, plataforma, fecha),
            CONSTRAINT fk_aal_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT chk_aal_plataforma CHECK (plataforma IN ('instagram'))
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_demografia (
            artista_id VARCHAR(40) NOT NULL, plataforma VARCHAR(20) NOT NULL, fecha DATE NOT NULL,
            dimension VARCHAR(10) NOT NULL, clave VARCHAR(100) NOT NULL, valor INT UNSIGNED NOT NULL,
            PRIMARY KEY (artista_id, plataforma, fecha, dimension, clave),
            CONSTRAINT fk_ade_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT chk_ade_plataforma CHECK (plataforma IN ('instagram')),
            CONSTRAINT chk_ade_dimension CHECK (dimension IN ({$in(MIG008_DIM)}))
        ){$o}");
        $pdo->exec("CREATE TABLE IF NOT EXISTS artista_publicaciones (
            artista_id VARCHAR(40) NOT NULL, plataforma VARCHAR(20) NOT NULL, post_id VARCHAR(40) NOT NULL,
            publicado_en DATETIME(3) NOT NULL, tipo VARCHAR(20) NOT NULL, enlace VARCHAR(500) NULL, texto VARCHAR(500) NULL,
            me_gusta INT UNSIGNED NULL, comentarios INT UNSIGNED NULL, alcance INT UNSIGNED NULL, guardados INT UNSIGNED NULL, compartidos INT UNSIGNED NULL, interacciones INT UNSIGNED NULL,
            capturado_en DATETIME(3) NOT NULL,
            PRIMARY KEY (artista_id, plataforma, post_id),
            KEY idx_apu_fecha (artista_id, publicado_en),
            CONSTRAINT fk_apu_artista FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE,
            CONSTRAINT chk_apu_plataforma CHECK (plataforma IN ('instagram'))
        ){$o}");
        // 'meta' como fuente válida de una captura de seguidores
        foreach ($pdo->query("SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'artista_metricas_redes' AND constraint_name = 'chk_amr_fuente'")->fetchAll(PDO::FETCH_COLUMN) as $c) {
            $pdo->exec('ALTER TABLE artista_metricas_redes DROP CONSTRAINT ' . $c);
        }
        $pdo->exec("ALTER TABLE artista_metricas_redes ADD CONSTRAINT chk_amr_fuente CHECK (fuente IN ('manual','apify','meta'))");
        return 'creadas artista_conexiones, artista_alcance, artista_demografia, artista_publicaciones; fuente «meta» permitida';
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec("UPDATE artista_metricas_redes SET fuente = 'manual' WHERE fuente = 'meta'");
        foreach ($pdo->query("SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'artista_metricas_redes' AND constraint_name = 'chk_amr_fuente'")->fetchAll(PDO::FETCH_COLUMN) as $c) {
            $pdo->exec('ALTER TABLE artista_metricas_redes DROP CONSTRAINT ' . $c);
        }
        $pdo->exec("ALTER TABLE artista_metricas_redes ADD CONSTRAINT chk_amr_fuente CHECK (fuente IN ('manual','apify'))");
        foreach (['artista_publicaciones', 'artista_demografia', 'artista_alcance', 'artista_conexiones'] as $t) $pdo->exec("DROP TABLE IF EXISTS $t");
    },
];
