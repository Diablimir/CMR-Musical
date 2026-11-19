# FLAMO CRM — Arquitectura de la base de datos (esquema v3)

> Estado: **Fases 1 y 2 implementadas, probadas y verificadas.** Fases 3 y 4 pendientes (ver §9).
> Documentos relacionados: `DATABASE_AUDIT.md` (hallazgos y evidencia previa), `DATABASE_REFACTOR_PLAN.md` (plan por fases),
> `DATA_DICTIONARY.md` (tablas y columnas), `schema.sql` (DDL), `CHANGELOG_DB.md` (registro de cambios).

## 1. Stack
MySQL/MariaDB (InnoDB, utf8mb4) vía PDO desde PHP 8 (`public/api`). Sin ORM. React como cliente.
Migraciones: `public/api/migrations/NNN_*.php` (cada una con `up()` y `down()`), ejecutor en `public/api/schema.php`,
CLI en `scripts/db/migrate.php`, endpoint de administración `api/migrate.php` (solo Super Admin).
**Probado únicamente en MariaDB 10.11.** La versión del MySQL de tu hosting no está verificada (ver §8).

## 2. Diagrama entidad-relación (Mermaid)

```mermaid
erDiagram
    cat_etapas_desarrollo ||--o{ artistas : "etapa_id (RESTRICT)"
    cat_roles_contacto ||--o{ artista_contactos : "rol_id (RESTRICT)"
    artistas ||--o{ artista_contactos : "artista_id (CASCADE)"
    contactos ||--o{ artista_contactos : "contacto_id (CASCADE)"
    artistas ||--o{ artista_generos : "artista_id (CASCADE)"
    cat_generos ||--o{ artista_generos : "genero_id (RESTRICT)"
    contactos ||--o{ contacto_correos : "contacto_id (CASCADE)"
    contactos ||--o{ contacto_telefonos : "contacto_id (CASCADE)"
    tours |o--o{ contratos : "tour_id (RESTRICT)"
    eventos |o--o{ contratos : "evento_id (RESTRICT)"
    venues |o--o{ contratos : "venue_id (RESTRICT)"
    artistas |o--o{ contratos : "artista_id (RESTRICT)"
    venues ||--o{ eventos : "venue_id (RESTRICT)"
    tours |o--o{ eventos : "tour_id (SET NULL)"
    artistas ||--o{ evento_artistas : "artista_id (RESTRICT)"
    cat_monedas ||--o{ evento_artistas : "moneda (RESTRICT)"
    eventos ||--o{ evento_artistas : "evento_id (CASCADE)"
    contactos ||--o{ proveedor_contactos : "contacto_id (CASCADE)"
    cat_roles_contacto ||--o{ proveedor_contactos : "rol_id (RESTRICT)"
    proveedores ||--o{ proveedor_contactos : "proveedor_id (CASCADE)"
    artistas |o--o{ proyectos_grabacion : "artista_id (SET NULL)"
    artistas ||--o{ tour_artistas : "artista_id (RESTRICT)"
    tours ||--o{ tour_artistas : "tour_id (CASCADE)"
    venues ||--o{ venue_contactos : "venue_id (CASCADE)"
    contactos ||--o{ venue_contactos : "contacto_id (CASCADE)"
    cat_roles_contacto ||--o{ venue_contactos : "rol_id (RESTRICT)"
    venues ||--o{ venue_proveedores : "venue_id (CASCADE)"
    proveedores ||--o{ venue_proveedores : "proveedor_id (CASCADE)"
    artistas {
        varchar id PK
        varchar nombre_artistico
        varchar nombre_legal
        tinyint etapa_id FK
        varchar isrc_default
        varchar iswc_default
        varchar sociedad_gestion
        varchar rfc
        varchar ciudad
        varchar estado
        varchar pais
        text foto
    }
    artista_contactos {
        varchar artista_id PK,FK
        varchar contacto_id PK,FK
        smallint_unsigned rol_id PK,FK
        tinyint es_principal
    }
    artista_generos {
        varchar artista_id PK,FK
        smallint_unsigned genero_id PK,FK
        tinyint es_principal
        tinyint_unsigned orden
    }
    cat_etapas_desarrollo {
        tinyint id PK
        varchar nombre
    }
    cat_generos {
        smallint_unsigned id PK
        varchar nombre
        varchar descripcion
    }
    cat_monedas {
        char codigo PK
        varchar nombre
    }
    cat_roles_contacto {
        smallint_unsigned id PK
        varchar nombre
    }
    contactos {
        varchar id PK
        varchar nombre
        varchar apellidos
    }
    contacto_correos {
        bigint_unsigned id PK
        varchar contacto_id FK
        varchar correo
        varchar etiqueta
        tinyint es_principal
    }
    contacto_telefonos {
        bigint_unsigned id PK
        varchar contacto_id FK
        varchar telefono
        varchar etiqueta
        tinyint es_principal
    }
    contratos {
        varchar id PK
        varchar titulo
        varchar artista_id FK
        varchar venue_id FK
        varchar tour_id FK
        varchar evento_id FK
        varchar tipo
        varchar estado
        varchar nombre_archivo
        text notas
        datetime fecha_subida
        bigint tamano_bytes
    }
    eventos {
        varchar id PK
        varchar nombre
        varchar venue_id FK
        varchar tour_id FK
        date fecha
        varchar estado
        int capacidad
        int asistencia
        decimal precio_boleto
        decimal ingreso_total
        decimal gastos_totales
        decimal utilidad
    }
    evento_artistas {
        bigint_unsigned id PK
        varchar evento_id FK
        varchar artista_id FK
        varchar rol
        tinyint es_principal
        smallint_unsigned orden_presentacion
        time hora_inicio
        time hora_fin
        decimal honorarios
        char moneda FK
        varchar estado_confirmacion
    }
    proveedores {
        varchar id PK
        varchar nombre
        varchar categoria
        decimal rating
        decimal costo_por_show
        text notas
    }
    proveedor_contactos {
        varchar proveedor_id PK,FK
        varchar contacto_id PK,FK
        smallint_unsigned rol_id PK,FK
        tinyint es_principal
    }
    proyectos_grabacion {
        varchar id PK
        varchar titulo
        varchar artista_id FK
        varchar estado
        date fecha_lanzamiento
        varchar estudio
        varchar productor
    }
    schema_meta {
        int id PK
    }
    tours {
        varchar id PK
        varchar nombre
        date fecha_inicio
        date fecha_fin
        varchar status
    }
    tour_artistas {
        varchar tour_id PK,FK
        varchar artista_id PK,FK
        tinyint es_principal
    }
    venues {
        varchar id PK
        varchar nombre
        text direccion
        varchar ciudad
        varchar estado
        varchar pais
        varchar codigo_postal
        decimal latitud
        decimal longitud
        decimal rating
        smallint score_rentabilidad
        smallint score_respuesta
        smallint score_puntualidad_pago
        smallint score_negociacion
        smallint score_produccion
        smallint score_hospitalidad
    }
    venue_contactos {
        varchar venue_id PK,FK
        varchar contacto_id PK,FK
        smallint_unsigned rol_id PK,FK
        tinyint es_principal
    }
    venue_proveedores {
        varchar venue_id PK,FK
        varchar proveedor_id PK,FK
    }
```

