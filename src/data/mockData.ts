import { Artist, Venue, Contact, Event, Tour, PipelineItem, HistoryEvent, Contract, Provider, RecordingProject } from '../types';

// Standard Pipeline Checklist template for Artists
const createDefaultPipeline = (): PipelineItem[] => [
  { id: 'p1', name: 'Identity Branding', category: 'Branding', completed: true },
  { id: 'p2', name: 'Logotipo & Isotipo Oficial', category: 'Branding', completed: true },
  { id: 'p3', name: 'Photoshoot Editorial / Prensa', category: 'Branding', completed: true },
  { id: 'p4', name: 'Electronic Press Kit (EPK) 2026', category: 'Branding', completed: false },
  { id: 'p5', name: 'Biografía Oficial Multi-lenguaje', category: 'Branding', completed: true },
  { id: 'p6', name: 'Distribuidora Premium (Amuse/TuneCore)', category: 'Distribución', completed: true },
  { id: 'p7', name: 'Registro de Obras INDAUTOR', category: 'Distribución', completed: true },
  { id: 'p8', name: 'Registro ISRC & ISWC', category: 'Distribución', completed: true },
  { id: 'p9', name: 'Afiliación SACM / ASCAP / BMI', category: 'Distribución', completed: true },
  { id: 'p10', name: 'Verificación Spotify for Artists', category: 'Presencia', completed: true },
  { id: 'p11', name: 'Verificación Apple Music for Artists', category: 'Presencia', completed: true },
  { id: 'p12', name: 'Redes Sociales unificadas (@handle)', category: 'Presencia', completed: true },
  { id: 'p13', name: 'Merchandising Oficial (Diseño & Stock)', category: 'Presencia', completed: false },
  { id: 'p14', name: 'Sponsorships & Patrocinios', category: 'Presencia', completed: false },
  { id: 'p15', name: 'Booking Nacional Activo', category: 'Booking & Management', completed: true },
  { id: 'p16', name: 'Booking Internacional En Progreso', category: 'Booking & Management', completed: false },
  { id: 'p17', name: 'Legal & Management Retainer', category: 'Booking & Management', completed: true },
  { id: 'p18', name: 'Gira de Prensa / Radiodifusión', category: 'Booking & Management', completed: false },
];

