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

## Notas
- Los datos viven en MySQL; las contraseñas se guardan cifradas (`password_hash`).
- Las colecciones se guardan completas (gana la última escritura). Si dos personas editan a la vez, puede perderse un cambio.
- Apify, scraping de lugares y Google Calendar siguen requiriendo Node y **no funcionan** en este plan hasta portarlos a PHP.
- Usa HTTPS (SSL gratis en hPanel) para proteger la sesión.

## Desarrollo local
```bash
cp public/api/config.sample.php public/api/config.php   # usa un DSN sqlite:/ruta/test.sqlite si no tienes MySQL
php -S 127.0.0.1:8000 -t public
npm run dev
```