Versión gráfica: `docs/diagrama-er.png` / `.svg` (se regenera con `python3 scripts/make-er-diagram.py`).

## 3. Decisiones de diseño

| Decisión | Motivo | Evidencia |
|---|---|---|
| Identificadores `VARCHAR(40)` generados por la aplicación (no UUID binario) | Cambiar ids obliga a reescribir todas las referencias del cliente; sin beneficio medible a esta escala | Auditoría §9 |
| «Uno principal» con `es_principal ∈ {1, NULL}` + `UNIQUE(padre, es_principal)` | Los `NULL` no colisionan en un UNIQUE, así que garantiza **un solo** principal sin triggers ni columnas generadas (compatible con cualquier versión) | Pruebas §10 |
| Contacto principal del venue en `venue_contactos` | Elimina el ciclo `venues ⇄ contactos`; el principal **debe** estar vinculado al venue (la marca vive en el vínculo) | Prueba §9 |
| Un contacto = una persona; correos y teléfonos en tablas propias | 1FN: un contacto puede tener varios medios; vínculos con venues, artistas y proveedores sin duplicar la persona | Pruebas §9 |
| `evento_artistas` con `UNIQUE(evento_id, artista_id, orden_presentacion)` | Impide participaciones duplicadas pero permite que un artista se presente varias veces en un evento | Pruebas §8 y §10 |
| `ingreso_total` capturado; `utilidad` calculada y protegida por `CHECK (utilidad = ingreso_total − gastos_totales)` | Cortesías y patrocinios hacen que el ingreso real difiera de asistencia × precio; el CHECK impide que la utilidad se desajuste | Prueba §8 y §11 |
| Dominios cerrados con `CHECK` + validación en PHP (no tablas `cat_estados_*`) | Son listas fijas del código, sin pantalla de administración; un catálogo no aporta | Auditoría §9 |
| Catálogos solo para dominios **abiertos**: géneros, roles de contacto, monedas, etapas | Crecen con el uso (se crean al vuelo, sin duplicados por mayúsculas) | Pruebas §2 |
| `RESTRICT` en contratos, eventos y artistas; `CASCADE` solo en dependientes sin sentido propio | Protege el historial contractual y financiero | Pruebas §12 |
| Columna `version` y bloqueo optimista | Evita que una persona pise el cambio de otra sobre el mismo registro | Pruebas §14 |
| Fechas de auditoría `DATETIME(3)` (UTC) | Permiten aritmética y validación del motor | Migración 002 |
| Columnas antiguas conservadas (marcadas OBSOLETO) hasta la Fase 4 | Permite revertir sin perder datos (patrón expandir–migrar–contraer) | Pruebas §4 |

