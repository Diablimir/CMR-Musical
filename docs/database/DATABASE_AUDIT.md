# FLAMO CRM — Auditoría de la base de datos (Fase 0)

> Estado: **solo análisis, sin cambios al esquema ni a producción.**
> Fecha: 2026-11-19 · Motor verificado: MariaDB 10.11 (compatible con MySQL; **la versión exacta de tu hosting no está verificada**).
> Todas las cifras de este documento salen de scripts reproducibles en `scripts/audit/`.

## 1. Contexto técnico (hallazgos del repositorio)

| Aspecto | Hallazgo |
|---|---|
| Motor y acceso | MySQL/MariaDB vía **PDO** (PHP 8). No hay ORM. SQLite solo para pruebas. |
| Backend | `public/api/*.php`. Un único punto de datos: `data.php` (`GET` carga todo, `POST ?action=sync` guarda cambios por registro en **una transacción**). |
| Capa de datos | `public/api/entities.php`: traduce objeto de la interfaz ⇄ fila (columnas núcleo + columna JSON `extra`). |
| Frontend | React. Mantiene **todo el conjunto de datos en memoria** y filtra en el cliente (no hay consultas filtradas al servidor). |
| Producción hoy | **0 registros de negocio** (artistas, venues, eventos… = 0). 2 usuarios. La migración no tiene datos que perder, pero debe ser segura para instalaciones con datos. |
| Esquema actual | 10 tablas, 16 índices, FKs reales, 0 restricciones CHECK. Diagrama: `docs/diagrama-er.png`. |

Consumidores del esquema en la interfaz (conteo de usos): `artistId` 29 (9 archivos), `venueId` 34 (8), `tourId` 8 (4), `eventId` 3 (3). Cualquier cambio en esas relaciones toca ~15 componentes.

## 2. Anomalías que el esquema actual PERMITE (evidencia ejecutada)

Script: `scripts/audit/anomalies.php` (MariaDB 10.11). Resultado literal:

```
ANOMALÍA PERMITIDA  · 1. Evento del artista A dentro de la gira del artista B
ANOMALÍA PERMITIDA  · 2. Contrato ligado al evento E1 pero con otro artista y otro venue
ANOMALÍA PERMITIDA  · 3. Ingreso total que no corresponde a asistencia × precio
ANOMALÍA PERMITIDA  · 4. Puntaje de venue = 500 (el rango válido es 0–100)
ANOMALÍA PERMITIDA  · 5. Rating de venue = 9.9 (el rango válido es 0–5)
ANOMALÍA PERMITIDA  · 6. Estado de evento inventado: 'Cualquier cosa'
ANOMALÍA PERMITIDA  · 7. Gira con fecha de fin anterior al inicio
8. Historial contractual: tras borrar el venue V2, contrato K1 → venue_id = NULL
9. Consulta por género 'Pop': LIKE '%Pop%' devuelve 3 artistas (solo 1 es 'Pop' exacto)
10. Restricciones CHECK existentes en el esquema: 0
```

Lectura: la integridad **referencial** (FK) funciona, pero la integridad de **dominio** y de **consistencia entre tablas** no existe.

## 3. Dependencias funcionales y formas normales (por tabla)

Notación: `X → Y` = X determina Y. «PK» = llave primaria `id`.