export const initialArtists: Artist[] = [
  {
    id: 'art-1',
    artisticName: 'Vladimir Belmont',
    legalName: 'Vladimir Belmont Guerrero',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bio: 'Pianista y productor de Neo-Classical Electronic que fusiona arreglos de orquesta acústica con sintetizadores analógicos modulares y ritmos IDM progresivos. Basado en la Ciudad de México con proyección internacional.',
    genre: 'Neo-Classical / Electronic',
    subgenres: ['Ambient', 'IDM', 'Modern Classical', 'Symphonic Techno'],
    languages: ['Español', 'Inglés'],
    startDate: '2019-04-12',
    city: 'CDMX',
    state: 'CDMX',
    country: 'México',
    members: ['Vladimir Belmont (Piano, Sintetizadores)', 'Sofia Cárdenas (Cello, Violín)'],
    manager: 'Clara Domínguez (Ocesa / Seitrack)',
    bookingAgent: 'Andrés Mendoza (Flamo Booking)',
    label: 'Erased Tapes Records (Europe)',
    publisher: 'Warner Chappell Music',
    distributor: 'FUGA',
    isrc: 'MX-F12-26-00045',
    iswc: 'T-918.234.091-2',
    pro: 'SACM',
    rfc: 'BEGV890412H89',
    stage: 'Consolidado',
    socialMedia: {
      instagram: 'https://instagram.com/vladbelmont',
      tiktok: 'https://tiktok.com/@vladbelmont.music',
      facebook: 'https://facebook.com/vladimirbelmont',
      youtube: 'https://youtube.com/vladimirbelmont',
      spotify: 'https://open.spotify.com/artist/vladbelmont',
      appleMusic: 'https://music.apple.com/artist/vladimir-belmont',
      website: 'https://vladimirbelmont.com',
      twitter: 'https://twitter.com/vladbelmont',
      threads: 'https://threads.net/@vladbelmont',
      whatsapp: 'https://wa.me/525512345678',
    },
    pipeline: createDefaultPipeline().map(item => 
      ['p4', 'p13', 'p16', 'p18'].includes(item.id) ? { ...item, completed: false } : { ...item, completed: true }
    ),
    history: [
      { id: 'h1', date: '2019-06-15', title: 'Debut Album Release', description: 'Lanzamiento de "Echoes of Silence" bajo distribución independiente logrando entrar a playlists editoriales.', type: 'release' },
      { id: 'h2', date: '2021-11-04', title: 'Firma de Contrato de Publishing', description: 'Suscripción de acuerdo editorial mundial con Warner Chappell Music.', type: 'signing' },
      { id: 'h3', date: '2023-05-18', title: 'Sold Out Lunario CDMX', description: 'Primer concierto estelar con boletos agotados en el icónico Lunario del Auditorio Nacional.', type: 'achievement' },
      { id: 'h4', date: '2024-09-12', title: 'Firma Internacional', description: 'Incorporación al roster de artistas del prestigioso sello europeo Erased Tapes Records.', type: 'signing' },
      { id: 'h5', date: '2025-03-20', title: 'Primer Tour Nacional', description: 'Gira "Symphonic Echoes" con 8 fechas con boleto pagado en las principales ciudades de la República.', type: 'tour' }
    ],
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2026-07-13T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'art-2',
    artisticName: 'Lara & The Moon',
    legalName: 'Lara Solórzano Estrada',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Proyecto de Indie Dream Pop liderado por Lara Solórzano. Caracterizado por melodías de guitarra con reverb, letras melancólicas e introspectivas y una voz dulce y flotante que transporta a mundos celestiales.',
    genre: 'Indie Pop',
    subgenres: ['Dream Pop', 'Shoegaze', 'Singer-Songwriter'],
    languages: ['Español'],
    startDate: '2023-01-10',
    city: 'Guadalajara',
    state: 'Jalisco',
    country: 'México',
    members: ['Lara Solórzano (Voz, Guitarra)', 'Mateo Ruíz (Bajo)', 'Daniela Ponce (Batería)'],
    manager: 'Andrés Mendoza (Flamo Management)',
    bookingAgent: 'Andrés Mendoza (Flamo Booking)',
    label: 'Independiente',
    publisher: 'Frecuencia Editorial',
    distributor: 'Amuse',
    isrc: 'MX-A34-26-90112',
    iswc: 'T-982.012.334-0',
    pro: 'SACM',
    rfc: 'SOEL010515R83',
    stage: 'Emergente',
    socialMedia: {
      instagram: 'https://instagram.com/laraythemoon',
      tiktok: 'https://tiktok.com/@laraythemoon',
      youtube: 'https://youtube.com/laraythemoon',
      spotify: 'https://open.spotify.com/artist/laraythemoon',
      whatsapp: 'https://wa.me/523398765432',
    },
    pipeline: createDefaultPipeline().map(item => 
      ['p3', 'p4', 'p13', 'p14', 'p15', 'p16', 'p18'].includes(item.id) ? { ...item, completed: false } : item
    ),
    history: [
      { id: 'h10', date: '2023-03-01', title: 'Lanzamiento de Primer Sencillo', description: '"Luna de Octubre" alcanza 50K reproducciones orgánicas en su primer mes.', type: 'release' },
      { id: 'h11', date: '2024-05-10', title: 'Primer Show en Guadalajara', description: 'Actuación con aforo completo en el Foro C3 Stage (Anexo) como soporte de un artista nacional.', type: 'milestone' },
      { id: 'h12', date: '2025-02-14', title: 'EP Lanzamiento', description: 'Presentación del EP de 5 canciones titulado "Cosmogonías" con excelente recepción crítica.', type: 'release' }
    ],
    created_at: '2025-02-15T09:00:00Z',
    updated_at: '2026-07-12T15:30:00Z',
    deleted_at: null,
  },
  {
    id: 'art-3',
    artisticName: 'Stereo Horizon',
    legalName: 'Synthwave Horizon S.A. de C.V.',
    photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    bio: 'Dúo regiomontano de Synthwave y Outrun electrónico. Con estéticas de neón retro-futuristas de los 80s, cajas de ritmo vintage y melodías cinemáticas ideales para conducir de noche.',
    genre: 'Electronic',
    subgenres: ['Synthwave', 'Retrowave', 'Outrun', 'Cyberpunk'],
    languages: ['Inglés', 'Español'],
    startDate: '2021-08-20',
    city: 'Monterrey',
    state: 'Nuevo León',
    country: 'México',
    members: ['Carlos Garza (Sintetizadores, Programación)', 'Emilio Treviño (Guitarras, Vocoder)'],
    manager: 'Federico Treviño',
    bookingAgent: 'Andrés Mendoza (Flamo Booking)',
    label: 'Lakeshore Records',
    publisher: 'Sony Music Publishing',
    distributor: 'The Orchard',
    isrc: 'MX-B89-25-33411',
    stage: 'Media carrera',
    socialMedia: {
      instagram: 'https://instagram.com/stereohorizon',
      facebook: 'https://facebook.com/stereohorizon',
      spotify: 'https://open.spotify.com/artist/stereohorizon',
      website: 'https://stereohorizon.net',
    },
    pipeline: createDefaultPipeline().map(item => 
      ['p4', 'p14', 'p16'].includes(item.id) ? { ...item, completed: false } : { ...item, completed: true }
    ),
    history: [
      { id: 'h20', date: '2021-10-01', title: 'Fundación del Dúo', description: 'Unión de Carlos y Emilio tras proyectos alternos de rock psicodélico.', type: 'milestone' },
      { id: 'h21', date: '2022-12-15', title: 'Lanzamiento de "Neon Highway"', description: 'Sencillo viralizado en comunidades de gaming de Twitch y YouTube.', type: 'release' },
      { id: 'h22', date: '2024-06-20', title: 'Firma con Lakeshore Records', description: 'Inclusión en soundtracks cinematográficos de renombre internacional.', type: 'signing' }
    ],
    created_at: '2025-01-10T14:00:00Z',
    updated_at: '2026-07-10T11:20:00Z',
    deleted_at: null,
  }
];

