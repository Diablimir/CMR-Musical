# Despliegue en Hostinger (plan Premium: PHP + MySQL)

## 1. Crear la base de datos
hPanel → **Bases de datos → Administración de MySQL** → crea una base, un usuario y una contraseña. Anota los tres datos.

## 2. Compilar
```bash
npm install
npx vite build
```
Se genera `dist/` (interfaz + carpeta `api/` con el PHP).

## 3. Subir
Sube **todo el contenido de `dist/`** a `public_html/` (Administrador de archivos de hPanel).

## 4. Configurar
En `public_html/api/` copia `config.sample.php` como `config.php` y edita:
- `db_dsn`, `db_user`, `db_pass` con los datos del paso 1 (en Hostinger el host es `localhost`)
- `install_token`: una cadena larga y aleatoria
- `admin_initial_password`: la clave inicial del usuario `admin` (mínimo 8 caracteres)

## 5. Instalar (una sola vez)
Abre `https://TU-DOMINIO/api/install.php?token=TU_TOKEN`. Debe responder `ok`.
**Después borra `api/install.php` del servidor.**

## 6. Entrar
Abre tu dominio e inicia sesión con `admin` y la clave que pusiste. Crea los demás usuarios en la pestaña **Usuarios**.

## Base de datos relacional y migraciones
- Sube también la carpeta `api/migrations/`. La **primera carga con sesión** tras publicar aplica las migraciones pendientes (con candado); no hace falta tocar phpMyAdmin.
- Antes de actualizar una base con datos reales, haz un respaldo (hPanel → Bases de datos → phpMyAdmin → Exportar).
- Revertir: `php scripts/db/migrate.php down 1` (por SSH) o, como Super Admin, `POST /api/migrate.php?action=down&to=1&confirm=yes`; luego vuelve a subir el código anterior. Detalle en `docs/database/DATABASE_ARCHITECTURE.md` §10.

## Notas
- Los datos viven en tablas MySQL relacionales (ver `docs/database/`); las contraseñas se guardan cifradas (`password_hash`).
- Cada registro lleva una versión: si dos personas editan **el mismo** registro, la segunda recibe un aviso en lugar de pisar el cambio de la primera.
- Apify, lugares y calendario funcionan en PHP (`api/apify.php`, `api/places.php`, `api/calendar.php`).
  - Apify en vivo: pon tu token en `apify_token` de `config.php`. **Sin token no se muestra ningún dato inventado**: «Actualizar ahora» responde que Apify no está configurado.
  - Historial de redes (pestaña «Audiencia & Captación» del artista): al agregar una red solo se escribe el usuario o enlace y **se conecta y trae los datos sola**. Instagram, TikTok, YouTube y Facebook se leen con Apify (datos públicos); las demás redes se capturan a mano. Cada captura se guarda por día.
  - **Actualización automática:** al abrir la pantalla del artista se actualiza lo que aún no tiene captura de hoy, y una tarea programada (cron de hPanel, `php …/api/social_cron.php`, diaria 06:17) captura a todos los artistas. Alternativa por URL: define `cron_token` en `config.php` y llama `https://TU_DOMINIO/api/social_cron.php?token=TU_CRON_TOKEN`.
  - **Instagram oficial (alcance, demografía e interacción por publicación):** requiere una app de Meta propia. Pasos (la consola de Meta cambia de nombres con frecuencia):
    1. En https://developers.facebook.com → *Mis apps* → *Crear app* → tipo *Negocio*.
    2. Agrega el producto *Inicio de sesión con Facebook para empresas* y, en su configuración, el *URI de redireccionamiento de OAuth válido*: `https://crm.flamo.wtf/api/meta_callback.php`.
    3. En *Configuración → Básica* copia el *ID de la app* y la *Clave secreta* y ponlos en `api/config.php` como `meta_app_id` y `meta_app_secret`; define también `meta_redirect_uri` con exactamente `https://crm.flamo.wtf/api/meta_callback.php` (la misma que registraste en Meta); define también `token_key` (texto largo y aleatorio, mínimo 16 caracteres; con él se cifran los tokens: no lo cambies después o habrá que reconectar las cuentas).
    4. La cuenta de Instagram del artista debe ser **profesional** (creador o negocio) y estar ligada a una página de Facebook; quien autoriza debe administrar esa página.
    5. Mientras la app esté en *modo desarrollo* solo funciona con personas que tengan un rol en la app (administrador, desarrollador o probador). Para conectar cuentas de terceros hay que pasar la *Revisión de la app* de Meta (permisos `instagram_manage_insights`, `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management`) y, normalmente, la verificación del negocio.
    6. Entra al artista → *Audiencia & Captación* → *Conectar Instagram oficial*. Sin las claves el botón aparece desactivado y explica qué falta.
  - Sin la conexión oficial solo se ven datos públicos (seguidores, siguiendo, publicaciones); con ella se suman alcance, demografía e interacción por publicación.
  - Calendario: un evento abre «Añadir a Google Calendar»; «sincronizar todos» descarga un `.ics` para importar.
  - La sincronización directa con la API de Google requeriría configurar OAuth en Google Cloud (no incluido).
- Usa HTTPS (SSL gratis en hPanel) para proteger la sesión.

## Desarrollo local
```bash
cp public/api/config.sample.php public/api/config.php   # usa un DSN sqlite:/ruta/test.sqlite si no tienes MySQL
php -S 127.0.0.1:8000 -t public
npm run dev
```
