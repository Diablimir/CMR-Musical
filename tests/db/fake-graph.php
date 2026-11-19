<?php
// Servidor de Meta SIMULADO para pruebas locales:  php -S 127.0.0.1:8001 tests/db/fake-graph.php
// Imita el diálogo OAuth, el intercambio de tokens y los endpoints de Graph que usa meta_lib.php (con datos de ejemplo).
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); $q = $_REQUEST;
header('Content-Type: application/json');
// Bitácora de lo que recibe (método, URL completa con query y nombres de los campos del cuerpo) para que las pruebas comprueben que ningún secreto viaja en la URL.
@file_put_contents('/tmp/graph-requests.log', $_SERVER['REQUEST_METHOD'] . ' ' . $_SERVER['REQUEST_URI'] . ' body=[' . implode(',', array_keys($_POST)) . ']' . "\n", FILE_APPEND);
$err = fn(string $m, int $c) => print(json_encode(['error' => ['message' => $m, 'code' => $c]]));
if ($path === '/dialog/oauth') {   // «el usuario autoriza»: vuelve al redirect_uri con un code
    if (($q['client_id'] ?? '') !== 'app123') { http_response_code(400); $err('App desconocida', 101); return; }
    $to = ($q['redirect_uri'] ?? '') . '?' . http_build_query(['code' => isset($_COOKIE['deny']) ? '' : 'FAKECODE', 'state' => $q['state'] ?? '']);
    header('Location: ' . $to); http_response_code(302); return;
}
if ($path === '/oauth/access_token') {
    if (($q['client_secret'] ?? '') !== 'sec') { http_response_code(400); $err('Secreto inválido', 101); return; }
    if (($q['grant_type'] ?? '') === 'fb_exchange_token') { echo json_encode(['access_token' => 'LONGTOKEN', 'expires_in' => 5184000]); return; }
    if (($q['code'] ?? '') === 'FAKECODE') { echo json_encode(['access_token' => 'SHORTTOKEN']); return; }
    http_response_code(400); $err('Código inválido', 100); return;
}
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($auth !== 'Bearer LONGTOKEN') { http_response_code(400); $err('Token inválido o vencido', 190); return; }
$IG = '17841400000000001';
if ($path === '/me/accounts') { echo json_encode(['data' => [['name' => 'Página QA', 'id' => '111', 'instagram_business_account' => ['id' => $IG, 'username' => 'qa.official']]]]); return; }
if ($path === "/$IG") { echo json_encode(['id' => $IG, 'username' => 'qa.official', 'followers_count' => 2500, 'follows_count' => 300, 'media_count' => 40]); return; }
if ($path === "/$IG/media") {
    echo json_encode(['data' => [
        ['id' => 'p1', 'caption' => 'Nuevo sencillo', 'media_type' => 'VIDEO', 'permalink' => 'https://instagram.com/p/p1', 'timestamp' => '2026-11-10T20:00:00+0000', 'like_count' => 300, 'comments_count' => 40],
        ['id' => 'p2', 'caption' => 'Foto del show', 'media_type' => 'IMAGE', 'permalink' => 'https://instagram.com/p/p2', 'timestamp' => '2026-11-05T18:30:00+0000', 'like_count' => 120, 'comments_count' => 10],
        ['id' => 'p3', 'media_type' => 'IMAGE', 'permalink' => 'https://instagram.com/p/p3', 'timestamp' => '2026-10-01T12:00:00+0000', 'like_count' => 50, 'comments_count' => 2],
    ]]); return;
}
if (preg_match('~^/(p\d)/insights$~', $path, $m)) {
    if ($m[1] === 'p3') { http_response_code(400); $err('Insights no disponibles para esta publicación', 100); return; }
    $v = ['p1' => [1000, 25, 12, 380], 'p2' => [400, 5, 2, 140]][$m[1]];
    echo json_encode(['data' => [['name' => 'reach', 'values' => [['value' => $v[0]]]], ['name' => 'saved', 'values' => [['value' => $v[1]]]], ['name' => 'shares', 'values' => [['value' => $v[2]]]], ['name' => 'total_interactions', 'values' => [['value' => $v[3]]]]]]); return;
}
if ($path === "/$IG/insights") {
    if (($q['metric'] ?? '') === 'reach') {
        $vals = []; for ($i = 29; $i >= 0; $i--) $vals[] = ['value' => 100 + (29 - $i) * 10, 'end_time' => gmdate('Y-m-d', time() - ($i - 1) * 86400) . 'T08:00:00+0000'];
        echo json_encode(['data' => [['name' => 'reach', 'period' => 'day', 'values' => $vals]]]); return;
    }
    if (($q['metric'] ?? '') === 'follower_demographics') {
        $bd = $q['breakdown'] ?? '';
        $res = ['age' => [['dimension_values' => ['18-24'], 'value' => 900], ['dimension_values' => ['25-34'], 'value' => 1100], ['dimension_values' => ['35-44'], 'value' => 300]],
                'gender' => [['dimension_values' => ['F'], 'value' => 1300], ['dimension_values' => ['M'], 'value' => 1100], ['dimension_values' => ['U'], 'value' => 100]],
                'city' => [['dimension_values' => ['Mexico City, Distrito Federal'], 'value' => 700], ['dimension_values' => ['Guadalajara, Jalisco'], 'value' => 300]],
                'country' => [['dimension_values' => ['MX'], 'value' => 2100], ['dimension_values' => ['US'], 'value' => 200]]][$bd] ?? null;
        if ($res === null) { http_response_code(400); $err('Breakdown no soportado', 100); return; }
        echo json_encode(['data' => [['name' => 'follower_demographics', 'total_value' => ['breakdowns' => [['dimension_keys' => [$bd], 'results' => $res]]]]]]); return;
    }
}
http_response_code(404); $err('Ruta no simulada: ' . $path, 803);
