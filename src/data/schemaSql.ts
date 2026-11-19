// ARCHIVO GENERADO por scripts/db/generate-docs.php — no editar a mano.
export interface SchemaTableDef { name: string; description: string; columns: { name: string; type: string; key?: 'PK' | 'FK'; notes: string }[]; indexes: string[]; }
export const SCHEMA_TABLES: SchemaTableDef[] = [
    {
        "name": "artistas",
        "description": "Entidad principal: perfil del artista o agrupación. Los datos anidados que aún no se consultan por separado (bio, redes, pipeline, historial, integrantes) van en `extra` (JSON).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre_artistico",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Nombre artístico."
            },
            {
                "name": "nombre_legal",
                "type": "VARCHAR(255)",
                "notes": "Nombre legal o razón social."
            },
            {
                "name": "genero",
                "type": "VARCHAR(150)",
                "notes": "OBSOLETO (v1): género como texto. Sustituido por artista_generos."
            },
            {
                "name": "etapa_id",
                "type": "TINYINT(4)",
                "notes": "Obligatorio · Llave foránea → cat_etapas_desarrollo(id), al borrar: RESTRICT · Etapa de carrera (catálogo).",
                "key": "FK"
            },
            {
                "name": "manager",
                "type": "VARCHAR(255)",
                "notes": "OBSOLETO (v1): texto. Sustituido por artista_contactos (rol Manager)."
            },
            {
                "name": "booking_agent",
                "type": "VARCHAR(255)",
                "notes": "OBSOLETO (v1): texto. Sustituido por artista_contactos (rol Booking)."
            },
            {
                "name": "isrc_default",
                "type": "VARCHAR(40)",
                "notes": "Código ISRC por defecto."
            },
            {
                "name": "iswc_default",
                "type": "VARCHAR(40)",
                "notes": "Código ISWC por defecto."
            },
            {
                "name": "sociedad_gestion",
                "type": "VARCHAR(80)",
                "notes": "Sociedad de gestión (SACM, ASCAP, BMI…)."
            },
            {
                "name": "rfc",
                "type": "VARCHAR(40)",
                "notes": "RFC fiscal."
            },
            {
                "name": "ciudad",
                "type": "VARCHAR(150)",
                "notes": "Ciudad de origen."
            },
            {
                "name": "estado",
                "type": "VARCHAR(150)",
                "notes": "Estado o provincia."
            },
            {
                "name": "pais",
                "type": "VARCHAR(150)",
                "notes": "País."
            },
            {
                "name": "foto",
                "type": "TEXT",
                "notes": "URL de la foto de perfil."
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "Documento JSON con campos anidados que aún no se consultan ni relacionan por separado."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            },
            {
                "name": "updated_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de la última modificación (UTC)."
            },
            {
                "name": "deleted_at",
                "type": "DATETIME(3)",
                "notes": "Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial)."
            }
        ],
        "indexes": [
            "CREATE INDEX etapa_id ON artistas(etapa_id);",
            "CREATE INDEX idx_artistas_nombre ON artistas(nombre_artistico);"
        ]
    },
    {
        "name": "artista_contactos",
        "description": "Vínculo contacto ↔ artista con rol (Manager, Booking…). Sustituye a los textos `manager` y `booking_agent`.",
        "columns": [
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → artistas(id), al borrar: CASCADE · Artista.",
                "key": "PK"
            },
            {
                "name": "contacto_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → contactos(id), al borrar: CASCADE · Contacto (persona).",
                "key": "PK"
            },
            {
                "name": "rol_id",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Llave foránea → cat_roles_contacto(id), al borrar: RESTRICT · Rol del contacto en la entidad (catálogo cat_roles_contacto).",
                "key": "PK"
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal."
            }
        ],
        "indexes": [
            "CREATE INDEX fk_artista_contactos_rol ON artista_contactos(rol_id);",
            "CREATE INDEX idx_artista_contactos_contacto ON artista_contactos(contacto_id);",
            "CREATE UNIQUE INDEX uq_ac_principal ON artista_contactos(artista_id,rol_id,es_principal);"
        ]
    },
    {
        "name": "artista_generos",
        "description": "Géneros de un artista (N:M). Un género es el principal; el resto, secundarios.",
        "columns": [
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → artistas(id), al borrar: CASCADE · Artista.",
                "key": "PK"
            },
            {
                "name": "genero_id",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Llave foránea → cat_generos(id), al borrar: RESTRICT · Género (catálogo cat_generos).",
                "key": "PK"
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Género principal del artista (1) o secundario (NULL)."
            },
            {
                "name": "orden",
                "type": "TINYINT(3) UNSIGNED",
                "notes": "Obligatorio · Posición del género en la lista del artista (1 = primero)."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_artista_generos_genero ON artista_generos(genero_id);",
            "CREATE UNIQUE INDEX uq_artista_genero_principal ON artista_generos(artista_id,es_principal);"
        ]
    },
    {
        "name": "cat_etapas_desarrollo",
        "description": "Catálogo cerrado de etapas de carrera de un artista (Desarrollo … Internacional).",
        "columns": [
            {
                "name": "id",
                "type": "TINYINT(4)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(50)",
                "notes": "Obligatorio · Nombre."
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX nombre ON cat_etapas_desarrollo(nombre);"
        ]
    },
    {
        "name": "cat_generos",
        "description": "Catálogo abierto de géneros musicales. Evita guardar listas de géneros separadas por comas.",
        "columns": [
            {
                "name": "id",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(80)",
                "notes": "Obligatorio · Nombre."
            },
            {
                "name": "descripcion",
                "type": "VARCHAR(255)",
                "notes": "Descripción opcional."
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX uq_generos_nombre ON cat_generos(nombre);"
        ]
    },
    {
        "name": "cat_monedas",
        "description": "Catálogo de monedas (ISO 4217) para honorarios.",
        "columns": [
            {
                "name": "codigo",
                "type": "CHAR(3)",
                "notes": "Obligatorio · Código ISO 4217 (MXN, USD, EUR).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(60)",
                "notes": "Obligatorio · Nombre."
            }
        ],
        "indexes": []
    },
    {
        "name": "cat_roles_contacto",
        "description": "Catálogo abierto de roles que una persona puede tener en una entidad (Manager, Booking, Promotor…). Unifica «Booking» y «booking».",
        "columns": [
            {
                "name": "id",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(60)",
                "notes": "Obligatorio · Nombre."
            }
        ],
        "indexes": [
            "CREATE UNIQUE INDEX uq_roles_nombre ON cat_roles_contacto(nombre);"
        ]
    },
    {
        "name": "contactos",
        "description": "Persona (o empresa) independiente de cualquier entidad. Sus medios de contacto y vínculos viven en tablas propias.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Nombre (o nombre completo en registros migrados)."
            },
            {
                "name": "apellidos",
                "type": "VARCHAR(255)",
                "notes": "Apellidos (opcional)."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            },
            {
                "name": "updated_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de la última modificación (UTC)."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_contactos_nombre ON contactos(nombre);"
        ]
    },
    {
        "name": "contacto_correos",
        "description": "Correos electrónicos de un contacto (uno principal).",
        "columns": [
            {
                "name": "id",
                "type": "BIGINT(20) UNSIGNED",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "contacto_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → contactos(id), al borrar: CASCADE · Contacto (persona).",
                "key": "FK"
            },
            {
                "name": "correo",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Dirección de correo."
            },
            {
                "name": "etiqueta",
                "type": "VARCHAR(30)",
                "notes": "Etiqueta (trabajo, personal…)."
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_contacto_correos_correo ON contacto_correos(correo);",
            "CREATE UNIQUE INDEX uq_contacto_correos_principal ON contacto_correos(contacto_id,es_principal);",
            "CREATE UNIQUE INDEX uq_contacto_correos_valor ON contacto_correos(contacto_id,correo);"
        ]
    },
    {
        "name": "contacto_telefonos",
        "description": "Teléfonos de un contacto (uno principal).",
        "columns": [
            {
                "name": "id",
                "type": "BIGINT(20) UNSIGNED",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "contacto_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → contactos(id), al borrar: CASCADE · Contacto (persona).",
                "key": "FK"
            },
            {
                "name": "telefono",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Número de teléfono."
            },
            {
                "name": "etiqueta",
                "type": "VARCHAR(30)",
                "notes": "Etiqueta (móvil, WhatsApp, oficina…)."
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_contacto_telefonos_telefono ON contacto_telefonos(telefono);",
            "CREATE UNIQUE INDEX uq_contacto_telefonos_principal ON contacto_telefonos(contacto_id,es_principal);",
            "CREATE UNIQUE INDEX uq_contacto_telefonos_valor ON contacto_telefonos(contacto_id,telefono);"
        ]
    },
    {
        "name": "contratos",
        "description": "Contratos con su archivo y estado. Las relaciones son RESTRICT: no se pierde el historial contractual por borrados en cascada.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "titulo",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Título del contrato."
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "Llave foránea → artistas(id), al borrar: RESTRICT · Artista.",
                "key": "FK"
            },
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "notes": "Llave foránea → venues(id), al borrar: RESTRICT · Venue.",
                "key": "FK"
            },
            {
                "name": "tour_id",
                "type": "VARCHAR(40)",
                "notes": "Llave foránea → tours(id), al borrar: RESTRICT · Gira.",
                "key": "FK"
            },
            {
                "name": "evento_id",
                "type": "VARCHAR(40)",
                "notes": "Llave foránea → eventos(id), al borrar: RESTRICT · Evento.",
                "key": "FK"
            },
            {
                "name": "tipo",
                "type": "VARCHAR(60)",
                "notes": "Tipo (dominio cerrado por CHECK)."
            },
            {
                "name": "estado",
                "type": "VARCHAR(30)",
                "notes": "Estado: Draft, Pending, Signed, Rejected, Active."
            },
            {
                "name": "nombre_archivo",
                "type": "VARCHAR(255)",
                "notes": "Nombre del archivo adjunto."
            },
            {
                "name": "notas",
                "type": "TEXT",
                "notes": "Notas internas."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "fecha_subida",
                "type": "DATETIME(3)",
                "notes": "Fecha y hora de carga."
            },
            {
                "name": "tamano_bytes",
                "type": "BIGINT(20)",
                "notes": "Tamaño del archivo en bytes."
            }
        ],
        "indexes": [
            "CREATE INDEX fk_contratos_tour ON contratos(tour_id);",
            "CREATE INDEX fk_contratos_venue ON contratos(venue_id);",
            "CREATE INDEX idx_contratos_artista ON contratos(artista_id);",
            "CREATE INDEX idx_contratos_evento ON contratos(evento_id);"
        ]
    },
    {
        "name": "eventos",
        "description": "Shows y conciertos. El ingreso se captura (puede diferir de asistencia × precio); la utilidad se calcula y un CHECK impide que se desajuste. Los artistas están en evento_artistas.",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Nombre comercial del evento."
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "OBSOLETO (v1): artista del evento. Sustituido por evento_artistas."
            },
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → venues(id), al borrar: RESTRICT · Recinto donde se realiza.",
                "key": "FK"
            },
            {
                "name": "tour_id",
                "type": "VARCHAR(40)",
                "notes": "Llave foránea → tours(id), al borrar: SET NULL · Gira.",
                "key": "FK"
            },
            {
                "name": "fecha",
                "type": "DATE",
                "notes": "Fecha del evento."
            },
            {
                "name": "estado",
                "type": "VARCHAR(30)",
                "notes": "Estatus: Draft, Confirmed, Completed, Cancelled."
            },
            {
                "name": "capacidad",
                "type": "INT(11)",
                "notes": "Aforo."
            },
            {
                "name": "asistencia",
                "type": "INT(11)",
                "notes": "Asistencia (boletos pagados y cortesías)."
            },
            {
                "name": "precio_boleto",
                "type": "DECIMAL(10,2)",
                "notes": "Precio promedio del boleto."
            },
            {
                "name": "ingreso_total",
                "type": "DECIMAL(12,2)",
                "notes": "Ingreso real capturado (puede diferir de asistencia × precio)."
            },
            {
                "name": "gastos_totales",
                "type": "DECIMAL(12,2)",
                "notes": "Gastos de producción, rider y viáticos."
            },
            {
                "name": "utilidad",
                "type": "DECIMAL(12,2)",
                "notes": "Utilidad = ingreso_total − gastos_totales (la fuerza un CHECK)."
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "Documento JSON con campos anidados que aún no se consultan ni relacionan por separado."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            },
            {
                "name": "updated_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de la última modificación (UTC)."
            },
            {
                "name": "deleted_at",
                "type": "DATETIME(3)",
                "notes": "Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial)."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_eventos_artista_fecha ON eventos(artista_id,fecha);",
            "CREATE INDEX idx_eventos_fecha ON eventos(fecha);",
            "CREATE INDEX idx_eventos_tour ON eventos(tour_id);",
            "CREATE INDEX idx_eventos_venue ON eventos(venue_id);"
        ]
    },
    {
        "name": "evento_artistas",
        "description": "Alineación del evento: qué artistas participan, con rol, orden, horario, honorarios y confirmación. Un artista puede presentarse más de una vez (distinto orden).",
        "columns": [
            {
                "name": "id",
                "type": "BIGINT(20) UNSIGNED",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "evento_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → eventos(id), al borrar: CASCADE · Evento.",
                "key": "FK"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → artistas(id), al borrar: RESTRICT · Artista.",
                "key": "FK"
            },
            {
                "name": "rol",
                "type": "VARCHAR(20)",
                "notes": "Obligatorio · Rol en el cartel: Artista, Invitado, Telonero, Soporte, Otro."
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Artista principal del evento (1) o NULL."
            },
            {
                "name": "orden_presentacion",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Orden en que se presenta (1 = primero)."
            },
            {
                "name": "hora_inicio",
                "type": "TIME",
                "notes": "Hora de inicio."
            },
            {
                "name": "hora_fin",
                "type": "TIME",
                "notes": "Hora de fin."
            },
            {
                "name": "honorarios",
                "type": "DECIMAL(12,2)",
                "notes": "Honorarios acordados (≥ 0)."
            },
            {
                "name": "moneda",
                "type": "CHAR(3)",
                "notes": "Obligatorio · Llave foránea → cat_monedas(codigo), al borrar: RESTRICT · Moneda de los honorarios (cat_monedas).",
                "key": "FK"
            },
            {
                "name": "estado_confirmacion",
                "type": "VARCHAR(20)",
                "notes": "Obligatorio · Pendiente, Confirmado o Cancelado."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            },
            {
                "name": "updated_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de la última modificación (UTC)."
            }
        ],
        "indexes": [
            "CREATE INDEX fk_ea_moneda ON evento_artistas(moneda);",
            "CREATE INDEX idx_ea_artista ON evento_artistas(artista_id,evento_id);",
            "CREATE UNIQUE INDEX uq_ea_presentacion ON evento_artistas(evento_id,artista_id,orden_presentacion);",
            "CREATE UNIQUE INDEX uq_ea_principal ON evento_artistas(evento_id,es_principal);"
        ]
    },
    {
        "name": "proveedores",
        "description": "Proveedores técnicos y de servicios (sonido, iluminación, catering…).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Nombre."
            },
            {
                "name": "categoria",
                "type": "VARCHAR(80)",
                "notes": "Categoría (dominio cerrado por CHECK)."
            },
            {
                "name": "contacto",
                "type": "VARCHAR(255)",
                "notes": "OBSOLETO (v1): nombre del contacto. Sustituido por proveedor_contactos."
            },
            {
                "name": "telefono",
                "type": "VARCHAR(60)",
                "notes": "OBSOLETO (v1)."
            },
            {
                "name": "correo",
                "type": "VARCHAR(255)",
                "notes": "OBSOLETO (v1)."
            },
            {
                "name": "rating",
                "type": "DECIMAL(3,1)",
                "notes": "Calificación 0–5."
            },
            {
                "name": "costo_por_show",
                "type": "DECIMAL(12,2)",
                "notes": "Costo base por show (MXN)."
            },
            {
                "name": "notas",
                "type": "TEXT",
                "notes": "Notas internas."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            }
        ],
        "indexes": []
    },
    {
        "name": "proveedor_contactos",
        "description": "Vínculo contacto ↔ proveedor con rol. Sustituye a las columnas contacto/telefono/correo del proveedor.",
        "columns": [
            {
                "name": "proveedor_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → proveedores(id), al borrar: CASCADE · Proveedor.",
                "key": "PK"
            },
            {
                "name": "contacto_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → contactos(id), al borrar: CASCADE · Contacto (persona).",
                "key": "PK"
            },
            {
                "name": "rol_id",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Llave foránea → cat_roles_contacto(id), al borrar: RESTRICT · Rol del contacto en la entidad (catálogo cat_roles_contacto).",
                "key": "PK"
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal."
            }
        ],
        "indexes": [
            "CREATE INDEX fk_proveedor_contactos_rol ON proveedor_contactos(rol_id);",
            "CREATE INDEX idx_proveedor_contactos_contacto ON proveedor_contactos(contacto_id);",
            "CREATE UNIQUE INDEX uq_pc_principal ON proveedor_contactos(proveedor_id,es_principal);"
        ]
    },
    {
        "name": "proyectos_grabacion",
        "description": "Proyectos de grabación de un artista. Canciones, costos, pagos y etapas van en `extra` (pendiente de Fase 3).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "titulo",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Título del proyecto."
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "Llave foránea → artistas(id), al borrar: SET NULL · Artista.",
                "key": "FK"
            },
            {
                "name": "estado",
                "type": "VARCHAR(40)",
                "notes": "Estado del proyecto (dominio cerrado por CHECK)."
            },
            {
                "name": "fecha_lanzamiento",
                "type": "DATE",
                "notes": "Fecha de lanzamiento prevista."
            },
            {
                "name": "estudio",
                "type": "VARCHAR(255)",
                "notes": "Estudio."
            },
            {
                "name": "productor",
                "type": "VARCHAR(255)",
                "notes": "Productor."
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "Documento JSON con campos anidados que aún no se consultan ni relacionan por separado."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_proyectos_artista ON proyectos_grabacion(artista_id);"
        ]
    },
    {
        "name": "tours",
        "description": "Giras con fechas y estatus. Los artistas participantes están en tour_artistas (una gira puede ser compartida).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "OBSOLETO (v1): artista de la gira. Sustituido por tour_artistas."
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Nombre."
            },
            {
                "name": "fecha_inicio",
                "type": "DATE",
                "notes": "Fecha de inicio."
            },
            {
                "name": "fecha_fin",
                "type": "DATE",
                "notes": "Fecha de fin (≥ inicio)."
            },
            {
                "name": "status",
                "type": "VARCHAR(50)",
                "notes": "Estatus: Planning, Active, Completed, Cancelled."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            },
            {
                "name": "updated_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de la última modificación (UTC)."
            },
            {
                "name": "deleted_at",
                "type": "DATETIME(3)",
                "notes": "Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial)."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_tours_artista ON tours(artista_id);"
        ]
    },
    {
        "name": "tour_artistas",
        "description": "Artistas de una gira (N:M); uno es el principal.",
        "columns": [
            {
                "name": "tour_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → tours(id), al borrar: CASCADE · Gira.",
                "key": "PK"
            },
            {
                "name": "artista_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → artistas(id), al borrar: RESTRICT · Artista.",
                "key": "PK"
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Artista principal de la gira (1) o NULL."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_ta_artista ON tour_artistas(artista_id);",
            "CREATE UNIQUE INDEX uq_ta_principal ON tour_artistas(tour_id,es_principal);"
        ]
    },
    {
        "name": "venues",
        "description": "Recintos, foros, teatros y bares, con coordenadas, calificación y puntajes. `extra` guarda datos de ficha aún no consultables por separado (horarios, redes, bandas locales).",
        "columns": [
            {
                "name": "id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»).",
                "key": "PK"
            },
            {
                "name": "nombre",
                "type": "VARCHAR(255)",
                "notes": "Obligatorio · Nombre del recinto."
            },
            {
                "name": "direccion",
                "type": "TEXT",
                "notes": "Dirección completa."
            },
            {
                "name": "ciudad",
                "type": "VARCHAR(150)",
                "notes": "Ciudad."
            },
            {
                "name": "estado",
                "type": "VARCHAR(150)",
                "notes": "Estado o provincia."
            },
            {
                "name": "pais",
                "type": "VARCHAR(150)",
                "notes": "País."
            },
            {
                "name": "codigo_postal",
                "type": "VARCHAR(20)",
                "notes": "Código postal."
            },
            {
                "name": "latitud",
                "type": "DECIMAL(10,8)",
                "notes": "Latitud (−90 a 90)."
            },
            {
                "name": "longitud",
                "type": "DECIMAL(11,8)",
                "notes": "Longitud (−180 a 180)."
            },
            {
                "name": "rating",
                "type": "DECIMAL(3,1)",
                "notes": "Calificación 0–5."
            },
            {
                "name": "score_rentabilidad",
                "type": "SMALLINT(6)",
                "notes": "Puntaje 0–100 de rentabilidad."
            },
            {
                "name": "score_respuesta",
                "type": "SMALLINT(6)",
                "notes": "Puntaje 0–100 de tiempo de respuesta."
            },
            {
                "name": "score_puntualidad_pago",
                "type": "SMALLINT(6)",
                "notes": "Puntaje 0–100 de puntualidad de pago."
            },
            {
                "name": "score_negociacion",
                "type": "SMALLINT(6)",
                "notes": "Puntaje 0–100 de negociación."
            },
            {
                "name": "score_produccion",
                "type": "SMALLINT(6)",
                "notes": "Puntaje 0–100 de producción."
            },
            {
                "name": "score_hospitalidad",
                "type": "SMALLINT(6)",
                "notes": "Puntaje 0–100 de hospitalidad."
            },
            {
                "name": "contacto_principal_id",
                "type": "VARCHAR(40)",
                "notes": "OBSOLETO (v1): contacto principal. Sustituido por venue_contactos.es_principal."
            },
            {
                "name": "extra",
                "type": "LONGTEXT",
                "notes": "Documento JSON con campos anidados que aún no se consultan ni relacionan por separado."
            },
            {
                "name": "version",
                "type": "INT(11)",
                "notes": "Obligatorio · Número de versión del registro: base del bloqueo optimista (sube en cada guardado)."
            },
            {
                "name": "created_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de creación (UTC, milisegundos)."
            },
            {
                "name": "updated_at",
                "type": "DATETIME(3)",
                "notes": "Obligatorio · Fecha y hora de la última modificación (UTC)."
            },
            {
                "name": "deleted_at",
                "type": "DATETIME(3)",
                "notes": "Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial)."
            }
        ],
        "indexes": [
            "CREATE INDEX idx_venues_ciudad ON venues(ciudad);",
            "CREATE INDEX idx_venues_contacto_principal ON venues(contacto_principal_id);",
            "CREATE INDEX idx_venues_nombre ON venues(nombre);"
        ]
    },
    {
        "name": "venue_contactos",
        "description": "Vínculo contacto ↔ venue con su rol; marca al contacto principal del venue. Reemplaza `venues.contacto_principal_id` y elimina la dependencia circular.",
        "columns": [
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → venues(id), al borrar: CASCADE · Venue.",
                "key": "PK"
            },
            {
                "name": "contacto_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → contactos(id), al borrar: CASCADE · Contacto (persona).",
                "key": "PK"
            },
            {
                "name": "rol_id",
                "type": "SMALLINT(5) UNSIGNED",
                "notes": "Obligatorio · Llave foránea → cat_roles_contacto(id), al borrar: RESTRICT · Rol del contacto en la entidad (catálogo cat_roles_contacto).",
                "key": "PK"
            },
            {
                "name": "es_principal",
                "type": "TINYINT(1)",
                "notes": "Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal."
            }
        ],
        "indexes": [
            "CREATE INDEX fk_venue_contactos_rol ON venue_contactos(rol_id);",
            "CREATE INDEX idx_venue_contactos_contacto ON venue_contactos(contacto_id);",
            "CREATE UNIQUE INDEX uq_vc_principal ON venue_contactos(venue_id,es_principal);"
        ]
    },
    {
        "name": "venue_proveedores",
        "description": "Relación N:M entre venues y proveedores.",
        "columns": [
            {
                "name": "venue_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → venues(id), al borrar: CASCADE · Venue.",
                "key": "PK"
            },
            {
                "name": "proveedor_id",
                "type": "VARCHAR(40)",
                "notes": "Obligatorio · Llave foránea → proveedores(id), al borrar: CASCADE · Proveedor.",
                "key": "PK"
            }
        ],
        "indexes": [
            "CREATE INDEX proveedor_id ON venue_proveedores(proveedor_id);"
        ]
    }
];
export const SCHEMA_SQL = "-- ==========================================================================\n-- FLAMO CRM — esquema relacional (MySQL / MariaDB, InnoDB, utf8mb4)\n-- Generado por scripts/db/generate-docs.php desde una base migrada (v3). No editar a mano.\n-- Para instalar: ejecutar este archivo en una base vacía. Para actualizar una base existente\n-- usa las migraciones (public/api/migrations), que conservan los datos.\n-- ==========================================================================\n\n/*M!999999\\- enable the sandbox mode */ \nCREATE TABLE `artista_contactos` (\n  `artista_id` varchar(40) NOT NULL,\n  `contacto_id` varchar(40) NOT NULL,\n  `rol_id` smallint(5) unsigned NOT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  PRIMARY KEY (`artista_id`,`contacto_id`,`rol_id`),\n  UNIQUE KEY `uq_ac_principal` (`artista_id`,`rol_id`,`es_principal`),\n  KEY `idx_artista_contactos_contacto` (`contacto_id`),\n  KEY `fk_artista_contactos_rol` (`rol_id`),\n  CONSTRAINT `fk_artista_contactos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_artista_contactos_entidad` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_artista_contactos_rol` FOREIGN KEY (`rol_id`) REFERENCES `cat_roles_contacto` (`id`),\n  CONSTRAINT `chk_artista_contactos_principal` CHECK (`es_principal` is null or `es_principal` = 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `artista_generos` (\n  `artista_id` varchar(40) NOT NULL,\n  `genero_id` smallint(5) unsigned NOT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  `orden` tinyint(3) unsigned NOT NULL,\n  PRIMARY KEY (`artista_id`,`genero_id`),\n  UNIQUE KEY `uq_artista_genero_principal` (`artista_id`,`es_principal`),\n  KEY `idx_artista_generos_genero` (`genero_id`),\n  CONSTRAINT `fk_ag_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_ag_genero` FOREIGN KEY (`genero_id`) REFERENCES `cat_generos` (`id`),\n  CONSTRAINT `chk_ag_principal` CHECK (`es_principal` is null or `es_principal` = 1),\n  CONSTRAINT `chk_ag_orden` CHECK (`orden` >= 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `artistas` (\n  `id` varchar(40) NOT NULL,\n  `nombre_artistico` varchar(255) NOT NULL,\n  `nombre_legal` varchar(255) DEFAULT NULL,\n  `genero` varchar(150) DEFAULT NULL,\n  `etapa_id` tinyint(4) NOT NULL DEFAULT 1,\n  `manager` varchar(255) DEFAULT NULL,\n  `booking_agent` varchar(255) DEFAULT NULL,\n  `isrc_default` varchar(40) DEFAULT NULL,\n  `iswc_default` varchar(40) DEFAULT NULL,\n  `sociedad_gestion` varchar(80) DEFAULT NULL,\n  `rfc` varchar(40) DEFAULT NULL,\n  `ciudad` varchar(150) DEFAULT NULL,\n  `estado` varchar(150) DEFAULT NULL,\n  `pais` varchar(150) DEFAULT NULL,\n  `foto` text DEFAULT NULL,\n  `extra` longtext DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `deleted_at` datetime(3) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `etapa_id` (`etapa_id`),\n  KEY `idx_artistas_nombre` (`nombre_artistico`),\n  CONSTRAINT `artistas_ibfk_1` FOREIGN KEY (`etapa_id`) REFERENCES `cat_etapas_desarrollo` (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `cat_etapas_desarrollo` (\n  `id` tinyint(4) NOT NULL,\n  `nombre` varchar(50) NOT NULL,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `nombre` (`nombre`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `cat_generos` (\n  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,\n  `nombre` varchar(80) NOT NULL,\n  `descripcion` varchar(255) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uq_generos_nombre` (`nombre`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `cat_monedas` (\n  `codigo` char(3) NOT NULL,\n  `nombre` varchar(60) NOT NULL,\n  PRIMARY KEY (`codigo`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `cat_roles_contacto` (\n  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,\n  `nombre` varchar(60) NOT NULL,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uq_roles_nombre` (`nombre`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `contacto_correos` (\n  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n  `contacto_id` varchar(40) NOT NULL,\n  `correo` varchar(255) NOT NULL,\n  `etiqueta` varchar(30) DEFAULT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uq_contacto_correos_valor` (`contacto_id`,`correo`),\n  UNIQUE KEY `uq_contacto_correos_principal` (`contacto_id`,`es_principal`),\n  KEY `idx_contacto_correos_correo` (`correo`),\n  CONSTRAINT `fk_contacto_correos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `chk_contacto_correos_principal` CHECK (`es_principal` is null or `es_principal` = 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `contacto_telefonos` (\n  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n  `contacto_id` varchar(40) NOT NULL,\n  `telefono` varchar(40) NOT NULL,\n  `etiqueta` varchar(30) DEFAULT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uq_contacto_telefonos_valor` (`contacto_id`,`telefono`),\n  UNIQUE KEY `uq_contacto_telefonos_principal` (`contacto_id`,`es_principal`),\n  KEY `idx_contacto_telefonos_telefono` (`telefono`),\n  CONSTRAINT `fk_contacto_telefonos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `chk_contacto_telefonos_principal` CHECK (`es_principal` is null or `es_principal` = 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `contactos` (\n  `id` varchar(40) NOT NULL,\n  `nombre` varchar(255) NOT NULL,\n  `apellidos` varchar(255) DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  PRIMARY KEY (`id`),\n  KEY `idx_contactos_nombre` (`nombre`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `contactos_legacy` (\n  `id` varchar(40) NOT NULL,\n  `venue_id` varchar(40) NOT NULL,\n  `nombre` varchar(255) NOT NULL,\n  `correo` varchar(255) DEFAULT NULL,\n  `telefono` varchar(60) DEFAULT NULL,\n  `rol` varchar(150) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `idx_contactos_venue` (`venue_id`),\n  KEY `idx_contactos_correo` (`correo`),\n  CONSTRAINT `contactos_legacy_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `contratos` (\n  `id` varchar(40) NOT NULL,\n  `titulo` varchar(255) NOT NULL,\n  `artista_id` varchar(40) DEFAULT NULL,\n  `venue_id` varchar(40) DEFAULT NULL,\n  `tour_id` varchar(40) DEFAULT NULL,\n  `evento_id` varchar(40) DEFAULT NULL,\n  `tipo` varchar(60) DEFAULT NULL,\n  `estado` varchar(30) DEFAULT NULL,\n  `nombre_archivo` varchar(255) DEFAULT NULL,\n  `notas` text DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `fecha_subida` datetime(3) DEFAULT NULL,\n  `tamano_bytes` bigint(20) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `idx_contratos_artista` (`artista_id`),\n  KEY `idx_contratos_evento` (`evento_id`),\n  KEY `fk_contratos_venue` (`venue_id`),\n  KEY `fk_contratos_tour` (`tour_id`),\n  CONSTRAINT `fk_contratos_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),\n  CONSTRAINT `fk_contratos_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),\n  CONSTRAINT `fk_contratos_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`),\n  CONSTRAINT `fk_contratos_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),\n  CONSTRAINT `chk_contratos_estado` CHECK (`estado` in ('Draft','Pending','Signed','Rejected','Active')),\n  CONSTRAINT `chk_contratos_tipo` CHECK (`tipo` in ('Management','Booking','Performance','Co-production','NDA','Foro/Arrendamiento','Other')),\n  CONSTRAINT `chk_contratos_tamano` CHECK (`tamano_bytes` is null or `tamano_bytes` >= 0)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `evento_artistas` (\n  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n  `evento_id` varchar(40) NOT NULL,\n  `artista_id` varchar(40) NOT NULL,\n  `rol` varchar(20) NOT NULL DEFAULT 'Artista',\n  `es_principal` tinyint(1) DEFAULT NULL,\n  `orden_presentacion` smallint(5) unsigned NOT NULL DEFAULT 1,\n  `hora_inicio` time DEFAULT NULL,\n  `hora_fin` time DEFAULT NULL,\n  `honorarios` decimal(12,2) DEFAULT NULL,\n  `moneda` char(3) NOT NULL DEFAULT 'MXN',\n  `estado_confirmacion` varchar(20) NOT NULL DEFAULT 'Pendiente',\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `uq_ea_presentacion` (`evento_id`,`artista_id`,`orden_presentacion`),\n  UNIQUE KEY `uq_ea_principal` (`evento_id`,`es_principal`),\n  KEY `idx_ea_artista` (`artista_id`,`evento_id`),\n  KEY `fk_ea_moneda` (`moneda`),\n  CONSTRAINT `fk_ea_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),\n  CONSTRAINT `fk_ea_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_ea_moneda` FOREIGN KEY (`moneda`) REFERENCES `cat_monedas` (`codigo`),\n  CONSTRAINT `chk_ea_principal` CHECK (`es_principal` is null or `es_principal` = 1),\n  CONSTRAINT `chk_ea_rol` CHECK (`rol` in ('Artista','Invitado','Telonero','Soporte','Otro')),\n  CONSTRAINT `chk_ea_estado` CHECK (`estado_confirmacion` in ('Pendiente','Confirmado','Cancelado')),\n  CONSTRAINT `chk_ea_orden` CHECK (`orden_presentacion` >= 1),\n  CONSTRAINT `chk_ea_honorarios` CHECK (`honorarios` is null or `honorarios` >= 0)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `eventos` (\n  `id` varchar(40) NOT NULL,\n  `nombre` varchar(255) NOT NULL,\n  `artista_id` varchar(40) DEFAULT NULL,\n  `venue_id` varchar(40) NOT NULL,\n  `tour_id` varchar(40) DEFAULT NULL,\n  `fecha` date DEFAULT NULL,\n  `estado` varchar(30) DEFAULT 'Draft',\n  `capacidad` int(11) DEFAULT 0,\n  `asistencia` int(11) DEFAULT 0,\n  `precio_boleto` decimal(10,2) DEFAULT 0.00,\n  `ingreso_total` decimal(12,2) DEFAULT 0.00,\n  `gastos_totales` decimal(12,2) DEFAULT 0.00,\n  `utilidad` decimal(12,2) DEFAULT 0.00,\n  `extra` longtext DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `deleted_at` datetime(3) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `idx_eventos_venue` (`venue_id`),\n  KEY `idx_eventos_tour` (`tour_id`),\n  KEY `idx_eventos_fecha` (`fecha`),\n  KEY `idx_eventos_artista_fecha` (`artista_id`,`fecha`),\n  CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),\n  CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),\n  CONSTRAINT `eventos_ibfk_3` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE SET NULL,\n  CONSTRAINT `chk_eventos_estado` CHECK (`estado` in ('Draft','Confirmed','Completed','Cancelled')),\n  CONSTRAINT `chk_eventos_cantidades` CHECK (`capacidad` >= 0 and `asistencia` >= 0 and `precio_boleto` >= 0 and `ingreso_total` >= 0 and `gastos_totales` >= 0),\n  CONSTRAINT `chk_eventos_utilidad` CHECK (`utilidad` = `ingreso_total` - `gastos_totales`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `proveedor_contactos` (\n  `proveedor_id` varchar(40) NOT NULL,\n  `contacto_id` varchar(40) NOT NULL,\n  `rol_id` smallint(5) unsigned NOT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  PRIMARY KEY (`proveedor_id`,`contacto_id`,`rol_id`),\n  UNIQUE KEY `uq_pc_principal` (`proveedor_id`,`es_principal`),\n  KEY `idx_proveedor_contactos_contacto` (`contacto_id`),\n  KEY `fk_proveedor_contactos_rol` (`rol_id`),\n  CONSTRAINT `fk_proveedor_contactos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_proveedor_contactos_entidad` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_proveedor_contactos_rol` FOREIGN KEY (`rol_id`) REFERENCES `cat_roles_contacto` (`id`),\n  CONSTRAINT `chk_proveedor_contactos_principal` CHECK (`es_principal` is null or `es_principal` = 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `proveedores` (\n  `id` varchar(40) NOT NULL,\n  `nombre` varchar(255) NOT NULL,\n  `categoria` varchar(80) DEFAULT NULL,\n  `contacto` varchar(255) DEFAULT NULL,\n  `telefono` varchar(60) DEFAULT NULL,\n  `correo` varchar(255) DEFAULT NULL,\n  `rating` decimal(3,1) DEFAULT 0.0,\n  `costo_por_show` decimal(12,2) DEFAULT 0.00,\n  `notas` text DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  PRIMARY KEY (`id`),\n  CONSTRAINT `chk_proveedores_categoria` CHECK (`categoria` in ('Sonido','Ingeniero de Audio','Iluminación','Catering','Backline','Escenografía','Seguridad','Personal de Apoyo','Otros')),\n  CONSTRAINT `chk_proveedores_valores` CHECK (`rating` between 0 and 5 and `costo_por_show` >= 0)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `proyectos_grabacion` (\n  `id` varchar(40) NOT NULL,\n  `titulo` varchar(255) NOT NULL,\n  `artista_id` varchar(40) DEFAULT NULL,\n  `estado` varchar(40) DEFAULT NULL,\n  `fecha_lanzamiento` date DEFAULT NULL,\n  `estudio` varchar(255) DEFAULT NULL,\n  `productor` varchar(255) DEFAULT NULL,\n  `extra` longtext DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  PRIMARY KEY (`id`),\n  KEY `idx_proyectos_artista` (`artista_id`),\n  CONSTRAINT `proyectos_grabacion_ibfk_1` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE SET NULL,\n  CONSTRAINT `chk_proyectos_estado` CHECK (`estado` in ('Planificación','Pre-producción','Grabando','Mezcla','Masterización','Completado'))\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `schema_meta` (\n  `id` int(11) NOT NULL,\n  `version` int(11) NOT NULL,\n  `updated_at` varchar(32) NOT NULL,\n  PRIMARY KEY (`id`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `schema_migrations` (\n  `version` int(11) NOT NULL,\n  `nombre` varchar(100) NOT NULL,\n  `aplicada_en` datetime(3) NOT NULL,\n  `checksum` char(32) NOT NULL,\n  `notas` text DEFAULT NULL,\n  PRIMARY KEY (`version`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `tour_artistas` (\n  `tour_id` varchar(40) NOT NULL,\n  `artista_id` varchar(40) NOT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  PRIMARY KEY (`tour_id`,`artista_id`),\n  UNIQUE KEY `uq_ta_principal` (`tour_id`,`es_principal`),\n  KEY `idx_ta_artista` (`artista_id`),\n  CONSTRAINT `fk_ta_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),\n  CONSTRAINT `fk_ta_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `chk_ta_principal` CHECK (`es_principal` is null or `es_principal` = 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `tours` (\n  `id` varchar(40) NOT NULL,\n  `artista_id` varchar(40) DEFAULT NULL,\n  `nombre` varchar(255) NOT NULL,\n  `fecha_inicio` date DEFAULT NULL,\n  `fecha_fin` date DEFAULT NULL,\n  `status` varchar(50) DEFAULT 'Planning',\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `deleted_at` datetime(3) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `idx_tours_artista` (`artista_id`),\n  CONSTRAINT `tours_ibfk_1` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),\n  CONSTRAINT `chk_tours_status` CHECK (`status` in ('Planning','Active','Completed','Cancelled')),\n  CONSTRAINT `chk_tours_fechas` CHECK (`fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `venue_contactos` (\n  `venue_id` varchar(40) NOT NULL,\n  `contacto_id` varchar(40) NOT NULL,\n  `rol_id` smallint(5) unsigned NOT NULL,\n  `es_principal` tinyint(1) DEFAULT NULL,\n  PRIMARY KEY (`venue_id`,`contacto_id`,`rol_id`),\n  UNIQUE KEY `uq_vc_principal` (`venue_id`,`es_principal`),\n  KEY `idx_venue_contactos_contacto` (`contacto_id`),\n  KEY `fk_venue_contactos_rol` (`rol_id`),\n  CONSTRAINT `fk_venue_contactos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_venue_contactos_entidad` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `fk_venue_contactos_rol` FOREIGN KEY (`rol_id`) REFERENCES `cat_roles_contacto` (`id`),\n  CONSTRAINT `chk_venue_contactos_principal` CHECK (`es_principal` is null or `es_principal` = 1)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `venue_proveedores` (\n  `venue_id` varchar(40) NOT NULL,\n  `proveedor_id` varchar(40) NOT NULL,\n  PRIMARY KEY (`venue_id`,`proveedor_id`),\n  KEY `proveedor_id` (`proveedor_id`),\n  CONSTRAINT `venue_proveedores_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE,\n  CONSTRAINT `venue_proveedores_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\nCREATE TABLE `venues` (\n  `id` varchar(40) NOT NULL,\n  `nombre` varchar(255) NOT NULL,\n  `direccion` text DEFAULT NULL,\n  `ciudad` varchar(150) DEFAULT NULL,\n  `estado` varchar(150) DEFAULT NULL,\n  `pais` varchar(150) DEFAULT NULL,\n  `codigo_postal` varchar(20) DEFAULT NULL,\n  `latitud` decimal(10,8) DEFAULT NULL,\n  `longitud` decimal(11,8) DEFAULT NULL,\n  `rating` decimal(3,1) DEFAULT 0.0,\n  `score_rentabilidad` smallint(6) DEFAULT 0,\n  `score_respuesta` smallint(6) DEFAULT 0,\n  `score_puntualidad_pago` smallint(6) DEFAULT 0,\n  `score_negociacion` smallint(6) DEFAULT 0,\n  `score_produccion` smallint(6) DEFAULT 0,\n  `score_hospitalidad` smallint(6) DEFAULT 0,\n  `contacto_principal_id` varchar(40) DEFAULT NULL,\n  `extra` longtext DEFAULT NULL,\n  `version` int(11) NOT NULL DEFAULT 1,\n  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),\n  `deleted_at` datetime(3) DEFAULT NULL,\n  PRIMARY KEY (`id`),\n  KEY `idx_venues_nombre` (`nombre`),\n  KEY `idx_venues_ciudad` (`ciudad`),\n  KEY `idx_venues_contacto_principal` (`contacto_principal_id`),\n  CONSTRAINT `fk_venues_principal_contact` FOREIGN KEY (`contacto_principal_id`) REFERENCES `contactos_legacy` (`id`) ON DELETE SET NULL,\n  CONSTRAINT `chk_venues_scores` CHECK (`score_rentabilidad` between 0 and 100 and `score_respuesta` between 0 and 100 and `score_puntualidad_pago` between 0 and 100 and `score_negociacion` between 0 and 100 and `score_produccion` between 0 and 100 and `score_hospitalidad` between 0 and 100),\n  CONSTRAINT `chk_venues_rating` CHECK (`rating` between 0 and 5),\n  CONSTRAINT `chk_venues_coord` CHECK ((`latitud` is null or `latitud` between -90 and 90) and (`longitud` is null or `longitud` between -180 and 180))\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n\n\n-- Datos de referencia (catálogos)\nINSERT INTO cat_etapas_desarrollo (id, nombre) VALUES (1, 'Desarrollo'), (2, 'Aficionado'), (3, 'Emergente'), (4, 'Media carrera'), (5, 'Consolidado'), (6, 'Consagrado'), (7, 'Internacional');\nINSERT INTO cat_roles_contacto (nombre) VALUES ('Manager'), ('Booking'), ('Promotor'), ('Técnico'), ('Hospitalidad'), ('Producción'), ('Administración'), ('Contacto comercial'), ('Contacto');\nINSERT INTO cat_monedas (codigo, nombre) VALUES ('MXN', 'Peso mexicano'), ('USD', 'Dólar estadounidense'), ('EUR', 'Euro');\nINSERT INTO schema_migrations (version, nombre, aplicada_en, checksum) VALUES (1, 'baseline_v1', NOW(3), ''), (2, 'integridad_fase1', NOW(3), ''), (3, 'nucleo_relacional_fase2', NOW(3), '');\n";