## 4. Formas normales: estado real

«✓» cumple con evidencia; «excepción» = no cumple y está justificado; «pendiente» = se corrige en Fase 3.

| Tabla(s) | 1FN | 2FN | 3FN | BCNF | Nota |
|---|---|---|---|---|---|
| `contactos`, `contacto_correos`, `contacto_telefonos` | ✓ | ✓ | ✓ | ✓ | Todo determinante es llave candidata (UNIQUE verificados) |
| `venue_contactos`, `artista_contactos`, `proveedor_contactos`, `venue_proveedores` | ✓ | ✓ | ✓ | ✓ | Tablas puente con atributos que dependen de la llave completa |
| `artista_generos`, `tour_artistas`, `evento_artistas` | ✓ | ✓ | ✓ | ✓ | |
| `cat_*` | ✓ | ✓ | ✓ | ✓ | |
| `artistas` | excepción | ✓ | excepción | — | `extra` JSON (bio, redes, pipeline, historial, integrantes): contenido de perfil que no se consulta ni relaciona; **promover a tabla en cuanto se filtre por él**. `ciudad → estado → pais`: dirección postal como valor (sin catálogo gobernado) |
| `venues` | excepción | ✓ | excepción | — | `extra` JSON (horarios, redes, bandas locales); misma excepción geográfica; `codigo_postal → ciudad` |
| `eventos` | pendiente | ✓ | excepción | — | `utilidad` es derivada pero **no puede desajustarse** (CHECK); `extra` con setlist/bandas invitadas (Fase 3) |
| `contratos` | ✓ | ✓ | pendiente | pendiente | `evento_id` determina artista/venue/gira (redundancia transitiva): pasa a tablas de partes en Fase 3 |
| `proyectos_grabacion` | pendiente | ✓ | ✓ | ✓ | canciones, costos, pagos y etapas en JSON: Fase 3 |
| `proveedores`, `tours` | ✓ | ✓ | ✓ | ✓ | |

**Qué prueban (y qué no) las pruebas automatizadas:** verifican las **restricciones** que materializan las dependencias (unicidad, llaves, CHECK) y la ausencia de anomalías concretas. La demostración formal de 3FN/BCNF es un análisis de dependencias funcionales (documentado por tabla en `DATA_DICTIONARY.md`), no algo que una prueba pueda demostrar por sí sola.

## 5. Integridad referencial

| Relación | Regla | Por qué |
|---|---|---|
| `evento_artistas → eventos` | CASCADE | La alineación no existe sin su evento |
| `evento_artistas → artistas` | RESTRICT | No se pierde el historial de quién tocó |
| `tour_artistas → tours` / `→ artistas` | CASCADE / RESTRICT | Ídem |
| `contacto_* → contactos`, `*_contactos → entidad` | CASCADE | Un vínculo no tiene sentido sin sus extremos (la persona **no** se borra al borrar un venue) |
| `*_contactos → cat_roles_contacto`, `artista_generos → cat_generos` | RESTRICT | No se borran catálogos en uso |
| `eventos → venues` | RESTRICT | Protege el historial financiero |
| `eventos → tours` | SET NULL | Un evento puede existir sin gira |
| `contratos → artistas/venues/tours/eventos` | RESTRICT | **El historial contractual no se pierde** (antes era SET NULL silencioso) |
| `proyectos_grabacion → artistas` | SET NULL | Pendiente de revisión en Fase 3 |

