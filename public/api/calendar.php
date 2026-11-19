<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['error' => 'Método no permitido.'], 405);
$action = $_GET['action'] ?? '';
$in = body();

function evt_summary(array $e): string {
    return '🎭 Show: ' . ($e['name'] ?? '') . ' (' . ($e['artistName'] ?? 'Artista') . ' @ ' . ($e['venueName'] ?? 'Recinto') . ')';
}
function evt_description(array $e): string {
    return "Agendado desde Flamo CRM:\n- Artista: " . ($e['artistName'] ?? 'N/A')
        . "\n- Recinto: " . ($e['venueName'] ?? 'N/A')
        . "\n- Estado: " . ($e['status'] ?? 'Confirmado');
}
function valid_date(mixed $d): bool {
    if (!is_string($d) || preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/', $d, $m) !== 1) return false;
    return checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
}
function ics_escape(string $s): string {
    return str_replace(["\\", ";", ",", "\r\n", "\n", "\r"], ["\\\\", "\;", "\\,", "\\n", "\\n", "\\n"], $s);
}

// Un solo evento: devuelve el enlace de "Añadir a Google Calendar"
if ($action === 'sync-event') {
    $event = $in['event'] ?? null;
    if (!is_array($event) || empty($event['name']) || !valid_date($event['date'] ?? null)) {
        respond(['error' => 'Faltan datos requeridos del evento (nombre y fecha).'], 400);
    }
    $e = $event;
    $e['artistName'] = $in['artistName'] ?? 'Artista';
    $e['venueName'] = $in['venueName'] ?? 'Recinto';
    $d = str_replace('-', '', substr($event['date'], 0, 10));
    $next = date('Ymd', strtotime(substr($event['date'], 0, 10) . ' +1 day'));
    $desc = evt_description($e) . "\n- Boletos: $" . ($event['ticketPrice'] ?? 0) . "\n- Aforo/Capacidad: " . ($event['capacity'] ?? 0) . ' pax';
    $url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        . '&text=' . rawurlencode(evt_summary($e))
        . "&dates={$d}/{$next}"
        . '&details=' . rawurlencode($desc)
        . '&location=' . rawurlencode((string)($in['venueAddress'] ?? $in['venueName'] ?? ''));
    respond(['success' => true, 'syncedToApi' => false, 'webUrl' => $url,
        'message' => 'Evento preparado para tu Google Calendar personal.']);
}

// Varios eventos: genera un archivo .ics (importable en Google Calendar, Apple, Outlook)
if ($action === 'sync-all') {
    $events = is_array($in['events'] ?? null) ? $in['events'] : [];
    $lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Flamo CRM//ES', 'CALSCALE:GREGORIAN'];
    $count = 0;
    foreach (array_slice($events, 0, 1000) as $e) {
        if (!is_array($e) || empty($e['name']) || !valid_date($e['date'] ?? null)) continue;
        $day = substr($e['date'], 0, 10);
        $lines[] = 'BEGIN:VEVENT';
        $lines[] = 'UID:' . preg_replace('/[^A-Za-z0-9-]/', '', (string)($e['id'] ?? uniqid())) . '@flamo-crm';
        $lines[] = 'DTSTAMP:' . gmdate('Ymd\THis\Z');
        $lines[] = 'DTSTART;VALUE=DATE:' . str_replace('-', '', $day);
        $lines[] = 'DTEND;VALUE=DATE:' . date('Ymd', strtotime("$day +1 day"));
        $lines[] = 'SUMMARY:' . ics_escape(evt_summary($e));
        $lines[] = 'DESCRIPTION:' . ics_escape(evt_description($e));
        $lines[] = 'LOCATION:' . ics_escape((string)($e['venueAddress'] ?? $e['venueName'] ?? ''));
        $lines[] = 'END:VEVENT';
        $count++;
    }
    $lines[] = 'END:VCALENDAR';
    respond(['success' => true, 'syncedCount' => $count, 'total' => count($events),
        'ics' => implode("\r\n", $lines) . "\r\n",
        'message' => $count > 0
            ? "Se generó un archivo con $count eventos. Impórtalo en Google Calendar (Configuración → Importar)."
            : 'No hay eventos con fecha válida para exportar.']);
}

respond(['error' => 'Acción no válida.'], 400);
