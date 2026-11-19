-- ==========================================================================
-- FLAMO CRM — esquema relacional (MySQL / MariaDB, InnoDB, utf8mb4)
-- Generado por scripts/db/generate-docs.php desde una base migrada (v3). No editar a mano.
-- Para instalar: ejecutar este archivo en una base vacía. Para actualizar una base existente
-- usa las migraciones (public/api/migrations), que conservan los datos.
-- ==========================================================================

/*M!999999\- enable the sandbox mode */ 
CREATE TABLE `artista_acciones` (
  `artista_id` varchar(40) NOT NULL,
  `accion_id` varchar(40) NOT NULL,
  `fecha` date NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `notas` text DEFAULT NULL,
  `plataforma` varchar(20) DEFAULT NULL,
  `creado_en` datetime(3) NOT NULL,
  PRIMARY KEY (`artista_id`,`accion_id`),
  KEY `idx_aa_artista_fecha` (`artista_id`,`fecha`),
  CONSTRAINT `fk_aa_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_aa_tipo` CHECK (`tipo` in ('Lanzamiento','Campaña','Publicación','Colaboración','Prensa','Gira','Otro')),
  CONSTRAINT `chk_aa_plataforma` CHECK (`plataforma` is null or `plataforma` in ('instagram','tiktok','facebook','youtube','spotify','appleMusic','twitter','threads')),
  CONSTRAINT `chk_aa_titulo` CHECK (char_length(trim(`titulo`)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_alcance` (
  `artista_id` varchar(40) NOT NULL,
  `plataforma` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `alcance` int(10) unsigned NOT NULL,
  PRIMARY KEY (`artista_id`,`plataforma`,`fecha`),
  CONSTRAINT `fk_aal_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_aal_plataforma` CHECK (`plataforma` = 'instagram')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_conexiones` (
  `artista_id` varchar(40) NOT NULL,
  `plataforma` varchar(20) NOT NULL,
  `cuenta_id` varchar(40) NOT NULL,
  `usuario` varchar(100) DEFAULT NULL,
  `token_cifrado` text NOT NULL,
  `expira_en` datetime(3) DEFAULT NULL,
  `conectado_en` datetime(3) NOT NULL,
  `ultima_sync` datetime(3) DEFAULT NULL,
  `ultimo_error` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`artista_id`,`plataforma`),
  CONSTRAINT `fk_ac_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ac_plataforma` CHECK (`plataforma` = 'instagram')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
CREATE TABLE `artista_demografia` (
  `artista_id` varchar(40) NOT NULL,
  `plataforma` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `dimension` varchar(10) NOT NULL,
  `clave` varchar(100) NOT NULL,
  `valor` int(10) unsigned NOT NULL,
  PRIMARY KEY (`artista_id`,`plataforma`,`fecha`,`dimension`,`clave`),
  CONSTRAINT `fk_ade_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ade_plataforma` CHECK (`plataforma` = 'instagram'),
  CONSTRAINT `chk_ade_dimension` CHECK (`dimension` in ('edad','genero','ciudad','pais'))
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
CREATE TABLE `artista_hitos` (
  `artista_id` varchar(40) NOT NULL,
  `hito_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `fecha` date DEFAULT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  PRIMARY KEY (`artista_id`,`hito_id`),
  KEY `idx_ah_fecha` (`artista_id`,`fecha`),
  CONSTRAINT `fk_ah_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ah_tipo` CHECK (`tipo` in ('milestone','release','signing','tour','achievement'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_idiomas` (
  `artista_id` varchar(40) NOT NULL,
  `idioma` varchar(60) NOT NULL,
  `orden` tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (`artista_id`,`idioma`),
  CONSTRAINT `fk_ai_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_integrantes` (
  `artista_id` varchar(40) NOT NULL,
  `integrante_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `rol` varchar(100) NOT NULL DEFAULT 'Músico',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `lugar_inicio` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`artista_id`,`integrante_id`),
  CONSTRAINT `fk_aint_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_aint_fechas` CHECK (`fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_metricas_redes` (
  `artista_id` varchar(40) NOT NULL,
  `plataforma` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `seguidores` int(10) unsigned NOT NULL,
  `siguiendo` int(10) unsigned DEFAULT NULL,
  `publicaciones` int(10) unsigned DEFAULT NULL,
  `interaccion` decimal(6,2) DEFAULT NULL,
  `fuente` varchar(10) NOT NULL,
  `capturado_en` datetime(3) NOT NULL,
  PRIMARY KEY (`artista_id`,`plataforma`,`fecha`),
  CONSTRAINT `fk_amr_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_amr_plataforma` CHECK (`plataforma` in ('instagram','tiktok','facebook','youtube','spotify','appleMusic','twitter','threads')),
  CONSTRAINT `chk_amr_interaccion` CHECK (`interaccion` is null or `interaccion` >= 0 and `interaccion` <= 100),
  CONSTRAINT `chk_amr_fuente` CHECK (`fuente` in ('manual','apify','meta'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_pipeline` (
  `artista_id` varchar(40) NOT NULL,
  `item_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `categoria` varchar(30) NOT NULL,
  `completado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`artista_id`,`item_id`),
  CONSTRAINT `fk_ap_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ap_categoria` CHECK (`categoria` in ('Branding','Distribución','Presencia','Booking & Management'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_publicaciones` (
  `artista_id` varchar(40) NOT NULL,
  `plataforma` varchar(20) NOT NULL,
  `post_id` varchar(40) NOT NULL,
  `publicado_en` datetime(3) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `enlace` varchar(500) DEFAULT NULL,
  `texto` varchar(500) DEFAULT NULL,
  `me_gusta` int(10) unsigned DEFAULT NULL,
  `comentarios` int(10) unsigned DEFAULT NULL,
  `alcance` int(10) unsigned DEFAULT NULL,
  `guardados` int(10) unsigned DEFAULT NULL,
  `compartidos` int(10) unsigned DEFAULT NULL,
  `interacciones` int(10) unsigned DEFAULT NULL,
  `capturado_en` datetime(3) NOT NULL,
  PRIMARY KEY (`artista_id`,`plataforma`,`post_id`),
  KEY `idx_apu_fecha` (`artista_id`,`publicado_en`),
  CONSTRAINT `fk_apu_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_apu_plataforma` CHECK (`plataforma` = 'instagram')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artista_redes` (
  `artista_id` varchar(40) NOT NULL,
  `plataforma` varchar(20) NOT NULL,
  `enlace` varchar(500) NOT NULL DEFAULT '',
  `conectado` tinyint(1) NOT NULL DEFAULT 0,
  `usuario_conectado` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`artista_id`,`plataforma`),
  CONSTRAINT `fk_ar_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_ar_plataforma` CHECK (`plataforma` in ('instagram','tiktok','facebook','youtube','spotify','appleMusic','twitter','threads','whatsapp','website'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `artistas` (
  `id` varchar(40) NOT NULL,
  `nombre_artistico` varchar(255) NOT NULL,
  `nombre_legal` varchar(255) DEFAULT NULL,
  `etapa_id` tinyint(4) NOT NULL DEFAULT 1,
  `isrc_default` varchar(40) DEFAULT NULL,
  `iswc_default` varchar(40) DEFAULT NULL,
  `sociedad_gestion` varchar(80) DEFAULT NULL,
  `rfc` varchar(40) DEFAULT NULL,
  `ciudad` varchar(150) DEFAULT NULL,
  `estado` varchar(150) DEFAULT NULL,
  `pais` varchar(150) DEFAULT NULL,
  `foto` text DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `sello` varchar(255) DEFAULT NULL,
  `editorial` varchar(255) DEFAULT NULL,
  `distribuidora` varchar(255) DEFAULT NULL,
  `foto_zoom` decimal(6,2) DEFAULT NULL,
  `foto_rotacion` decimal(6,2) DEFAULT NULL,
  `foto_contraste` decimal(6,2) DEFAULT NULL,
  `foto_brillo` decimal(6,2) DEFAULT NULL,
  `foto_grises` decimal(6,2) DEFAULT NULL,
  `foto_sepia` decimal(6,2) DEFAULT NULL,
  `foto_desenfoque` decimal(6,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etapa_id` (`etapa_id`),
  KEY `idx_artistas_nombre` (`nombre_artistico`),
  CONSTRAINT `artistas_ibfk_1` FOREIGN KEY (`etapa_id`) REFERENCES `cat_etapas_desarrollo` (`id`),
  CONSTRAINT `chk_artistas_foto` CHECK (`foto_zoom` is null or `foto_zoom` > 0)
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
CREATE TABLE `contrato_artistas` (
  `contrato_id` varchar(40) NOT NULL,
  `artista_id` varchar(40) NOT NULL,
  PRIMARY KEY (`contrato_id`,`artista_id`),
  KEY `idx_cartistas_artista` (`artista_id`),
  CONSTRAINT `fk_cartistas_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `fk_cartistas_contrato` FOREIGN KEY (`contrato_id`) REFERENCES `contratos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contrato_eventos` (
  `contrato_id` varchar(40) NOT NULL,
  `evento_id` varchar(40) NOT NULL,
  PRIMARY KEY (`contrato_id`,`evento_id`),
  KEY `idx_ceventos_evento` (`evento_id`),
  CONSTRAINT `fk_ceventos_contrato` FOREIGN KEY (`contrato_id`) REFERENCES `contratos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ceventos_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contrato_proveedores` (
  `contrato_id` varchar(40) NOT NULL,
  `proveedor_id` varchar(40) NOT NULL,
  PRIMARY KEY (`contrato_id`,`proveedor_id`),
  KEY `idx_cproveedores_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_cproveedores_contrato` FOREIGN KEY (`contrato_id`) REFERENCES `contratos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cproveedores_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contrato_tours` (
  `contrato_id` varchar(40) NOT NULL,
  `tour_id` varchar(40) NOT NULL,
  PRIMARY KEY (`contrato_id`,`tour_id`),
  KEY `idx_ctours_tour` (`tour_id`),
  CONSTRAINT `fk_ctours_contrato` FOREIGN KEY (`contrato_id`) REFERENCES `contratos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ctours_tour` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contrato_venues` (
  `contrato_id` varchar(40) NOT NULL,
  `venue_id` varchar(40) NOT NULL,
  PRIMARY KEY (`contrato_id`,`venue_id`),
  KEY `idx_cvenues_venue` (`venue_id`),
  CONSTRAINT `fk_cvenues_contrato` FOREIGN KEY (`contrato_id`) REFERENCES `contratos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cvenues_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `contratos` (
  `id` varchar(40) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `tipo` varchar(60) DEFAULT NULL,
  `estado` varchar(30) DEFAULT NULL,
  `nombre_archivo` varchar(255) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `fecha_subida` datetime(3) DEFAULT NULL,
  `tamano_bytes` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
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
CREATE TABLE `evento_bandas_invitadas` (
  `evento_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`evento_id`,`orden`),
  CONSTRAINT `fk_ebi_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `evento_setlist` (
  `evento_id` varchar(40) NOT NULL,
  `item_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `duracion_seg` int(10) unsigned DEFAULT NULL,
  `tempo` varchar(10) DEFAULT NULL,
  `notas_transicion` text DEFAULT NULL,
  PRIMARY KEY (`evento_id`,`item_id`),
  KEY `idx_es_orden` (`evento_id`,`orden`),
  CONSTRAINT `fk_es_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_es_tempo` CHECK (`tempo` is null or `tempo` in ('Lento','Medio','Rápido'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `eventos` (
  `id` varchar(40) NOT NULL,
  `nombre` varchar(255) NOT NULL,
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
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  `feedback_artista` text DEFAULT NULL,
  `reaccion_publico` text DEFAULT NULL,
  `valoracion_ritmo` tinyint(4) DEFAULT NULL,
  `notas_optimizacion` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eventos_venue` (`venue_id`),
  KEY `idx_eventos_tour` (`tour_id`),
  KEY `idx_eventos_fecha` (`fecha`),
  CONSTRAINT `eventos_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`),
  CONSTRAINT `eventos_ibfk_3` FOREIGN KEY (`tour_id`) REFERENCES `tours` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_eventos_estado` CHECK (`estado` in ('Draft','Confirmed','Completed','Cancelled')),
  CONSTRAINT `chk_eventos_cantidades` CHECK (`capacidad` >= 0 and `asistencia` >= 0 and `precio_boleto` >= 0 and `ingreso_total` >= 0 and `gastos_totales` >= 0),
  CONSTRAINT `chk_eventos_utilidad` CHECK (`utilidad` = `ingreso_total` - `gastos_totales`),
  CONSTRAINT `chk_eventos_ritmo` CHECK (`valoracion_ritmo` is null or `valoracion_ritmo` between 1 and 5)
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
  `rating` decimal(3,1) DEFAULT 0.0,
  `costo_por_show` decimal(12,2) DEFAULT 0.00,
  `notas` text DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_proveedores_categoria` CHECK (`categoria` in ('Sonido','Ingeniero de Audio','Iluminación','Catering','Backline','Escenografía','Seguridad','Personal de Apoyo','Otros')),
  CONSTRAINT `chk_proveedores_valores` CHECK (`rating` between 0 and 5 and `costo_por_show` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyecto_canciones` (
  `proyecto_id` varchar(40) NOT NULL,
  `cancion_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `duracion_seg` int(10) unsigned DEFAULT NULL,
  `compositor` varchar(255) DEFAULT NULL,
  `estado` varchar(30) NOT NULL,
  `progreso` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`proyecto_id`,`cancion_id`),
  CONSTRAINT `fk_pc_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_grabacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pc_estado` CHECK (`estado` in ('Composición','Demo','Grabación de Instrumentos','Grabación de Voces','Mezcla','Masterizado','Listo')),
  CONSTRAINT `chk_pc_progreso` CHECK (`progreso` between 0 and 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyecto_costos` (
  `proyecto_id` varchar(40) NOT NULL,
  `costo_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `categoria` varchar(30) NOT NULL,
  `monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`proyecto_id`,`costo_id`),
  CONSTRAINT `fk_pco_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_grabacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pco_categoria` CHECK (`categoria` in ('Estudio/Grabación','Músicos de Sesión','Mezcla','Masterización','Arreglos/Producción','Otros')),
  CONSTRAINT `chk_pco_monto` CHECK (`monto` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyecto_etapas` (
  `proyecto_id` varchar(40) NOT NULL,
  `etapa_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `nombre` varchar(20) NOT NULL,
  `estado` varchar(15) NOT NULL DEFAULT 'Pendiente',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`proyecto_id`,`etapa_id`),
  CONSTRAINT `fk_pe_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_grabacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pe_nombre` CHECK (`nombre` in ('Pre-producción','Grabación','Revisión','Mezcla','Masterización','Listo')),
  CONSTRAINT `chk_pe_estado` CHECK (`estado` in ('Pendiente','En Progreso','Completado')),
  CONSTRAINT `chk_pe_fechas` CHECK (`fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyecto_instrumentos` (
  `proyecto_id` varchar(40) NOT NULL,
  `etapa_id` varchar(40) NOT NULL,
  `instrumento_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `estado` varchar(10) NOT NULL DEFAULT 'Pendiente',
  `musico` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`proyecto_id`,`etapa_id`,`instrumento_id`),
  CONSTRAINT `fk_pi_etapa` FOREIGN KEY (`proyecto_id`, `etapa_id`) REFERENCES `proyecto_etapas` (`proyecto_id`, `etapa_id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pi_estado` CHECK (`estado` in ('Pendiente','Grabando','Listo'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyecto_pagos` (
  `proyecto_id` varchar(40) NOT NULL,
  `pago_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `monto` decimal(12,2) NOT NULL DEFAULT 0.00,
  `fecha_vencimiento` date DEFAULT NULL,
  `estado` varchar(12) NOT NULL DEFAULT 'Pendiente',
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`proyecto_id`,`pago_id`),
  KEY `idx_pp_vencimiento` (`fecha_vencimiento`),
  CONSTRAINT `fk_pp_proyecto` FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_grabacion` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_pp_estado` CHECK (`estado` in ('Pendiente','Pagado')),
  CONSTRAINT `chk_pp_monto` CHECK (`monto` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `proyectos_grabacion` (
  `id` varchar(40) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `artista_id` varchar(40) DEFAULT NULL,
  `estado` varchar(40) DEFAULT NULL,
  `fecha_lanzamiento` date DEFAULT NULL,
  `estudio` varchar(255) DEFAULT NULL,
  `productor` varchar(255) DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_proyectos_artista` (`artista_id`),
  CONSTRAINT `fk_proyectos_artista` FOREIGN KEY (`artista_id`) REFERENCES `artistas` (`id`),
  CONSTRAINT `chk_proyectos_estado` CHECK (`estado` in ('Planificación','Pre-producción','Grabando','Mezcla','Masterización','Completado'))
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
  `nombre` varchar(255) NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Planning',
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_tours_status` CHECK (`status` in ('Planning','Active','Completed','Cancelled')),
  CONSTRAINT `chk_tours_fechas` CHECK (`fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `venue_bandas_locales` (
  `venue_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`venue_id`,`orden`),
  CONSTRAINT `fk_vb_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE
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
CREATE TABLE `venue_horarios` (
  `venue_id` varchar(40) NOT NULL,
  `orden` smallint(5) unsigned NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  PRIMARY KEY (`venue_id`,`orden`),
  CONSTRAINT `fk_vh_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE `venue_notas` (
  `venue_id` varchar(40) NOT NULL,
  `nota_id` varchar(40) NOT NULL,
  `fecha` datetime(3) NOT NULL,
  `texto` text NOT NULL,
  `autor` varchar(100) DEFAULT NULL,
  `evento_id` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`venue_id`,`nota_id`),
  KEY `idx_vn_evento` (`evento_id`),
  KEY `idx_vn_venue_fecha` (`venue_id`,`fecha`),
  CONSTRAINT `fk_vn_evento` FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vn_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vn_texto` CHECK (char_length(trim(`texto`)) > 0)
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
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  `sitio_web` varchar(500) DEFAULT NULL,
  `telefono` varchar(60) DEFAULT NULL,
  `num_resenas` int(11) NOT NULL DEFAULT 0,
  `place_id` varchar(120) DEFAULT NULL,
  `tipo_establecimiento` varchar(120) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `tiktok` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `correo` varchar(255) DEFAULT NULL,
  `youtube` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_venues_nombre` (`nombre`),
  KEY `idx_venues_ciudad` (`ciudad`),
  CONSTRAINT `chk_venues_scores` CHECK (`score_rentabilidad` between 0 and 100 and `score_respuesta` between 0 and 100 and `score_puntualidad_pago` between 0 and 100 and `score_negociacion` between 0 and 100 and `score_produccion` between 0 and 100 and `score_hospitalidad` between 0 and 100),
  CONSTRAINT `chk_venues_rating` CHECK (`rating` between 0 and 5),
  CONSTRAINT `chk_venues_coord` CHECK ((`latitud` is null or `latitud` between -90 and 90) and (`longitud` is null or `longitud` between -180 and 180))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Datos de referencia (catálogos)
INSERT INTO cat_etapas_desarrollo (id, nombre) VALUES (1, 'Desarrollo'), (2, 'Aficionado'), (3, 'Emergente'), (4, 'Media carrera'), (5, 'Consolidado'), (6, 'Consagrado'), (7, 'Internacional');
INSERT INTO cat_roles_contacto (nombre) VALUES ('Manager'), ('Booking'), ('Promotor'), ('Técnico'), ('Hospitalidad'), ('Producción'), ('Administración'), ('Contacto comercial'), ('Contacto');
INSERT INTO cat_monedas (codigo, nombre) VALUES ('MXN', 'Peso mexicano'), ('USD', 'Dólar estadounidense'), ('EUR', 'Euro');
INSERT INTO schema_migrations (version, nombre, aplicada_en, checksum) VALUES (1, 'baseline_v1', NOW(3), ''), (2, 'integridad_fase1', NOW(3), ''), (3, 'nucleo_relacional_fase2', NOW(3), ''), (4, 'grupos_y_contratos', NOW(3), ''), (5, 'contraccion_fase4', NOW(3), ''), (6, 'venue_notas', NOW(3), ''), (7, 'metricas_redes', NOW(3), ''), (8, 'meta_oficial', NOW(3), '');
