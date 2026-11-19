<?php
declare(strict_types=1);

// Conexión OFICIAL con Instagram (API de Meta, «Instagram API con Facebook Login»).
// Requiere una app de Meta propia: meta_app_id, meta_app_secret y token_key en api/config.php (ver HOSTINGER.md).
// El token de acceso se guarda cifrado (AES-256-GCM, clave = token_key) y NUNCA se envía al navegador.

class MetaError extends RuntimeException {
    public int $metaCode;
    public function __construct(string $msg, int $metaCode = 0) { parent::__construct($msg); $this->metaCode = $metaCode; }
}

const META_SCOPES = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management';
const META_DEFAULT_GRAPH = 'https://graph.facebook.com/v21.0';
const META_DEFAULT_DIALOG = 'https://www.facebook.com/v21.0/dialog/oauth';

function meta_cfg(string $k, ?string $default = null): ?string {
    if (function_exists('config')) { $v = config()[$k] ?? null; if (is_string($v) && trim($v) !== '') return trim($v); }
    return $default;
}
/** Claves que faltan en config.php para poder conectar (vacío = todo listo). */
function meta_missing(): array {
    $m = [];
    foreach (['meta_app_id', 'meta_app_secret'] as $k) if (meta_cfg($k) === null) $m[] = $k;
    if (meta_cfg('meta_redirect_uri') === null) $m[] = 'meta_redirect_uri';
    if (strlen((string)meta_cfg('token_key')) < 16) $m[] = 'token_key (mínimo 16 caracteres)';
    return $m;
}
function meta_configured(): bool { return meta_missing() === []; }
function meta_graph(): string { return rtrim(meta_cfg('meta_graph_url', META_DEFAULT_GRAPH), '/'); }
/** URI de retorno de OAuth: se define SIEMPRE en config.php (debe coincidir con la registrada en la app de Meta; no se deduce de la cabecera Host, que controla el cliente). */
function meta_redirect_uri(): string { return (string)meta_cfg('meta_redirect_uri', ''); }

// ───────── Cifrado del token ─────────
function meta_encrypt(string $plain, string $key): string {
    $k = hash('sha256', $key, true); $iv = random_bytes(12); $tag = '';
    $ct = openssl_encrypt($plain, 'aes-256-gcm', $k, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) throw new RuntimeException('No se pudo cifrar el token.');
    return base64_encode($iv . $tag . $ct);
}
function meta_decrypt(string $blob, string $key): string {
    $raw = base64_decode($blob, true);
    if ($raw === false || strlen($raw) < 29) throw new MetaError('El token guardado está dañado: vuelve a conectar la cuenta.');
    $p = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', hash('sha256', $key, true), OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
    if ($p === false) throw new MetaError('No se pudo descifrar el token (¿cambió token_key?): vuelve a conectar la cuenta.');
    return $p;
}

// ───────── HTTP hacia Graph ─────────
/** Llamada a Graph. El token va en la cabecera Authorization (no en la URL, para que no quede en bitácoras). */
function meta_get(string $path, array $params = [], ?string $token = null): array {
    $url = meta_graph() . '/' . ltrim($path, '/') . ($params ? '?' . http_build_query($params) : '');
    $headers = $token !== null ? ['Authorization: Bearer ' . $token] : [];
    [$code, $raw] = http_request($url, 'GET', null, $headers, 40);
    if ($code === 0) throw new MetaError('No se pudo contactar a Meta.');
    $j = json_decode($raw, true);
    if (!is_array($j)) throw new MetaError("Meta respondió algo inesperado ($code).");
    if (isset($j['error'])) throw new MetaError((string)($j['error']['message'] ?? 'Error de Meta'), (int)($j['error']['code'] ?? 0));
    return $j;
}

/** POST de formulario hacia Graph (el secreto de la app y los tokens viajan en el cuerpo, no en la URL). */
function meta_post(string $path, array $params): array {
    [$code, $raw] = http_request(meta_graph() . '/' . ltrim($path, '/'), 'POST', http_build_query($params), ['Content-Type: application/x-www-form-urlencoded'], 40);
    if ($code === 0) throw new MetaError('No se pudo contactar a Meta.');
    $j = json_decode($raw, true);
    if (!is_array($j)) throw new MetaError("Meta respondió algo inesperado ($code).");
    if (isset($j['error'])) throw new MetaError((string)($j['error']['message'] ?? 'Error de Meta'), (int)($j['error']['code'] ?? 0));
    return $j;
}

