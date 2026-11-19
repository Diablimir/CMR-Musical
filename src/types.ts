/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SocialMedia {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
  spotify?: string;
  appleMusic?: string;
  twitter?: string;
  threads?: string;
  whatsapp?: string;
  website?: string;
  instagramConnected?: boolean;
  instagramConnectedUser?: string;
  tiktokConnected?: boolean;
  tiktokConnectedUser?: string;
  facebookConnected?: boolean;
  facebookConnectedUser?: string;
}

export type ArtistStage =
  | 'Desarrollo'
  | 'Aficionado'
  | 'Emergente'
  | 'Media carrera'
  | 'Consolidado'
  | 'Consagrado'
  | 'Internacional';

export interface PipelineItem {
  id: string;
  name: string;
  category: 'Branding' | 'Distribución' | 'Presencia' | 'Booking & Management';
  completed: boolean;
}

export interface MemberHistory {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate?: string;
  venueName?: string;
  active: boolean;
}

export interface PhotoStyle {
  zoom?: number;
  rotation?: number;
  contrast?: number;
  brightness?: number;
  grayscale?: number;
  sepia?: number;
  blur?: number;
}

export interface Artist {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  artisticName: string;
  legalName: string;
  photo: string;
  photoStyle?: PhotoStyle;
  bio: string;
  genre: string;
  subgenres: string[];
  languages: string[];
  startDate: string;
  city: string;
  state: string;
  country: string;
  members: string[];
  memberHistory?: MemberHistory[];
  manager: string;
  bookingAgent: string;
  label: string;
  publisher: string;
  distributor: string;
  isrc?: string;
  iswc?: string;
  pro?: string; // Sociedad de gestión (e.g. SACM, ASCAP, BMI)
  rfc?: string;
  stage: ArtistStage;
  socialMedia: SocialMedia;
  pipeline: PipelineItem[];
  history: HistoryEvent[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface HistoryEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'milestone' | 'release' | 'signing' | 'tour' | 'achievement';
}

export interface ContactChannel {
  value: string;
  label?: string | null;
  primary?: boolean;
}

export interface ContactLink {
  type: 'venue' | 'artist' | 'provider';
  id: string;
  role: string;
  isPrincipal?: boolean;
}

export interface Contact {
  id: string;
  version?: number;
  name: string; // nombre completo (nombre + apellidos)
  email: string; // correo principal
  phone: string; // teléfono principal
  role: string; // rol en el primer venue vinculado
  venueId: string; // primer venue vinculado ('' si no tiene)
  firstName?: string;
  lastName?: string;
  emails?: ContactChannel[];
  phones?: ContactChannel[];
  links?: ContactLink[];
}

/** Nota de seguimiento de un venue (p. ej. cómo salió el show una vez realizado). */
export interface VenueNote {
  id: string;
  date: string;      // ISO (UTC)
  text: string;
  author?: string;
  eventId?: string;  // show al que se refiere (opcional)
}

export interface Venue {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
  website: string;
  phone: string;
  rating: number;
  userRatingsCount: number;
  placeId: string;
  establishmentType: string;
  hours: string[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  email?: string;
  youtube?: string;
  twitter?: string;
  // Score metrics (0-100) calculated from parameters
  scoreRentabilidad: number | null;  // null = No aplica (NP)
  scoreResponseTime: number | null;  // null = No aplica (NP)
  scorePuntualidadPago: number | null;  // null = No aplica (NP)
  scoreNegociacion: number | null;  // null = No aplica (NP)
  scoreProduccion: number | null;  // null = No aplica (NP)
  scoreHospitalidad: number | null;  // null = No aplica (NP)
  contactoPrincipalId?: string; // Direct field in venues as requested (eliminating es_principal trigger complexity)
  providerIds?: string[]; // Associated providers/suppliers
  localBands?: string[]; // Support/local bands linked to this venue
  notes?: VenueNote[]; // Notas de seguimiento (tabla venue_notas)
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SetlistItem {
  id: string;
  songTitle: string;
  duration?: string;
  tempo?: 'Lento' | 'Medio' | 'Rápido';
  transitionNotes?: string;
}

export interface EventFeedback {
  artistThoughts?: string; // Qué pensó el artista del concierto/setlist
  crowdReaction?: string; // Cómo se vivió el concierto / reacción del público
  pacingRating?: number; // Valoración del ritmo de las canciones (1-5 estrellas)
  optimizationNotes?: string; // Notas para optimizar el orden en el futuro
}

export type EventArtistRole = 'Artista' | 'Invitado' | 'Telonero' | 'Soporte' | 'Otro';

export interface EventArtist {
  artistId: string;
  role?: EventArtistRole;
  isPrincipal?: boolean;
  order?: number; // orden de presentación
  startTime?: string; // HH:MM
  endTime?: string;
  fee?: number; // honorarios
  currency?: string;
  status?: 'Pendiente' | 'Confirmado' | 'Cancelado';
}

export interface Event {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  name: string;
  artistId: string; // artista principal
  artists?: EventArtist[]; // alineación completa
  venueId: string;
  date: string;
  capacity: number;
  attendance: number;
  ticketPrice: number;
  totalIncome: number;
  expenses: number;
  profit: number;
  status: 'Draft' | 'Confirmed' | 'Completed' | 'Cancelled';
  tourId?: string; // Foreign key connection
  guestBands?: string[]; // Bands performing with us on this concert
  setlist?: SetlistItem[]; // Setlist of songs played/to play
  feedback?: EventFeedback; // Artist thoughts & optimization notes
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Provider {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  name: string;
  category: 'Sonido' | 'Ingeniero de Audio' | 'Iluminación' | 'Catering' | 'Backline' | 'Escenografía' | 'Seguridad' | 'Personal de Apoyo' | 'Otros';
  contactName: string;
  phone: string;
  email: string;
  rating: number; // 1-5 estrellas
  costPerShow: number; // costo base por show
  notes?: string;
  venueIds: string[]; // Linked venues
  created_at: string;
}

export interface RecordingSong {
  id: string;
  title: string;
  duration?: string;
  composer?: string;
  status: 'Composición' | 'Demo' | 'Grabación de Instrumentos' | 'Grabación de Voces' | 'Mezcla' | 'Masterizado' | 'Listo';
  progress: number; // 0-100%
  notes?: string;
}

export interface ProjectCostItem {
  id: string;
  concept: string;
  category: 'Estudio/Grabación' | 'Músicos de Sesión' | 'Mezcla' | 'Masterización' | 'Arreglos/Producción' | 'Otros';
  amount: number;
  notes?: string;
}

export interface ProjectPayment {
  id: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'Pendiente' | 'Pagado';
  notes?: string;
}

export interface RecordingInstrument {
  id: string;
  name: string;
  status: 'Pendiente' | 'Grabando' | 'Listo';
  musician?: string;
}

export interface ProjectStage {
  id: string;
  name: 'Pre-producción' | 'Grabación' | 'Revisión' | 'Mezcla' | 'Masterización' | 'Listo';
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  startDate?: string;
  endDate?: string;
  notes?: string;
  instruments?: RecordingInstrument[];
}

export interface RecordingProject {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  title: string;
  artistId: string;
  status: 'Planificación' | 'Pre-producción' | 'Grabando' | 'Mezcla' | 'Masterización' | 'Completado';
  releaseDate?: string;
  studio?: string;
  producer?: string;
  songs: RecordingSong[];
  costs?: ProjectCostItem[];
  payments?: ProjectPayment[];
  stages?: ProjectStage[];
  created_at: string;
}

export interface Tour {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  name: string;
  artistId: string; // artista principal
  artistIds?: string[]; // todos los artistas de la gira
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FilterState {
  year: string;
  month: string;
  quarter: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  artistId: string;
  tourId: string;
  venueId: string;
  city: string;
  state: string;
  status: string;
}

export interface Contract {
  id: string;
  version?: number; // control de concurrencia (lo asigna el servidor)
  title: string;
  artistId?: string;
  venueId?: string;
  tourId?: string;
  eventId?: string;
  // Partes (artistas, venues, proveedores) y objeto (eventos, giras) del contrato. Los campos de arriba son el primero de cada lista.
  artistIds?: string[];
  venueIds?: string[];
  providerIds?: string[];
  eventIds?: string[];
  tourIds?: string[];
  fileName: string;
  fileSize: string;
  status: 'Draft' | 'Pending' | 'Signed' | 'Rejected' | 'Active';
  uploadedAt: string;
  type: 'Management' | 'Booking' | 'Performance' | 'Co-production' | 'NDA' | 'Foro/Arrendamiento' | 'Other';
  notes?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: string;
  password?: string;
  created_at: string;
}


