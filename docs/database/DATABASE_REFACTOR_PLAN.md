# FLAMO CRM — Plan de refactorización de la base de datos

> **Estado:** Fases 1 y 2 implementadas y verificadas (ver `DATABASE_ARCHITECTURE.md` y `CHANGELOG_DB.md`). Decisiones del dueño del producto: eventos con varios artistas ✔, giras compartidas ✔, ingreso del evento capturado ✔.

Basado en `DATABASE_AUDIT.md`. Estrategia: **expandir → migrar → validar → adaptar → contraer**, por fases independientes y reversibles. Producción hoy no tiene datos de negocio, pero el plan está pensado para instalaciones con datos.

## Principios
- **Contrato de API estable**: `GET /api/data.php` y `POST ?action=sync` siguen devolviendo/recibiendo los mismos objetos (`Artist`, `Event`, …). La interfaz no se reescribe de golpe; `entities.php` traduce a las tablas nuevas.
- **Rollback por regeneración** (decisión tomada al implementar): el código nuevo deja de escribir las columnas viejas y `down()` las **reconstruye** desde las tablas nuevas (probado en `tests/db/run.php` §4). Es más simple y seguro que mantener dos escrituras en paralelo.
- **Nada destructivo en producción** hasta una ventana de verificación (propuesta: 2 semanas con la doble escritura activa).
- Toda migración: **idempotente por paso**, registrada en una tabla `schema_migrations(version, aplicada_en, checksum)`.
- Antes de cada fase en producción: respaldo (`mysqldump` desde hPanel → Bases de datos → phpMyAdmin → Exportar) y exportación JSON de todas las tablas.

## Fases

### Fase 1 — Integridad sin cambiar estructura (bajo riesgo)
| Cambio | Justificación (auditoría) |
|---|---|
| `CHECK` de dominio: estados (evento, gira, contrato, proyecto), tipos de contrato, categorías de proveedor, scores 0–100, rating 0–5, latitud/longitud, capacidad/asistencia ≥ 0, `fecha_fin ≥ fecha_inicio` | Anomalías 4–7 |
| Misma validación en PHP (mensajes por campo) | MySQL antiguo ignora CHECK |
| `contratos`: FKs a `RESTRICT` + `deleted_at` en contratos, proveedores y contactos | Anomalía 8 (historial) |
| Columna `version` y bloqueo optimista en `sync` | ACID – aislamiento |
| Retirar `idx_eventos_artista` (redundante) e `idx_artistas_deleted` | §7 sobreindexación |
| `created_at/updated_at` → `DATETIME` (migración con conversión ISO → DATETIME) | §5 |
| `contratos.tamano` → `tamano_bytes INT` | §5 |
| Quitar datos inventados de `AddArtistModal` | §8.1 |
| Mensaje de error con el nombre del campo | §8.6 |

**Rollback:** script inverso (quitar CHECK/columnas añadidas; las conversiones de fecha son reversibles porque se conserva el ISO original en una columna temporal hasta la contracción).

### Fase 2 — Núcleo relacional (expansión + doble escritura)
1. **Catálogos**: `cat_generos`, `cat_roles_contacto`, `cat_monedas`.
2. **Géneros**: `artista_generos(artista_id, genero_id, es_principal, orden)`; migración: dividir `genero` por comas (1.º = principal) + `subgenres` como secundarios. `UNIQUE(artista_id, genero_id)`; un solo principal por artista.
3. **Contactos centralizados**: `contactos(id, nombre, apellidos, …)`, `contacto_telefonos`, `contacto_correos`, `venue_contactos`, `artista_contactos`, `proveedor_contactos` (cada una con `rol_id`, `es_principal`). Principal por venue sin ciclo: `UNIQUE(venue_id, es_principal)` con `es_principal ∈ {1, NULL}`. Migración: contactos actuales → `venue_contactos`; `manager`/`booking_agent` de artistas y `contacto/telefono/correo` de proveedores → contactos + puentes.
4. **Eventos con varios artistas** *(condicionado a tu decisión)*: `evento_artistas` con `UNIQUE(evento_id, artista_id, orden_presentacion)`; migración: cada `eventos.artista_id` → fila `rol='Principal'`, `orden=1`. `eventos.artista_id` se mantiene (doble escritura) hasta la Fase 4.
5. **Consistencia evento–gira–artista**: regla `artista del evento ∈ artistas de la gira` validada en transacción.