export const initialVenues: Venue[] = [
  {
    id: 'ven-1',
    name: 'Lunario del Auditorio Nacional',
    address: 'Avenida Paseo de la Reforma 50, Bosque de Chapultepec I Secc, Miguel Hidalgo',
    city: 'CDMX',
    state: 'CDMX',
    country: 'México',
    postalCode: '11580',
    lat: 19.4262,
    lng: -99.1864,
    website: 'https://www.lunario.com.mx',
    phone: '55 9138 1350',
    rating: 4.8,
    userRatingsCount: 4320,
    placeId: 'ChIJXzFUXW_90YUR4DSwk_K57_w',
    establishmentType: 'Foro Concert Hall',
    hours: ['Lunes a Viernes: 10:00 - 18:00', 'Fines de semana de evento: 14:00 - 22:00'],
    instagram: 'https://instagram.com/lunariomx',
    facebook: 'https://facebook.com/lunariomx',
    twitter: 'https://twitter.com/lunariomx',
    email: 'contacto@auditorio.com.mx',
    whatsapp: '5591381350',
    scoreRentabilidad: 92,
    scoreResponseTime: 85,
    scorePuntualidadPago: 98,
    scoreNegociacion: 78,
    scoreProduccion: 96,
    scoreHospitalidad: 90,
    contactoPrincipalId: 'con-1', // Lunario principal
    created_at: '2025-01-01T12:00:00Z',
    updated_at: '2026-07-13T09:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ven-2',
    name: 'C3 Stage',
    address: 'Avenida Vallarta 1488, Lafayette',
    city: 'Guadalajara',
    state: 'Jalisco',
    country: 'México',
    postalCode: '44160',
    lat: 20.6756,
    lng: -103.3705,
    website: 'https://www.c3stage.com',
    phone: '33 1955 5757',
    rating: 4.5,
    userRatingsCount: 1890,
    placeId: 'ChIJzWvM6_S-xoYRv_NenB0rQ8k',
    establishmentType: 'Club de Música / Recinto de Eventos',
    hours: ['Martes a Sábado: 12:00 - 20:00'],
    instagram: 'https://instagram.com/c3stage',
    facebook: 'https://facebook.com/c3stage',
    email: 'booking@c3stage.com',
    scoreRentabilidad: 88,
    scoreResponseTime: 92,
    scorePuntualidadPago: 85,
    scoreNegociacion: 80,
    scoreProduccion: 85,
    scoreHospitalidad: 82,
    contactoPrincipalId: 'con-2',
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2026-07-11T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ven-3',
    name: 'Café Iguana',
    address: 'Calle Diego de Montemayor 927, Barrio Antiguo, Centro',
    city: 'Monterrey',
    state: 'Nuevo León',
    country: 'México',
    postalCode: '64000',
    lat: 25.6663,
    lng: -100.3068,
    website: 'https://www.cafeiguana.com.mx',
    phone: '81 8343 0822',
    rating: 4.6,
    userRatingsCount: 2950,
    placeId: 'ChIJj7bW416BYoYRHmI3bI4qOqM',
    establishmentType: 'Bar de Rock / Foro Alternativo',
    hours: ['Miércoles a Domingo: 18:00 - 02:00'],
    instagram: 'https://instagram.com/cafeiguanamx',
    facebook: 'https://facebook.com/cafeiguanamty',
    email: 'contacto@cafeiguana.com.mx',
    whatsapp: '8183430822',
    scoreRentabilidad: 80,
    scoreResponseTime: 75,
    scorePuntualidadPago: 90,
    scoreNegociacion: 85,
    scoreProduccion: 70,
    scoreHospitalidad: 88,
    contactoPrincipalId: 'con-3',
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2026-07-12T14:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ven-4',
    name: 'Teatro Metropólitan',
    address: 'Independencia 90, Colonia Centro, Centro',
    city: 'CDMX',
    state: 'CDMX',
    country: 'México',
    postalCode: '06050',
    lat: 19.4342,
    lng: -99.1444,
    website: 'https://www.ticketmaster.com.mx/teatro-metropolitan-boletos-mexico/venue/163851',
    phone: '55 5510 1396',
    rating: 4.7,
    userRatingsCount: 8120,
    placeId: 'ChIJb6e9pC_90YURkK_7_U-T9v8',
    establishmentType: 'Teatro Histórico Art Deco',
    hours: ['Lunes a Sábado: 11:00 - 18:00'],
    instagram: 'https://instagram.com/tmetropolitanmx',
    facebook: 'https://facebook.com/teatrometropolitan',
    email: 'metropolitan@ocesa.mx',
    scoreRentabilidad: 95,
    scoreResponseTime: 80,
    scorePuntualidadPago: 96,
    scoreNegociacion: 72,
    scoreProduccion: 98,
    scoreHospitalidad: 92,
    contactoPrincipalId: 'con-4',
    created_at: '2025-02-01T11:00:00Z',
    updated_at: '2026-07-10T16:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ven-5',
    name: 'Foro Indie Rocks!',
    address: 'Calle Zacatecas 39, Roma Norte, Cuauhtémoc',
    city: 'CDMX',
    state: 'CDMX',
    country: 'México',
    postalCode: '06700',
    lat: 19.4168,
    lng: -99.1554,
    website: 'https://www.indierocks.mx/foro',
    phone: '55 5207 4331',
    rating: 4.4,
    userRatingsCount: 1540,
    placeId: 'ChIJVVWXV7P_0YURH7Y9gUqGPlc',
    establishmentType: 'Foro de Conciertos Independientes & Jardín',
    hours: ['Miércoles a Sábado: 14:00 - 02:00'],
    instagram: 'https://instagram.com/foroindierocks',
    facebook: 'https://facebook.com/foroindierocks',
    email: 'foro@indierocks.mx',
    scoreRentabilidad: 84,
    scoreResponseTime: 88,
    scorePuntualidadPago: 92,
    scoreNegociacion: 88,
    scoreProduccion: 80,
    scoreHospitalidad: 85,
    contactoPrincipalId: 'con-5',
    created_at: '2025-02-10T09:00:00Z',
    updated_at: '2026-07-13T11:00:00Z',
    deleted_at: null,
  }
];

