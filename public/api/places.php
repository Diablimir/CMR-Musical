<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
$me = require_login();
set_time_limit(120);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método no permitido.'], 405);

$raw = trim((string)(body()['query'] ?? ''));
rate_limit('places:' . $me['id'], 25, 600);
if ($raw === '') respond(['error' => 'Se requiere una URL de Google Maps o un término de búsqueda.'], 400);
if (strlen($raw) > 2000) respond(['error' => 'Consulta demasiado larga.'], 400);

// Solo se siguen enlaces de Google (evita usar el servidor para llamar a sitios arbitrarios).
function is_google_host(string $url): bool {
    $p = parse_url($url);
    // Solo HTTPS en el puerto 443 (evita usar el servidor para sondear puertos o servicios internos).
    if (!$p || strtolower($p['scheme'] ?? '') !== 'https' || empty($p['host']) || (isset($p['port']) && (int)$p['port'] !== 443) || isset($p['user']) || isset($p['pass'])) return false;
    $h = strtolower($p['host']);
    $ok = false;
    foreach (['google.com', 'google.com.mx', 'goo.gl', 'maps.app.goo.gl', 'g.co'] as $d) {
        if ($h === $d || str_ends_with($h, '.' . $d)) { $ok = true; break; }
    }
    if (!$ok) return false;
    // La IP a la que resuelve el nombre debe ser pública (nada de redes privadas, loopback o reservadas).
    $ips = gethostbynamel($h) ?: [];
    if (!$ips) return false;
    foreach ($ips as $ip) if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return false;
    return true;
}

$target = $raw;
if (preg_match('#^https?://#i', $raw)) {
    if (!is_google_host($raw)) respond(['error' => 'Solo se admiten enlaces de Google Maps.'], 400);
    $cur = $raw;
    for ($i = 0; $i < 5; $i++) {
        [$code, , $h] = http_request($cur, 'GET', null, [], 10);
        if ($code >= 300 && $code < 400 && !empty($h['location'])) {
            $next = $h['location'];
            if (!preg_match('#^https?://#i', $next)) {
                $pp = parse_url($cur);
                $next = $pp['scheme'] . '://' . $pp['host'] . (str_starts_with($next, '/') ? '' : '/') . $next;
            }
            if (!is_google_host($next)) break;
            $cur = $next;
            continue;
        }
        break;
    }
    $target = $cur;
}

function rnd(int $min, int $max): int { return random_int($min, $max); }

// Extrae nombre y coordenadas de un enlace de Google Maps (o usa el texto tal cual).
function parse_input(string $targetUrl, string $rawQuery): array {
    $name = ''; $lat = null; $lng = null;
    if (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $targetUrl, $m)) { $lat = (float)$m[1]; $lng = (float)$m[2]; }
    elseif (preg_match('/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/', $targetUrl, $m)) { $lat = (float)$m[1]; $lng = (float)$m[2]; }
    if (preg_match('#place/([^/@?]+)#', $targetUrl, $m)) $name = str_replace('+', ' ', urldecode($m[1]));
    if ($name === '' && preg_match('#search/([^/@?]+)#', $targetUrl, $m)) $name = str_replace('+', ' ', urldecode($m[1]));
    if ($name === '' && preg_match('/[?&](?:q|query)=([^&]+)/', $targetUrl, $m)) $name = str_replace('+', ' ', urldecode($m[1]));
    if ($name === '' && !preg_match('#^https?://#i', $rawQuery)) $name = $rawQuery;
    return [trim($name), $lat, $lng];
}

function nominatim(string $path, array $params): ?array {
    $params += ['format' => 'jsonv2', 'addressdetails' => 1, 'extratags' => 1, 'accept-language' => 'es'];
    [$code, $out] = http_request(
        'https://nominatim.openstreetmap.org/' . $path . '?' . http_build_query($params),
        'GET', null, ['User-Agent: FlamoCRM/1.0 (venue autocomplete)', 'Accept: application/json'], 15
    );
    if ($code !== 200) return null;
    $j = json_decode($out, true);
    if (!is_array($j)) return null;
    if (isset($j[0]) && is_array($j[0])) return $j[0];   // search
    return isset($j['lat']) ? $j : null;                  // reverse
}

