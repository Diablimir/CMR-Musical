// ARCHIVO GENERADO por scripts/export-schema.php — no editar a mano.
export interface SchemaTableDef { name: string; description: string; columns: { name: string; type: string; key?: 'PK' | 'FK'; notes: string }[]; indexes: string[]; }
export const SCHEMA_TABLES: SchemaTableDef[] = [
    {
        "name": "cat_etapas_desarrollo",
        "description": "Catálogo de etapas de desarrollo (reemplaza un ENUM frágil).",
        "columns": [
            {
                "name": "id",
                "type": "TINYINT",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(50)",
                "notes": "Obligatorio · Único"
            }
        ],
        "indexes": []
    },
    {
        "name": "artistas",
        "description": "Entidad principal del CRM. Perfil artístico, etapa de desarrollo y datos de gestión. Los campos anidados (bio, redes, pipeline, historial) van en `extra` (JSON).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "nombre_artistico",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "nombre_legal",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "genero",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "etapa_id",
                "type": "TINYINT",
                "key": "FK",
                "notes": "Obligatorio · Valor por defecto: 1 · Llave foránea → cat_etapas_desarrollo(id), sin borrado en cascada (protege la integridad)"
            },
            {
                "name": "manager",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "booking_agent",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "isrc_default",
                "type": "VARCHAR(40)",
                "notes": ""
            },
            {
                "name": "iswc_default",
                "type": "VARCHAR(40)",
                "notes": ""
            },
            {
                "name": "sociedad_gestion",
                "type": "VARCHAR(80)",
                "notes": ""
            },
            {
                "name": "rfc",
                "type": "VARCHAR(40)",
                "notes": ""
            },
            {
                "name": "ciudad",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "estado",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "pais",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "foto",
                "type": "TEXT",
                "notes": ""
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "JSON con los campos anidados que no se consultan como columnas"
            },
            {
                "name": "created_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "updated_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "deleted_at",
                "type": "VARCHAR(32)",
                "notes": "Borrado lógico: NULL = activo"
            }
        ],
        "indexes": [
            "CREATE INDEX idx_artistas_nombre ON artistas(nombre_artistico);",
            "CREATE INDEX idx_artistas_deleted ON artistas(deleted_at);"
        ]
    },
    {
        "name": "venues",
        "description": "Recintos, bares, teatros y foros, con coordenadas, rating y puntajes. Enlace directo al contacto principal.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "direccion",
                "type": "TEXT",
                "notes": ""
            },
            {
                "name": "ciudad",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "estado",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "pais",
                "type": "VARCHAR(150)",
                "notes": ""
            },
            {
                "name": "codigo_postal",
                "type": "VARCHAR(20)",
                "notes": ""
            },
            {
                "name": "latitud",
                "type": "DECIMAL(10,8)",
                "notes": ""
            },
            {
                "name": "longitud",
                "type": "DECIMAL(11,8)",
                "notes": ""
            },
            {
                "name": "rating",
                "type": "DECIMAL(3,1)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "score_rentabilidad",
                "type": "SMALLINT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "score_respuesta",
                "type": "SMALLINT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "score_puntualidad_pago",
                "type": "SMALLINT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "score_negociacion",
                "type": "SMALLINT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "score_produccion",
                "type": "SMALLINT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "score_hospitalidad",
                "type": "SMALLINT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "contacto_principal_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → contactos(id), al borrar: SET NULL (se añade con ALTER por la dependencia circular)"
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "JSON con los campos anidados que no se consultan como columnas"
            },
            {
                "name": "created_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "updated_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "deleted_at",
                "type": "VARCHAR(32)",
                "notes": "Borrado lógico: NULL = activo"
            }
        ],
        "indexes": [
            "CREATE INDEX idx_venues_nombre ON venues(nombre);",
            "CREATE INDEX idx_venues_ciudad ON venues(ciudad);",
            "CREATE INDEX idx_venues_contacto_principal ON venues(contacto_principal_id);"
        ]
    },
    {
        "name": "contactos",
        "description": "Agentes, promotores y personal de cada recinto. Se eliminan en cascada con su venue.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Obligatorio · Llave foránea → venues(id), al borrar: CASCADE"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "correo",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "telefono",
                "type": "VARCHAR(60)",
                "notes": ""
            },
            {
                "name": "rol",
                "type": "VARCHAR(150)",
                "notes": ""
            }
        ],
        "indexes": [
            "CREATE INDEX idx_contactos_venue ON contactos(venue_id);",
            "CREATE INDEX idx_contactos_correo ON contactos(correo);"
        ]
    },
    {
        "name": "proveedores",
        "description": "Proveedores técnicos (sonido, iluminación, catering…).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "categoria",
                "type": "VARCHAR(80)",
                "notes": ""
            },
            {
                "name": "contacto",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "telefono",
                "type": "VARCHAR(60)",
                "notes": ""
            },
            {
                "name": "correo",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "rating",
                "type": "DECIMAL(3,1)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "costo_por_show",
                "type": "DECIMAL(12,2)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "notas",
                "type": "TEXT",
                "notes": ""
            },
            {
                "name": "created_at",
                "type": "VARCHAR(32)",
                "notes": ""
            }
        ],
        "indexes": []
    },
    {
        "name": "venue_proveedores",
        "description": "Relación N:M entre venues y proveedores.",
        "columns": [
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio · Llave foránea → venues(id), al borrar: CASCADE"
            },
            {
                "name": "proveedor_id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio · Llave foránea → proveedores(id), al borrar: CASCADE"
            }
        ],
        "indexes": []
    },
    {
        "name": "tours",
        "description": "Giras de un artista, con fechas y estatus.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Obligatorio · Llave foránea → artistas(id), sin borrado en cascada (protege la integridad)"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "fecha_inicio",
                "type": "DATE",
                "notes": ""
            },
            {
                "name": "fecha_fin",
                "type": "DATE",
                "notes": ""
            },
            {
                "name": "status",
                "type": "VARCHAR(50)",
                "notes": "Valor por defecto: Planning"
            },
            {
                "name": "created_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "updated_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "deleted_at",
                "type": "VARCHAR(32)",
                "notes": "Borrado lógico: NULL = activo"
            }
        ],
        "indexes": [
            "CREATE INDEX idx_tours_artista ON tours(artista_id);"
        ]
    },
    {
        "name": "eventos",
        "description": "Shows y conciertos. Relaciona artista, venue y gira, con el detalle financiero.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Obligatorio · Llave foránea → artistas(id), sin borrado en cascada (protege la integridad)"
            },
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Obligatorio · Llave foránea → venues(id), sin borrado en cascada (protege la integridad)"
            },
            {
                "name": "tour_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → tours(id), al borrar: SET NULL"
            },
            {
                "name": "fecha",
                "type": "DATE",
                "notes": ""
            },
            {
                "name": "estado",
                "type": "VARCHAR(30)",
                "notes": "Valor por defecto: Draft"
            },
            {
                "name": "capacidad",
                "type": "INT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "asistencia",
                "type": "INT",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "precio_boleto",
                "type": "DECIMAL(10,2)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "ingreso_total",
                "type": "DECIMAL(12,2)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "gastos_totales",
                "type": "DECIMAL(12,2)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "utilidad",
                "type": "DECIMAL(12,2)",
                "notes": "Valor por defecto: 0"
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "JSON con los campos anidados que no se consultan como columnas"
            },
            {
                "name": "created_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "updated_at",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "deleted_at",
                "type": "VARCHAR(32)",
                "notes": "Borrado lógico: NULL = activo"
            }
        ],
        "indexes": [
            "CREATE INDEX idx_eventos_artista ON eventos(artista_id);",
            "CREATE INDEX idx_eventos_venue ON eventos(venue_id);",
            "CREATE INDEX idx_eventos_tour ON eventos(tour_id);",
            "CREATE INDEX idx_eventos_fecha ON eventos(fecha);",
            "CREATE INDEX idx_eventos_artista_fecha ON eventos(artista_id, fecha);"
        ]
    },
    {
        "name": "contratos",
        "description": "Contratos ligados (opcionalmente) a artista, venue, gira y evento.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "titulo",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → artistas(id), al borrar: SET NULL"
            },
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → venues(id), al borrar: SET NULL"
            },
            {
                "name": "tour_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → tours(id), al borrar: SET NULL"
            },
            {
                "name": "evento_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → eventos(id), al borrar: SET NULL"
            },
            {
                "name": "tipo",
                "type": "VARCHAR(60)",
                "notes": ""
            },
            {
                "name": "estado",
                "type": "VARCHAR(30)",
                "notes": ""
            },
            {
                "name": "nombre_archivo",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "tamano",
                "type": "VARCHAR(40)",
                "notes": ""
            },
            {
                "name": "fecha_subida",
                "type": "VARCHAR(32)",
                "notes": ""
            },
            {
                "name": "notas",
                "type": "TEXT",
                "notes": ""
            }
        ],
        "indexes": [
            "CREATE INDEX idx_contratos_artista ON contratos(artista_id);",
            "CREATE INDEX idx_contratos_evento ON contratos(evento_id);"
        ]
    },
    {
        "name": "proyectos_grabacion",
        "description": "Proyectos de grabación de un artista. Canciones, costos, pagos y etapas van en `extra` (JSON).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "key": "PK",
                "notes": "Obligatorio"
            },
            {
                "name": "titulo",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "key": "FK",
                "notes": "Llave foránea → artistas(id), al borrar: SET NULL"
            },
            {
                "name": "estado",
                "type": "VARCHAR(40)",
                "notes": ""
            },
            {
                "name": "fecha_lanzamiento",
                "type": "DATE",
                "notes": ""
            },
            {
                "name": "estudio",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "productor",
                "type": "VARCHAR(255)",
                "notes": ""
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "JSON con los campos anidados que no se consultan como columnas"
            },
            {
                "name": "created_at",
                "type": "VARCHAR(32)",
                "notes": ""
            }
        ],
        "indexes": [
            "CREATE INDEX idx_proyectos_artista ON proyectos_grabacion(artista_id);"
        ]
    }
];
export const SCHEMA_SQL = "-- ==========================================\n-- FLAMO CRM · ESQUEMA RELACIONAL (MySQL / InnoDB)\n-- Generado desde public/api/schema.php. No editar a mano:\n-- ejecuta `php scripts/export-schema.php` para regenerarlo.\n-- ==========================================\n\nCREATE TABLE cat_etapas_desarrollo (\n    id TINYINT NOT NULL PRIMARY KEY,\n    nombre VARCHAR(50) NOT NULL UNIQUE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE artistas (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    nombre_artistico VARCHAR(255) NOT NULL,\n    nombre_legal VARCHAR(255),\n    genero VARCHAR(150),\n    etapa_id TINYINT NOT NULL DEFAULT 1,\n    manager VARCHAR(255),\n    booking_agent VARCHAR(255),\n    isrc_default VARCHAR(40),\n    iswc_default VARCHAR(40),\n    sociedad_gestion VARCHAR(80),\n    rfc VARCHAR(40),\n    ciudad VARCHAR(150),\n    estado VARCHAR(150),\n    pais VARCHAR(150),\n    foto TEXT,\n    extra LONGTEXT,\n    created_at VARCHAR(32),\n    updated_at VARCHAR(32),\n    deleted_at VARCHAR(32) NULL DEFAULT NULL,\n    FOREIGN KEY (etapa_id) REFERENCES cat_etapas_desarrollo(id)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE venues (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    nombre VARCHAR(255) NOT NULL,\n    direccion TEXT,\n    ciudad VARCHAR(150),\n    estado VARCHAR(150),\n    pais VARCHAR(150),\n    codigo_postal VARCHAR(20),\n    latitud DECIMAL(10,8),\n    longitud DECIMAL(11,8),\n    rating DECIMAL(3,1) DEFAULT 0,\n    score_rentabilidad SMALLINT DEFAULT 0,\n    score_respuesta SMALLINT DEFAULT 0,\n    score_puntualidad_pago SMALLINT DEFAULT 0,\n    score_negociacion SMALLINT DEFAULT 0,\n    score_produccion SMALLINT DEFAULT 0,\n    score_hospitalidad SMALLINT DEFAULT 0,\n    contacto_principal_id VARCHAR(40) NULL,\n    extra LONGTEXT,\n    created_at VARCHAR(32),\n    updated_at VARCHAR(32),\n    deleted_at VARCHAR(32) NULL DEFAULT NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE contactos (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    venue_id VARCHAR(40) NOT NULL,\n    nombre VARCHAR(255) NOT NULL,\n    correo VARCHAR(255),\n    telefono VARCHAR(60),\n    rol VARCHAR(150),\n    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE proveedores (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    nombre VARCHAR(255) NOT NULL,\n    categoria VARCHAR(80),\n    contacto VARCHAR(255),\n    telefono VARCHAR(60),\n    correo VARCHAR(255),\n    rating DECIMAL(3,1) DEFAULT 0,\n    costo_por_show DECIMAL(12,2) DEFAULT 0,\n    notas TEXT,\n    created_at VARCHAR(32)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE venue_proveedores (\n    venue_id VARCHAR(40) NOT NULL,\n    proveedor_id VARCHAR(40) NOT NULL,\n    PRIMARY KEY (venue_id, proveedor_id),\n    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,\n    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE tours (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    artista_id VARCHAR(40) NOT NULL,\n    nombre VARCHAR(255) NOT NULL,\n    fecha_inicio DATE NULL,\n    fecha_fin DATE NULL,\n    status VARCHAR(50) DEFAULT 'Planning',\n    created_at VARCHAR(32),\n    updated_at VARCHAR(32),\n    deleted_at VARCHAR(32) NULL DEFAULT NULL,\n    FOREIGN KEY (artista_id) REFERENCES artistas(id)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE eventos (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    nombre VARCHAR(255) NOT NULL,\n    artista_id VARCHAR(40) NOT NULL,\n    venue_id VARCHAR(40) NOT NULL,\n    tour_id VARCHAR(40) NULL,\n    fecha DATE NULL,\n    estado VARCHAR(30) DEFAULT 'Draft',\n    capacidad INT DEFAULT 0,\n    asistencia INT DEFAULT 0,\n    precio_boleto DECIMAL(10,2) DEFAULT 0,\n    ingreso_total DECIMAL(12,2) DEFAULT 0,\n    gastos_totales DECIMAL(12,2) DEFAULT 0,\n    utilidad DECIMAL(12,2) DEFAULT 0,\n    extra LONGTEXT,\n    created_at VARCHAR(32),\n    updated_at VARCHAR(32),\n    deleted_at VARCHAR(32) NULL DEFAULT NULL,\n    FOREIGN KEY (artista_id) REFERENCES artistas(id),\n    FOREIGN KEY (venue_id) REFERENCES venues(id),\n    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE contratos (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    titulo VARCHAR(255) NOT NULL,\n    artista_id VARCHAR(40) NULL,\n    venue_id VARCHAR(40) NULL,\n    tour_id VARCHAR(40) NULL,\n    evento_id VARCHAR(40) NULL,\n    tipo VARCHAR(60),\n    estado VARCHAR(30),\n    nombre_archivo VARCHAR(255),\n    tamano VARCHAR(40),\n    fecha_subida VARCHAR(32),\n    notas TEXT,\n    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL,\n    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,\n    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE SET NULL,\n    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE proyectos_grabacion (\n    id VARCHAR(40) NOT NULL PRIMARY KEY,\n    titulo VARCHAR(255) NOT NULL,\n    artista_id VARCHAR(40) NULL,\n    estado VARCHAR(40),\n    fecha_lanzamiento DATE NULL,\n    estudio VARCHAR(255),\n    productor VARCHAR(255),\n    extra LONGTEXT,\n    created_at VARCHAR(32),\n    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE SET NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n-- Catálogo\nINSERT INTO cat_etapas_desarrollo (id, nombre) VALUES\n(1, 'Desarrollo'),\n(2, 'Aficionado'),\n(3, 'Emergente'),\n(4, 'Media carrera'),\n(5, 'Consolidado'),\n(6, 'Consagrado'),\n(7, 'Internacional');\n\n-- Llave circular venues → contactos\nALTER TABLE venues ADD CONSTRAINT fk_venues_principal_contact FOREIGN KEY (contacto_principal_id) REFERENCES contactos(id) ON DELETE SET NULL;\n\n-- Índices\nCREATE INDEX idx_artistas_nombre ON artistas(nombre_artistico);\nCREATE INDEX idx_artistas_deleted ON artistas(deleted_at);\nCREATE INDEX idx_venues_nombre ON venues(nombre);\nCREATE INDEX idx_venues_ciudad ON venues(ciudad);\nCREATE INDEX idx_venues_contacto_principal ON venues(contacto_principal_id);\nCREATE INDEX idx_contactos_venue ON contactos(venue_id);\nCREATE INDEX idx_contactos_correo ON contactos(correo);\nCREATE INDEX idx_tours_artista ON tours(artista_id);\nCREATE INDEX idx_eventos_artista ON eventos(artista_id);\nCREATE INDEX idx_eventos_venue ON eventos(venue_id);\nCREATE INDEX idx_eventos_tour ON eventos(tour_id);\nCREATE INDEX idx_eventos_fecha ON eventos(fecha);\nCREATE INDEX idx_eventos_artista_fecha ON eventos(artista_id, fecha);\nCREATE INDEX idx_contratos_artista ON contratos(artista_id);\nCREATE INDEX idx_contratos_evento ON contratos(evento_id);\nCREATE INDEX idx_proyectos_artista ON proyectos_grabacion(artista_id);\n";
