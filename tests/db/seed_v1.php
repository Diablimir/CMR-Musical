<?php
declare(strict_types=1);
// Siembra datos en el esquema v1 (como los dejaba la versión anterior) para probar la migración.
function seed_v1(PDO $pdo): void {
    $T = '2026-03-01T10:00:00.000Z';
    $ins = fn(string $sql, array $rows) => array_map(fn($r) => $pdo->prepare($sql)->execute($r), $rows);
    $ins('INSERT INTO artistas (id,nombre_artistico,nombre_legal,genero,etapa_id,manager,booking_agent,isrc_default,sociedad_gestion,ciudad,estado,pais,foto,extra,created_at,updated_at,deleted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        ['art-1', 'Banda Uno', 'Banda Uno SA', 'Indie Rock, Pop,Urbano', 3, 'Andrés Mendoza', 'Flamo Booking Agency', 'MX123', 'SACM', 'CDMX', 'CDMX', 'México', '/uploads/avatars/a.jpg', json_encode(['subgenres' => ['Indie', 'Pop'], 'bio' => 'Bío con ñ', 'startDate' => '2019-05-01', 'languages' => ['Español', 'Inglés', 'español'], 'label' => 'Sello X', 'publisher' => 'Edit X', 'distributor' => 'Dist X', 'photoStyle' => ['zoom' => 1.2, 'rotation' => 5, 'blur' => 0], 'members' => ['Ana (Voz)', 'Luis (Batería)', 'Extra (Teclados)'], 'memberHistory' => [['id' => 'mh1', 'name' => 'Ana', 'role' => 'Voz', 'startDate' => '2019-01-01', 'venueName' => 'Foro Origen', 'active' => true], ['id' => 'mh2', 'name' => 'Luis', 'role' => 'Batería', 'startDate' => '2019-02-01', 'endDate' => '2022-01-01', 'active' => false]], 'socialMedia' => ['instagram' => '@uno', 'instagramConnected' => true, 'instagramConnectedUser' => '@uno_oficial', 'spotify' => 'https://spotify.com/uno'], 'pipeline' => [['id' => 'p1', 'name' => 'Logo', 'category' => 'Branding', 'completed' => true], ['id' => 'p2', 'name' => 'EPK', 'category' => 'Branding', 'completed' => false]], 'history' => [['id' => 'h1', 'date' => '2020-01-01', 'title' => 'Hito', 'description' => 'd', 'type' => 'milestone'], ['id' => 'h2', 'date' => '2021-06-01', 'title' => 'Disco', 'description' => '', 'type' => 'release']]]), $T, $T, null],
        ['art-2', 'Banda Dos', 'Banda Dos SA', 'Jazz', 7, 'andrés mendoza', '', null, null, 'GDL', 'Jalisco', 'México', '', json_encode([]), $T, $T, null],
        ['art-3', 'Solista Tres', null, '', 1, '', '', null, null, '', '', '', '', null, $T, $T, '2026-04-01T00:00:00.000Z'],
    ]);
    $ins('INSERT INTO venues (id,nombre,direccion,ciudad,estado,pais,latitud,longitud,rating,score_rentabilidad,extra,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        ['ven-1', 'Foro Uno', 'Calle 1', 'CDMX', 'CDMX', 'México', 19.4326, -99.1332, 4.5, 80, json_encode(['hours' => ['L-V 10-18', 'Sáb 12-22'], 'phone' => '+52 55', 'website' => 'https://foro.mx', 'userRatingsCount' => 1200, 'placeId' => 'ChIJabc', 'establishmentType' => 'Teatro', 'instagram' => '@foro', 'localBands' => ['Local 1', 'Local 2']]), $T, $T],
        ['ven-2', 'Foro Dos', '', 'GDL', 'Jalisco', 'México', 20.6, -103.3, 0, 0, null, $T, $T],
    ]);
    $ins('INSERT INTO contactos (id,venue_id,nombre,correo,telefono,rol) VALUES (?,?,?,?,?,?)', [
        ['con-1', 'ven-1', 'Ana López', 'ana@foro.com', '555-0001', 'Booking'],
        ['con-2', 'ven-1', 'Luis Pérez', '', '555-0002', 'booking'],
        ['con-3', 'ven-2', 'María García', 'maria@foro2.com', '', ''],
    ]);
    $pdo->exec("UPDATE venues SET contacto_principal_id = 'con-1' WHERE id = 'ven-1'");
    $ins('INSERT INTO proveedores (id,nombre,categoria,contacto,telefono,correo,rating,costo_por_show,notas,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)', [
        ['prov-1', 'Sonido SA', 'Sonido', 'Luis Sonido', '555-9', 'luis@sonido.com', 4.5, 15000.5, 'ok', $T],
        ['prov-2', 'Luces MX', 'Iluminación', '', '', '', 0, 0, null, $T],
    ]);
    $pdo->exec("INSERT INTO venue_proveedores (venue_id, proveedor_id) VALUES ('ven-1','prov-1')");
    $ins('INSERT INTO tours (id,artista_id,nombre,fecha_inicio,fecha_fin,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', [
        ['tour-1', 'art-1', 'Gira 26', '2026-03-01', '2026-06-01', 'Active', $T, $T],
    ]);
    $ins('INSERT INTO eventos (id,nombre,artista_id,venue_id,tour_id,fecha,estado,capacidad,asistencia,precio_boleto,ingreso_total,gastos_totales,utilidad,extra,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [
        ['evt-1', 'Show 1', 'art-1', 'ven-1', 'tour-1', '2026-04-10', 'Completed', 500, 450, 350.5, 157725, 50000, 107725, json_encode(['guestBands' => ['G1', 'G2'], 'setlist' => [['id' => 's1', 'songTitle' => 'Canción', 'duration' => '3:20', 'tempo' => 'Rápido', 'transitionNotes' => 'Luz roja'], ['id' => 's2', 'songTitle' => 'Balada', 'duration' => '4:05']], 'feedback' => ['artistThoughts' => 'Muy bien', 'crowdReaction' => 'Cantaron', 'pacingRating' => 4, 'optimizationNotes' => 'Subir tempo']]), $T, $T],
        ['evt-2', 'Show 2', 'art-2', 'ven-2', null, '2026-05-10', 'Draft', 100, 0, 0, 0, 0, 0, null, $T, $T],
        ['evt-3', 'Show 3', 'art-1', 'ven-2', null, '2026-06-10', 'Cancelled', 100, 0, 0, 0, 0, 0, null, $T, $T],
    ]);
    $ins('INSERT INTO contratos (id,titulo,artista_id,venue_id,tour_id,evento_id,tipo,estado,nombre_archivo,tamano,fecha_subida,notas) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [
        ['ctr-1', 'Contrato', 'art-1', 'ven-1', 'tour-1', 'evt-1', 'Booking', 'Signed', 'c.pdf', '2.4 MB', $T, 'n'],
        ['ctr-2', 'Sin relaciones', null, null, null, null, 'Other', 'Draft', 'd.pdf', '512 KB', $T, null],
        ['ctr-3', 'De gira', 'art-2', null, 'tour-1', null, 'Management', 'Pending', 'g.pdf', '1 MB', $T, null],
    ]);
    $ins('INSERT INTO proyectos_grabacion (id,titulo,artista_id,estado,fecha_lanzamiento,estudio,productor,extra,created_at) VALUES (?,?,?,?,?,?,?,?,?)', [
        ['rec-1', 'Álbum', 'art-1', 'Grabando', '2027-01-01', 'E', 'P', json_encode(['songs' => [['id' => 'so1', 'title' => 'T1', 'status' => 'Demo', 'progress' => 40, 'duration' => '2:30', 'composer' => 'Yo'], ['id' => 'so2', 'title' => 'T2', 'status' => 'Listo', 'progress' => 100]], 'costs' => [['id' => 'c1', 'concept' => 'Estudio', 'category' => 'Estudio/Grabación', 'amount' => 10000.5], ['id' => 'c2', 'concept' => 'Mezcla', 'category' => 'Mezcla', 'amount' => 3000, 'notes' => 'n']], 'payments' => [['id' => 'pa1', 'concept' => 'Anticipo', 'amount' => 5000, 'dueDate' => '2026-12-01', 'status' => 'Pendiente'], ['id' => 'pa2', 'concept' => 'Final', 'amount' => 8000.5, 'dueDate' => '2027-01-15', 'status' => 'Pagado']], 'stages' => [['id' => 'st1', 'name' => 'Grabación', 'status' => 'En Progreso', 'startDate' => '2026-11-01', 'instruments' => [['id' => 'i1', 'name' => 'Batería', 'status' => 'Listo', 'musician' => 'Luis'], ['id' => 'i2', 'name' => 'Bajo', 'status' => 'Pendiente']]], ['id' => 'st2', 'name' => 'Mezcla', 'status' => 'Pendiente']]]), $T],
    ]);
}
