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

    // Solo para api/install.php (se usa una vez; luego borra install.php)
    'install_token'          => 'CAMBIA_ESTE_TOKEN_LARGO_Y_ALEATORIO',
    'admin_initial_password' => 'CAMBIA_LA_CLAVE_DEL_ADMIN',
];
