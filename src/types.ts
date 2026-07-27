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

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  venueId: string;
}

export interface Venue {
  id: string;
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
  scoreRentabilidad: number;
  scoreResponseTime: number;
  scorePuntualidadPago: number;
  scoreNegociacion: number;
  scoreProduccion: number;
  scoreHospitalidad: number;
  contactoPrincipalId?: string; // Direct field in venues as requested (eliminating es_principal trigger complexity)
  providerIds?: string[]; // Associated providers/suppliers
  localBands?: string[]; // Support/local bands linked to this venue
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

export interface Event {
  id: string;
  name: string;
  artistId: string;
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
  name: string;
  artistId: string;
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
  title: string;
  artistId?: string;
  venueId?: string;
  tourId?: string;
  eventId?: string;
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