/** Canje de tokens: POST (secretos en el cuerpo); si Meta no lo admite (respuesta no interpretable o «petición no soportada») se reintenta con el GET documentado. */
function meta_token_call(array $params): array {
    try { return meta_post('oauth/access_token', $params); }
    catch (MetaError $e) { if (!in_array($e->metaCode, [0, 3], true)) throw $e; return meta_get('oauth/access_token', $params); }
}

function meta_auth_url(string $state): string {
    $base = meta_cfg('meta_dialog_url', META_DEFAULT_DIALOG);
    return $base . '?' . http_build_query(['client_id' => meta_cfg('meta_app_id'), 'redirect_uri' => meta_redirect_uri(), 'state' => $state, 'scope' => META_SCOPES, 'response_type' => 'code']);
}

/** code → token de usuario de larga duración (≈60 días). @return array{token:string,expires:?string} */
function meta_exchange_code(string $code): array {
    $short = meta_token_call(['client_id' => meta_cfg('meta_app_id'), 'client_secret' => meta_cfg('meta_app_secret'), 'redirect_uri' => meta_redirect_uri(), 'code' => $code]);
    if (empty($short['access_token'])) throw new MetaError('Meta no entregó un token de acceso.');
    $long = meta_token_call(['grant_type' => 'fb_exchange_token', 'client_id' => meta_cfg('meta_app_id'), 'client_secret' => meta_cfg('meta_app_secret'), 'fb_exchange_token' => $short['access_token']]);
    $tok = (string)($long['access_token'] ?? $short['access_token']);
    $exp = isset($long['expires_in']) && is_numeric($long['expires_in']) ? gmdate('Y-m-d H:i:s', time() + (int)$long['expires_in']) . '.000' : null;
    return ['token' => $tok, 'expires' => $exp];
}

/** Cuentas de Instagram profesionales ligadas a las páginas del usuario. @return list<array{id:string,username:string,page:string}> */
function meta_parse_accounts(array $resp): array {
    $out = [];
    foreach ((array)($resp['data'] ?? []) as $pg) {
        $ig = $pg['instagram_business_account'] ?? null;
        if (is_array($ig) && !empty($ig['id'])) $out[] = ['id' => (string)$ig['id'], 'username' => (string)($ig['username'] ?? ''), 'page' => (string)($pg['name'] ?? '')];
    }
    return $out;
}
function meta_find_accounts(string $token): array { return meta_parse_accounts(meta_get('me/accounts', ['fields' => 'name,instagram_business_account{id,username}', 'limit' => 50], $token)); }

