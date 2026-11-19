<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
$me = require_login();
rate_limit('upload:' . $me['id'], 30, 600);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método no permitido.'], 405);

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_SIDE = 800;

$f = $_FILES['file'] ?? null;
if (!$f || $f['error'] !== UPLOAD_ERR_OK) {
    $msg = ($f['error'] ?? 0) === UPLOAD_ERR_INI_SIZE || ($f['error'] ?? 0) === UPLOAD_ERR_FORM_SIZE
        ? 'La imagen es demasiado grande para el servidor.' : 'No se recibió la imagen.';
    respond(['error' => $msg], 400);
}
if ($f['size'] > MAX_UPLOAD_BYTES) respond(['error' => 'La imagen supera los 6 MB.'], 413);
if (!is_uploaded_file($f['tmp_name'])) respond(['error' => 'Archivo no válido.'], 400);

$info = @getimagesize($f['tmp_name']);
$allowed = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'];
if (!$info || !isset($allowed[$info[2]])) respond(['error' => 'Formato no admitido. Usa JPG, PNG, WEBP o GIF.'], 415);

// Límite de píxeles ANTES de decodificar (una imagen pequeña en bytes puede ocupar gigas en memoria al descomprimirse).
if ($info[0] * $info[1] > 36000000) respond(['error' => 'La imagen tiene demasiados píxeles (máx. 36 megapíxeles).'], 413);

$dir = dirname(__DIR__) . '/uploads/avatars';
if (!is_dir($dir) && !@mkdir($dir, 0755, true)) respond(['error' => 'No se pudo crear la carpeta de imágenes.'], 500);
$guard = dirname(__DIR__) . '/uploads/.htaccess';
if (!is_file($guard)) {
    @file_put_contents($guard, "# Solo imágenes: nunca ejecutar código en esta carpeta\n<FilesMatch \"\\.(php|phtml|php[0-9]|phar|pl|cgi)$\">\n  Require all denied\n</FilesMatch>\nOptions -ExecCGI -Indexes\n");
}

$name = bin2hex(random_bytes(12));
$saved = false;

// Con GD: se redimensiona y se vuelve a codificar como JPG (elimina metadatos y cualquier contenido oculto).
if (function_exists('imagecreatefromstring')) {
    $src = @imagecreatefromstring((string)file_get_contents($f['tmp_name']));
    if ($src) {
        $w = imagesx($src); $h = imagesy($src);
        $scale = min(1, MAX_SIDE / max($w, $h));
        $nw = max(1, (int)round($w * $scale)); $nh = max(1, (int)round($h * $scale));
        $dst = imagecreatetruecolor($nw, $nh);
        imagefill($dst, 0, 0, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        $saved = imagejpeg($dst, "$dir/$name.jpg", 85);
        $ext = 'jpg';
    }
}
// Nunca se publica el archivo original: solo la imagen recodificada (así no puede quedar contenido ejecutable oculto).
if (!$saved) respond(['error' => 'No se pudo procesar la imagen (¿archivo dañado?).'], 422);

respond(['ok' => true, 'url' => "/uploads/avatars/$name.$ext"], 201);
