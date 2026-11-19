# FLAMO CRM — Registro de cambios de la base de datos

## v10 · Cambios pendientes de aprobación  (migración 010)
**Añadido:** `cambios_pendientes`: cola de aprobación. Quien no es Super Admin puede crear y editar, pero su cambio NO se aplica: queda como propuesta (JSON del registro + versión base) hasta que el Super Admin la aprueba (se aplica con las mismas validaciones y el mismo control de versiones) o la rechaza con motivo. Solo el Super Admin elimina. La tabla es también la bitácora (quién propuso, quién resolvió, cuándo y por qué; se conserva 180 días) y no tiene llave foránea a `users` para que el historial sobreviva si se borra la cuenta. **Rollback:** elimina la tabla (las propuestas pendientes se pierden; los datos ya aprobados no cambian).

## v9 · Índice de intentos  (migración 009)
**Añadido:** índices `(ident, ts)` y `(ts)` en `login_attempts`, la tabla que cuenta los intentos de acceso y el uso de integraciones costosas (límites de uso). Sin ellos, bajo un ataque la cuenta por `ident` recorrería toda la tabla. Si la tabla no existe (instalación solo por migraciones) no hace nada. **Rollback:** quita los dos índices.

## v8 · Conexión oficial con Instagram  (migración 008)
**Añadido:** `artista_conexiones` (cuenta conectada por OAuth; token **cifrado** con AES-256-GCM, nunca enviado al navegador), `artista_alcance` (alcance diario), `artista_demografia` (edad, género, ciudad, país por fecha) y `artista_publicaciones` (me gusta, comentarios, alcance, guardados, compartidos, interacciones). La fuente `meta` es válida en `artista_metricas_redes`.
**Rollback:** `down()` elimina las 4 tablas y deja las capturas con fuente `meta` marcadas como `manual` (no se pierden, pierden su origen). Los tokens guardados se pierden: habría que volver a conectar.

## v7 · Historial de redes y acciones  (migración 007)
**Añadido:** `artista_metricas_redes` (una captura por artista + red + día: seguidores, siguiendo, publicaciones, interacción, fuente `manual`/`apify`) y `artista_acciones` (lanzamiento, campaña, publicación, colaboración, prensa, gira, otro). Los shows se toman de `eventos` (no se duplican). Con ambas la interfaz mide el cambio de seguidores después de cada acción.
**Quitado (sin migración):** el «modo demostración» de `api/apify.php` y los valores por defecto inventados (50 000 seguidores, 5.2 % de interacción…). Si Apify no devuelve datos reales, se responde un error y NO se guarda nada.
**Rollback:** `down()` elimina solo estas dos tablas (el historial capturado después de aplicarla se pierde al revertir).

## v6 · Notas del venue  (migración 006)
**Añadido:** `venue_notas` (venue_id, nota_id, fecha, texto, autor, evento_id): notas de seguimiento de un recinto, p. ej. cómo salió el show. CASCADE al borrar el venue; SET NULL al borrar el evento (la nota se conserva); CHECK de texto no vacío.
**Antes de esto (sin migración):** las métricas del venue admiten `NULL` = «No aplica» (NP): no cuentan en el Flamo Score y los pesos restantes se reajustan.
**Rollback:** `down()` elimina solo `venue_notas` (las notas escritas después de aplicarla se pierden al revertir; el resto no cambia).

## v5 · Fase 4 — Contracción  (migración 005)
**Eliminado** (tras verificar que el reemplazo está completo; si no, aborta sin cambiar nada): `artistas.genero/manager/booking_agent/extra`, `venues.contacto_principal_id/extra`, `proveedores.contacto/telefono/correo`, `tours.artista_id`, `eventos.artista_id/extra`, `contratos.artista_id/venue_id/tour_id/evento_id`, `proyectos_grabacion.extra`, y las tablas `contactos_legacy`, `collections`, `schema_meta`.
**Rollback:** `down()` recrea las estructuras (vacías); al seguir revirtiendo (004, 003) se reconstruyen desde las tablas nuevas, incluso los datos creados después de contraer (verificado en pruebas §21).
**Orden:** la importación del formato JSON más antiguo se ejecuta *antes* de contraer.

## v4 · Fase 3 — Grupos repetidos y contratos  (migración 004)
**Añadido:** `artista_redes/idiomas/integrantes/pipeline/hitos`, `venue_horarios/bandas_locales`, `evento_setlist/bandas_invitadas`, `proyecto_canciones/costos/pagos/etapas/instrumentos`, `contrato_artistas/venues/proveedores/eventos/tours`; columnas para bio, sello, ficha de venue y feedback del evento.
**Cambiado:** los contratos admiten varias partes; duraciones a segundos (sumables); costos y pagos se suman en SQL. Interfaz: selección múltiple de artistas/venues en contratos; se dejaron de inventar integrantes/fechas por defecto.
**Migración de datos:** verificada con datos de prueba ricos (conteos en `schema_migrations.notas`) y reversible.

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
- Pruebas automatizadas: 265 comprobaciones de base de datos + prueba de interfaz de extremo a extremo.
- Documentación generada desde la base real (`generate-docs.php`).