// ───────── Lectores de respuestas (puros: se prueban con ejemplos) ─────────
/** @return array{usuario:?string,seguidores:?int,siguiendo:?int,publicaciones:?int} */
function meta_parse_account(array $r): array {
    return ['usuario' => isset($r['username']) ? (string)$r['username'] : null, 'seguidores' => social_int($r['followers_count'] ?? null), 'siguiendo' => social_int($r['follows_count'] ?? null), 'publicaciones' => social_int($r['media_count'] ?? null)];
}
/** Alcance diario: [fecha => alcance]. `end_time` cierra el día, así que el dato es del día anterior. */
function meta_parse_reach(array $r): array {
    $out = [];
    foreach ((array)($r['data'][0]['values'] ?? []) as $v) {
        $n = social_int($v['value'] ?? null); $t = isset($v['end_time']) ? strtotime((string)$v['end_time']) : false;
        if ($n === null || $t === false) continue;
        $out[gmdate('Y-m-d', $t - 86400)] = $n;
    }
    ksort($out);
    return $out;
}
const META_GENDER = ['F' => 'Mujeres', 'M' => 'Hombres', 'U' => 'Sin especificar'];
/** Demografía de una dimensión: [clave => personas]. */
function meta_parse_demographics(array $r, string $dim): array {
    $out = [];
    foreach ((array)($r['data'][0]['total_value']['breakdowns'][0]['results'] ?? []) as $x) {
        $k = (string)($x['dimension_values'][0] ?? ''); $n = social_int($x['value'] ?? null);
        if ($k === '' || $n === null) continue;
        $out[$dim === 'genero' ? (META_GENDER[$k] ?? $k) : $k] = $n;
    }
    arsort($out);
    return $out;
}
/** Publicaciones de /media (sin alcance todavía). */
function meta_parse_media(array $r): array {
    $out = [];
    foreach ((array)($r['data'] ?? []) as $m) {
        if (empty($m['id']) || empty($m['timestamp']) || ($t = strtotime((string)$m['timestamp'])) === false) continue;
        $out[] = ['post_id' => mb_substr((string)$m['id'], 0, 40), 'publicado_en' => gmdate('Y-m-d H:i:s', $t) . '.000', 'tipo' => mb_substr((string)($m['media_type'] ?? 'IMAGE'), 0, 20),
            'enlace' => isset($m['permalink']) ? mb_substr((string)$m['permalink'], 0, 500) : null, 'texto' => isset($m['caption']) ? mb_substr((string)$m['caption'], 0, 500) : null,
            'me_gusta' => social_int($m['like_count'] ?? null), 'comentarios' => social_int($m['comments_count'] ?? null),
            'alcance' => null, 'guardados' => null, 'compartidos' => null, 'interacciones' => null];
    }
    return $out;
}
/** Insights de una publicación: ['reach'=>n, 'saved'=>n, 'shares'=>n, 'total_interactions'=>n]. */
function meta_parse_media_insights(array $r): array {
    $o = [];
    foreach ((array)($r['data'] ?? []) as $d) { $n = social_int($d['values'][0]['value'] ?? $d['total_value']['value'] ?? null); if (isset($d['name']) && $n !== null) $o[(string)$d['name']] = $n; }
    return $o;
}
/** Interacción de una publicación sobre su alcance (%), o null si falta algún dato. */
function meta_post_engagement(array $p): ?float {
    if (empty($p['alcance']) || $p['interacciones'] === null) return null;
    return min(100.0, round($p['interacciones'] / $p['alcance'] * 100, 2));
}

