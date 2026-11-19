<?php
declare(strict_types=1);

// Redes sociales del artista: normalización de datos reales, guardado del historial y consulta a Apify.
// Aquí NO se inventa nada: si un dato no existe, se devuelve null/error y la interfaz lo muestra como «sin dato».

const SOCIAL_NETS = ['instagram', 'tiktok', 'facebook', 'youtube', 'spotify', 'appleMusic', 'twitter', 'threads'];
const SOCIAL_AUTO = ['instagram', 'tiktok', 'youtube', 'facebook'];   // redes con captura automática (Apify); el resto se captura a mano
const ACTION_TYPES = ['Lanzamiento', 'Campaña', 'Publicación', 'Colaboración', 'Prensa', 'Gira', 'Otro'];

/** Usuario de una red a partir de «@usuario», «usuario» o una URL (https://instagram.com/usuario/?hl=es). */
function social_handle(string $raw): string {
    $s = trim($raw);
    if ($s === '') return '';
    if (preg_match('~^https?://~i', $s) || str_contains($s, '/')) {
        $path = (string)(parse_url(preg_match('~^https?://~i', $s) ? $s : 'https://' . $s, PHP_URL_PATH) ?? '');
        $parts = array_values(array_filter(explode('/', $path), fn($p) => $p !== ''));
        $s = $parts ? (string)end($parts) : '';
        if (str_starts_with($s, '@')) $s = substr($s, 1);
    }
    $s = ltrim($s, '@');
    return preg_match('/^[A-Za-z0-9._-]{1,100}$/', $s) ? $s : '';
}

function social_int(mixed $v): ?int { return (is_int($v) || is_float($v) || (is_string($v) && is_numeric($v))) && $v >= 0 ? (int)round((float)$v) : null; }

/**
 * Convierte la respuesta de un actor de Apify en una captura real. Devuelve null si no hay un dato de seguidores válido
 * (en ese caso NO se guarda nada y se avisa al usuario).
 * @return array{seguidores:int,siguiendo:?int,publicaciones:?int,interaccion:?float,usuario:?string,verificado:bool}|null
 */
function social_normalize(string $platform, array $items): ?array {
    $first = $items[0] ?? null;
    if (!is_array($first)) return null;
    if ($platform === 'instagram') {
        $f = social_int($first['followersCount'] ?? null);
        if ($f === null) return null;
        $likesOf = fn($p) => is_array($p) ? [social_int($p['likesCount'] ?? null), social_int($p['commentsCount'] ?? null)] : [null, null];
        $per = [];
        foreach (is_array($first['latestPosts'] ?? null) ? $first['latestPosts'] : [] as $p) { [$l, $c] = $likesOf($p); if ($l !== null && $c !== null) $per[] = $l + $c; }
        return ['seguidores' => $f, 'siguiendo' => social_int($first['followsCount'] ?? null), 'publicaciones' => social_int($first['postsCount'] ?? null),
            'interaccion' => ($per && $f > 0) ? min(100.0, round(array_sum($per) / count($per) / $f * 100, 2)) : null,
            'usuario' => isset($first['username']) ? (string)$first['username'] : null, 'verificado' => !empty($first['verified'])];
    }
    if ($platform === 'tiktok') {
        $meta = null; foreach ($items as $it) if (is_array($it) && is_array($it['authorMeta'] ?? null) && social_int($it['authorMeta']['fans'] ?? null) !== null) { $meta = $it['authorMeta']; break; }
        if ($meta === null) return null;
        $f = social_int($meta['fans']);
        $per = [];
        foreach ($items as $it) { if (!is_array($it)) continue; $d = social_int($it['diggCount'] ?? null); $c = social_int($it['commentCount'] ?? null); $s = social_int($it['shareCount'] ?? null); if ($d !== null && $c !== null && $s !== null) $per[] = $d + $c + $s; }
        return ['seguidores' => $f, 'siguiendo' => social_int($meta['following'] ?? null), 'publicaciones' => social_int($meta['video'] ?? null),
            'interaccion' => ($per && $f > 0) ? min(100.0, round(array_sum($per) / count($per) / $f * 100, 2)) : null,
            'usuario' => isset($meta['name']) ? (string)$meta['name'] : null, 'verificado' => !empty($meta['verified'])];
    }
    if ($platform === 'youtube') {
        // streamers/youtube-channel-scraper: el elemento del canal trae numberOfSubscribers (o subscriberCount)
        $ch = null; foreach ($items as $it) if (is_array($it) && social_int($it['numberOfSubscribers'] ?? $it['subscriberCount'] ?? $it['subscribers'] ?? null) !== null) { $ch = $it; break; }
        if ($ch === null) return null;
        return ['seguidores' => social_int($ch['numberOfSubscribers'] ?? $ch['subscriberCount'] ?? $ch['subscribers']), 'siguiendo' => null,
            'publicaciones' => social_int($ch['channelTotalVideos'] ?? $ch['videoCount'] ?? null), 'interaccion' => null,
            'usuario' => isset($ch['channelName']) ? (string)$ch['channelName'] : (isset($ch['title']) ? (string)$ch['title'] : null), 'verificado' => !empty($ch['isChannelVerified'] ?? $ch['verified'] ?? false)];
    }
    if ($platform === 'facebook') {
        // apify/facebook-pages-scraper: followers (seguidores de la página); likes se ignora para no mezclar métricas
        $pg = null; foreach ($items as $it) if (is_array($it) && social_int($it['followers'] ?? $it['followersCount'] ?? null) !== null) { $pg = $it; break; }
        if ($pg === null) return null;
        return ['seguidores' => social_int($pg['followers'] ?? $pg['followersCount']), 'siguiendo' => null, 'publicaciones' => null, 'interaccion' => null,
            'usuario' => isset($pg['pageName']) ? (string)$pg['pageName'] : (isset($pg['title']) ? (string)$pg['title'] : null), 'verificado' => !empty($pg['verified'] ?? false)];
    }
    return null;
}

