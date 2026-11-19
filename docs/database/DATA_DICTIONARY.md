# FLAMO CRM — Diccionario de datos

> Generado por `scripts/db/generate-docs.php` desde la base migrada (esquema v3). No editar a mano.
> Motor: MySQL/MariaDB (InnoDB, utf8mb4). Convención: «PK» llave primaria · «FK» llave foránea · «UQ» única · «NN» no nula.
> Las columnas marcadas **OBSOLETO** existen solo en bases actualizadas desde v1 y se retiran en la Fase 4.

## Índice

- [`artistas`](#artistas) — Entidad principal: perfil del artista o agrupación. Los datos anidados que aún no se consultan por separado (bio, redes, pipeline, historial, integrantes) van en `extra` (JSON).
- [`artista_contactos`](#artista_contactos) — Vínculo contacto ↔ artista con rol (Manager, Booking…). Sustituye a los textos `manager` y `booking_agent`.
- [`artista_generos`](#artista_generos) — Géneros de un artista (N:M). Un género es el principal; el resto, secundarios.
- [`cat_etapas_desarrollo`](#cat_etapas_desarrollo) — Catálogo cerrado de etapas de carrera de un artista (Desarrollo … Internacional).
- [`cat_generos`](#cat_generos) — Catálogo abierto de géneros musicales. Evita guardar listas de géneros separadas por comas.
- [`cat_monedas`](#cat_monedas) — Catálogo de monedas (ISO 4217) para honorarios.
- [`cat_roles_contacto`](#cat_roles_contacto) — Catálogo abierto de roles que una persona puede tener en una entidad (Manager, Booking, Promotor…). Unifica «Booking» y «booking».
- [`contactos`](#contactos) — Persona (o empresa) independiente de cualquier entidad. Sus medios de contacto y vínculos viven en tablas propias.
- [`contactos_legacy`](#contactos_legacy) — Solo en bases actualizadas desde v1: copia de la tabla de contactos anterior, conservada hasta la Fase 4 para poder revertir.
- [`contacto_correos`](#contacto_correos) — Correos electrónicos de un contacto (uno principal).
- [`contacto_telefonos`](#contacto_telefonos) — Teléfonos de un contacto (uno principal).
- [`contratos`](#contratos) — Contratos con su archivo y estado. Las relaciones son RESTRICT: no se pierde el historial contractual por borrados en cascada.
- [`eventos`](#eventos) — Shows y conciertos. El ingreso se captura (puede diferir de asistencia × precio); la utilidad se calcula y un CHECK impide que se desajuste. Los artistas están en evento_artistas.
- [`evento_artistas`](#evento_artistas) — Alineación del evento: qué artistas participan, con rol, orden, horario, honorarios y confirmación. Un artista puede presentarse más de una vez (distinto orden).
- [`proveedores`](#proveedores) — Proveedores técnicos y de servicios (sonido, iluminación, catering…).
- [`proveedor_contactos`](#proveedor_contactos) — Vínculo contacto ↔ proveedor con rol. Sustituye a las columnas contacto/telefono/correo del proveedor.
- [`proyectos_grabacion`](#proyectos_grabacion) — Proyectos de grabación de un artista. Canciones, costos, pagos y etapas van en `extra` (pendiente de Fase 3).
- [`schema_migrations`](#schema_migrations) — Registro de migraciones aplicadas (versión, nombre, fecha, checksum y notas).
- [`tours`](#tours) — Giras con fechas y estatus. Los artistas participantes están en tour_artistas (una gira puede ser compartida).
- [`tour_artistas`](#tour_artistas) — Artistas de una gira (N:M); uno es el principal.
- [`venues`](#venues) — Recintos, foros, teatros y bares, con coordenadas, calificación y puntajes. `extra` guarda datos de ficha aún no consultables por separado (horarios, redes, bandas locales).
- [`venue_contactos`](#venue_contactos) — Vínculo contacto ↔ venue con su rol; marca al contacto principal del venue. Reemplaza `venues.contacto_principal_id` y elimina la dependencia circular.
- [`venue_proveedores`](#venue_proveedores) — Relación N:M entre venues y proveedores.

---

## artistas

**Propósito:** Entidad principal: perfil del artista o agrupación. Los datos anidados que aún no se consultan por separado (bio, redes, pipeline, historial, integrantes) van en `extra` (JSON).

**Cardinalidad:** 1 artista — N géneros, contactos, giras, eventos, proyectos, contratos

**Dependencias funcionales:** id → todas las columnas. Dependencia transitiva ciudad → estado → pais aceptada como excepción de 3FN (dirección postal como valor; ver DATABASE_AUDIT §3).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre_artistico` | `varchar(255)` | NN |  |  | Nombre artístico. |
| `nombre_legal` | `varchar(255)` | sí | `NULL` |  | Nombre legal o razón social. |
| `genero` | `varchar(150)` | sí | `NULL` |  | OBSOLETO (v1): género como texto. Sustituido por artista_generos. |
| `etapa_id` | `tinyint(4)` | NN | `1` | FK | Etapa de carrera (catálogo). |
| `manager` | `varchar(255)` | sí | `NULL` |  | OBSOLETO (v1): texto. Sustituido por artista_contactos (rol Manager). |
| `booking_agent` | `varchar(255)` | sí | `NULL` |  | OBSOLETO (v1): texto. Sustituido por artista_contactos (rol Booking). |
| `isrc_default` | `varchar(40)` | sí | `NULL` |  | Código ISRC por defecto. |
| `iswc_default` | `varchar(40)` | sí | `NULL` |  | Código ISWC por defecto. |
| `sociedad_gestion` | `varchar(80)` | sí | `NULL` |  | Sociedad de gestión (SACM, ASCAP, BMI…). |
| `rfc` | `varchar(40)` | sí | `NULL` |  | RFC fiscal. |
| `ciudad` | `varchar(150)` | sí | `NULL` |  | Ciudad de origen. |
| `estado` | `varchar(150)` | sí | `NULL` |  | Estado o provincia. |
| `pais` | `varchar(150)` | sí | `NULL` |  | País. |
| `foto` | `text` | sí | `NULL` |  | URL de la foto de perfil. |
| `extra` | `longtext` | sí | `NULL` |  | Documento JSON con campos anidados que aún no se consultan ni relacionan por separado. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |

**Llaves foráneas:**

- `etapa_id` → `cat_etapas_desarrollo(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Índices:** `etapa_id` (etapa_id); `idx_artistas_nombre` (nombre_artistico)

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

- `artista_id` → `artistas(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `genero_id` → `cat_generos(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Unicidad:**

- `uq_artista_genero_principal` sobre (`artista_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_ag_orden`: ``orden` >= 1`
- `chk_ag_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `idx_artista_generos_genero` (genero_id)

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

**Cardinalidad:** N contratos — 0..1 artista, venue, gira y evento

**Dependencias funcionales:** id → todas las columnas. Pendiente de Fase 3: evento_id determina artista/venue/gira (redundancia transitiva) → se pasará a tablas de partes.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `titulo` | `varchar(255)` | NN |  |  | Título del contrato. |
| `artista_id` | `varchar(40)` | sí | `NULL` | FK | Artista. |
| `venue_id` | `varchar(40)` | sí | `NULL` | FK | Venue. |
| `tour_id` | `varchar(40)` | sí | `NULL` | FK | Gira. |
| `evento_id` | `varchar(40)` | sí | `NULL` | FK | Evento. |
| `tipo` | `varchar(60)` | sí | `NULL` |  | Tipo (dominio cerrado por CHECK). |
| `estado` | `varchar(30)` | sí | `NULL` |  | Estado: Draft, Pending, Signed, Rejected, Active. |
| `nombre_archivo` | `varchar(255)` | sí | `NULL` |  | Nombre del archivo adjunto. |
| `notas` | `text` | sí | `NULL` |  | Notas internas. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `fecha_subida` | `datetime(3)` | sí | `NULL` |  | Fecha y hora de carga. |
| `tamano_bytes` | `bigint(20)` | sí | `NULL` |  | Tamaño del archivo en bytes. |

**Llaves foráneas:**

- `tour_id` → `tours(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `evento_id` → `eventos(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `venue_id` → `venues(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Restricciones CHECK:**

- `chk_contratos_estado`: ``estado` in ('Draft','Pending','Signed','Rejected','Active')`
- `chk_contratos_tamano`: ``tamano_bytes` is null or `tamano_bytes` >= 0`
- `chk_contratos_tipo`: ``tipo` in ('Management','Booking','Performance','Co-production','NDA','Foro/Arrendamiento','Other')`

**Índices:** `fk_contratos_tour` (tour_id); `fk_contratos_venue` (venue_id); `idx_contratos_artista` (artista_id); `idx_contratos_evento` (evento_id)

---

## eventos

**Propósito:** Shows y conciertos. El ingreso se captura (puede diferir de asistencia × precio); la utilidad se calcula y un CHECK impide que se desajuste. Los artistas están en evento_artistas.

**Cardinalidad:** 1 evento — N artistas (evento_artistas), N contratos; N:1 venue, N:1 gira (opcional)

**Dependencias funcionales:** id → todas las columnas. utilidad = ingreso_total − gastos_totales (verificada por CHECK). `extra` guarda setlist, bandas invitadas y feedback (pendiente de Fase 3).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre comercial del evento. |
| `artista_id` | `varchar(40)` | sí | `NULL` | FK | OBSOLETO (v1): artista del evento. Sustituido por evento_artistas. |
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
| `extra` | `longtext` | sí | `NULL` |  | Documento JSON con campos anidados que aún no se consultan ni relacionan por separado. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `tour_id` → `tours(id)` · al borrar el padre: **SET NULL**

**Restricciones CHECK:**

- `chk_eventos_cantidades`: ``capacidad` >= 0 and `asistencia` >= 0 and `precio_boleto` >= 0 and `ingreso_total` >= 0 and `gastos_totales` >= 0`
- `chk_eventos_estado`: ``estado` in ('Draft','Confirmed','Completed','Cancelled')`
- `chk_eventos_utilidad`: ``utilidad` = `ingreso_total` - `gastos_totales``

**Índices:** `idx_eventos_artista_fecha` (artista_id,fecha); `idx_eventos_fecha` (fecha); `idx_eventos_tour` (tour_id); `idx_eventos_venue` (venue_id)

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

- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `moneda` → `cat_monedas(codigo)` · al borrar el padre: **RESTRICT** (protege el historial)
- `evento_id` → `eventos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

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

## proveedores

**Propósito:** Proveedores técnicos y de servicios (sonido, iluminación, catering…).

**Cardinalidad:** 1 proveedor — N venues (vía venue_proveedores), N contactos

**Dependencias funcionales:** id → todas las columnas. La categoría es un dominio cerrado (CHECK).

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `id` | `varchar(40)` | NN |  | PK | Identificador único (texto generado por la aplicación, p. ej. «ven-1731…»). |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `categoria` | `varchar(80)` | sí | `NULL` |  | Categoría (dominio cerrado por CHECK). |
| `contacto` | `varchar(255)` | sí | `NULL` |  | OBSOLETO (v1): nombre del contacto. Sustituido por proveedor_contactos. |
| `telefono` | `varchar(60)` | sí | `NULL` |  | OBSOLETO (v1). |
| `correo` | `varchar(255)` | sí | `NULL` |  | OBSOLETO (v1). |
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

- `contacto_id` → `contactos(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `rol_id` → `cat_roles_contacto(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `proveedor_id` → `proveedores(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Unicidad:**

- `uq_pc_principal` sobre (`proveedor_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_proveedor_contactos_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `fk_proveedor_contactos_rol` (rol_id); `idx_proveedor_contactos_contacto` (contacto_id)

---

## proyectos_grabacion

**Propósito:** Proyectos de grabación de un artista. Canciones, costos, pagos y etapas van en `extra` (pendiente de Fase 3).

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
| `extra` | `longtext` | sí | `NULL` |  | Documento JSON con campos anidados que aún no se consultan ni relacionan por separado. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **SET NULL**

**Restricciones CHECK:**

- `chk_proyectos_estado`: ``estado` in ('Planificación','Pre-producción','Grabando','Mezcla','Masterización','Completado')`

**Índices:** `idx_proyectos_artista` (artista_id)

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
| `artista_id` | `varchar(40)` | sí | `NULL` | FK | OBSOLETO (v1): artista de la gira. Sustituido por tour_artistas. |
| `nombre` | `varchar(255)` | NN |  |  | Nombre. |
| `fecha_inicio` | `date` | sí | `NULL` |  | Fecha de inicio. |
| `fecha_fin` | `date` | sí | `NULL` |  | Fecha de fin (≥ inicio). |
| `status` | `varchar(50)` | sí | `Planning` |  | Estatus: Planning, Active, Completed, Cancelled. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |

**Llaves foráneas:**

- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)

**Restricciones CHECK:**

- `chk_tours_fechas`: ``fecha_inicio` is null or `fecha_fin` is null or `fecha_fin` >= `fecha_inicio``
- `chk_tours_status`: ``status` in ('Planning','Active','Completed','Cancelled')`

**Índices:** `idx_tours_artista` (artista_id)

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

- `artista_id` → `artistas(id)` · al borrar el padre: **RESTRICT** (protege el historial)
- `tour_id` → `tours(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Unicidad:**

- `uq_ta_principal` sobre (`tour_id`, `es_principal`)

**Restricciones CHECK:**

- `chk_ta_principal`: ``es_principal` is null or `es_principal` = 1`

**Índices:** `idx_ta_artista` (artista_id)

---

## venues

**Propósito:** Recintos, foros, teatros y bares, con coordenadas, calificación y puntajes. `extra` guarda datos de ficha aún no consultables por separado (horarios, redes, bandas locales).

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
| `score_rentabilidad` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de rentabilidad. |
| `score_respuesta` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de tiempo de respuesta. |
| `score_puntualidad_pago` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de puntualidad de pago. |
| `score_negociacion` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de negociación. |
| `score_produccion` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de producción. |
| `score_hospitalidad` | `smallint(6)` | sí | `0` |  | Puntaje 0–100 de hospitalidad. |
| `contacto_principal_id` | `varchar(40)` | sí | `NULL` | FK | OBSOLETO (v1): contacto principal. Sustituido por venue_contactos.es_principal. |
| `extra` | `longtext` | sí | `NULL` |  | Documento JSON con campos anidados que aún no se consultan ni relacionan por separado. |
| `version` | `int(11)` | NN | `1` |  | Número de versión del registro: base del bloqueo optimista (sube en cada guardado). |
| `created_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de creación (UTC, milisegundos). |
| `updated_at` | `datetime(3)` | NN | `current_timestamp(3)` |  | Fecha y hora de la última modificación (UTC). |
| `deleted_at` | `datetime(3)` | sí | `NULL` |  | Borrado lógico: NULL = activo; con fecha = archivado (se conserva el historial). |

**Llaves foráneas:**

- `contacto_principal_id` → `contactos_legacy(id)` · al borrar el padre: **SET NULL**

**Restricciones CHECK:**

- `chk_venues_coord`: `(`latitud` is null or `latitud` between -90 and 90) and (`longitud` is null or `longitud` between -180 and 180)`
- `chk_venues_rating`: ``rating` between 0 and 5`
- `chk_venues_scores`: ``score_rentabilidad` between 0 and 100 and `score_respuesta` between 0 and 100 and `score_puntualidad_pago` between 0 and 100 and `score_negociacion` between 0 and 100 and `score_produccion` between 0 and 100 and `score_hospitalidad` between 0 and 100`

**Índices:** `idx_venues_ciudad` (ciudad); `idx_venues_contacto_principal` (contacto_principal_id); `idx_venues_nombre` (nombre)

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

## venue_proveedores

**Propósito:** Relación N:M entre venues y proveedores.

**Cardinalidad:** N venues — M proveedores

**Dependencias funcionales:** (venue_id, proveedor_id) clave compuesta; sin atributos dependientes.

| Columna | Tipo | Nulo | Por defecto | Clave | Descripción |
|---|---|---|---|---|---|
| `venue_id` | `varchar(40)` | NN |  | PK, FK | Venue. |
| `proveedor_id` | `varchar(40)` | NN |  | PK, FK | Proveedor. |

**Llaves foráneas:**

- `venue_id` → `venues(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)
- `proveedor_id` → `proveedores(id)` · al borrar el padre: **CASCADE** (el dependiente carece de sentido sin su padre)

**Índices:** `proveedor_id` (proveedor_id)