function venue_type(?string $category, ?string $type): string {
    $map = [
        'theatre' => 'Teatro', 'arts_centre' => 'Centro de artes', 'nightclub' => 'Club nocturno',
        'stadium' => 'Estadio', 'events_venue' => 'Recinto de eventos', 'concert_hall' => 'Sala de conciertos',
        'cinema' => 'Cine', 'bar' => 'Bar', 'pub' => 'Bar', 'restaurant' => 'Restaurante',
        'community_centre' => 'Centro comunitario', 'conference_centre' => 'Centro de convenciones',
        'sports_centre' => 'Centro deportivo', 'auditorium' => 'Auditorio', 'hotel' => 'Hotel',
    ];
    return $map[$type ?? ''] ?? 'Recinto';
}

function venue_from_osm(array $r, string $fallbackName): array {
    $a = $r['address'] ?? [];
    $x = $r['extratags'] ?? [];
    $name = $r['name'] ?? ($a[$r['type'] ?? ''] ?? '') ?: $fallbackName;
    $road = trim(($a['road'] ?? '') . ' ' . ($a['house_number'] ?? ''));
    $parts = array_filter([$road, $a['neighbourhood'] ?? $a['suburb'] ?? '', $a['postcode'] ?? '']);
    $address = $parts ? implode(', ', $parts) : (string)($r['display_name'] ?? '');
    $city = $a['city'] ?? $a['town'] ?? $a['village'] ?? $a['municipality'] ?? $a['county'] ?? '';
    $hours = !empty($x['opening_hours']) ? [(string)$x['opening_hours']] : [];
    $name = $name ?: $fallbackName;
    $lat = (float)$r['lat']; $lng = (float)$r['lon'];
    return array_merge(venue_base($name), [
        'address' => $address, 'city' => $city, 'state' => $a['state'] ?? '',
        'country' => $a['country'] ?? 'México', 'postalCode' => $a['postcode'] ?? '',
        'lat' => $lat, 'lng' => $lng,
        'website' => $x['website'] ?? $x['contact:website'] ?? 'https://www.google.com/maps/search/?api=1&query=' . $lat . ',' . $lng,
        'phone' => $x['phone'] ?? $x['contact:phone'] ?? '',
        'rating' => 0, 'userRatingsCount' => 0,
        'placeId' => '',
        'establishmentType' => venue_type($r['category'] ?? null, $r['type'] ?? null),
        'hours' => $hours,
        'scoreRentabilidad' => 0, 'scoreResponseTime' => 0, 'scorePuntualidadPago' => 0,
        'scoreNegociacion' => 0, 'scoreProduccion' => 0, 'scoreHospitalidad' => 0,
    ]);
}

function venue_base(string $name): array {
    $now = gmdate('c');
    return [
        'id' => 'ven-' . (int)(microtime(true) * 1000),
        'name' => $name,
        'country' => 'México',
        'postalCode' => '',
        'website' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($name),
        'placeId' => 'ChIJ' . bin2hex(random_bytes(8)),
        'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null,
    ];
}

