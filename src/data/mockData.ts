/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Artist, 
  Venue, 
  Contact, 
  Event, 
  Tour, 
  PipelineItem, 
  HistoryEvent, 
  Contract, 
  Provider, 
  RecordingProject,
  GooglePlacesData,
  VenueScores 
} from '../types';

// ===== UTILIDADES =====

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

const createVenueScores = (base: number = 80): VenueScores => ({
  rentabilidad: Math.floor(base + Math.random() * 20),
  responseTime: Math.floor(base + Math.random() * 20),
  puntualidadPago: Math.floor(base + Math.random() * 20),
  negociacion: Math.floor(base + Math.random() * 20),
  produccion: Math.floor(base + Math.random() * 20),
  hospitalidad: Math.floor(base + Math.random() * 20),
});

const createGooglePlacesData = (): GooglePlacesData => ({
  placeId: `ChIJ${Math.random().toString(36).substring(2, 20)}`,
  rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
  userRatingsCount: Math.floor(500 + Math.random() * 3000),
  website: 'https://www.venue.com',
  phone: '55 1234 5678',
});

// ===== DATOS INICIALES =====

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
    startDate: '2018-06-15',
    city: 'CDMX',
    state: 'CDMX',
    country: 'México',
    members: ['Vladimir Belmont (Composición, Sintetizadores, Piano)'],
    manager: 'Andrés Mendoza',
    bookingAgent: 'Andrés Mendoza',
    label: 'Independiente',
    publisher: 'Flamo Publishing',
    distributor: 'TuneCore',
    isrc: 'QZEX62312456',
    iswc: 'T-123.456.789-C',
    pro: 'SACM',
    rfc: 'BEGV800615LM1',
    stage: 'Consolidado',
    socialMedia: {
      instagram: 'https://instagram.com/vladimirbelmontmusic',
      spotify: 'https://open.spotify.com/artist/vladimirhoff',
      youtube: 'https://youtube.com/@vladimirbelmontmusic',
      twitter: 'https://twitter.com/vladimirhoff',
      website: 'https://vladimirbelmontmusic.com',
      connectedPlatforms: ['instagram'],
      connectedUsers: { instagram: 'vladimirbelmontmusic' },
    },
    pipeline: createDefaultPipeline(),
    history: [
      {
        id: 'h1',
        date: '2023-03-15',
        title: 'Lanzamiento de EP "Synthetic Harmonies"',
        description: 'Primer EP lanzado en plataformas digitales con éxito moderado',
        type: 'release',
      },
      {
        id: 'h2',
        date: '2023-10-20',
        title: 'Firma con TuneCore',
        description: 'Alianza de distribución digital para expansión global',
        type: 'signing',
      },
    ],
    created_at: '2018-06-15T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    deleted_at: null,
  },
];

export const initialVenues: Venue[] = [
  {
    id: 'ven-1',
    name: 'Foro Novedoso',
    address: 'Avenida Paseo de la Reforma 505, Col. Cuauhtémoc',
    city: 'CDMX',
    state: 'CDMX',
    country: 'México',
    postalCode: '06500',
    lat: 19.4326,
    lng: -99.1332,
    establishmentType: 'Teatro / Centro de Espectáculos',
    hours: ['Lunes a Sábado: 18:00 - 23:00', 'Domingo: 17:00 - 22:00'],
    googlePlaces: createGooglePlacesData(),
    instagram: 'https://instagram.com/fornovedoso',
    facebook: 'https://facebook.com/fornovedoso',
    email: 'booking@fornovedoso.com',
    scores: createVenueScores(85),
    created_at: '2020-01-10T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ven-2',
    name: 'Arena Monterrey',
    address: 'Avenida Fundidora 200, Barrio Antiguo',
    city: 'Monterrey',
    state: 'Nuevo León',
    country: 'México',
    postalCode: '64000',
    lat: 25.6866,
    lng: -100.3161,
    establishmentType: 'Arena / Auditorio',
    hours: ['Martes a Domingo: 19:00 - 23:30'],
    googlePlaces: createGooglePlacesData(),
    website: 'https://arenamonterrey.com',
    scores: createVenueScores(75),
    created_at: '2019-05-20T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    deleted_at: null,
  },
];

