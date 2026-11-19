<?php
declare(strict_types=1);
// Regreso de Meta tras autorizar la cuenta (redirect_uri de la app). Navegación del navegador: no lleva cabecera personalizada,
// por eso se protege con `state` (aleatorio, guardado en la sesión, de un solo uso y con vigencia de 15 minutos).
header_remove('Content-Type'); header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store');
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/social_lib.php';

function back(string $status, string $msg, string $artist = ''): never {
    header('Location: /?' . http_build_query(array_filter(['meta' => $status, 'artist' => $artist, 'msg' => $msg])));
    exit;
}
header('Content-Type: text/html; charset=utf-8');
$u = current_user();
if (!$u) back('error', 'Tu sesión expiró. Inicia sesión y vuelve a conectar la cuenta.');
start_session();
$ctx = $_SESSION['meta_oauth'] ?? null; unset($_SESSION['meta_oauth']);   // un solo uso
$state = (string)($_GET['state'] ?? '');
if (!is_array($ctx) || $state === '' || !hash_equals((string)$ctx['state'], $state) || time() - (int)$ctx['at'] > 900) back('error', 'La autorización no es válida o venció. Inténtalo de nuevo.');
$aid = (string)$ctx['artist'];
if (isset($_GET['error'])) back('error', 'No se autorizó la conexión: ' . mb_substr((string)($_GET['error_description'] ?? $_GET['error']), 0, 160), $aid);
$code = (string)($_GET['code'] ?? '');
if ($code === '' || !meta_configured()) back('error', 'Falta el código de autorización o la configuración de Meta.', $aid);

$pdo = db();
try {
    ensure_schema($pdo);
    $tok = meta_exchange_code($code);
    $accounts = meta_find_accounts($tok['token']);
    if (!$accounts) back('error', 'No se encontró una cuenta de Instagram profesional ligada a una página de Facebook de esta persona. Convierte la cuenta a profesional (creador o negocio) y lígala a una página.', $aid);
    // si hay varias, se prefiere la que coincide con el usuario guardado del artista
    $want = social_artist_handle($pdo, $aid, 'instagram'); $pick = $accounts[0];
    foreach ($accounts as $a) if ($want !== '' && strcasecmp($a['username'], $want) === 0) { $pick = $a; break; }
    meta_save_connection($pdo, $aid, $pick['id'], $pick['username'] ?: null, $tok['token'], $tok['expires'], (string)meta_cfg('token_key'));
    $r = meta_sync_artist($pdo, $aid);
    if (!$r['ok']) back('error', 'Cuenta conectada pero no se pudieron leer los datos: ' . $r['error'], $aid);
    back('ok', 'Instagram conectado: @' . ($pick['username'] ?: $pick['id']) . ($r['avisos'] ? ' (' . count($r['avisos']) . ' aviso(s))' : ''), $aid);
} catch (MetaError $e) {
    back('error', 'Meta respondió con un error: ' . mb_substr($e->getMessage(), 0, 180), $aid);
} catch (Throwable $e) {
    error_log('meta_callback: ' . $e->getMessage());
    back('error', 'No se pudo completar la conexión.', $aid);
}