export const initialContacts: Contact[] = [
  { id: 'con-1', name: 'Ignacio Ortiz', email: 'ignacio.ortiz@auditorio.com.mx', phone: '55 9138 1352', role: 'Director de Booking & Programación', venueId: 'ven-1' },
  { id: 'con-1b', name: 'Laura Salgado', email: 'laura.salgado@auditorio.com.mx', phone: '55 9138 1361', role: 'Coordinadora Técnica de Producción', venueId: 'ven-1' },
  { id: 'con-2', name: 'Rodrigo Flores', email: 'rodrigo@c3stage.com', phone: '33 1955 5759', role: 'Gerente General & Contrataciones', venueId: 'ven-2' },
  { id: 'con-3', name: 'Chapa Martínez', email: 'chapa@cafeiguana.com.mx', phone: '81 8343 0824', role: 'Fundador & Booker Principal', venueId: 'ven-3' },
  { id: 'con-4', name: 'Federico Altamirano', email: 'faltamirano@ocesa.mx', phone: '55 5510 1398', role: 'Coordinador de Espectáculos Ocesa', venueId: 'ven-4' },
  { id: 'con-5', name: 'Cynthia Flores', email: 'cynthia@indierocks.mx', phone: '55 5207 4333', role: 'Directora Ejecutiva', venueId: 'ven-5' }
];