| Tabla | Dependencias relevantes | 1FN | 2FN | 3FN | BCNF | Veredicto |
|---|---|---|---|---|---|---|
| `artistas` | `genero` almacena listas («Indie Rock, Pop»); `extra` JSON con listas/objetos (`subgenres`, `languages`, `members`, `memberHistory`, `socialMedia`, `pipeline`, `history`); `ciudad → estado → pais`; `manager`/`booking_agent` son texto repetido que en realidad son personas | ✗ | ✓ | ✗ | ✗ | Viola 1FN (grupos repetidos) y 3FN (dependencia transitiva geográfica) |
| `venues` | `ciudad → estado → pais`; `codigo_postal → ciudad, estado`; `extra` JSON: `hours[]`, `localBands[]`, redes; ciclo con `contactos` | ✗ | ✓ | ✗ | ✗ | 1FN por JSON; 3FN por geografía |
| `contactos` | Un solo teléfono y un solo correo; `rol` texto libre repetido; pertenece a **un** venue | ✓ | ✓ | ✓ | ✓ | Normal pero **demasiado rígida**: no modela personas compartidas ni varios medios de contacto |
| `proveedores` | `contacto, telefono, correo` son una persona embebida | ✓ | ✓ | ✗ (entidad persona embebida) | — | Mezcla entidades |
| `tours` | `artista_id` único | ✓ | ✓ | ✓ | ✓ | Normal; **no cubre giras multi-artista** |
| `eventos` | `(asistencia, precio_boleto) → ingreso_total`; `(ingreso_total, gastos_totales) → utilidad`; `tour_id → tours.artista_id` vs `eventos.artista_id` (sin restricción); `extra`: `setlist[]`, `guestBands[]`, `feedback{}` | ✗ | ✓ | ✗ | ✗ | Columnas **derivadas almacenadas** (puede divergir, anomalía 3); JSON con grupos repetidos |
| `contratos` | `evento_id → artista_id, venue_id, tour_id` (el evento ya los determina) | ✓ | ✓ | ✗ | ✗ | Redundancia transitiva (anomalía 2); `tamano` guarda «1 MB» (valor+unidad) |
| `proyectos_grabacion` | `extra` JSON: `songs[]`, `costs[]`, `payments[]`, `stages[]` (con instrumentos) | ✗ | ✓ | ✓ | ✓ | Grupos repetidos con **importes** (se suman y consultan) dentro de JSON |
| `venue_proveedores`, `cat_etapas_desarrollo`, `users` | llave compuesta / catálogo | ✓ | ✓ | ✓ | ✓ | Correctas |

**Excepciones que propongo justificar (no normalizar):**
- Geografía (`ciudad/estado/pais/codigo_postal`) en artistas y venues: es una **dirección postal como valor** (viene de Google/OSM), no hay catálogo gobernado y los nombres de ciudad son ambiguos. Normalizarla exigiría un catálogo de lugares con identificadores externos. Se documenta como excepción 3FN.
- Contenido de perfil en JSON (`bio`, `photoStyle`, `pipeline`, `history`, `languages`) **mientras no se consulte ni relacione** individualmente. Criterio de promoción: en cuanto se filtre o agregue por esos datos, pasa a tabla.

> No declaro BCNF/3FN cumplidas: hoy **no se cumplen** en 6 de 10 tablas (ver columna Veredicto). La verificación de FDs es analítica (no se puede probar con pruebas automáticas); lo que sí se automatiza son las consultas de detección de anomalías (sección 2).

## 4. Integridad referencial

| Relación | Regla actual | Problema |
|---|---|---|
| `contratos.venue_id/artista_id/tour_id/evento_id` | `SET NULL` | **Pierde el historial contractual** en silencio (anomalía 8). Debe ser `RESTRICT` + borrado lógico |
| `eventos.tour_id` | `SET NULL` | Correcto (evento puede existir sin gira) |
| `contactos.venue_id` | `CASCADE` | Correcto mientras el contacto sea de un solo venue; deja de serlo al centralizar |
| `venues.contacto_principal_id` ⇄ `contactos.venue_id` | ciclo | Obliga a `ALTER` y a un paso extra de «fix-up» en PHP; no garantiza que el principal pertenezca al venue |
| `eventos.artista_id/venue_id` | `RESTRICT` | Correcto (protege historial) |
| `tours.artista_id` | `RESTRICT` | Correcto |

## 5. Tipos de dato

| Hallazgo | Detalle |
|---|---|
| ✓ | `DECIMAL` para dinero; `DATE` para fechas; `INT` para cantidades. |
| ✗ | `created_at/updated_at/deleted_at` son `VARCHAR(32)` (no `DATETIME/TIMESTAMP`): no permiten aritmética de fechas ni validación del motor. Se guardó el texto ISO que genera la interfaz. |
| ✗ | Sin `BOOLEAN` donde aplica (p. ej. `completed`, `active`, `connected` viven dentro de JSON). |
| ✗ | Sin `CHECK` en rangos: scores 0–100, rating 0–5, latitud/longitud, capacidad ≥ 0. |
| ✗ | `contratos.tamano` = «1 MB» (texto compuesto). Debe ser `INT` de bytes. |
| ℹ | Identificadores `VARCHAR(40)` generados por la interfaz (`ven-1731…`). **No recomiendo cambiarlos** (ver §9). |

