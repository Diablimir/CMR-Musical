# FLAMO CRM — Registro de cambios de la base de datos

## v3 · Fase 2 — Núcleo relacional  (migración 003)
**Añadido**
- `cat_generos` + `artista_generos`: géneros atómicos (1 principal por artista, sin duplicados).
- Contactos centralizados: `contactos` (independiente), `contacto_correos`, `contacto_telefonos`, `venue_contactos`, `artista_contactos`, `proveedor_contactos`, `cat_roles_contacto`.
- `evento_artistas`: eventos con varios artistas (rol, orden, horario, honorarios, moneda, confirmación).
- `tour_artistas`: giras compartidas. `cat_monedas`.
- CHECK `utilidad = ingreso_total − gastos_totales`.
**Cambiado**
- `eventos.artista_id` y `tours.artista_id` pasan a NULL y **dejan de escribirse** (obsoletos).
- La interfaz: pestaña **Contactos**, alineación de artistas en el formulario del evento, ingreso real opcional, géneros/subgéneros en el alta de artista.
- Se dejaron de **inventar datos** al crear un artista (subgéneros «Indie/Alternative», «Flamo Booking Agency», «Flamo Management», sello/editorial/distribuidora ficticios, redes con URL supuesta).
**Migración de datos (verificada, reversible):** géneros (+subgéneros) → tablas; contactos de venue (con su principal) → `contactos` + `venue_contactos`; manager/booking → contactos con rol; contacto de proveedor → contactos; `eventos.artista_id` → `evento_artistas`; `tours.artista_id` → `tour_artistas`.
**Rollback:** `down()` reconstruye las columnas y tablas antiguas desde las nuevas.

## v2 · Fase 1 — Integridad  (migración 002)
**Añadido:** 13 grupos de restricciones CHECK (estados, tipos, rangos, fechas); columna `version` en 7 tablas (bloqueo optimista); aviso de conflicto en la interfaz.
**Cambiado:** `created_at/updated_at/deleted_at/fecha_subida` de `VARCHAR(32)` a `DATETIME(3)`; `contratos.tamano` («2.4 MB») → `tamano_bytes`; FK de `contratos` de `SET NULL` a `RESTRICT` (el historial no se pierde).
**Eliminado:** índices `idx_eventos_artista` (redundante) e `idx_artistas_deleted` (sin utilidad).
**Seguridad de la migración:** si hay datos fuera de dominio, aborta **sin cambiar nada** y lista los problemas.

## v1 · Línea base  (migración 001)
Esquema original (10 tablas) y marcador de versión. En bases ya existentes solo se registra como aplicada.

## Infraestructura
- Ejecutor de migraciones con candado, tabla `schema_migrations`, CLI (`scripts/db/migrate.php`) y endpoint de administración.
- Errores del servidor con mensajes en español y el nombre del campo/registro.
- Pruebas automatizadas: 154 comprobaciones de base de datos + prueba de interfaz de extremo a extremo.
- Documentación generada desde la base real (`generate-docs.php`).