export const initialTours: Tour[] = [
  {
    id: 'tour-1',
    name: 'Neo-Symphony Tour 2026',
    artistId: 'art-1',
    startDate: '2026-03-01',
    endDate: '2026-10-31',
    status: 'Active',
    created_at: '2025-11-15T12:00:00Z',
    updated_at: '2026-07-13T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'tour-2',
    name: 'Cosmogonías Tour 2026',
    artistId: 'art-2',
    startDate: '2026-05-10',
    endDate: '2026-12-15',
    status: 'Active',
    created_at: '2026-02-20T09:00:00Z',
    updated_at: '2026-07-12T15:00:00Z',
    deleted_at: null,
  }
];

export const initialEvents: Event[] = [
  // Vladimir Belmont (art-1) Events
  {
    id: 'evt-1',
    name: 'Vladimir Belmont: Neo-Symphony Live CDMX',
    artistId: 'art-1',
    venueId: 'ven-1', // Lunario
    date: '2026-03-12',
    capacity: 1000,
    attendance: 1000, // Sold out!
    ticketPrice: 650,
    totalIncome: 650000,
    expenses: 180000,
    profit: 470000,
    status: 'Completed',
    tourId: 'tour-1',
    guestBands: ['Lara & The Moon', 'Sofia Cárdenas (Violín/Cello)'],
    setlist: [
      { id: 'set-1', songTitle: 'Overture to the Cosmos', duration: '4:20', tempo: 'Lento', transitionNotes: 'Entrada con luces atenuadas, directo a piano acústico' },
      { id: 'set-2', songTitle: 'Modular Waves', duration: '3:50', tempo: 'Rápido', transitionNotes: 'Transición directa con arpegios de sintetizador modular' },
      { id: 'set-3', songTitle: 'Symphonic Echoes', duration: '5:15', tempo: 'Rápido', transitionNotes: 'Solo de Cello de Sofía seguido de clímax con caja de ritmo' },
      { id: 'set-4', songTitle: 'Digital Dawn', duration: '3:45', tempo: 'Medio', transitionNotes: 'Despedida emotiva y agradecimientos al público' }
    ],
    feedback: {
      artistThoughts: 'Me sentí sumamente conectado con el público en el Lunario. Sin embargo, abrir con "Overture to the Cosmos" retrasó un poco el impacto enérgico. Se sintió un poco lento el arranque de la gente.',
      crowdReaction: 'La audiencia enloqueció cuando Sofía entró al Cello en "Symphonic Echoes". Esa transición salvó el ritmo inicial y mantuvo a todos de pie.',
      pacingRating: 4,
      optimizationNotes: 'Para el show del Teatro Metropólitan, sugiero mover "Modular Waves" (tempo Rápido) como segunda o incluso primera canción para enganchar de golpe, y dejar "Overture to the Cosmos" para el encore.'
    },
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2026-03-13T09:00:00Z',
    deleted_at: null,
  },
  {
    id: 'evt-2',
    name: 'Vladimir Belmont: Neo-Symphony Guadalajara',
    artistId: 'art-1',
    venueId: 'ven-2', // C3 Stage
    date: '2026-05-18',
    capacity: 900,
    attendance: 780,
    ticketPrice: 480,
    totalIncome: 374400,
    expenses: 120000,
    profit: 254400,
    status: 'Completed',
    tourId: 'tour-1',
    created_at: '2026-01-10T11:00:00Z',
    updated_at: '2026-05-19T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'evt-3',
    name: 'Vladimir Belmont: Neo-Symphony Monterrey',
    artistId: 'art-1',
    venueId: 'ven-3', // Café Iguana
    date: '2026-06-25',
    capacity: 700,
    attendance: 590,
    ticketPrice: 400,
    totalIncome: 236000,
    expenses: 95000,
    profit: 141000,
    status: 'Completed',
    tourId: 'tour-1',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-06-26T11:00:00Z',
    deleted_at: null,
  },
  {
    id: 'evt-4',
    name: 'Vladimir Belmont: Grand Orchestral Live CDMX',
    artistId: 'art-1',
    venueId: 'ven-4', // Teatro Metropólitan
    date: '2026-09-15',
    capacity: 3100,
    attendance: 2850,
    ticketPrice: 850,
    totalIncome: 2422500,
    expenses: 750000,
    profit: 1672500,
    status: 'Confirmed',
    tourId: 'tour-1',
    created_at: '2026-04-10T12:00:00Z',
    updated_at: '2026-07-13T10:00:00Z',
    deleted_at: null,
  },

  // Lara & The Moon (art-2) Events
  {
    id: 'evt-5',
    name: 'Lara & The Moon: Dreamcatcher Tour GDL',
    artistId: 'art-2',
    venueId: 'ven-2', // C3 Stage
    date: '2026-05-10',
    capacity: 900,
    attendance: 520,
    ticketPrice: 300,
    totalIncome: 156000,
    expenses: 55000,
    profit: 101000,
    status: 'Completed',
    tourId: 'tour-2',
    created_at: '2026-02-25T14:00:00Z',
    updated_at: '2026-05-11T10:00:00Z',
    deleted_at: null,
  },
  {
    id: 'evt-6',
    name: 'Lara & The Moon: Dreamcatcher Tour CDMX',
    artistId: 'art-2',
    venueId: 'ven-5', // Foro Indie Rocks!
    date: '2026-07-25',
    capacity: 600,
    attendance: 410,
    ticketPrice: 350,
    totalIncome: 143500,
    expenses: 45000,
    profit: 98500,
    status: 'Confirmed',
    tourId: 'tour-2',
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-07-12T15:00:00Z',
    deleted_at: null,
  },
  {
    id: 'evt-7',
    name: 'Lara & The Moon: Dreamcatcher Tour MTY',
    artistId: 'art-2',
    venueId: 'ven-3', // Café Iguana
    date: '2026-10-18',
    capacity: 700,
    attendance: 0, // Upcoming
    ticketPrice: 320,
    totalIncome: 0,
    expenses: 40000, // Budgeted
    profit: -40000,
    status: 'Confirmed',
    tourId: 'tour-2',
    created_at: '2026-04-12T10:00:00Z',
    updated_at: '2026-07-12T15:00:00Z',
    deleted_at: null,
  }
];

