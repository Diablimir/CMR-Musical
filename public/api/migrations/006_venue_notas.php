<?php
declare(strict_types=1);

// Migración 006 — Notas de seguimiento de un venue (p. ej. cómo salió el show una vez realizado).
// Tabla hija con llave (venue_id, nota_id): un venue tiene N notas, cada una con fecha, texto, autor y, opcionalmente,
// el evento al que se refiere (si el evento se borra, la nota se conserva: SET NULL). Borrar el venue borra sus notas (CASCADE).
// down() elimina la tabla (las notas escritas después de aplicar esta migración se pierden al revertir; el resto no cambia).

return [
    'id' => 6,
    'name' => 'venue_notas',
    'description' => 'Notas de seguimiento por venue (texto, fecha, autor y evento opcional)',
    'up' => function (PDO $pdo): string {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $pdo->exec("CREATE TABLE IF NOT EXISTS venue_notas (
            venue_id VARCHAR(40) NOT NULL,
            nota_id VARCHAR(40) NOT NULL,
            fecha DATETIME(3) NOT NULL,
            texto TEXT NOT NULL,
            autor VARCHAR(100) NULL,
            evento_id VARCHAR(40) NULL,
            PRIMARY KEY (venue_id, nota_id),
            KEY idx_vn_evento (evento_id),
            KEY idx_vn_venue_fecha (venue_id, fecha),
            CONSTRAINT fk_vn_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
            CONSTRAINT fk_vn_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL,
            CONSTRAINT chk_vn_texto CHECK (CHAR_LENGTH(TRIM(texto)) > 0)
        ){$o}");
        return 'creada venue_notas';
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec('DROP TABLE IF EXISTS venue_notas');
    },
];