/** Valida y guarda (o reemplaza) la captura de un día. $d = ['seguidores', 'siguiendo'?, 'publicaciones'?, 'interaccion'?]. */
function social_save_snapshot(PDO $pdo, string $artistId, string $platform, string $date, array $d, string $source): void {
    if (!in_array($platform, SOCIAL_NETS, true)) throw new InvalidArgumentException('Red social no válida.');
    if (!in_array($source, ['manual', 'apify'], true)) throw new InvalidArgumentException('Fuente no válida.');
    $dt = DateTime::createFromFormat('Y-m-d', $date);
    if (!$dt || $dt->format('Y-m-d') !== $date) throw new InvalidArgumentException('La fecha no es válida (usa AAAA-MM-DD).');
    if ($date > gmdate('Y-m-d', time() + 86400)) throw new InvalidArgumentException('La fecha no puede ser futura.');
    $f = social_int($d['seguidores'] ?? null);
    if ($f === null) throw new InvalidArgumentException('Los seguidores deben ser un número entero igual o mayor que 0.');
    $opt = function (string $k, string $label) use ($d): ?int { $v = $d[$k] ?? null; if ($v === null || $v === '') return null; $n = social_int($v); if ($n === null) throw new InvalidArgumentException("«{$label}» debe ser un número entero igual o mayor que 0."); return $n; };
    $sg = $opt('siguiendo', 'Siguiendo'); $pb = $opt('publicaciones', 'Publicaciones');
    $ia = $d['interaccion'] ?? null;
    if ($ia === null || $ia === '') $ia = null;
    elseif (!is_numeric($ia) || $ia < 0 || $ia > 100) throw new InvalidArgumentException('La interacción debe estar entre 0 y 100 %.');
    else $ia = round((float)$ia, 2);
    $st = $pdo->prepare('INSERT INTO artista_metricas_redes (artista_id, plataforma, fecha, seguidores, siguiendo, publicaciones, interaccion, fuente, capturado_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE seguidores = VALUES(seguidores), siguiendo = VALUES(siguiendo), publicaciones = VALUES(publicaciones), interaccion = VALUES(interaccion), fuente = VALUES(fuente), capturado_en = VALUES(capturado_en)');
    $st->execute([$artistId, $platform, $date, $f, $sg, $pb, $ia, $source, gmdate('Y-m-d H:i:s') . '.000']);
}