## 6. Propiedades ACID

| Propiedad | Estado | Evidencia |
|---|---|---|
| Atomicidad | ✓ Una petición `sync` = una transacción; ante error hay `ROLLBACK` | Prueba previa: un evento inválido revierte todo el lote (`eventos siguen siendo: 2`). |
| Consistencia | ◐ FKs ✓; dominio y reglas cruzadas ✗ | Sección 2. |
| Aislamiento | ◐ InnoDB `REPEATABLE READ` por defecto; **actualización perdida posible en el mismo registro** (gana el último guardado; la interfaz envía el objeto completo) | Dos usuarios sobre registros distintos: verificado sin pérdida. Mismo registro: sin control de versión. |
| Durabilidad | ? InnoDB confirma en disco por defecto; **no verificable** en Hostinger desde aquí | Sin acceso a `innodb_flush_log_at_trx_commit` del servidor. |
| DDL | ⚠ En MySQL el DDL no es transaccional (`ensure_schema` puede quedar a medias) | Mitigado con `IF NOT EXISTS` y marcador de versión; las migraciones deben ser idempotentes por paso. |

## 7. Rendimiento (medido)

Datos sintéticos: 300 artistas, 1 000 venues, **30 000 eventos**. Scripts: `scale.php`, `explain.php`.

