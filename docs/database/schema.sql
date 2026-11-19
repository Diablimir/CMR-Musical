-- ==========================================================================
-- FLAMO CRM — esquema relacional (MySQL / MariaDB, InnoDB, utf8mb4)
-- Generado por scripts/db/generate-docs.php desde una base migrada (v3). No editar a mano.
-- Para instalar: ejecutar este archivo en una base vacía. Para actualizar una base existente
-- usa las migraciones (public/api/migrations), que conservan los datos.
-- ==========================================================================

/*M!999999\- enable the sandbox mode */ 
CREATE TABLE `artista_contactos` (
  `artista_id` varchar(40) NOT NULL,
  `contacto_id` varchar(40) NOT NULL,
  `rol_id` smallint(5) unsigned NOT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`artista_id`,`contacto_id`,`rol_id`),
  UNIQUE KEY `uq_ac_principal` (`artista_id`,`rol_id`,`es_principal`),
  KEY `idx_artista_contactos_contacto` (`contacto_id`),
  KEY `fk_artista_contactos_rol` (`rol_id`),
  CONSTRAINT `fk_artista_contactos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_artista_contactos_entidad` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_artista_contactos_rol` FOREIGN KEY (`rol_id`) REFERENCES `cat_roles_contacto` (`id`),
  CONSTRAINT `chk_artista_contactos_principal` CHECK (`es_principal` is null or `es_principal` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_generos` (
  `artista_id` varchar(40) NOT NULL,
  `genero_id` smallint(5) unsigned NOT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  `orden` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`artista_id`,`genero_id`),
  UNIQUE KEY `uq_artista_genero_principal` (`artista_id`,`es_principal`),
  KEY `idx_artista_generos_genero` (`genero_id`),
  CONSTRAINT `fk_ag_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ag_genero` FOREIGN KEY (`genero_id`) REFERENCES `cat_generos` (`id`),
  CONSTRAINT `chk_ag_principal` CHECK (`es_principal` is null or `es_principal` = 1),
  CONSTRAINT `chk_ag_orden` CHECK (`orden` >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artistas` (
  `id` varchar(40) NOT NULL,
  `nombre_artistico` varchar(255) NOT NULL,
  `nombre_legal` varchar(255) DEFAULT NULL,
  `genero` varchar(150) DEFAULT NULL,
  `etapa_id` tinyint(4) NOT NULL DEFAULT 1,
  `manager` varchar(255) DEFAULT NULL,
  `booking_agent` varchar(255) DEFAULT NULL,
  `isrc_default` varchar(40) DEFAULT NULL,
  `iswc_default` varchar(40) DEFAULT NULL,
  `sociedad_gestion` varchar(80) DEFAULT NULL,
  `rfc` varchar(40) DEFAULT NULL,
  `ciudad` varchar(150) DEFAULT NULL,
  `estado` varchar(150) DEFAULT NULL,
  `pais` varchar(150) DEFAULT NULL,
  `foto` text DEFAULT NULL,
  `extra` longtext DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etapa_id` (`etapa_id`),
  KEY `idx_artistas_nombre` (`nombre_artistico`),
  CONSTRAINT `artistas_ibfk_1` FOREIGN KEY (`etapa_id`) REFERENCES `cat_etapas_desarrollo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cat_etapas_desarrollo` (
  `id` tinyint(4) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cat_generos` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(80) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_generos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cat_monedas` (
  `codigo` char(3) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  PRIMARY KEY (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `cat_roles_contacto` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contacto_correos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `contacto_id` varchar(40) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `etiqueta` varchar(30) DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_contacto_correos_valor` (`contacto_id`,`correo`),
  UNIQUE KEY `uq_contacto_correos_principal` (`contacto_id`,`es_principal`),
  KEY `idx_contacto_correos_correo` (`correo`),
  CONSTRAINT `fk_contacto_correos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_contacto_correos_principal` CHECK (`es_principal` is null or `es_principal` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contacto_telefonos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `contacto_id` varchar(40) NOT NULL,
  `telefono` varchar(40) NOT NULL,
  `etiqueta` varchar(30) DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_contacto_telefonos_valor` (`contacto_id`,`telefono`),
  UNIQUE KEY `uq_contacto_telefonos_principal` (`contacto_id`,`es_principal`),
  KEY `idx_contacto_telefonos_telefono` (`telefono`),
  CONSTRAINT `fk_contacto_telefonos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_contacto_telefonos_principal` CHECK (`es_principal` is null or `es_principal` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contactos` (
  `id` varchar(40) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `apellidos` varchar(255) DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_contactos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contactos_legacy` (
  `id` varchar(40) NOT NULL,
  `venue_id` varchar(40) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `telefono` varchar(60) DEFAULT NULL,
  `rol` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_contactos_venue` (`venue_id`),
  KEY `idx_contactos_correo` (`correo`),
  CONSTRAINT `contactos_legacy_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contratos` (
  `id` varchar(40) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `artista_id` varchar(40) DEFAULT NULL,
  `venue_id` varchar(40) DEFAULT NULL,
  `tour_id` varchar(40) DEFAULT NULL,
  `evento_id` varchar(40) DEFAULT NULL,
  `tipo` varchar(60) DEFAULT NULL,
  `estado` varchar(30) DEFAULT NULL,
  `nombre_archivo` varchar(255) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `fecha_subida` datetime(3) DEFAULT NULL,
  `tamano_bytes` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_contratos_artista` (`artista_id`),
  KEY `idx_contratos_evento` (`evento_id`),
  KEY `fk_contratos_venue` (`venue_id`),
  KEY `fk_contratos_tour` (`tour_id`),
  CONSTRAINT `fk_contratos_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `fk_contratos_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`),
  CONSTRAINT `fk_contratos_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`),
  CONSTRAINT `fk_contratos_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),
  CONSTRAINT `chk_contratos_estado` CHECK (`estado` in ('Draft','Pending','Signed','Rejected','Active')),
  CONSTRAINT `chk_contratos_tipo` CHECK (`tipo` in ('Management','Booking','Performance','Co-production','NDA','Foro/Arrendamiento','Other')),
  CONSTRAINT `chk_contratos_tamano` CHECK (`tamano_bytes` is null or `tamano_bytes` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `evento_artistas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `evento_id` varchar(40) NOT NULL,
  `artista_id` varchar(40) NOT NULL,
  `rol` varchar(20) NOT NULL DEFAULT 'Artista',
  `es_principal` tinyint(1) DEFAULT NULL,
  `orden_presentacion` smallint(5) unsigned NOT NULL DEFAULT 1,
  `hora_inicio` time DEFAULT NULL,
  `hora_fin` time DEFAULT NULL,
  `honorarios` decimal(12,2) DEFAULT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'MXN',
  `estado_confirmacion` varchar(20) NOT NULL DEFAULT 'Pendiente',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ea_presentacion` (`evento_id`,`artista_id`,`orden_presentacion`),
  UNIQUE KEY `uq_ea_principal` (`evento_id`,`es_principal`),
  KEY `idx_ea_artista` (`artista_id`,`evento_id`),
  KEY `fk_ea_moneda` (`moneda`),
  CONSTRAINT `fk_ea_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `fk_ea_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ea_moneda` FOREIGN KEY (`moneda`) REFERENCES `cat_monedas` (`codigo`),
  CONSTRAINT `chk_ea_principal` CHECK (`es_principal` is null or `es_principal` = 1),
  CONSTRAINT `chk_ea_rol` CHECK (`rol` in ('Artista','Invitado','Telonero','Soporte','Otro')),
  CONSTRAINT `chk_ea_estado` CHECK (`estado_confirmacion` in ('Pendiente','Confirmado','Cancelado')),
  CONSTRAINT `chk_ea_orden` CHECK (`orden_presentacion` >= 1),
  CONSTRAINT `chk_ea_honorarios` CHECK (`honorarios` is null or `honorarios` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `eventos` (
  `id` varchar(40) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `artista_id` varchar(40) DEFAULT NULL,
  `venue_id` varchar(40) NOT NULL,
  `tour_id` varchar(40) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `estado` varchar(30) DEFAULT 'Draft',
  `capacidad` int(11) DEFAULT 0,
  `asistencia` int(11) DEFAULT 0,
  `precio_boleto` decimal(10,2) DEFAULT 0.00,
  `ingreso_total` decimal(12,2) DEFAULT 0.00,
  `gastos_totales` decimal(12,2) DEFAULT 0.00,
  `utilidad` decimal(12,2) DEFAULT 0.00,
  `extra` longtext DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eventos_venue` (`venue_id`),
  KEY `idx_eventos_tour` (`tour_id`),
  KEY `idx_eventos_fecha` (`fecha`),
  KEY `idx_eventos_artista_fecha` (`artista_id`,`fecha`),
  CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),
  CONSTRAINT `eventos_ibfk_3` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_eventos_estado` CHECK (`estado` in ('Draft','Confirmed','Completed','Cancelled')),
  CONSTRAINT `chk_eventos_cantidades` CHECK (`capacidad` >= 0 and `asistencia` >= 0 and `precio_boleto` >= 0 and `ingreso_total` >= 0 and `gastos_totales` >= 0),
  CONSTRAINT `chk_eventos_utilidad` CHECK (`utilidad` = `ingreso_total` - `gastos_totales`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proveedor_contactos` (
  `proveedor_id` varchar(40) NOT NULL,
  `contacto_id` varchar(40) NOT NULL,
  `rol_id` smallint(5) unsigned NOT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`proveedor_id`,`contacto_id`,`rol_id`),
  UNIQUE KEY `uq_pc_principal` (`proveedor_id`,`es_principal`),
  KEY `idx_proveedor_contactos_contacto` (`contacto_id`),
  KEY `fk_proveedor_contactos_rol` (`rol_id`),
  CONSTRAINT `fk_proveedor_contactos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proveedor_contactos_entidad` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proveedor_contactos_rol` FOREIGN KEY (`rol_id`) REFERENCES `cat_roles_contacto` (`id`),
  CONSTRAINT `chk_proveedor_contactos_principal` CHECK (`es_principal` is null or `es_principal` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proveedores` (
  `id` varchar(40) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `categoria` varchar(80) DEFAULT NULL,
  `contacto` varchar(255) DEFAULT NULL,
  `telefono` varchar(60) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `rating` decimal(3,1) DEFAULT 0.0,
  `costo_por_show` decimal(12,2) DEFAULT 0.00,
  `notas` text DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_proveedores_categoria` CHECK (`categoria` in ('Sonido','Ingeniero de Audio','Iluminación','Catering','Backline','Escenografía','Seguridad','Personal de Apoyo','Otros')),
  CONSTRAINT `chk_proveedores_valores` CHECK (`rating` between 0 and 5 and `costo_por_show` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyectos_grabacion` (
  `id` varchar(40) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `artista_id` varchar(40) DEFAULT NULL,
  `estado` varchar(40) DEFAULT NULL,
  `fecha_lanzamiento` date DEFAULT NULL,
  `estudio` varchar(255) DEFAULT NULL,
  `productor` varchar(255) DEFAULT NULL,
  `extra` longtext DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_proyectos_artista` (`artista_id`),
  CONSTRAINT `proyectos_grabacion_ibfk_1` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_proyectos_estado` CHECK (`estado` in ('Planificación','Pre-producción','Grabando','Mezcla','Masterización','Completado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `schema_meta` (
  `id` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `updated_at` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `schema_migrations` (
  `version` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `aplicada_en` datetime(3) NOT NULL,
  `checksum` char(32) NOT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `tour_artistas` (
  `tour_id` varchar(40) NOT NULL,
  `artista_id` varchar(40) NOT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`tour_id`,`artista_id`),
  UNIQUE KEY `uq_ta_principal` (`tour_id`,`es_principal`),
  KEY `idx_ta_artista` (`artista_id`),
  CONSTRAINT `fk_ta_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `fk_ta_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ta_principal` CHECK (`es_principal` is null or `es_principal` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `tours` (
  `id` varchar(40) NOT NULL,
  `artista_id` varchar(40) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Planning',
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tours_artista` (`artista_id`),
  CONSTRAINT `tours_ibfk_1` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `chk_tours_status` CHECK (`status` in ('Planning','Active','Completed','Cancelled')),
  CONSTRAINT `chk_tours_fechas` CHECK (`fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `venue_contactos` (
  `venue_id` varchar(40) NOT NULL,
  `contacto_id` varchar(40) NOT NULL,
  `rol_id` smallint(5) unsigned NOT NULL,
  `es_principal` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`venue_id`,`contacto_id`,`rol_id`),
  UNIQUE KEY `uq_vc_principal` (`venue_id`,`es_principal`),
  KEY `idx_venue_contactos_contacto` (`contacto_id`),
  KEY `fk_venue_contactos_rol` (`rol_id`),
  CONSTRAINT `fk_venue_contactos_contacto` FOREIGN KEY (`contacto_id`) REFERENCES `contactos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_venue_contactos_entidad` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_venue_contactos_rol` FOREIGN KEY (`rol_id`) REFERENCES `cat_roles_contacto` (`id`),
  CONSTRAINT `chk_venue_contactos_principal` CHECK (`es_principal` is null or `es_principal` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `venue_proveedores` (
  `venue_id` varchar(40) NOT NULL,
  `proveedor_id` varchar(40) NOT NULL,
  PRIMARY KEY (`venue_id`,`proveedor_id`),
  KEY `proveedor_id` (`proveedor_id`),
  CONSTRAINT `venue_proveedores_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `venue_proveedores_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `venues` (
  `id` varchar(40) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `direccion` text DEFAULT NULL,
  `ciudad` varchar(150) DEFAULT NULL,
  `estado` varchar(150) DEFAULT NULL,
  `pais` varchar(150) DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `rating` decimal(3,1) DEFAULT 0.0,
  `score_rentabilidad` smallint(6) DEFAULT 0,
  `score_respuesta` smallint(6) DEFAULT 0,
  `score_puntualidad_pago` smallint(6) DEFAULT 0,
  `score_negociacion` smallint(6) DEFAULT 0,
  `score_produccion` smallint(6) DEFAULT 0,
  `score_hospitalidad` smallint(6) DEFAULT 0,
  `contacto_principal_id` varchar(40) DEFAULT NULL,
  `extra` longtext DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_venues_nombre` (`nombre`),
  KEY `idx_venues_ciudad` (`ciudad`),
  KEY `idx_venues_contacto_principal` (`contacto_principal_id`),
  CONSTRAINT `fk_venues_principal_contact` FOREIGN KEY (`contacto_principal_id`) REFERENCES `contactos_legacy` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_venues_scores` CHECK (`score_rentabilidad` between 0 and 100 and `score_respuesta` between 0 and 100 and `score_puntualidad_pago` between 0 and 100 and `score_negociacion` between 0 and 100 and `score_produccion` between 0 and 100 and `score_hospitalidad` between 0 and 100),
  CONSTRAINT `chk_venues_rating` CHECK (`rating` between 0 and 5),
  CONSTRAINT `chk_venues_coord` CHECK ((`latitud` is null or `latitud` between -90 and 90) and (`longitud` is null or `longitud` between -180 and 180))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Datos de referencia (catálogos)
INSERT INTO cat_etapas_desarrollo (id, nombre) VALUES (1, 'Desarrollo'), (2, 'Aficionado'), (3, 'Emergente'), (4, 'Media carrera'), (5, 'Consolidado'), (6, 'Consagrado'), (7, 'Internacional');
INSERT INTO cat_roles_contacto (nombre) VALUES ('Manager'), ('Booking'), ('Promotor'), ('Técnico'), ('Hospitalidad'), ('Producción'), ('Administración'), ('Contacto comercial'), ('Contacto');
INSERT INTO cat_monedas (codigo, nombre) VALUES ('MXN', 'Peso mexicano'), ('USD', 'Dólar estadounidense'), ('EUR', 'Euro');
INSERT INTO schema_migrations (version, nombre, aplicada_en, checksum) VALUES (1, 'baseline_v1', NOW(3), ''), (2, 'integridad_fase1', NOW(3), ''), (3, 'nucleo_relacional_fase2', NOW(3), '');