// ───────── Guardado ─────────
function meta_store_reach(PDO $pdo, string $aid, array $series): int {
    $st = $pdo->prepare('INSERT INTO artista_alcance (artista_id, plataforma, fecha, alcance) VALUES (?, \'instagram\', ?, ?) ON DUPLICATE KEY UPDATE alcance = VALUES(alcance)');
    foreach ($series as $d => $n) $st->execute([$aid, $d, $n]);
    return count($series);
}
/** Reemplaza la foto demográfica de esa fecha y dimensión. */
function meta_store_demographics(PDO $pdo, string $aid, string $date, string $dim, array $rows): int {
    $own = !$pdo->inTransaction(); if ($own) $pdo->beginTransaction();   // todo o nada: nunca queda una foto a medias
    try {
        $pdo->prepare("DELETE FROM artista_demografia WHERE artista_id = ? AND plataforma = 'instagram' AND fecha = ? AND dimension = ?")->execute([$aid, $date, $dim]);
        $st = $pdo->prepare("INSERT INTO artista_demografia (artista_id, plataforma, fecha, dimension, clave, valor) VALUES (?, 'instagram', ?, ?, ?, ?)");
        $n = 0; foreach ($rows as $k => $v) { $st->execute([$aid, $date, $dim, mb_substr((string)$k, 0, 100), $v]); $n++; }
        if ($own) $pdo->commit();
    } catch (Throwable $e) { if ($own && $pdo->inTransaction()) $pdo->rollBack(); throw $e; }
    return $n;
}
function meta_store_posts(PDO $pdo, string $aid, array $posts): int {
    $st = $pdo->prepare("INSERT INTO artista_publicaciones (artista_id, plataforma, post_id, publicado_en, tipo, enlace, texto, me_gusta, comentarios, alcance, guardados, compartidos, interacciones, capturado_en)
        VALUES (?, 'instagram', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE tipo = VALUES(tipo), enlace = VALUES(enlace), texto = VALUES(texto), me_gusta = VALUES(me_gusta), comentarios = VALUES(comentarios),
            alcance = VALUES(alcance), guardados = VALUES(guardados), compartidos = VALUES(compartidos), interacciones = VALUES(interacciones), capturado_en = VALUES(capturado_en)");
    $now = gmdate('Y-m-d H:i:s') . '.000';
    foreach ($posts as $p) $st->execute([$aid, $p['post_id'], $p['publicado_en'], $p['tipo'], $p['enlace'], $p['texto'], $p['me_gusta'], $p['comentarios'], $p['alcance'], $p['guardados'], $p['compartidos'], $p['interacciones'], $now]);
    return count($posts);
}

// ───────── Conexión y sincronización ─────────
function meta_connection(PDO $pdo, string $aid): ?array {
    $st = $pdo->prepare("SELECT * FROM artista_conexiones WHERE artista_id = ? AND plataforma = 'instagram'"); $st->execute([$aid]);
    return $st->fetch() ?: null;
}
function meta_save_connection(PDO $pdo, string $aid, string $accountId, ?string $username, string $token, ?string $expires, string $key): void {
    $now = gmdate('Y-m-d H:i:s') . '.000';
    $pdo->prepare("INSERT INTO artista_conexiones (artista_id, plataforma, cuenta_id, usuario, token_cifrado, expira_en, conectado_en, ultimo_error) VALUES (?, 'instagram', ?, ?, ?, ?, ?, NULL)
        ON DUPLICATE KEY UPDATE cuenta_id = VALUES(cuenta_id), usuario = VALUES(usuario), token_cifrado = VALUES(token_cifrado), expira_en = VALUES(expira_en), conectado_en = VALUES(conectado_en), ultimo_error = NULL")
        ->execute([$aid, $accountId, $username, meta_encrypt($token, $key), $expires, $now]);
}

/**
 * Trae de la API oficial: seguidores (se guarda como captura de hoy, fuente «meta»), alcance de los últimos 30 días,
 * demografía y las últimas publicaciones con su alcance. Lo que Meta no entregue (p. ej. demografía con menos de 100 seguidores) se omite y se avisa.
 * @return array{ok:bool,error?:string,avisos:string[],resumen?:array}
 */
function meta_sync_artist(PDO $pdo, string $aid): array {
    $c = meta_connection($pdo, $aid);
    if (!$c) return ['ok' => false, 'error' => 'Este artista no tiene la cuenta oficial conectada.', 'avisos' => []];
    $key = (string)meta_cfg('token_key');
    $avisos = []; $res = ['reach' => 0, 'demografia' => 0, 'posts' => 0];
    try {
        $token = meta_decrypt((string)$c['token_cifrado'], $key); $ig = (string)$c['cuenta_id']; $today = gmdate('Y-m-d');
        $acc = meta_parse_account(meta_get($ig, ['fields' => 'username,followers_count,follows_count,media_count'], $token));
        if ($acc['seguidores'] === null) throw new MetaError('Meta no devolvió los seguidores de la cuenta.');
        // publicaciones y su alcance
        $posts = meta_parse_media(meta_get("$ig/media", ['fields' => 'id,caption,media_type,permalink,timestamp,like_count,comments_count', 'limit' => 25], $token));
        foreach ($posts as &$p) {
            try {
                $ins = meta_parse_media_insights(meta_get($p['post_id'] . '/insights', ['metric' => 'reach,saved,shares,total_interactions'], $token));
                $p['alcance'] = $ins['reach'] ?? null; $p['guardados'] = $ins['saved'] ?? null; $p['compartidos'] = $ins['shares'] ?? null; $p['interacciones'] = $ins['total_interactions'] ?? null;
            } catch (MetaError $e) { if ($e->metaCode === 190) throw $e; /* hay publicaciones sin insights (p. ej. de antes de ser cuenta profesional) */ }
        }
        unset($p);
        $res['posts'] = meta_store_posts($pdo, $aid, $posts);
        $eng = array_values(array_filter(array_map(fn($p) => ($p['interacciones'] !== null && $acc['seguidores'] > 0) ? $p['interacciones'] / $acc['seguidores'] * 100 : null, $posts), fn($v) => $v !== null));
        social_save_snapshot($pdo, $aid, 'instagram', $today, ['seguidores' => $acc['seguidores'], 'siguiendo' => $acc['siguiendo'], 'publicaciones' => $acc['publicaciones'],
            'interaccion' => $eng ? min(100.0, round(array_sum($eng) / count($eng), 2)) : null], 'meta');
        // alcance diario (30 días)
        try { $res['reach'] = meta_store_reach($pdo, $aid, meta_parse_reach(meta_get("$ig/insights", ['metric' => 'reach', 'period' => 'day', 'since' => time() - 29 * 86400, 'until' => time()], $token))); }
        catch (MetaError $e) { if ($e->metaCode === 190) throw $e; $avisos[] = 'Alcance: ' . $e->getMessage(); }
        // demografía
        foreach (['edad' => 'age', 'genero' => 'gender', 'ciudad' => 'city', 'pais' => 'country'] as $dim => $bd) {
            try { $res['demografia'] += meta_store_demographics($pdo, $aid, $today, $dim, meta_parse_demographics(meta_get("$ig/insights", ['metric' => 'follower_demographics', 'period' => 'lifetime', 'metric_type' => 'total_value', 'breakdown' => $bd], $token), $dim)); }
            catch (MetaError $e) { if ($e->metaCode === 190) throw $e; $avisos[] = 'Demografía (' . $dim . '): ' . $e->getMessage(); }
        }
        $pdo->prepare("UPDATE artista_conexiones SET ultima_sync = ?, ultimo_error = NULL, usuario = COALESCE(?, usuario) WHERE artista_id = ? AND plataforma = 'instagram'")->execute([gmdate('Y-m-d H:i:s') . '.000', $acc['usuario'], $aid]);
        return ['ok' => true, 'avisos' => $avisos, 'resumen' => $res];
    } catch (MetaError $e) {
        $msg = $e->metaCode === 190 ? 'La conexión con Instagram venció o fue revocada: vuelve a conectar la cuenta.' : $e->getMessage();
        $pdo->prepare("UPDATE artista_conexiones SET ultimo_error = ? WHERE artista_id = ? AND plataforma = 'instagram'")->execute([mb_substr($msg, 0, 255), $aid]);
        return ['ok' => false, 'error' => $msg, 'avisos' => $avisos];
    }
}

/** Todo lo oficial guardado de un artista, listo para la interfaz (sin el token). */
function meta_load(PDO $pdo, string $aid): array {
    $c = meta_connection($pdo, $aid);
    $iso = fn($v) => $v === null ? null : substr(str_replace(' ', 'T', (string)$v), 0, 23) . 'Z';
    $q = function (string $sql) use ($pdo, $aid) { $s = $pdo->prepare($sql); $s->execute([$aid]); return $s->fetchAll(); };
    $demoDate = $q("SELECT MAX(fecha) m FROM artista_demografia WHERE artista_id = ? AND plataforma = 'instagram'")[0]['m'] ?? null;
    $demo = ['date' => $demoDate, 'edad' => [], 'genero' => [], 'ciudad' => [], 'pais' => []];
    if ($demoDate) {
        $st = $pdo->prepare("SELECT dimension, clave, valor FROM artista_demografia WHERE artista_id = ? AND plataforma = 'instagram' AND fecha = ? ORDER BY dimension, valor DESC, clave");
        $st->execute([$aid, $demoDate]);
        foreach ($st->fetchAll() as $r) $demo[$r['dimension']][] = ['key' => $r['clave'], 'value' => (int)$r['valor']];
    }
    return [
        'connection' => $c ? ['connected' => true, 'username' => $c['usuario'], 'expiresAt' => $iso($c['expira_en']), 'lastSync' => $iso($c['ultima_sync']), 'lastError' => $c['ultimo_error']] : null,
        'reach' => array_map(fn($r) => ['date' => $r['fecha'], 'reach' => (int)$r['alcance']], $q("SELECT fecha, alcance FROM artista_alcance WHERE artista_id = ? AND plataforma = 'instagram' ORDER BY fecha")),
        'demographics' => $demo,
        'posts' => array_map(function ($r) use ($iso) {
            $p = ['alcance' => $r['alcance'] === null ? null : (int)$r['alcance'], 'interacciones' => $r['interacciones'] === null ? null : (int)$r['interacciones']];
            $n = fn($v) => $v === null ? null : (int)$v;
            return ['id' => $r['post_id'], 'date' => $iso($r['publicado_en']), 'type' => $r['tipo'], 'url' => $r['enlace'], 'text' => $r['texto'], 'likes' => $n($r['me_gusta']), 'comments' => $n($r['comentarios']),
                'reach' => $p['alcance'], 'saves' => $n($r['guardados']), 'shares' => $n($r['compartidos']), 'interactions' => $p['interacciones'], 'engagement' => meta_post_engagement($p)];
        }, $q('SELECT post_id, publicado_en, tipo, enlace, texto, me_gusta, comentarios, alcance, guardados, compartidos, interacciones FROM artista_publicaciones WHERE artista_id = ? AND plataforma = \'instagram\' ORDER BY publicado_en DESC')),
    ];
}