**Carga completa (lo que hace hoy la interfaz al abrir):**
`GET /api/data.php` → **0.30 s · 11.0 MB de JSON · 158 MB de memoria PHP.`
Riesgo: con el `memory_limit` típico de hosting compartido (frecuentemente 128–256 MB; **verificar con `phpinfo`**) el límite práctico está en torno a **20–25 mil eventos**. Para un CRM de management (cientos de eventos al año) no es urgente, pero es el techo real de la arquitectura actual.

**EXPLAIN:**

| Consulta | Plan | Conclusión |
|---|---|---|
| Eventos de un artista | `ref idx_eventos_artista` (~100 filas) | OK, pero ver redundancia abajo |
| Eventos de un venue | `ref idx_eventos_venue` (~30) | OK |
| Eventos de un mes | `range idx_eventos_fecha` (~930) | OK |
| Eventos de un artista en un año | `range idx_eventos_artista_fecha` (~40) | OK |
| Eventos por estado | `ALL` (28 071 filas) | `estado` tiene 3 valores → un índice no ayudaría (selectividad 0.01 %) |
| Artista por prefijo / contenido | `ALL` (300 filas) | Con 300 filas el optimizador prefiere escanear |
| Venues por ciudad | `ALL` | `idx_venues_ciudad` no se usa (3 ciudades) |

**Sobreindexación detectada:**
- `idx_eventos_artista` es **redundante** con `idx_eventos_artista_fecha` (prefijo izquierdo).
- `idx_artistas_deleted`: 0 valores distintos (todo NULL) → no aporta.
- `idx_venues_ciudad`: no se usa con baja cardinalidad; mantener solo si aparecen consultas por ciudad a gran escala.
- Índices que **sí** se justifican: FKs (`artista_id`, `venue_id`, `tour_id`, `evento_id`), `eventos(fecha)` y `eventos(artista_id, fecha)`.

## 8. Hallazgos de la interfaz (relevantes para la base)

1. **Datos inventados al crear un artista** (`AddArtistModal.tsx`): `subgenres: ['Indie','Alternative']`, `bookingAgent: 'Flamo Booking Agency'`, `manager` por defecto `'Flamo Management'`, `genre` por defecto `'Alternativo'`. Contaminan la base con datos que nadie capturó.
2. **Género como texto libre** («Ej. Indie Rock, Pop, Urbano»): invita a guardar listas separadas por comas.
3. **Contactos solo dentro del venue** (`VenueDrawer`): no hay directorio, ni contactos de artistas/proveedores.
4. **Contratos**: el formulario deja elegir artista, venue y evento de forma independiente (permite combinaciones incoherentes, anomalía 2).
5. **Ingreso/utilidad del evento** se calculan en el cliente al crear (`asistencia × precio`) y se guardan: es el origen de la columna derivada.
6. Los errores del servidor ya se muestran (aviso rojo), pero **sin indicar el campo**.

## 9. Evaluación de la propuesta de refactorización

| Propuesta | Veredicto | Razón (con evidencia) |
|---|---|---|
| `cat_generos` + `artista_generos` | **Hacer** | Anomalía 9 (falsos positivos) y 1FN. Cambio de comportamiento: `genre` pasa a «principal» y el resto a subgéneros. |
| Contactos centralizados + teléfonos/correos + tablas puente + principal sin ciclo | **Hacer** | Elimina el ciclo; modela personas compartidas; cubre managers/proveedores. Restricción de «un principal por venue» con `UNIQUE(venue_id, es_principal)` (columna `NULL` = no principal). |
| `evento_artistas` | **Hacer, condicionado** | Solo tiene sentido si hay carteles/festivales. Hoy la interfaz admite **un** artista por evento. Se implementa con artista «Principal» por defecto para no romper la interfaz. **Requiere tu decisión.** |
| `tour_artistas` | **Condicionado** | Solo si hay giras compartidas. Sin ella se necesita una regla `evento.artista ∈ tour.artistas`. |
| `contrato_*` (5 tablas) | **Parcial** | Evento/gira son el **objeto** del contrato, no partes. Justificadas: `contrato_artistas`, `contrato_venues`, `contrato_proveedores` (partes) y `contrato_eventos` (objeto, N:M). `contrato_tours` solo si un contrato cubre una gira completa. Las columnas `artista_id/venue_id/tour_id/evento_id` actuales desaparecen (redundantes). |
| 8 catálogos `cat_estados_*`, `cat_tipos_*`, `cat_categorias_*` | **Reducir** | Los dominios son listas **cerradas** definidas en el código y sin pantalla de administración. `CHECK` + validación en PHP es suficiente. Catálogo solo para dominios **abiertos**: `cat_generos`, `cat_roles_contacto`, `cat_monedas` (+ `cat_etapas_desarrollo` ya existente). Salvedad: MySQL < 8.0.16 ignora `CHECK` (MariaDB ≥ 10.2 lo aplica) → se refuerza en PHP. |
| `proyecto_canciones`/`proyecto_artistas`/`proyecto_colaboradores` | **Ampliar** | Además: `proyecto_costos` y `proyecto_pagos`, porque son importes que se suman (no deben vivir en JSON). Colaboradores solo si hay participantes con rol. |
| `evento_setlist` | **Hacer** (no pedido) | El setlist es una lista ordenada de filas con identidad propia. |
| UUID nativo | **No ahora** | Cambiar ids obliga a reescribir todas las FKs y referencias del frontend; el beneficio no se justifica a esta escala. MariaDB ≥ 10.7 tiene tipo `UUID`; MySQL no. |
| `deleted_at` | **Extender** | Añadir a contratos, proveedores y contactos para conservar historial. |
| Control de concurrencia | **Hacer** | Columna `version` + bloqueo optimista (409 si cambió). |

## 10. Riesgos principales
1. Reescribir `entities.php` y 15 componentes a la vez: **alto**. Mitigación: contrato de API estable (mismos objetos) + doble escritura durante la transición.
2. Heurísticas de migración (separar nombre/apellidos; deduplicar contactos por nombre; separar géneros por comas): **pueden equivocarse**. Se documentan y son reversibles.
3. `CHECK` ignorado por MySQL antiguo: se mitiga con validación en PHP.
4. Fusionar contactos por nombre puede unir homónimos: solo se fusionan los de `manager`/`booking_agent` con coincidencia exacta.

Ver el plan en `DATABASE_REFACTOR_PLAN.md`.
