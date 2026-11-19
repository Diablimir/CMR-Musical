<?php
// Copia este archivo como config.php y completa los datos (hPanel → Bases de datos MySQL).
// config.php NO debe subirse a GitHub (ya está en .gitignore).
return [
    'db_dsn'  => 'mysql:host=localhost;dbname=u123456789_flamo;charset=utf8mb4',
    'db_user' => 'u123456789_flamo',
    'db_pass' => 'CAMBIA_ESTA_CLAVE',

    // Token de Apify (https://console.apify.com/account/integrations). Déjalo vacío para usar el modo demostración.
    'apify_token' => '',

    // Captura diaria de redes (api/social_cron.php por URL): define un texto largo y aleatorio (mín. 16 caracteres). Déjalo vacío si usas cron por consola.
    'cron_token' => '',

    // Conexión OFICIAL con Instagram (alcance, demografía y publicaciones). Crea una app en https://developers.facebook.com (tipo «Negocio»)
    // con el producto «Inicio de sesión con Facebook para empresas» y agrega esta URL como «URI de redirección OAuth válido»:
    //   https://TU_DOMINIO/api/meta_callback.php
    // token_key: texto largo y aleatorio (mín. 16 caracteres) con el que se cifran los tokens. No lo cambies después o habrá que reconectar las cuentas.
    'meta_app_id' => '',
    'meta_app_secret' => '',
    'token_key' => '',

    // Solo para api/install.php (se usa una vez; luego borra install.php)
    'install_token'          => 'CAMBIA_ESTE_TOKEN_LARGO_Y_ALEATORIO',
    'admin_initial_password' => 'CAMBIA_LA_CLAVE_DEL_ADMIN',
];
