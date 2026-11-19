# FLAMO CRM — Seguridad y escalabilidad

> Auditoría del 19-nov-2026: revisión propia + auditoría independiente de solo lectura hecha por Codex (OpenAI), cada hallazgo verificado en el código o por una prueba antes de corregirlo. Las pruebas están en `tests/db/security-http.cjs` (38 comprobaciones por HTTP), `tests/db/run.php` (366 de base de datos) y `tests/db/ui-csp.cjs`.

## Controles que ya existían y se verificaron
| Área | Estado |
|---|---|
| Inyección SQL | Todo con consultas preparadas (PDO); los nombres de tabla/columna salen de definiciones internas, nunca del cliente |
| Contraseñas | `password_hash` (bcrypt) / `password_verify` |
| Cookie de sesión | `Secure`, `HttpOnly`, `SameSite=Lax` (comprobado en producción); el id se regenera al iniciar sesión |
| CSRF | Toda escritura exige la cabecera `X-Requested-With: flamo` |
| Tokens de Instagram | Cifrados AES-256-GCM en la base; nunca se envían al navegador |
| Archivos internos | `config.php`, `schema.php`, `entities.php`, `*_lib.php`, `migrations/` bloqueados por `.htaccess`; `install.php` ya no existe en producción |
| Datos | Todo se valida en PHP y con restricciones (CHECK, FK, UNIQUE) en la base |

## Corregido en esta auditoría
| Hallazgo | Gravedad | Corrección | Prueba |
|---|---|---|---|
| Bucle infinito en `child_id()` con una lista de ids repetidos «prediseñados» (agotaba el servidor con una sola petición) | Alta | Sufijo que siempre avanza | `run.php` §20f |
| Bloqueo global del login: 60 fallos de un anónimo dejaban fuera a todos | Alta | Límite por usuario+IP (10) y por IP (40), sin bloqueo global; el intento se cuenta antes de verificar | `security-http` |
| Consumo de cuota/servidor por integraciones (Apify, Meta, mapas, subidas) | Alta | `rate_limit()` por usuario: Apify 12, mapas 25, Meta 12, subidas 30 cada 10 min | `security-http` |
| Cuerpos enormes leídos en memoria; imágenes de miles de megapíxeles | Media | Rechazo por `Content-Length` antes de leer (2 MB; 12 MB en sincronización); máx. 36 MP; nunca se publica el archivo original | `security-http` |
| Cambiar la contraseña no cerraba las demás sesiones; sin caducidad | Media | Huella de contraseña en la sesión; caducidad a 2 h de inactividad y 12 h absolutas; modo estricto de ids de sesión | `security-http` |
| Secreto de la app de Meta y tokens en la URL | Media | Canje por POST (cuerpo); token en cabecera; URI de retorno fija en `config.php` (no se deduce de la cabecera Host) | `security-http` |
| Cualquiera podía cancelar un OAuth en curso con un `state` falso | Baja | Solo un `state` válido se consume | `security-http` |
| Roles: el servidor aceptaba cualquier texto; carrera al degradar/borrar al último Super Admin | Media | Catálogo de roles; transacción con bloqueo de filas | `security-http` |
| Enumeración de usuarios por tiempo de respuesta | Baja | Siempre se verifica contra un hash | `security-http` |
| SSRF en la resolución de enlaces de Google Maps | Media | Solo `https` puerto 443, sin credenciales, IP pública | `security-http` |
| Estado de Apify mostraba fragmentos del token | Baja | Solo «configurado sí/no» | `security-http` |
| Fechas inexistentes en el calendario | Baja | `checkdate` | `security-http` |
| Sin política de contenido (CSP) | Media | CSP estricta en `.htaccess`: scripts solo propios; probada bloqueando una inyección | `ui-csp` |
| Demografía de Meta podía quedar a medias | Baja | Transacción por dimensión | `run.php` |

## Pendiente de decisión (no se cambió sin tu confirmación)
1. **Permisos por rol.** La interfaz muestra 6 roles (Super Admin, Administrador, Director de Booking, Director de Finanzas, Gestor de Contenido, Abogado Legal CRM), pero el servidor solo distingue «Super Admin» (usuarios y migraciones) del resto: cualquier usuario con sesión puede leer y modificar todo por la API. Es aceptable si todos son personal de confianza; si no, hay que definir quién ve y edita qué.
2. **Versión obligatoria al actualizar.** Omitir `version` en una actualización evita el aviso de conflicto (compatibilidad con clientes antiguos).
3. **Migraciones desde la web.** `ensure_schema()` y `api/migrate.php` (solo Super Admin) ejecutan DDL con el mismo usuario de base de datos que la API; en hosting compartido no se puede separar sin cambiar el despliegue.
4. **`social_cron.php?token=`** acepta el token por URL si se define `cron_token`; en producción se usa por consola, sin token.

## Escalabilidad (medida con `scripts/db/bench.php`)
| Volumen | Carga completa | JSON | Comprimido (gzip) | Memoria PHP | Guardar 1 registro |
|---|---|---|---|---|---|
| 2 000 eventos | 48 ms | 1.1 MB | 0.0 MB | 14 MB | 4 ms |
| 20 000 eventos | 528 ms | 10.1 MB | 0.4 MB | 120 MB | 4 ms |

- Las **escrituras** escalan bien (sincronización por diferencias, 2–4 ms por registro) y todas las llaves foráneas tienen índice.
- La **carga inicial** trae todo: con ~20 000 eventos usa 120 MB de PHP y 10 MB de JSON (producción ya comprime y guarda en caché los archivos de la interfaz). Hacia 50 000 eventos puede acercarse al `memory_limit` del hosting. El siguiente paso es cargar solo una ventana de fechas (p. ej. últimos 24 meses + próximos) y pedir lo antiguo bajo demanda.
- `login_attempts` tiene índices (migración 009) para que los límites de uso no se degraden bajo ataque.