export const initialContacts: Contact[] = [
  {
    id: 'con-1',
    name: 'Juan Pérez García',
    email: 'juan.perez@fornovedoso.com',
    phone: '+52 55 1234 5678',
    role: 'Gerente de Booking',
    linkedTo: [{ type: 'venue', id: 'ven-1' }],
  },
];

export const initialTours: Tour[] = [
  {
    id: 'tour-1',
    name: 'Gira "Synthetic Dreams" 2026',
    artistId: 'art-1',
    startDate: '2026-03-01',
    endDate: '2026-11-30',
    status: 'Planning',
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    deleted_at: null,
  },
];

export const initialEvents: Event[] = [
  {
    id: 'evt-1',
    name: 'Vladimir Belmont - Show Especial CDMX',
    artistId: 'art-1',
    venueId: 'ven-1',
    date: '2026-08-15',
    capacity: 800,
    attendance: 650,
    ticketPrice: 350,
    totalIncome: 227500,
    expenses: 85000,
    profit: 142500,
    status: 'Confirmed',
    tourId: 'tour-1',
    guestBands: ['The Ambient Collective'],
    setlist: [
      { id: 'set-1', songTitle: 'Synthetic Harmonies', duration: '4:32', tempo: 'Medio' },
      { id: 'set-2', songTitle: 'Digital Dreams', duration: '5:12', tempo: 'Rápido' },
    ],
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    deleted_at: null,
  },
];

export const initialContracts: Contract[] = [
  {
    id: 'cont-1',
    title: 'Contrato de Performance - Foro Novedoso Agosto 2026',
    artistId: 'art-1',
    venueId: 'ven-1',
    eventId: 'evt-1',
    fileName: 'Performance_Contract_ForoNovedoso_Aug2026.pdf',
    fileSize: '245 KB',
    status: 'Signed',
    uploadedAt: '2026-07-01T00:00:00Z',
    type: 'Performance',
  },
];

export const initialProviders: Provider[] = [
  {
    id: 'prov-1',
    name: 'Audio Pro México',
    category: 'Sonido',
    contactName: 'Carlos Mendoza',
    phone: '+52 55 9876 5432',
    email: 'carlos@audiopromexico.com',
    rating: 5,
    costPerShow: 15000,
    notes: 'Equipo de élite, respuesta rápida',
    venueIds: ['ven-1', 'ven-2'],
    created_at: '2019-03-10T00:00:00Z',
  },
];

export const initialRecordingProjects: RecordingProject[] = [
  {
    id: 'rec-1',
    title: '"Synthetic Dreams" - Álbum de Estudio',
    artistId: 'art-1',
    status: 'Mezcla',
    releaseDate: '2026-12-01',
    studio: 'Estudio Sonic Waves, CDMX',
    producer: 'Vladimir Belmont & Productor Invitado',
    songs: [
      { id: 'song-1', title: 'Intro', duration: '2:15', composer: 'Vladimir Belmont', status: 'Masterizado', progress: 100 },
      { id: 'song-2', title: 'Synthetic Dreams', duration: '5:45', composer: 'Vladimir Belmont', status: 'Mezcla', progress: 85 },
    ],
    costs: [
      { id: 'cost-1', concept: 'Tiempo de Estudio', category: 'Estudio/Grabación', amount: 35000 },
      { id: 'cost-2', concept: 'Músicos de Sesión', category: 'Músicos de Sesión', amount: 18000 },
    ],
    payments: [
      { id: 'pay-1', concept: 'Anticipo', amount: 25000, dueDate: '2026-06-01', status: 'Pagado' },
      { id: 'pay-2', concept: 'Saldo', amount: 28000, dueDate: '2026-12-01', status: 'Pendiente' },
    ],
    created_at: '2025-09-01T00:00:00Z',
  },
];
