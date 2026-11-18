<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_login();
set_time_limit(120);

$action = $_GET['action'] ?? '';

if ($action === 'status') {
    $t = apify_token();
    respond([
        'configured' => $t !== '',
        'hasToken' => $t !== '',
        'maskedToken' => $t !== '' ? substr($t, 0, 4) . '...' . substr($t, -4) : null,
        'message' => $t !== ''
            ? 'Apify API Token configurado en el servidor.'
            : 'Token no detectado. Agrega apify_token en api/config.php para habilitar scraping en vivo.',
    ]);
}

if ($action !== 'scrape' || $_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Acción no válida.'], 400);

$in = body();
$platform = (string)($in['platform'] ?? 'instagram');
if (!in_array($platform, ['instagram', 'tiktok', 'spotify', 'youtube'], true)) $platform = 'instagram';
$handle = trim(ltrim(trim((string)($in['handle'] ?? '')), '@'));
if ($handle === '') respond(['error' => 'Se requiere un handle o nombre de usuario válido.'], 400);
if (strlen($handle) > 120) respond(['error' => 'Handle demasiado largo.'], 400);

$token = apify_token();
$actors = [
    'instagram' => ['apify~instagram-profile-scraper', ['usernames' => [$handle]]],
    'tiktok'    => ['clockworks~free-tiktok-scraper', ['profiles' => [$handle]]],
    'spotify'   => ['apify~spotify-scraper', ['search' => $handle, 'type' => 'artist']],
    'youtube'   => ['streamliners~youtube-scraper', ['searchKeywords' => $handle, 'maxResults' => 1]],
];
[$actorId, $actorInput] = $actors[$platform];

function fmt_followers(float $n): string {
    return $n >= 1000000 ? number_format($n / 1000000, 1, '.', '') . 'M' : number_format($n / 1000, 1, '.', '') . 'K';
}

if ($token !== '') {
    [$code, $raw] = http_request(
        "https://api.apify.com/v2/acts/{$actorId}/run-sync-get-dataset-items",
        'POST', json_encode($actorInput), ['Content-Type: application/json', 'Authorization: Bearer ' . $token], 100
    );
    if ($code >= 200 && $code < 300) {
        $items = json_decode($raw, true);
        $first = is_array($items) ? ($items[0] ?? null) : null;
        if (is_array($first) && $first) {
            $followers = (float)($first['followersCount'] ?? $first['followers'] ?? $first['subscribersCount'] ?? $first['monthlyListeners'] ?? 50000);
            $eng = isset($first['engagementRate']) && is_numeric($first['engagementRate']) ? number_format((float)$first['engagementRate'], 2) . '%' : '5.2%';
            respond([
                'success' => true, 'liveScraped' => true, 'isDemoMode' => false,
                'platform' => $platform, 'handle' => '@' . $handle,
                'scrapedAt' => gmdate('c'), 'actorUsed' => $actorId,
                'profile' => [
                    'username' => $first['username'] ?? $handle,
                    'fullName' => $first['fullName'] ?? $first['name'] ?? $handle,
                    'followers' => $followers,
                    'followersFormatted' => fmt_followers($followers),
                    'following' => $first['followsCount'] ?? $first['following'] ?? 0,
                    'postsCount' => $first['postsCount'] ?? $first['mediaCount'] ?? 0,
                    'engagementRate' => $eng,
                    'verified' => (bool)($first['verified'] ?? $first['isVerified'] ?? false),
                    'bio' => $first['biography'] ?? $first['bio'] ?? 'Perfil oficial extraído con Apify.',
                    'avatarUrl' => $first['profilePicUrl'] ?? $first['avatar'] ?? '',
                    'topHashtag' => '',
                    'topPostLikes' => $first['latestPosts'][0]['likesCount'] ?? (int)round($followers * 0.08),
                    'topPostComments' => $first['latestPosts'][0]['commentsCount'] ?? (int)round($followers * 0.005),
                ],
            ]);
        }
    }
}

// Modo demostración (sin token o si Apify no respondió): datos simulados, marcados como tal.
$rf = 0.95 + mt_rand() / mt_getrandmax() * 0.1;
$base = ['instagram' => 48500, 'tiktok' => 132000, 'spotify' => 310000, 'youtube' => 92000][$platform];
$followers = (int)round($base * $rf);
$name = implode(' ', array_map(fn($s) => mb_strtoupper(mb_substr($s, 0, 1)) . mb_substr($s, 1), explode('_', $handle)));
respond([
    'success' => true, 'liveScraped' => false, 'isDemoMode' => true,
    'message' => $token !== ''
        ? 'Apify no devolvió datos; se muestran datos de demostración.'
        : 'Modo demostración. Para scraping en vivo configura apify_token en api/config.php.',
    'platform' => $platform, 'handle' => '@' . $handle,
    'scrapedAt' => gmdate('c'), 'actorUsed' => str_replace('~', '/', $actorId),
    'profile' => [
        'username' => $handle, 'fullName' => $name,
        'followers' => $followers, 'followersFormatted' => fmt_followers($followers),
        'following' => (int)round(380 * $rf), 'postsCount' => (int)round(210 * $rf),
        'engagementRate' => number_format(5.1 + mt_rand() / mt_getrandmax() * 2.2, 2) . '%',
        'verified' => false,
        'bio' => "Datos de demostración para {$handle}.",
        'avatarUrl' => '', 'topHashtag' => '',
        'topPostLikes' => (int)round($followers * 0.082), 'topPostComments' => (int)round($followers * 0.007),
    ],
]);