/** Consulta Apify y devuelve ['ok' => true, 'data' => captura] o ['ok' => false, 'error' => mensaje]. Nunca devuelve cifras de relleno. */
function social_apify_fetch(string $platform, string $handle): array {
    if (!in_array($platform, SOCIAL_AUTO, true)) return ['ok' => false, 'error' => 'Esta red no tiene captura automática todavía: captúrala a mano.'];
    if ($handle === '') return ['ok' => false, 'error' => 'Falta el usuario o enlace de la red del artista.'];
    $token = apify_token();
    if ($token === '') return ['ok' => false, 'error' => 'Apify no está configurado en el servidor (falta apify_token en api/config.php).'];
    $actors = [
        'instagram' => ['apify~instagram-profile-scraper', ['usernames' => [$handle]]],
        'tiktok' => ['clockworks~free-tiktok-scraper', ['profiles' => [$handle], 'resultsPerPage' => 10, 'shouldDownloadVideos' => false, 'shouldDownloadCovers' => false]],
        'youtube' => ['streamers~youtube-channel-scraper', ['startUrls' => [['url' => 'https://www.youtube.com/@' . $handle]], 'maxResults' => 1, 'maxResultsShorts' => 0, 'maxResultStreams' => 0]],
        'facebook' => ['apify~facebook-pages-scraper', ['startUrls' => [['url' => 'https://www.facebook.com/' . $handle]]]],
    ];
    [$actor, $input] = $actors[$platform];
    [$code, $raw] = http_request("https://api.apify.com/v2/acts/{$actor}/run-sync-get-dataset-items", 'POST', json_encode($input), ['Content-Type: application/json', 'Authorization: Bearer ' . $token], 110);
    if ($code === 0) return ['ok' => false, 'error' => 'No se pudo contactar a Apify.'];
    if ($code < 200 || $code >= 300) return ['ok' => false, 'error' => "Apify respondió con error ($code)."];
    $items = json_decode($raw, true);
    $data = is_array($items) ? social_normalize($platform, $items) : null;
    if ($data === null) {
        $f = (is_array($items) && is_array($items[0] ?? null)) ? $items[0] : [];
        $why = isset($f['errorDescription']) ? ' Motivo: ' . mb_substr((string)$f['errorDescription'], 0, 160) : (isset($f['error']) ? ' Motivo: ' . mb_substr((string)$f['error'], 0, 160) : '');
        return ['ok' => false, 'error' => 'Apify no devolvió datos de ese perfil (¿el usuario existe y es público?).' . $why];
    }
    return ['ok' => true, 'data' => $data, 'actor' => str_replace('~', '/', $actor)];
}

/** Usuario de la red guardado para el artista: el enlace; si no hay, el usuario que quedó de la conexión anterior. */
function social_artist_handle(PDO $pdo, string $artistId, string $platform): string {
    $st = $pdo->prepare('SELECT enlace, usuario_conectado FROM artista_redes WHERE artista_id = ? AND plataforma = ?');
    $st->execute([$artistId, $platform]);
    $r = $st->fetch();
    if (!$r) return '';
    $h = social_handle((string)$r['enlace']);
    return $h !== '' ? $h : social_handle((string)($r['usuario_conectado'] ?? ''));
}

/**
 * Actualiza automáticamente las redes con captura automática de un artista: solo las que tienen usuario guardado y
 * todavía no tienen captura de HOY (así abrir la pantalla muchas veces no gasta consultas).
 * @return array{refreshed:string[],errors:array<string,string>,skipped:string[]}
 */
function social_refresh_artist(PDO $pdo, string $artistId, bool $force = false): array {
    $out = ['refreshed' => [], 'errors' => [], 'skipped' => []];
    $today = gmdate('Y-m-d');
    foreach (SOCIAL_AUTO as $p) {
        $h = social_artist_handle($pdo, $artistId, $p);
        if ($h === '') continue;
        if (!$force) {
            $st = $pdo->prepare('SELECT 1 FROM artista_metricas_redes WHERE artista_id = ? AND plataforma = ? AND fecha = ?'); $st->execute([$artistId, $p, $today]);
            if ($st->fetchColumn()) { $out['skipped'][] = $p; continue; }
        }
        $r = social_apify_fetch($p, $h);
        if ($r['ok']) { social_save_snapshot($pdo, $artistId, $p, $today, $r['data'], 'apify'); $out['refreshed'][] = $p; }
        else $out['errors'][$p] = $r['error'];
    }
    return $out;
}