export const initialContracts: Contract[] = [
  {
    id: 'con-1',
    title: 'Contrato de Representación Artística y Management Exclusivo',
    artistId: 'art-1', // Vladimir Belmont
    fileName: 'CONTRATO_MGMT_EXCLUSIVE_BELMONT_2026.pdf',
    fileSize: '1.8 MB',
    status: 'Signed',
    uploadedAt: '2026-01-15T11:20:00Z',
    type: 'Management',
    notes: 'Management al 15% de comisión sobre ingresos brutos de shows y patrocinios.'
  },
  {
    id: 'con-2',
    title: 'Contrato de Arrendamiento e Inmueble para Concierto (Lunario)',
    venueId: 'ven-1', // Lunario
    eventId: 'evt-1', // Neo-Symphony Live CDMX
    tourId: 'tour-1',
    fileName: 'ARRENDAMIENTO_LUNARIO_BELMONT_SIGNED.pdf',
    fileSize: '2.4 MB',
    status: 'Signed',
    uploadedAt: '2026-02-10T14:45:00Z',
    type: 'Foro/Arrendamiento',
    notes: 'Depósito de garantía reembolsable pagado. Seguro de responsabilidad civil contratado.'
  },
  {
    id: 'con-3',
    title: 'Contrato de Co-Producción de Espectáculo En Vivo - C3 Stage',
    venueId: 'ven-2', // C3 Stage
    eventId: 'evt-5', // Lara & The Moon Tour
    tourId: 'tour-2',
    fileName: 'COPROD_C3STAGE_LARA_2026.pdf',
    fileSize: '950 KB',
    status: 'Active',
    uploadedAt: '2026-04-18T09:15:00Z',
    type: 'Co-production',
    notes: 'Acuerdo de Split 70/30 a favor del artista tras recuperar costos operativos.'
  },
  {
    id: 'con-4',
    title: 'Acuerdo de Confidencialidad y NDA de Gira (Non-Disclosure)',
    artistId: 'art-2', // Lara & The Moon
    fileName: 'NDA_GLOBAL_LARA_MOON_PRODUCTIONS.pdf',
    fileSize: '450 KB',
    status: 'Signed',
    uploadedAt: '2026-03-01T10:00:00Z',
    type: 'NDA',
    notes: 'Suscrito por todo el crew técnico de gira, músicos de sesión e ingenieros.'
  }
];

