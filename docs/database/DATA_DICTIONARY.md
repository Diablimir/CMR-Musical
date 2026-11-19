# FLAMO CRM — Diccionario de datos

> Generado por `scripts/db/generate-docs.php` desde la base migrada (esquema v3). No editar a mano.
> Motor: MySQL/MariaDB (InnoDB, utf8mb4). Convención: «PK» llave primaria · «FK» llave foránea · «UQ» única · «NN» no nula.
> Las columnas marcadas **OBSOLETO** existen solo en bases actualizadas desde v1 y se retiran en la Fase 4.

## Índice

- [`artistas`](#artistas) — Entidad principal: perfil del artista o agrupación. Bio, sello y ajustes de foto son columnas; redes, idiomas, integrantes, pipeline e hitos viven en tablas hijas (Fase 3).
- [`artista_acciones`](#artista_acciones) — Bitácora de acciones del artista (lanzamientos, campañas, publicaciones, colaboraciones, prensa, giras). Los shows no se duplican: se toman de eventos al cruzar con las métricas.
- [`artista_contactos`](#artista_contactos) — Vínculo contacto ↔ artista con rol (Manager, Booking…). Sustituye a los textos `manager` y `booking_agent`.
- [`artista_generos`](#artista_generos) — Géneros de un artista (N:M). Un género es el principal; el resto, secundarios.
- [`artista_hitos`](#artista_hitos) — Hitos y logros en la trayectoria de un artista.
- [`artista_idiomas`](#artista_idiomas) — Idiomas en que canta o trabaja un artista (sin duplicados por mayúsculas).
- [`artista_integrantes`](#artista_integrantes) — Integrantes de una agrupación, con rol, fechas de ingreso/salida y si siguen activos (historial).
- [`artista_metricas_redes`](#artista_metricas_redes) — Historial de redes sociales de un artista: una captura por red y día (seguidores, siguiendo, publicaciones, interacción) con su fuente (manual o apify). Permite ver la evolución y cruzarla con las acciones.
- [`artista_pipeline`](#artista_pipeline) — Pasos del plan de carrera de un artista (checklist por categoría).
- [`artista_redes`](#artista_redes) — Redes sociales de un artista: una fila por plataforma, con enlace y estado de conexión.
- [`cat_etapas_desarrollo`](#cat_etapas_desarrollo) — Catálogo cerrado de etapas de carrera de un artista (Desarrollo … Internacional).
- [`cat_generos`](#cat_generos) — Catálogo abierto de géneros musicales. Evita guardar listas de géneros separadas por comas.
- [`cat_monedas`](#cat_monedas) — Catálogo de monedas (ISO 4217) para honorarios.
- [`cat_roles_contacto`](#cat_roles_contacto) — Catálogo abierto de roles que una persona puede tener en una entidad (Manager, Booking, Promotor…). Unifica «Booking» y «booking».
- [`contactos`](#contactos) — Persona (o empresa) independiente de cualquier entidad. Sus medios de contacto y vínculos viven en tablas propias.
- [`contacto_correos`](#contacto_correos) — Correos electrónicos de un contacto (uno principal).
- [`contacto_telefonos`](#contacto_telefonos) — Teléfonos de un contacto (uno principal).
- [`contratos`](#contratos) — Contratos con su archivo y estado. Las relaciones son RESTRICT: no se pierde el historial contractual por borrados en cascada.
- [`contrato_artistas`](#contrato_artistas) — Artistas que son parte de un contrato (N:M). Los contratos se conservan aunque el artista se archive.
- [`contrato_eventos`](#contrato_eventos) — Eventos a los que se refiere un contrato (N:M).
- [`contrato_proveedores`](#contrato_proveedores) — Proveedores que son parte de un contrato (N:M).
- [`contrato_tours`](#contrato_tours) — Giras a las que se refiere un contrato (N:M). La gira de un evento no se duplica: se deduce de contrato_eventos.
- [`contrato_venues`](#contrato_venues) — Venues que son parte de un contrato (N:M).
- [`eventos`](#eventos) — Shows y conciertos. El ingreso se captura (puede diferir de asistencia × precio); la utilidad se calcula y un CHECK impide que se desajuste. Los artistas están en evento_artistas.
- [`evento_artistas`](#evento_artistas) — Alineación del evento: qué artistas participan, con rol, orden, horario, honorarios y confirmación. Un artista puede presentarse más de una vez (distinto orden).
- [`evento_bandas_invitadas`](#evento_bandas_invitadas) — Bandas invitadas o teloneras de un evento (texto libre; las que son artistas del CRM van en evento_artistas).
- [`evento_setlist`](#evento_setlist) — Repertorio de un evento: canciones en orden, con duración en segundos (sumable) y notas de transición.
- [`proveedores`](#proveedores) — Proveedores técnicos y de servicios (sonido, iluminación, catering…).
- [`proveedor_contactos`](#proveedor_contactos) — Vínculo contacto ↔ proveedor con rol. Sustituye a las columnas contacto/telefono/correo del proveedor.
- [`proyectos_grabacion`](#proyectos_grabacion) — Proyectos de grabación de un artista. Canciones, costos, pagos, etapas e instrumentos viven en tablas hijas (Fase 3): costos y pagos se pueden sumar en SQL.
- [`proyecto_canciones`](#proyecto_canciones) — Canciones de un proyecto de grabación, con duración, compositor, estado y avance.
- [`proyecto_costos`](#proyecto_costos) — Costos del proyecto (concepto, categoría, monto ≥ 0). Se suman con SUM(monto).
- [`proyecto_etapas`](#proyecto_etapas) — Etapas de producción del proyecto (pre-producción, grabación, mezcla…).
- [`proyecto_instrumentos`](#proyecto_instrumentos) — Instrumentos y músicos asignados a una etapa del proyecto.
- [`proyecto_pagos`](#proyecto_pagos) — Pagos del proyecto con fecha de vencimiento y estado (Pendiente/Pagado…).
- [`schema_migrations`](#schema_migrations) — Registro de migraciones aplicadas (versión, nombre, fecha, checksum y notas).
- [`tours`](#tours) — Giras con fechas y estatus. Los artistas participantes están en tour_artistas (una gira puede ser compartida).
- [`tour_artistas`](#tour_artistas) — Artistas de una gira (N:M); uno es el principal.
- [`venues`](#venues) — Recintos, foros, teatros y bares, con coordenadas, calificación y puntajes. Sitio web, reseñas y demás datos de ficha son columnas; horarios y bandas locales viven en tablas hijas (Fase 3).
- [`venue_bandas_locales`](#venue_bandas_locales) — Bandas locales asociadas a un venue.
- [`venue_contactos`](#venue_contactos) — Vínculo contacto ↔ venue con su rol; marca al contacto principal del venue. Reemplaza `venues.contacto_principal_id` y elimina la dependencia circular.
- [`venue_horarios`](#venue_horarios) — Horarios de operación del venue (una línea por renglón de texto).
- [`venue_notas`](#venue_notas) — Notas de seguimiento de un venue (p. ej. cómo salió el show una vez realizado): texto, fecha, autor y, opcionalmente, el evento al que se refiere.
- [`venue_proveedores`](#venue_proveedores) — Relación N:M entre venues y proveedores.

---

## artistas

**Propósito:** Entidad principal: perfil del artista o agrupación. Bio, sello y ajustes de foto son columnas; redes, idiomas, integrantes, pipeline e hitos viven en tablas hijas (Fase 3).

**Cardinalidad:** 1 artista — N géneros, contactos, giras, eventos, proyectos, contratos

**Dependencias funcionales:** id → todas las columnas. Dependencia transitiva ciudad → estado → pais aceptada como excepción de 3FN (dirección postal como valor; ver DATABASE_AUDIT §3).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre_artistico` | `varchar(255)` | NN |  |  | Nombre artístico. |
| `nombre_legal` | `varchar(255)` | sí | `NULL` |  | Nombre legal o razón social. |
| `etapa_id` | `tinyint(4)` | NN | `1` | FK | Etapa de carrera (catálogo). |
| `isrc_default` | `varchar(40)` | sí | `NULL` |  | Código ISRC por defecto. |
| `iswc_default` | `varchar(40)` | sí | `NULL` |  | Código ISWC por defecto. |
| `sociedad_gestion` | `varchar(80)` | sí | `NULL` |  | Sociedad de gestión (SACM, ASCAP, BMI…). |
| `rfc` | `varchar(40)` | sí | `NULL` |  | RFC fiscal. |
| `ciudad` | `varchar(150)` | sí | `NULL` |  | Ciudad de origen. |
| `estado` | `varchar(150)` | sí | `NULL` |  | Estado o provincia. |
| `pais` | `varchar(150)` | sí | `NULL` |  | País. |
| `foto` | `text` | sí | `NULL` |  | URL de la foto de perfil. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |
| `bio` | `text` | sí | `NULL` |  |  |
| `fecha_inicio` | `date` | sí | `NULL` |  |  |
| `sello` | `varchar(255)` | sí | `NULL` |  |  |
| `editorial` | `varchar(255)` | sí | `NULL` |  |  |
| `distribuidora` | `varchar(255)` | sí | `NULL` |  |  |
| `foto_zoom` | `decimal(6,2)` | sí | `NULL` |  |  |
| `foto_rotacion` | `decimal(6,2)` | sí | `NULL` |  |  |
| `foto_contraste` | `decimal(6,2)` | sí | `NULL` |  |  |
| `foto_brillo` | `decimal(6,2)` | sí | `NULL` |  |  |
| `foto_grises` | `decimal(6,2)` | sí | `NULL` |  |  |
| `foto_sepia` | `decimal(6,2)` | sí | `NULL` |  |  |
| `foto_desenfoque` | `decimal(6,2)` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `etapa_id` → `cat_etapas_desarrollo(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Restricciones CHECK:**

- `chk_artistas_foto`: ``foto_zoom` is null or `foto_zoom` > 0`

**Índices:** `etapa_id` (etapa_id); `idx_artistas_nombre` (nombre_artistico)

---

## artista_acciones

**Propósito:** Bitácora de acciones del artista (lanzamientos, campañas, publicaciones, colaboraciones, prensa, giras). Los shows no se duplican: se toman de eventos al cruzar con las métricas.

**Cardinalidad:** N acciones — 1 artista

**Dependencias funcionales:** (artista_id, accion_id) → fecha, tipo, titulo, notas, plataforma (opcional), creado_en. CHECK: tipo en dominio cerrado, título no vacío.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `accion_id` | `varchar(40)` | NN |  | PK |  |
| `fecha` | `date` | NN |  |  |  |
| `tipo` | `varchar(20)` | NN |  |  |  |
| `titulo` | `varchar(255)` | NN |  |  |  |
| `notas` | `text` | sí | `NULL` |  |  |
| `plataforma` | `varchar(20)` | sí | `NULL` |  |  |
| `creado_en` | `datetime(3)` | NN |  |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_aa_plataforma`: ``plataforma` is null or `plataforma` in ('instagram','tiktok','facebook','youtube','spotify','appleMusic','twitter','threads')`
- `chk_aa_tipo`: ``tipo` in ('Lanzamiento','Campaña','Publicación','Colaboración','Prensa','Gira','Otro')`
- `chk_aa_titulo`: `char_length(trim(`titulo`)) > 0`

**Índices:** `idx_aa_artista_fecha` (artista_id,fecha)

---

## artista_contactos

**Propósito:** Vínculo contacto ↔ artista con rol (Manager, Booking…). Sustituye a los textos `manager` y `booking_agent`.

**Cardinalidad:** N artistas — M contactos

**Dependencias funcionales:** (artista_id, contacto_id, rol_id) → es_principal. Un principal por (artista, rol).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `contacto_id` | `varchar(40)` | NN |  | PK, FK | Contacto (persona). |
| `rol_id` | `smallint(5) unsigned` | NN |  | PK, FK | Rol del contacto en la entidad (catálogo cat_roles_contacto). |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal. |

**Llaves foráneas:**

- `rol_id` → `cat_roles_contacto(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `contacto_id` → `contactos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Unicidad:**

- `uq_ac_principal` sobre (`artista_id`, `rol_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_artista_contactos_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `fk_artista_contactos_rol` (rol_id); `idx_artista_contactos_contacto` (contacto_id)

---

## artista_generos

**Propósito:** Géneros de un artista (N:M). Un género es el principal; el resto, secundarios.

**Cardinalidad:** N artistas — M géneros

**Dependencias funcionales:** (artista_id, genero_id) → es_principal, orden. Un solo principal por artista (UNIQUE sobre es_principal con NULL).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `genero_id` | `smallint(5) unsigned` | NN |  | PK, FK | Género (catálogo cat_generos). |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Género principal del artista (1) o secundario (NULL). |
| `orden` | `tinyint(3) unsigned` | NN |  |  | Posición del género en la lista del artista (1 = primero). |

**Llaves foráneas:**

- `genero_id` → `cat_generos(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Unicidad:**

- `uq_artista_genero_principal` sobre (`artista_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_ag_orden`: ``orden` >= 1`
- `chk_ag_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `idx_artista_generos_genero` (genero_id)

---

## artista_hitos

**Propósito:** Hitos y logros en la trayectoria de un artista.

**Cardinalidad:** N hitos — 1 artista

**Dependencias funcionales:** (artista_id, hito_id) → fecha, título, descripción, tipo.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `hito_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `fecha` | `date` | sí | `NULL` |  |  |
| `titulo` | `varchar(255)` | NN |  |  |  |
| `descripcion` | `text` | sí | `NULL` |  |  |
| `tipo` | `varchar(20)` | NN |  |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_ah_tipo`: ``tipo` in ('milestone','release','signing','tour','achievement')`

**Índices:** `idx_ah_fecha` (artista_id,fecha)

---

## artista_idiomas

**Propósito:** Idiomas en que canta o trabaja un artista (sin duplicados por mayúsculas).

**Cardinalidad:** N idiomas — 1 artista

**Dependencias funcionales:** (artista_id, idioma) clave compuesta; orden conserva el orden de captura.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `idioma` | `varchar(60)` | NN |  | PK |  |
| `orden` | `tinyint(3) unsigned` | NN |  |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

---

## artista_integrantes

**Propósito:** Integrantes de una agrupación, con rol, fechas de ingreso/salida y si siguen activos (historial).

**Cardinalidad:** N integrantes — 1 artista

**Dependencias funcionales:** (artista_id, integrante_id) → nombre, rol, fechas, activo. Los «miembros actuales» se derivan de aquí, no se guardan aparte.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `integrante_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `rol` | `varchar(100)` | NN | `Músico` |  |  |
| `fecha_inicio` | `date` | sí | `NULL` |  |  |
| `fecha_fin` | `date` | sí | `NULL` |  |  |
| `lugar_inicio` | `varchar(255)` | sí | `NULL` |  |  |
| `activo` | `tinyint(1)` | NN | `1` |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_aint_fechas`: ``fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio``

---

## artista_metricas_redes

**Propósito:** Historial de redes sociales de un artista: una captura por red y día (seguidores, siguiendo, publicaciones, interacción) con su fuente (manual o apify). Permite ver la evolución y cruzarla con las acciones.

**Cardinalidad:** N capturas — 1 artista

**Dependencias funcionales:** (artista_id, plataforma, fecha) → seguidores, siguiendo, publicaciones, interaccion, fuente, capturado_en. Capturar de nuevo el mismo día reemplaza. CHECK: plataforma y fuente en dominio cerrado, interacción 0–100.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `plataforma` | `varchar(20)` | NN |  | PK |  |
| `fecha` | `date` | NN |  | PK |  |
| `seguidores` | `int(10) unsigned` | NN |  |  |  |
| `siguiendo` | `int(10) unsigned` | sí | `NULL` |  |  |
| `publicaciones` | `int(10) unsigned` | sí | `NULL` |  |  |
| `interaccion` | `decimal(6,2)` | sí | `NULL` |  |  |
| `fuente` | `varchar(10)` | NN |  |  |  |
| `capturado_en` | `datetime(3)` | NN |  |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_amr_fuente`: ``fuente` in ('manual','apify')`
- `chk_amr_interaccion`: ``interaccion` is null or `interaccion` >= 0 and `interaccion` <= 100`
- `chk_amr_plataforma`: ``plataforma` in ('instagram','tiktok','facebook','youtube','spotify','appleMusic','twitter','threads')`

---

## artista_pipeline

**Propósito:** Pasos del plan de carrera de un artista (checklist por categoría).

**Cardinalidad:** N pasos — 1 artista

**Dependencias funcionales:** (artista_id, item_id) → nombre, categoría, completado.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `item_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `categoria` | `varchar(30)` | NN |  |  |  |
| `completado` | `tinyint(1)` | NN | `0` |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_ap_categoria`: ``categoria` in ('Branding','Distribución','Presencia','Booking & Management')`

---

## artista_redes

**Propósito:** Redes sociales de un artista: una fila por plataforma, con enlace y estado de conexión.

**Cardinalidad:** N redes — 1 artista

**Dependencias funcionales:** (artista_id, plataforma) → enlace, conectado, usuario_conectado. Plataforma en dominio cerrado por CHECK.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `plataforma` | `varchar(20)` | NN |  | PK |  |
| `enlace` | `varchar(500)` | NN | `` |  |  |
| `conectado` | `tinyint(1)` | NN | `0` |  |  |
| `usuario_conectado` | `varchar(100)` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_ar_plataforma`: ``plataforma` in ('instagram','tiktok','facebook','youtube','spotify','appleMusic','twitter','threads','whatsapp','website')`

---

## cat_etapas_desarrollo

**Propósito:** Catálogo cerrado de etapas de carrera de un artista (Desarrollo … Internacional).

**Cardinalidad:** 1 etapa — N artistas

**Dependencias funcionales:** id → nombre; nombre → id (clave candidata)

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `tinyint(4)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(50)` | NN |  |  | Nombre. |

**Unicidad:**

- `nombre` sobre (`nombre`)

---

## cat_generos

**Propósito:** Catálogo abierto de géneros musicales. Evita guardar listas de géneros separadas por comas.

**Cardinalidad:** 1 género — N artistas (vía artista_generos)

**Dependencias funcionales:** id → nombre, descripcion; nombre → id (clave candidata, sin distinguir mayúsculas)

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `smallint(5) unsigned` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(80)` | NN |  |  | Nombre. |
| `descripcion` | `varchar(255)` | sí | `NULL` |  | Descripción opcional. |

**Unicidad:**

- `uq_generos_nombre` sobre (`nombre`)

---

## cat_monedas

**Propósito:** Catálogo de monedas (ISO 4217) para honorarios.

**Cardinalidad:** 1 moneda — N participaciones en eventos

**Dependencias funcionales:** codigo → nombre

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `codigo` | `char(3)` | NN |  | PK | Código ISO 4217 (MXN, USD, EUR). |
| `nombre` | `varchar(60)` | NN |  |  | Nombre. |

---

## cat_roles_contacto

**Propósito:** Catálogo abierto de roles que una persona puede tener en una entidad (Manager, Booking, Promotor…). Unifica «Booking» y «booking».

**Cardinalidad:** 1 rol — N vínculos de contacto

**Dependencias funcionales:** id → nombre; nombre → id

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `smallint(5) unsigned` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(60)` | NN |  |  | Nombre. |

**Unicidad:**

- `uq_roles_nombre` sobre (`nombre`)

---

## contactos

**Propósito:** Persona (o empresa) independiente de cualquier entidad. Sus medios de contacto y vínculos viven en tablas propias.

**Cardinalidad:** 1 contacto — N correos, N teléfonos, N vínculos con venues/artistas/proveedores

**Dependencias funcionales:** id → nombre, apellidos, version, created_at, updated_at. 1FN: nombre completo = nombre + apellidos.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre (o nombre completo en registros migrados). |
| `apellidos` | `varchar(255)` | sí | `NULL` |  | Apellidos (opcional). |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |

**Índices:** `idx_contactos_nombre` (nombre)

---

## contacto_correos

**Propósito:** Correos electrónicos de un contacto (uno principal).

**Cardinalidad:** 1 contacto — N correos

**Dependencias funcionales:** id → todas; (contacto_id, correo) clave candidata; un solo principal por contacto.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `contacto_id` | `varchar(40)` | NN |  | FK | Contacto (persona). |
| `correo` | `varchar(255)` | NN |  |  | Dirección de correo. |
| `etiqueta` | `varchar(30)` | sí | `NULL` |  | Etiqueta (trabajo, personal…). |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal. |

**Llaves foráneas:**

- `contacto_id` → `contactos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Unicidad:**

- `uq_contacto_correos_principal` sobre (`contacto_id`, `es_principal`)
- `uq_contacto_correos_valor` sobre (`contacto_id`, `correo`)

**Restricciones CHECK:**

- `chk_contacto_correos_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `idx_contacto_correos_correo` (correo)

---

## contacto_telefonos

**Propósito:** Teléfonos de un contacto (uno principal).

**Cardinalidad:** 1 contacto — N teléfonos

**Dependencias funcionales:** id → todas; (contacto_id, telefono) clave candidata; un solo principal por contacto.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `contacto_id` | `varchar(40)` | NN |  | FK | Contacto (persona). |
| `telefono` | `varchar(40)` | NN |  |  | Número de teléfono. |
| `etiqueta` | `varchar(30)` | sí | `NULL` |  | Etiqueta (móvil, WhatsApp, oficina…). |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal. |

**Llaves foráneas:**

- `contacto_id` → `contactos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Unicidad:**

- `uq_contacto_telefonos_principal` sobre (`contacto_id`, `es_principal`)
- `uq_contacto_telefonos_valor` sobre (`contacto_id`, `telefono`)

**Restricciones CHECK:**

- `chk_contacto_telefonos_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `idx_contacto_telefonos_telefono` (telefono)

---

## contratos

**Propósito:** Contratos con su archivo y estado. Las relaciones son RESTRICT: no se pierde el historial contractual por borrados en cascada.

**Cardinalidad:** N contratos — M artistas, venues, proveedores, eventos y giras (tablas contrato_*)

**Dependencias funcionales:** id → todas las columnas. Las partes (artistas, venues, proveedores) y el objeto (eventos, giras) viven en tablas contrato_* (Fase 3); se eliminó la redundancia transitiva evento_id → artista/venue/gira.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `titulo` | `varchar(255)` | NN |  |  | Título del contrato. |
| `tipo` | `varchar(60)` | sí | `NULL` |  | Tipo (dominio cerrado por CHECK). |
| `estado` | `varchar(30)` | sí | `NULL` |  | Estado: Draft, Pending, Signed, Rejected, Active. |
| `nombre_archivo` | `varchar(255)` | sí | `NULL` |  | Nombre del archivo adjunto. |
| `notas` | `text` | sí | `NULL` |  | Notas internas. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `fecha_subida` | `datetime(3)` | sí | `NULL` |  | Fecha y hora de carga. |
| `tamano_bytes` | `bigint(20)` | sí | `NULL` |  | Tamaño del archivo en bytes. |

**Restricciones CHECK:**

- `chk_contratos_estado`: ``estado` in ('Draft','Pending','Signed','Rejected','Active')`
- `chk_contratos_tamano`: ``tamano_bytes` is null or `tamano_bytes` >= 0`
- `chk_contratos_tipo`: ``tipo` in ('Management','Booking','Performance','Co-production','NDA','Foro/Arrendamiento','Other')`

---

## contrato_artistas

**Propósito:** Artistas que son parte de un contrato (N:M). Los contratos se conservan aunque el artista se archive.

**Cardinalidad:** N contratos — M artistas

**Dependencias funcionales:** (contrato_id, artista_id) clave compuesta, sin atributos dependientes parciales. Borrar un artista con contratos está bloqueado (RESTRICT).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `contrato_id` | `varchar(40)` | NN |  | PK, FK |  |
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |

**Llaves foráneas:**

- `contrato_id` → `contratos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Índices:** `idx_cartistas_artista` (artista_id)

---

## contrato_eventos

**Propósito:** Eventos a los que se refiere un contrato (N:M).

**Cardinalidad:** N contratos — M eventos

**Dependencias funcionales:** (contrato_id, evento_id) clave compuesta.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `contrato_id` | `varchar(40)` | NN |  | PK, FK |  |
| `evento_id` | `varchar(40)` | NN |  | PK, FK | Evento. |

**Llaves foráneas:**

- `evento_id` → `eventos(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `contrato_id` → `contratos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Índices:** `idx_ceventos_evento` (evento_id)

---

## contrato_proveedores

**Propósito:** Proveedores que son parte de un contrato (N:M).

**Cardinalidad:** N contratos — M proveedores

**Dependencias funcionales:** (contrato_id, proveedor_id) clave compuesta.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `contrato_id` | `varchar(40)` | NN |  | PK, FK |  |
| `proveedor_id` | `varchar(40)` | NN |  | PK, FK | Proveedor. |

**Llaves foráneas:**

- `proveedor_id` → `proveedores(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `contrato_id` → `contratos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Índices:** `idx_cproveedores_proveedor` (proveedor_id)

---

## contrato_tours

**Propósito:** Giras a las que se refiere un contrato (N:M). La gira de un evento no se duplica: se deduce de contrato_eventos.

**Cardinalidad:** N contratos — M giras

**Dependencias funcionales:** (contrato_id, tour_id) clave compuesta.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `contrato_id` | `varchar(40)` | NN |  | PK, FK |  |
| `tour_id` | `varchar(40)` | NN |  | PK, FK | Gira. |

**Llaves foráneas:**

- `contrato_id` → `contratos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `tour_id` → `tours(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Índices:** `idx_ctours_tour` (tour_id)

---

## contrato_venues

**Propósito:** Venues que son parte de un contrato (N:M).

**Cardinalidad:** N contratos — M venues

**Dependencias funcionales:** (contrato_id, venue_id) clave compuesta.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `contrato_id` | `varchar(40)` | NN |  | PK, FK |  |
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `contrato_id` → `contratos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Índices:** `idx_cvenues_venue` (venue_id)

---

## eventos

**Propósito:** Shows y conciertos. El ingreso se captura (puede diferir de asistencia × precio); la utilidad se calcula y un CHECK impide que se desajuste. Los artistas están en evento_artistas.

**Cardinalidad:** 1 evento — N artistas (evento_artistas), N contratos; N:1 venue, N:1 gira (opcional)

**Dependencias funcionales:** id → todas las columnas. utilidad = ingreso_total − gastos_totales (verificada por CHECK). Setlist y bandas invitadas viven en tablas hijas; el feedback son columnas (Fase 3).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre comercial del evento. |
| `venue_id` | `varchar(40)` | NN |  | FK | Recinto donde se realiza. |
| `tour_id` | `varchar(40)` | sí | `NULL` | FK | Gira. |
| `fecha` | `date` | sí | `NULL` |  | Fecha del evento. |
| `estado` | `varchar(30)` | sí | `Draft` |  | Estatus: Draft, Confirmed, Completed, Cancelled. |
| `capacidad` | `int(11)` | sí | `0` |  | Aforo. |
| `asistencia` | `int(11)` | sí | `0` |  | Asistencia (boletos pagados y cortesías). |
| `precio_boleto` | `decimal(10,2)` | sí | `0.00` |  | Precio promedio del boleto. |
| `ingreso_total` | `decimal(12,2)` | sí | `0.00` |  | Ingreso real capturado (puede diferir de asistencia × precio). |
| `gastos_totales` | `decimal(12,2)` | sí | `0.00` |  | Gastos de producción, rider y viáticos. |
| `utilidad` | `decimal(12,2)` | sí | `0.00` |  | Utilidad = ingreso_total − gastos_totales (la fuerza un CHECK). |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |
| `feedback_artista` | `text` | sí | `NULL` |  |  |
| `reaccion_publico` | `text` | sí | `NULL` |  |  |
| `valoracion_ritmo` | `tinyint(4)` | sí | `NULL` |  |  |
| `notas_optimizacion` | `text` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `tour_id` → `tours(id)` · al borrar el padre: **SET NULL**

**Restricciones CHECK:**

- `chk_eventos_cantidades`: ``capacidad` >= 0 and `asistencia` >= 0 and `precio_boleto` >= 0 and `ingreso_total` >= 0 and `gastos_totales` >= 0`
- `chk_eventos_estado`: ``estado` in ('Draft','Confirmed','Completed','Cancelled')`
- `chk_eventos_ritmo`: ``valoracion_ritmo` is null or `valoracion_ritmo` between 1 and 5`
- `chk_eventos_utilidad`: ``utilidad` = `ingreso_total` - `gastos_totales``

**Índices:** `idx_eventos_fecha` (fecha); `idx_eventos_tour` (tour_id); `idx_eventos_venue` (venue_id)

---

## evento_artistas

**Propósito:** Alineación del evento: qué artistas participan, con rol, orden, horario, honorarios y confirmación. Un artista puede presentarse más de una vez (distinto orden).

**Cardinalidad:** N eventos — M artistas

**Dependencias funcionales:** (evento_id, artista_id, orden_presentacion) clave candidata → rol, horario, honorarios, moneda, estado. Un solo artista principal por evento.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `bigint(20) unsigned` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `evento_id` | `varchar(40)` | NN |  | FK | Evento. |
| `artista_id` | `varchar(40)` | NN |  | FK | Artista. |
| `rol` | `varchar(20)` | NN | `Artista` |  | Rol en el cartel: Artista, Invitado, Telonero, Soporte, Otro. |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Artista principal del evento (1) o NULL. |
| `orden_presentacion` | `smallint(5) unsigned` | NN | `1` |  | Orden en que se presenta (1 = primero). |
| `hora_inicio` | `time` | sí | `NULL` |  | Hora de inicio. |
| `hora_fin` | `time` | sí | `NULL` |  | Hora de fin. |
| `honorarios` | `decimal(12,2)` | sí | `NULL` |  | Honorarios acordados (≥ 0). |
| `moneda` | `char(3)` | NN | `MXN` | FK | Moneda de los honorarios (cat_monedas). |
| `estado_confirmacion` | `varchar(20)` | NN | `Pendiente` |  | Pendiente, Confirmado o Cancelado. |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |

**Llaves foráneas:**

- `evento_id` → `eventos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `moneda` → `cat_monedas(codigo)` · al borrar el padre: **RESTRICT** (protege el historial)

**Unicidad:**

- `uq_ea_presentacion` sobre (`evento_id`, `artista_id`, `orden_presentacion`)
- `uq_ea_principal` sobre (`evento_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_ea_estado`: ``estado_confirmacion` in ('Pendiente','Confirmado','Cancelado')`
- `chk_ea_honorarios`: ``honorarios` is null or `honorarios` >= 0`
- `chk_ea_orden`: ``orden_presentacion` >= 1`
- `chk_ea_principal`: ``es_principal` is null or `es_principal` = 1`
- `chk_ea_rol`: ``rol` in ('Artista','Invitado','Telonero','Soporte','Otro')`

**Índices:** `fk_ea_moneda` (moneda); `idx_ea_artista` (artista_id,evento_id)

---

## evento_bandas_invitadas

**Propósito:** Bandas invitadas o teloneras de un evento (texto libre; las que son artistas del CRM van en evento_artistas).

**Cardinalidad:** N bandas — 1 evento

**Dependencias funcionales:** (evento_id, orden) → nombre.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `evento_id` | `varchar(40)` | NN |  | PK, FK | Evento. |
| `orden` | `smallint(5) unsigned` | NN |  | PK |  |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |

**Llaves foráneas:**

- `evento_id` → `eventos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

---

## evento_setlist

**Propósito:** Repertorio de un evento: canciones en orden, con duración en segundos (sumable) y notas de transición.

**Cardinalidad:** N canciones — 1 evento

**Dependencias funcionales:** (evento_id, item_id) → título, duracion_seg, tempo, notas_transicion.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `evento_id` | `varchar(40)` | NN |  | PK, FK | Evento. |
| `item_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `titulo` | `varchar(255)` | NN |  |  |  |
| `duracion_seg` | `int(10) unsigned` | sí | `NULL` |  |  |
| `tempo` | `varchar(10)` | sí | `NULL` |  |  |
| `notas_transicion` | `text` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `evento_id` → `eventos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_es_tempo`: ``tempo` is null or `tempo` in ('Lento','Medio','Rápido')`

**Índices:** `idx_es_orden` (evento_id,orden)

---

## proveedores

**Propósito:** Proveedores técnicos y de servicios (sonido, iluminación, catering…).

**Cardinalidad:** 1 proveedor — N venues (vía venue_proveedores), N contactos

**Dependencias funcionales:** id → todas las columnas. La categoría es un dominio cerrado (CHECK).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `categoria` | `varchar(80)` | sí | `NULL` |  | Categoría (dominio cerrado por CHECK). |
| `rating` | `decimal(3,1)` | sí | `0.0` |  | Calificación 0–5. |
| `costo_por_show` | `decimal(12,2)` | sí | `0.00` |  | Costo base por show (MXN). |
| `notas` | `text` | sí | `NULL` |  | Notas internas. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |

**Restricciones CHECK:**

- `chk_proveedores_categoria`: ``categoria` in ('Sonido','Ingeniero de Audio','Iluminación','Catering','Backline','Escenografía','Seguridad','Personal de Apoyo','Otros')`
- `chk_proveedores_valores`: ``rating` between 0 and 5 and `costo_por_show` >= 0`

---

## proveedor_contactos

**Propósito:** Vínculo contacto ↔ proveedor con rol. Sustituye a las columnas contacto/telefono/correo del proveedor.

**Cardinalidad:** N proveedores — M contactos

**Dependencias funcionales:** (proveedor_id, contacto_id, rol_id) → es_principal. Un solo principal por proveedor.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `proveedor_id` | `varchar(40)` | NN |  | PK, FK | Proveedor. |
| `contacto_id` | `varchar(40)` | NN |  | PK, FK | Contacto (persona). |
| `rol_id` | `smallint(5) unsigned` | NN |  | PK, FK | Rol del contacto en la entidad (catálogo cat_roles_contacto). |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal. |

**Llaves foráneas:**

- `proveedor_id` → `proveedores(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `contacto_id` → `contactos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `rol_id` → `cat_roles_contacto(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Unicidad:**

- `uq_pc_principal` sobre (`proveedor_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_proveedor_contactos_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `fk_proveedor_contactos_rol` (rol_id); `idx_proveedor_contactos_contacto` (contacto_id)

---

## proyectos_grabacion

**Propósito:** Proyectos de grabación de un artista. Canciones, costos, pagos, etapas e instrumentos viven en tablas hijas (Fase 3): costos y pagos se pueden sumar en SQL.

**Cardinalidad:** 1 artista — N proyectos

**Dependencias funcionales:** id → todas las columnas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `titulo` | `varchar(255)` | NN |  |  | Título del proyecto. |
| `artista_id` | `varchar(40)` | sí | `NULL` | FK | Artista. |
| `estado` | `varchar(40)` | sí | `NULL` |  | Estado del proyecto (dominio cerrado por CHECK). |
| `fecha_lanzamiento` | `date` | sí | `NULL` |  | Fecha de lanzamiento prevista. |
| `estudio` | `varchar(255)` | sí | `NULL` |  | Estudio. |
| `productor` | `varchar(255)` | sí | `NULL` |  | Productor. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Restricciones CHECK:**

- `chk_proyectos_estado`: ``estado` in ('Planificación','Pre-producción','Grabando','Mezcla','Masterización','Completado')`

**Índices:** `idx_proyectos_artista` (artista_id)

---

## proyecto_canciones

**Propósito:** Canciones de un proyecto de grabación, con duración, compositor, estado y avance.

**Cardinalidad:** N canciones — 1 proyecto

**Dependencias funcionales:** (proyecto_id, cancion_id) → título, duracion_seg, compositor, estado, progreso (0–100 por CHECK).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `proyecto_id` | `varchar(40)` | NN |  | PK, FK |  |
| `cancion_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `titulo` | `varchar(255)` | NN |  |  |  |
| `duracion_seg` | `int(10) unsigned` | sí | `NULL` |  |  |
| `compositor` | `varchar(255)` | sí | `NULL` |  |  |
| `estado` | `varchar(30)` | NN |  |  |  |
| `progreso` | `tinyint(3) unsigned` | NN | `0` |  |  |
| `notas` | `text` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `proyecto_id` → `proyectos_grabacion(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_pc_estado`: ``estado` in ('Composición','Demo','Grabación de Instrumentos','Grabación de Voces','Mezcla','Masterizado','Listo')`
- `chk_pc_progreso`: ``progreso` between 0 and 100`

---

## proyecto_costos

**Propósito:** Costos del proyecto (concepto, categoría, monto ≥ 0). Se suman con SUM(monto).

**Cardinalidad:** N costos — 1 proyecto

**Dependencias funcionales:** (proyecto_id, costo_id) → concepto, categoría, monto, notas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `proyecto_id` | `varchar(40)` | NN |  | PK, FK |  |
| `costo_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `concepto` | `varchar(255)` | NN |  |  |  |
| `categoria` | `varchar(30)` | NN |  |  |  |
| `monto` | `decimal(12,2)` | NN | `0.00` |  |  |
| `notas` | `text` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `proyecto_id` → `proyectos_grabacion(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_pco_categoria`: ``categoria` in ('Estudio/Grabación','Músicos de Sesión','Mezcla','Masterización','Arreglos/Producción','Otros')`
- `chk_pco_monto`: ``monto` >= 0`

---

## proyecto_etapas

**Propósito:** Etapas de producción del proyecto (pre-producción, grabación, mezcla…).

**Cardinalidad:** N etapas — 1 proyecto

**Dependencias funcionales:** (proyecto_id, etapa_id) → nombre, estado, fechas, notas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `proyecto_id` | `varchar(40)` | NN |  | PK, FK |  |
| `etapa_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `nombre` | `varchar(20)` | NN |  |  | Nombre. |
| `estado` | `varchar(15)` | NN | `Pendiente` |  |  |
| `fecha_inicio` | `date` | sí | `NULL` |  |  |
| `fecha_fin` | `date` | sí | `NULL` |  |  |
| `notas` | `text` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `proyecto_id` → `proyectos_grabacion(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_pe_estado`: ``estado` in ('Pendiente','En Progreso','Completado')`
- `chk_pe_fechas`: ``fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio``
- `chk_pe_nombre`: ``nombre` in ('Pre-producción','Grabación','Revisión','Mezcla','Masterización','Listo')`

---

## proyecto_instrumentos

**Propósito:** Instrumentos y músicos asignados a una etapa del proyecto.

**Cardinalidad:** N instrumentos — 1 etapa

**Dependencias funcionales:** (proyecto_id, etapa_id, instrumento_id) → nombre, estado, músico.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `proyecto_id` | `varchar(40)` | NN |  | PK, FK |  |
| `etapa_id` | `varchar(40)` | NN |  | PK, FK |  |
| `instrumento_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `estado` | `varchar(10)` | NN | `Pendiente` |  |  |
| `musico` | `varchar(255)` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `proyecto_id` → `proyecto_etapas(proyecto_id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `etapa_id` → `proyecto_etapas(etapa_id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_pi_estado`: ``estado` in ('Pendiente','Grabando','Listo')`

---

## proyecto_pagos

**Propósito:** Pagos del proyecto con fecha de vencimiento y estado (Pendiente/Pagado…).

**Cardinalidad:** N pagos — 1 proyecto

**Dependencias funcionales:** (proyecto_id, pago_id) → concepto, monto, fecha_vencimiento, estado.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `proyecto_id` | `varchar(40)` | NN |  | PK, FK |  |
| `pago_id` | `varchar(40)` | NN |  | PK |  |
| `orden` | `smallint(5) unsigned` | NN |  |  |  |
| `concepto` | `varchar(255)` | NN |  |  |  |
| `monto` | `decimal(12,2)` | NN | `0.00` |  |  |
| `fecha_vencimiento` | `date` | sí | `NULL` |  |  |
| `estado` | `varchar(12)` | NN | `Pendiente` |  |  |
| `notas` | `text` | sí | `NULL` |  |  |

**Llaves foráneas:**

- `proyecto_id` → `proyectos_grabacion(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Restricciones CHECK:**

- `chk_pp_estado`: ``estado` in ('Pendiente','Pagado')`
- `chk_pp_monto`: ``monto` >= 0`

**Índices:** `idx_pp_vencimiento` (fecha_vencimiento)

---

## schema_migrations

**Propósito:** Registro de migraciones aplicadas (versión, nombre, fecha, checksum y notas).

**Cardinalidad:** —

**Dependencias funcionales:** version → nombre, aplicada_en, checksum, notas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `version` | `int(11)` | NN |  | PK | Número de la migración. |
| `nombre` | `varchar(100)` | NN |  |  | Nombre. |
| `aplicada_en` | `datetime(3)` | NN |  |  | Cuándo se aplicó. |
| `checksum` | `char(32)` | NN |  |  | MD5 del archivo de la migración al aplicarla. |
| `notas` | `text` | sí | `NULL` |  | Resumen de lo migrado. |

---

## tours

**Propósito:** Giras con fechas y estatus. Los artistas participantes están en tour_artistas (una gira puede ser compartida).

**Cardinalidad:** 1 gira — N artistas (tour_artistas), N eventos

**Dependencias funcionales:** id → nombre, fechas, status. CHECK fecha_fin ≥ fecha_inicio.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `fecha_inicio` | `date` | sí | `NULL` |  | Fecha de inicio. |
| `fecha_fin` | `date` | sí | `NULL` |  | Fecha de fin (≥ inicio). |
| `status` | `varchar(50)` | sí | `Planning` |  | Estatus: Planning, Active, Completed, Cancelled. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |

**Restricciones CHECK:**

- `chk_tours_fechas`: ``fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio``
- `chk_tours_status`: ``status` in ('Planning','Active','Completed','Cancelled')`

---

## tour_artistas

**Propósito:** Artistas de una gira (N:M); uno es el principal.

**Cardinalidad:** N giras — M artistas

**Dependencias funcionales:** (tour_id, artista_id) → es_principal. Regla en PHP: los artistas de cada evento deben pertenecer a la gira del evento.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `tour_id` | `varchar(40)` | NN |  | PK, FK | Gira. |
| `artista_id` | `varchar(40)` | NN |  | PK, FK | Artista. |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Artista principal de la gira (1) o NULL. |

**Llaves foráneas:**

- `tour_id` → `tours(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Unicidad:**

- `uq_ta_principal` sobre (`tour_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_ta_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `idx_ta_artista` (artista_id)

---

## venues

**Propósito:** Recintos, foros, teatros y bares, con coordenadas, calificación y puntajes. Sitio web, reseñas y demás datos de ficha son columnas; horarios y bandas locales viven en tablas hijas (Fase 3).

**Cardinalidad:** 1 venue — N contactos, eventos, contratos; N:M proveedores

**Dependencias funcionales:** id → todas las columnas. codigo_postal/ciudad/estado/pais: misma excepción de 3FN que artistas.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre del recinto. |
| `direccion` | `text` | sí | `NULL` |  | Dirección completa. |
| `ciudad` | `varchar(150)` | sí | `NULL` |  | Ciudad. |
| `estado` | `varchar(150)` | sí | `NULL` |  | Estado o provincia. |
| `pais` | `varchar(150)` | sí | `NULL` |  | País. |
| `codigo_postal` | `varchar(20)` | sí | `NULL` |  | Código postal. |
| `latitud` | `decimal(10,8)` | sí | `NULL` |  | Latitud (−90 a 90). |
| `longitud` | `decimal(11,8)` | sí | `NULL` |  | Longitud (−180 a 180). |
| `rating` | `decimal(3,1)` | sí | `0.0` |  | Calificación 0–5. |
| `score_rentabilidad` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de rentabilidad. NULL = No aplica (NP): no cuenta en el Flamo Score; 0 = sin evaluar. |
| `score_respuesta` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de tiempo de respuesta. NULL = No aplica (NP): no cuenta en el Flamo Score; 0 = sin evaluar. |
| `score_puntualidad_pago` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de puntualidad de pago. NULL = No aplica (NP): no cuenta en el Flamo Score; 0 = sin evaluar. |
| `score_negociacion` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de negociación. NULL = No aplica (NP): no cuenta en el Flamo Score; 0 = sin evaluar. |
| `score_produccion` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de producción. NULL = No aplica (NP): no cuenta en el Flamo Score; 0 = sin evaluar. |
| `score_hospitalidad` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de hospitalidad. NULL = No aplica (NP): no cuenta en el Flamo Score; 0 = sin evaluar. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |
| `sitio_web` | `varchar(500)` | sí | `NULL` |  |  |
| `telefono` | `varchar(60)` | sí | `NULL` |  |  |
| `num_resenas` | `int(11)` | NN | `0` |  |  |
| `place_id` | `varchar(120)` | sí | `NULL` |  |  |
| `tipo_establecimiento` | `varchar(120)` | sí | `NULL` |  |  |
| `instagram` | `varchar(255)` | sí | `NULL` |  |  |
| `facebook` | `varchar(255)` | sí | `NULL` |  |  |
| `tiktok` | `varchar(255)` | sí | `NULL` |  |  |
| `whatsapp` | `varchar(255)` | sí | `NULL` |  |  |
| `correo` | `varchar(255)` | sí | `NULL` |  |  |
| `youtube` | `varchar(255)` | sí | `NULL` |  |  |
| `twitter` | `varchar(255)` | sí | `NULL` |  |  |

**Restricciones CHECK:**

- `chk_venues_coord`: `(`latitud` is null or `latitud` between -90 and 90) and (`longitud` is null or `longitud` between -180 and 180)`
- `chk_venues_rating`: ``rating` between 0 and 5`
- `chk_venues_scores`: ``score_rentabilidad` between 0 and 100 and `score_respuesta` between 0 and 100 and `score_puntualidad_pago` between 0 and 100 and `score_negociacion` between 0 and 100 and `score_produccion` between 0 and 100 and `score_hospitalidad` between 0 and 100`

**Índices:** `idx_venues_ciudad` (ciudad); `idx_venues_nombre` (nombre)

---

## venue_bandas_locales

**Propósito:** Bandas locales asociadas a un venue.

**Cardinalidad:** N bandas — 1 venue

**Dependencias funcionales:** (venue_id, orden) → nombre.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |
| `orden` | `smallint(5) unsigned` | NN |  | PK |  |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

---

## venue_contactos

**Propósito:** Vínculo contacto ↔ venue con su rol; marca al contacto principal del venue. Reemplaza `venues.contacto_principal_id` y elimina la dependencia circular.

**Cardinalidad:** N venues — M contactos

**Dependencias funcionales:** (venue_id, contacto_id, rol_id) → es_principal. Un solo principal por venue (garantiza que el principal pertenece al venue).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |
| `contacto_id` | `varchar(40)` | NN |  | PK, FK | Contacto (persona). |
| `rol_id` | `smallint(5) unsigned` | NN |  | PK, FK | Rol del contacto en la entidad (catálogo cat_roles_contacto). |
| `es_principal` | `tinyint(1)` | sí | `NULL` |  | Marca de «principal»: vale 1 o NULL (NULL = no principal). Permite un UNIQUE que garantiza un solo principal. |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `contacto_id` → `contactos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `rol_id` → `cat_roles_contacto(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Unicidad:**

- `uq_vc_principal` sobre (`venue_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_venue_contactos_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `fk_venue_contactos_rol` (rol_id); `idx_venue_contactos_contacto` (contacto_id)

---

## venue_horarios

**Propósito:** Horarios de operación del venue (una línea por renglón de texto).

**Cardinalidad:** N horarios — 1 venue

**Dependencias funcionales:** (venue_id, orden) → descripción.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |
| `orden` | `smallint(5) unsigned` | NN |  | PK |  |
| `descripcion` | `varchar(255)` | NN |  |  |  |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

---

## venue_notas

**Propósito:** Notas de seguimiento de un venue (p. ej. cómo salió el show una vez realizado): texto, fecha, autor y, opcionalmente, el evento al que se refiere.

**Cardinalidad:** N notas — 1 venue; N notas — 0..1 evento

**Dependencias funcionales:** (venue_id, nota_id) → fecha, texto, autor, evento_id. Al borrar el venue se borran sus notas (CASCADE); al borrar el evento la nota se conserva sin vínculo (SET NULL). CHECK: el texto no puede estar en blanco.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |
| `nota_id` | `varchar(40)` | NN |  | PK |  |
| `fecha` | `datetime(3)` | NN |  |  |  |
| `texto` | `text` | NN |  |  |  |
| `autor` | `varchar(100)` | sí | `NULL` |  |  |
| `evento_id` | `varchar(40)` | sí | `NULL` | FK | Evento. |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `evento_id` → `eventos(id)` · al borrar el padre: **SET NULL**

**Restricciones CHECK:**

- `chk_vn_texto`: `char_length(trim(`texto`)) > 0`

**Índices:** `idx_vn_evento` (evento_id); `idx_vn_venue_fecha` (venue_id,fecha)

---

## venue_proveedores

**Propósito:** Relación N:M entre venues y proveedores.

**Cardinalidad:** N venues — M proveedores

**Dependencias funcionales:** (venue_id, proveedor_id) clave compuesta; sin atributos dependientes.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |
| `proveedor_id` | `varchar(40)` | NN |  | PK, FK | Proveedor. |

**Llaves foráneas:**

- `proveedor_id` → `proveedores(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `venue_id` → `venues(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Índices:** `proveedor_id` (proveedor_id)