**Interfaz (Fase 2):** chips de géneros con autocompletado; directorio de **Contactos** con búsqueda y roles; en el evento, **alineación** (lista de artistas con orden/horario/honorarios) solo si se confirma la regla de negocio.

### Fase 3 — Grupos repetidos y contratos  ✅ implementada (migración 004)
- `evento_setlist`, `proyecto_canciones`, `proyecto_costos`, `proyecto_pagos`, `proyecto_etapas` (+ `proyecto_artistas`/`proyecto_colaboradores` si hay colaboraciones), `venue_horarios`, `venue_bandas_locales`, `artista_redes`, `artista_integrantes`.
- Contratos: `contrato_artistas`, `contrato_venues`, `contrato_proveedores`, `contrato_eventos` (+ `contrato_tours` solo si hay contratos de gira completa). Se retiran `artista_id/venue_id/tour_id/evento_id` por redundantes (Fase 4).
- **Interfaz:** selector de partes del contrato (varias), con autocompletado de artista/venue al elegir evento (evita incoherencias); etiqueta «archivado» para entidades desactivadas sin romper el historial.

### Fase 4 — Contracción (solo tras verificar)  ✅ implementada (migración 005)
Retirar columnas/estructuras obsoletas (`eventos.artista_id`, `artistas.genero`, `artistas.manager`, `contratos.*_id`, `venues.contacto_principal_id`, JSON migrado). Script separado, **no se ejecuta sin tu autorización explícita** y sin respaldo previo.

## Estrategia de rollback
| Nivel | Cuándo | Cómo |
|---|---|---|
| Por fase | Fallo durante la migración | Cada paso es transaccional cuando el motor lo permite; si no, es idempotente y se reanuda. Script `rollback_faseN.sql` que elimina solo lo añadido por esa fase. |
| Por versión de código | Fallo tras publicar | Re-subir los archivos de la versión anterior (el commit previo está en Git). Funciona porque la doble escritura mantiene las columnas viejas actualizadas. |
| Por datos | Corrupción | Restaurar el respaldo `mysqldump` previo a la fase. |

## Pruebas obligatorias (automatizadas, PHP CLI sobre MariaDB real)
Creación/edición/eliminación; eventos con varios artistas; artistas con varios géneros; contacto en varias entidades; historial contractual conservado al desactivar; unicidad (género duplicado, participación duplicada, segundo principal); integridad referencial; **fallos parciales** (rollback completo); **concurrencia** (mismo registro con `version`); compatibilidad con registros existentes (migración de un volcado v1); equivalencia del contrato de API (ida y vuelta de objetos); `EXPLAIN` de las consultas por índice.

## Decisiones que necesito de ti
1. ¿Un evento puede tener **varios artistas** (festivales, carteles) o siempre uno?
2. El **ingreso del evento**: ¿es siempre `asistencia × precio` (derivado, no se guarda) o se **captura aparte** (cortesías, patrocinios)?
3. ¿Hasta dónde ejecutar ahora: solo **Fase 1**, **Fases 1–2**, o todo por etapas con pausa entre cada una?
4. ¿Las giras pueden ser **compartidas** por varios artistas?

## Fuera de alcance (justificado)
Cambiar identificadores a UUID; paginación/filtros en servidor (solo necesarios cerca de ~20 mil eventos); normalizar geografía (excepción 3FN documentada).