export const initialProviders: Provider[] = [
  {
    id: 'prov-1',
    name: 'Sonido Crew CDMX',
    category: 'Sonido',
    contactName: 'Miguel Juárez',
    phone: '55 4321 0987',
    email: 'mjuarez@sonidocrew.mx',
    rating: 5,
    costPerShow: 25000,
    notes: 'Excelente equipo de PA Meyer Sound, incluye personal de montaje.',
    venueIds: ['ven-1', 'ven-4', 'ven-5'],
    created_at: '2026-01-10T12:00:00Z'
  },
  {
    id: 'prov-2',
    name: 'Ing. Carlos Sound',
    category: 'Ingeniero de Audio',
    contactName: 'Carlos Santillán',
    phone: '55 1122 3344',
    email: 'carlos.sound@audioing.com',
    rating: 5,
    costPerShow: 8000,
    notes: 'Ingeniero de sala oficial para shows de Vladimir Belmont. Especialista en consolas Digico.',
    venueIds: ['ven-1', 'ven-2', 'ven-4'],
    created_at: '2026-02-15T12:00:00Z'
  },
  {
    id: 'prov-3',
    name: 'Neo Lights & Escena',
    category: 'Iluminación',
    contactName: 'Adriana Ponce',
    phone: '33 9988 7766',
    email: 'contacto@neolights.mx',
    rating: 4,
    costPerShow: 15000,
    notes: 'Rigs de luces móviles de última generación y lasers para shows electrónicos.',
    venueIds: ['ven-2', 'ven-3'],
    created_at: '2026-03-01T12:00:00Z'
  }
];

