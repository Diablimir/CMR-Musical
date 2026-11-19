<?php
declare(strict_types=1);

// Migración 010 — Cambios pendientes de aprobación.
// Quien no es Super Admin puede crear y editar, pero sus cambios NO se aplican: quedan aquí como propuestas hasta que el Super Admin
// las aprueba (entonces se aplican con las mismas validaciones) o las rechaza (con motivo). Eliminar es solo del Super Admin.
// La tabla también sirve de bitácora: quién propuso, quién resolvió, cuándo y por qué. No tiene llaves foráneas a `users` a propósito:
// el historial debe sobrevivir aunque se borre la cuenta.
// down() elimina la tabla (las propuestas pendientes se pierden al revertir; los datos ya aprobados no cambian).

const MIG010_COLS = ['artists', 'venues', 'providers', 'contacts', 'tours', 'events', 'contracts', 'recording_projects'];

return [
    'id' => 10,
    'name' => 'cambios_pendientes',
    'description' => 'Cola de cambios pendientes de aprobación del Super Admin (con bitácora)',
    'up' => function (PDO $pdo): string {
        $o = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $in = "'" . implode("','", MIG010_COLS) . "'";
        $pdo->exec("CREATE TABLE IF NOT EXISTS cambios_pendientes (
            id VARCHAR(40) NOT NULL PRIMARY KEY,
            coleccion VARCHAR(30) NOT NULL,
            registro_id VARCHAR(40) NOT NULL,
            accion VARCHAR(10) NOT NULL,
            datos LONGTEXT NOT NULL,
            version_base INT NULL,
            propuesto_por VARCHAR(40) NOT NULL,
            propuesto_nombre VARCHAR(100) NOT NULL,
            creado_en DATETIME(3) NOT NULL,
            estado VARCHAR(10) NOT NULL DEFAULT 'pendiente',
            resuelto_por VARCHAR(100) NULL,
            resuelto_en DATETIME(3) NULL,
            motivo VARCHAR(255) NULL,
            KEY idx_cp_estado (estado, creado_en),
            KEY idx_cp_registro (coleccion, registro_id, estado),
            KEY idx_cp_usuario (propuesto_por, estado, creado_en),
            CONSTRAINT chk_cp_coleccion CHECK (coleccion IN ({$in})),
            CONSTRAINT chk_cp_accion CHECK (accion IN ('crear','editar')),
            CONSTRAINT chk_cp_estado CHECK (estado IN ('pendiente','aprobado','rechazado')),
            CONSTRAINT chk_cp_datos CHECK (JSON_VALID(datos))
        ){$o}");
        return 'creada cambios_pendientes';
    },
    'down' => function (PDO $pdo): void {
        $pdo->exec('DROP TABLE IF EXISTS cambios_pendientes');
    },
];