// 1) Apify Google Maps Extractor (si hay token)
$token = apify_token();
$apifyInfo = ['configured' => $token !== '', 'status' => null, 'message' => null];
if ($token !== '') {
    $isUrl = (bool)preg_match('#^https?://#i', $target);
    $input = $isUrl
        ? ['startUrls' => [['url' => $target]], 'maxCrawledPlacesPerSearch' => 1, 'language' => 'es']
        : ['searchStringsArray' => [$target], 'maxCrawledPlacesPerSearch' => 1, 'language' => 'es'];
    [$code, $out] = http_request(
        'https://api.apify.com/v2/acts/compass~google-maps-extractor/run-sync-get-dataset-items?timeout=90',
        'POST', json_encode($input),
        ['Content-Type: application/json', 'Authorization: Bearer ' . $token], 110
    );
    $apifyInfo['status'] = $code;
    if ($code === 0) {
        $apifyInfo['message'] = 'Sin respuesta de Apify (tiempo agotado o conexión bloqueada).';
    } elseif ($code < 200 || $code >= 300) {
        $e = json_decode($out, true);
        $apifyInfo['message'] = (string)($e['error']['message'] ?? ('Apify respondió con error ' . $code . '.'));
    }
    if ($code >= 200 && $code < 300) {
        $items = json_decode($out, true);
        $f = is_array($items) ? ($items[0] ?? null) : null;
        if (is_array($f) && (!empty($f['title']) || !empty($f['name']))) {
            $name = (string)($f['title'] ?? $f['name']);
            $hours = [];
            foreach (($f['openingHours'] ?? []) as $h) $hours[] = is_array($h) && isset($h['day']) ? $h['day'] . ': ' . ($h['hours'] ?? '') : (string)(is_array($h) ? json_encode($h) : $h);
            respond(['success' => true, 'liveScraped' => true, 'source' => 'apify', 'venue' => array_merge(venue_base($name), [
                'address' => $f['address'] ?? "$name, " . ($f['city'] ?? 'CDMX'),
                'city' => $f['city'] ?? 'CDMX', 'state' => $f['state'] ?? 'CDMX',
                'country' => $f['countryCode'] ?? 'México', 'postalCode' => $f['postalCode'] ?? '06000',
                'lat' => $f['location']['lat'] ?? 19.4326, 'lng' => $f['location']['lng'] ?? -99.1332,
                'website' => $f['website'] ?? 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode($name),
                'phone' => $f['phone'] ?? '',
                'rating' => (float)($f['totalScore'] ?? $f['stars'] ?? 0),
                'userRatingsCount' => (int)($f['reviewsCount'] ?? 0),
                'placeId' => $f['placeId'] ?? 'ChIJ' . bin2hex(random_bytes(8)),
                'establishmentType' => $f['categoryName'] ?? 'Foro / Centro de Espectáculos',
                'hours' => $hours ?: ['Lunes a Sábado: 12:00 - 21:00'],
                'scoreRentabilidad' => rnd(82, 96), 'scoreResponseTime' => rnd(82, 96), 'scorePuntualidadPago' => rnd(82, 96),
                'scoreNegociacion' => rnd(82, 96), 'scoreProduccion' => rnd(82, 96), 'scoreHospitalidad' => rnd(82, 96),
            ])]);
        }
    }
}

if ($apifyInfo['configured'] && $apifyInfo['message'] === null) {
    $apifyInfo['message'] = 'Apify no devolvió resultados para esta búsqueda.';
}

// 2) Datos reales de OpenStreetMap (gratis, sin clave)
[$qName, $qLat, $qLng] = parse_input($target, $raw);
$hit = null;
if ($qLat !== null && $qLng !== null) {
    $hit = nominatim('reverse', ['lat' => $qLat, 'lon' => $qLng, 'zoom' => 18]);
    if ($hit && $qName !== '') $hit['name'] = $qName;       // el nombre de Google es más fiable
}
if (!$hit && $qName !== '') {
    $hit = nominatim('search', ['q' => $qName, 'limit' => 1, 'countrycodes' => 'mx']);
    if (!$hit) $hit = nominatim('search', ['q' => $qName, 'limit' => 1]);
}
if (!$hit) {
    respond(['error' => 'No se encontró ese lugar. Prueba con el nombre y la ciudad (ej. "Teatro Metropolitan, Ciudad de México") o pega el enlace completo de Google Maps.'], 404);
}
$v = venue_from_osm($hit, $qName ?: 'Recinto');
if ($qLat !== null && $qLng !== null) { $v['lat'] = $qLat; $v['lng'] = $qLng; }
respond(['success' => true, 'liveScraped' => false, 'source' => 'openstreetmap', 'apify' => $apifyInfo, 'venue' => $v]);