export const initialRecordingProjects: RecordingProject[] = [
  {
    id: 'rec-1',
    title: 'Symphony of the Future',
    artistId: 'art-1', // Vladimir Belmont
    status: 'Grabando',
    releaseDate: '2026-11-15',
    studio: 'Estudios Sony CDMX',
    producer: 'Vladimir Belmont / Clara Domínguez',
    songs: [
      { id: 'song-1', title: 'Overture to the Cosmos', duration: '4:20', composer: 'Vladimir Belmont', status: 'Listo', progress: 100, notes: 'Piano y sintetizadores principales masterizados con éxito.' },
      { id: 'song-2', title: 'Modular Waves', duration: '3:50', composer: 'Vladimir Belmont', status: 'Mezcla', progress: 85, notes: 'Mezclando bajo sintetizado analógico con Cello acústico.' },
      { id: 'song-3', title: 'Symphonic Echoes (feat. Sofia Cárdenas)', duration: '5:15', composer: 'Vladimir Belmont', status: 'Grabación de Instrumentos', progress: 60, notes: 'Falta grabar la sección de violines finales la próxima semana.' },
      { id: 'song-4', title: 'Digital Dawn', duration: '3:45', composer: 'Vladimir Belmont', status: 'Demo', progress: 20, notes: 'Demo inicial aprobado por la discográfica.' }
    ],
    costs: [
      { id: 'cost-1', concept: 'Estudios Sony CDMX (10 sesiones)', category: 'Estudio/Grabación', amount: 45000, notes: 'Incluye asistente de grabación y cafetería' },
      { id: 'cost-2', concept: 'Sofía Cárdenas (Violonchelo y Arreglos)', category: 'Músicos de Sesión', amount: 12000, notes: 'Grabación en Symphonic Echoes' },
      { id: 'cost-3', concept: 'Héctor Luna (Baterista de Sesión)', category: 'Músicos de Sesión', amount: 8000, notes: 'Rítmicas base grabadas en 2 sesiones' },
      { id: 'cost-4', concept: 'Clara Domínguez (Mezcla de todo el álbum)', category: 'Mezcla', amount: 25000, notes: 'Tarifa preferencial para 10 temas' },
      { id: 'cost-5', concept: 'Sterling Sound NY (Masterización)', category: 'Masterización', amount: 15000, notes: 'Ingeniero de mastering senior asignado' }
    ],
    payments: [
      { id: 'pay-1', concept: 'Anticipo de Estudio (Apartado)', amount: 25000, dueDate: '2026-02-15', status: 'Pagado', notes: 'Transferencia electrónica a Sony Music S.A.' },
      { id: 'pay-2', concept: 'Honorarios Músicos de Sesión', amount: 20000, dueDate: '2026-05-10', status: 'Pagado', notes: 'Pago completo a Sofía y Héctor' },
      { id: 'pay-3', concept: 'Anticipo de Mezcla (50%)', amount: 12500, dueDate: '2026-08-01', status: 'Pendiente', notes: 'Por liquidar al iniciar etapa de mezcla' },
      { id: 'pay-4', concept: 'Pago Restante Estudio & Master', amount: 47500, dueDate: '2026-10-15', status: 'Pendiente', notes: 'Sujeto a entrega de masters' }
    ],
    stages: [
      { id: 'stg-1', name: 'Pre-producción', status: 'Completado', startDate: '2026-01-15', endDate: '2026-03-01', notes: 'Maquetas de sintetizadores listas y estructura aprobada.' },
      {
        id: 'stg-2',
        name: 'Grabación',
        status: 'En Progreso',
        startDate: '2026-03-10',
        notes: 'Grabación en curso de cuerdas y retoques vocales.',
        instruments: [
          { id: 'inst-1', name: 'Piano & Sintetizadores', status: 'Listo', musician: 'Vladimir Belmont' },
          { id: 'inst-2', name: 'Batería acústica', status: 'Listo', musician: 'Héctor Luna' },
          { id: 'inst-3', name: 'Bajo eléctrico', status: 'Listo', musician: 'Carlos Mendoza' },
          { id: 'inst-4', name: 'Violonchelo y Cuerdas', status: 'Grabando', musician: 'Sofía Cárdenas' },
          { id: 'inst-5', name: 'Sintetizadores adicionales', status: 'Pendiente' }
        ]
      },
      { id: 'stg-3', name: 'Revisión', status: 'Pendiente', notes: 'Control de calidad de tomas.' },
      { id: 'stg-4', name: 'Mezcla', status: 'Pendiente', notes: 'Asignado a Clara Domínguez.' },
      { id: 'stg-5', name: 'Masterización', status: 'Pendiente', notes: 'Asignado a Sterling Sound.' },
      { id: 'stg-6', name: 'Listo', status: 'Pendiente' }
    ],
    created_at: '2026-01-10T12:00:00Z'
  },
  {
    id: 'rec-2',
    title: 'Cosmogonías Estelares',
    artistId: 'art-2', // Lara & The Moon
    status: 'Planificación',
    releaseDate: '2027-02-14',
    studio: 'El Desierto Estudios',
    producer: 'Mateo Ruíz / Lara Solórzano',
    songs: [
      { id: 'song-2-1', title: 'Eclipse de Cobre', duration: '3:30', composer: 'Lara Solórzano', status: 'Demo', progress: 30, notes: 'Boceto acústico de guitarra y voz.' },
      { id: 'song-2-2', title: 'Saturno en tus Ojos', duration: '4:10', composer: 'Lara Solórzano', status: 'Composición', progress: 10, notes: 'Escribiendo la sección del puente.' }
    ],
    costs: [
      { id: 'cost-2-1', concept: 'Arrendamiento de El Desierto Estudios', category: 'Estudio/Grabación', amount: 35000, notes: 'Cotización por 7 días de grabación residencial' },
      { id: 'cost-2-2', concept: 'Mateo Ruíz (Servicio de Producción)', category: 'Arreglos/Producción', amount: 20000, notes: 'Anticipo fijado' }
    ],
    payments: [
      { id: 'pay-2-1', concept: 'Reserva El Desierto (50%)', amount: 17500, dueDate: '2026-09-01', status: 'Pendiente', notes: 'Apartado del espacio' }
    ],
    stages: [
      { id: 'stg-2-1', name: 'Pre-producción', status: 'En Progreso', startDate: '2026-06-15', notes: 'Maquetando guitarras de prueba en home studio.' },
      {
        id: 'stg-2-2',
        name: 'Grabación',
        status: 'Pendiente',
        instruments: [
          { id: 'inst-2-1', name: 'Guitarras Acústicas', status: 'Pendiente', musician: 'Lara Solórzano' },
          { id: 'inst-2-2', name: 'Voces Principales', status: 'Pendiente', musician: 'Lara Solórzano' }
        ]
      },
      { id: 'stg-2-3', name: 'Revisión', status: 'Pendiente' },
      { id: 'stg-2-4', name: 'Mezcla', status: 'Pendiente' },
      { id: 'stg-2-5', name: 'Masterización', status: 'Pendiente' },
      { id: 'stg-2-6', name: 'Listo', status: 'Pendiente' }
    ],
    created_at: '2026-06-01T12:00:00Z'
  }
];