Reglas entre tablas que el motor no puede expresar con FK (se validan en PHP **dentro de la transacción**): los artistas de un evento deben pertenecer a su gira; no se puede quitar de una gira a un artista que tiene eventos en ella.

## 6. ACID

| Propiedad | Mecanismo | Verificado en |
|---|---|---|
| Atomicidad | Cada `sync` es **una** transacción; ante cualquier error, `ROLLBACK` completo | Pruebas §13 (lote con un registro inválido; fallo a mitad de una alineación; violación de FK) |
| Consistencia | FK, UNIQUE, CHECK + validación PHP con mensajes por campo | Pruebas §10–§12 |
| Aislamiento | InnoDB `REPEATABLE READ`; `SELECT … FOR UPDATE` por fila + comparación de `version` | Pruebas §14: una escritura espera al bloqueo y expira con error 1205; la segunda persona recibe conflicto |
| Durabilidad | `COMMIT` de InnoDB; lo confirmado lo ve otra conexión | Prueba §13. **No verificable** la configuración de flush del servidor de Hostinger |
| DDL | No transaccional en MySQL → migraciones **idempotentes por paso**, candado `GET_LOCK` y comprobación previa | Pruebas §3 y §5 |

## 7. Índices (justificados con EXPLAIN, 20 000 eventos)
Toda FK tiene índice (prueba automática); no hay índices redundantes (prueba automática). Se retiraron `idx_eventos_artista` (prefijo de otro) e `idx_artistas_deleted` (sin valores distintos).
`eventos(fecha)` y `eventos(venue_id)` se usan para rangos y venues; «eventos de un artista» usa `evento_artistas(artista_id, evento_id)`. No se indexó `estado` (3 valores → selectividad 0.01 %). Detalle en `DATABASE_AUDIT.md` §7 y pruebas §15–§16.

## 8. Riesgos y límites conocidos
- **CHECK**: MariaDB ≥ 10.2 y MySQL ≥ 8.0.16 los aplican; MySQL 5.7 los **ignora** en silencio. Por eso las mismas reglas se validan en PHP.
- La versión del motor de tu hosting no está verificada; la primera carga tras publicar ejecuta las migraciones y, si el motor no soporta algo, la aplicación muestra un error y la migración se puede repetir o revertir.
- Heurísticas de migración (documentadas, reversibles): géneros separados por coma (el 1.º = principal); mismo manager = mismo nombre sin distinguir mayúsculas; roles unificados sin distinguir mayúsculas; el nombre completo de los contactos antiguos queda en `nombre` (no se adivinan apellidos).
- La API de la interfaz **no cambia de forma** (solo se añaden campos opcionales); la carga sigue trayendo todo el conjunto (límite práctico ~20–25 mil eventos, ver auditoría §7).
- No existe pantalla para crear giras: `tour_artistas` está listo y probado a nivel de datos/API, pero la interfaz aún no ofrece giras compartidas.

## 9. Pendiente
**Fase 3:** contratos con partes (`contrato_artistas/venues/proveedores/eventos`), `evento_setlist`, `proyecto_canciones/costos/pagos/etapas`, horarios y bandas locales de venues, redes e integrantes de artistas.
**Fase 4 (contracción, solo con tu autorización y respaldo):** eliminar columnas/tablas OBSOLETO (`contactos_legacy`, `eventos.artista_id`, `artistas.genero/manager/booking_agent`, `venues.contacto_principal_id`, `proveedores.contacto/telefono/correo`, `tours.artista_id`).

## 10. Operación

**Aplicar** (automático): la primera petición con sesión tras publicar ejecuta las migraciones pendientes (con candado). También: `php scripts/db/migrate.php up`.

**Revertir** (haz un respaldo antes: hPanel → Bases de datos → phpMyAdmin → Exportar):
```bash
php scripts/db/migrate.php down 1     # vuelve al esquema original v1 (reconstruye las columnas antiguas desde las tablas nuevas)
```
o, como Super Admin: `POST /api/migrate.php?action=down&to=1&confirm=yes`. Después se vuelve a subir el código anterior.
Pérdidas posibles al revertir (documentadas): contactos sin venue, correos/teléfonos adicionales, vínculos a más de un venue y la alineación completa (solo se conserva el artista principal).

**Regenerar documentación y SQL:** `php scripts/db/generate-docs.php` (base de pruebas) y `python3 scripts/make-er-diagram.py`.
**Pruebas:** `php tests/db/run.php` (154 comprobaciones) y `node tests/db/ui-relational.js` (interfaz de extremo a extremo).
