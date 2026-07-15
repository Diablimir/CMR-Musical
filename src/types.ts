/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Rango de validación genérico para números
 * @template T - Tipo base
 */
type RangedNumber<Min extends number, Max extends number> = number & { readonly __min: Min; readonly __max: Max };

/**
 * Crea un número validado dentro de un rango
 */
function createRangedNumber<Min extends number, Max extends number>(value: number, min: Min, max: Max): number {
  if (value < min || value > max) {
    throw new Error(`Valor ${value} fuera del rango [${min}, ${max}]`);
  }
  return value;
}

/**
 * Formato de timestamp ISO 8601
 * @example "2026-07-15T17:11:24Z"
 */
type ISOTimestamp = string & { readonly __brand: 'ISOTimestamp' };

function createISOTimestamp(date?: Date): ISOTimestamp {
  return (date || new Date()).toISOString() as ISOTimestamp;
}

/**
 * Redes sociales con validación de conexión
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
  /** Plataformas conectadas y autenticadas */
  connectedPlatforms?: Array<'instagram' | 'tiktok' | 'facebook'>;
  connectedUsers?: Record<string, string>; // platform -> username
}

/**
 * Etapas de desarrollo artístico
 */
export type ArtistStage =
  | 'Desarrollo'
  | 'Aficionado'
  | 'Emergente'
  | 'Media carrera'
  | 'Consolidado'
  | 'Consagrado'
  | 'Internacional';

/**
 * Item del pipeline de desarrollo
 */
export interface PipelineItem {
  id: string;
  name: string;
  category: 'Branding' | 'Distribución' | 'Presencia' | 'Booking & Management';
  completed: boolean;
  dueDate?: string; // ISO 8601
  completedAt?: string; // ISO 8601
}

/**
 * Evento histórico del artista
 */
export interface HistoryEvent {
  id: string;
  date: string; // ISO 8601
  title: string;
  description: string;
  type: 'milestone' | 'release' | 'signing' | 'tour' | 'achievement';
}

/**
 * Perfil completo del artista
 */
export interface Artist {
  id: string;
  artisticName: string;
  legalName: string;
  photo: string;
  bio: string;
  genre: string;
  subgenres: string[];
  languages: string[];
  startDate: string; // ISO 8601
  city: string;
  state: string;
  country: string;
  members: string[];
  manager: string;
  bookingAgent: string;
  label: string;
  publisher: string;
  distributor: string;
  isrc?: string; // International Standard Recording Code
  iswc?: string; // International Standard Musical Work Code
  pro?: string; // Sociedad de gestión (e.g. SACM, ASCAP, BMI)
  rfc?: string; // RFC mexicano
  stage: ArtistStage;
  socialMedia: SocialMedia;
  pipeline: PipelineItem[];
  history: HistoryEvent[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at: string | null; // ISO 8601 o null
}

/**
 * Contacto vinculado a múltiples entidades
 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  /** Referencias a entidades que pueden poseer este contacto */
  linkedTo: Array<{ type: 'venue' | 'artist' | 'provider'; id: string }>;
}

/**
 * Scores de desempeño de un recinto (0-100)
 */
export interface VenueScores {
  /** Potencial de ingresos (rentabilidad) */
  rentabilidad: number; // 0-100
  /** Tiempo de respuesta a consultas */
  responseTime: number; // 0-100
  /** Puntualidad en pagos */
  puntualidadPago: number; // 0-100
  /** Capacidad de negociación */
  negociacion: number; // 0-100
  /** Calidad de producción técnica */
  produccion: number; // 0-100
  /** Calidad de hospitalidad */
  hospitalidad: number; // 0-100
}

/**
 * Información de Google Places para un recinto
 */
export interface GooglePlacesData {
  placeId: string;
  rating: number; // 0-5 en Google
  userRatingsCount: number;
  website: string;
  phone: string;
}

/**
 * Recinto de espectáculos
 */
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
  establishmentType: string;
  hours: string[];
  
  // Datos de Google Places
  googlePlaces: GooglePlacesData;
  
  // Redes sociales del recinto
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  email?: string;
  youtube?: string;
  twitter?: string;
  
  // Scores locales calculados (0-100)
  scores: VenueScores;
  
  // Relaciones
  contactoPrincipalId?: string;
  providerIds?: string[];
  localBands?: string[];
  
  // Timestamps
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at: string | null; // ISO 8601 o null
}

/**
 * Item de setlist para un evento
 */
export interface SetlistItem {
  id: string;
  songTitle: string;
  duration?: string; // HH:MM:SS
  tempo?: 'Lento' | 'Medio' | 'Rápido';
  transitionNotes?: string;
}

/**
 * Feedback del artista sobre un evento
 */
export interface EventFeedback {
  artistThoughts?: string;
  crowdReaction?: string;
  pacingRating?: number; // 1-5
  optimizationNotes?: string;
}

/**
 * Estados posibles de un evento
 */
export type EventStatus = 'Draft' | 'Confirmed' | 'Completed' | 'Cancelled';

/**
 * Evento musical
 */
export interface Event {
  id: string;
  name: string;
  artistId: string;
  venueId: string;
  date: string; // ISO 8601
  capacity: number;
  attendance: number;
  ticketPrice: number;
  totalIncome: number;
  expenses: number;
  profit: number;
  status: EventStatus;
  tourId?: string;
  guestBands?: string[];
  setlist?: SetlistItem[];
  feedback?: EventFeedback;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at: string | null; // ISO 8601 o null
}

/**
 * Categorías de proveedores de servicios
 */
export type ProviderCategory =
  | 'Sonido'
  | 'Ingeniero de Audio'
  | 'Iluminación'
  | 'Catering'
  | 'Backline'
  | 'Escenografía'
  | 'Seguridad'
  | 'Personal de Apoyo'
  | 'Otros';

/**
 * Proveedor de servicios para eventos
 */
export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  contactName: string;
  phone: string;
  email: string;
  rating: number; // 1-5 estrellas
  costPerShow: number;
  notes?: string;
  venueIds: string[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at: string | null; // ISO 8601 o null
}

/**
 * Estados de grabación de una canción
 */
export type RecordingStatus =
  | 'Composición'
  | 'Demo'
  | 'Grabación de Instrumentos'
  | 'Grabación de Voces'
  | 'Mezcla'
  | 'Masterizado'
  | 'Listo';

/**
 * Canción en proyecto de grabación
 */
export interface RecordingSong {
  id: string;
  title: string;
  duration?: string; // HH:MM:SS
  composer?: string;
  status: RecordingStatus;
  progress: number; // 0-100%
  notes?: string;
}

/**
 * Item de costo del proyecto
 */
export interface ProjectCostItem {
  id: string;
  concept: string;
  category: 'Estudio/Grabación' | 'Músicos de Sesión' | 'Mezcla' | 'Masterización' | 'Arreglos/Producción' | 'Otros';
  amount: number;
  notes?: string;
}

/**
 * Pago del proyecto
 */
export interface ProjectPayment {
  id: string;
  concept: string;
  amount: number;
  dueDate: string; // ISO 8601
  status: 'Pendiente' | 'Pagado';
  notes?: string;
}

/**
 * Instrumento en grabación
 */
export interface RecordingInstrument {
  id: string;
  name: string;
  status: 'Pendiente' | 'Grabando' | 'Listo';
  musician?: string;
}

/**
 * Etapa del proyecto de grabación
 */
export interface ProjectStage {
  id: string;
  name: 'Pre-producción' | 'Grabación' | 'Revisión' | 'Mezcla' | 'Masterización' | 'Listo';
  status: 'Pendiente' | 'En Progreso' | 'Completado';
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  notes?: string;
  instruments?: RecordingInstrument[];
}

/**
 * Proyecto de grabación
 */
export interface RecordingProject {
  id: string;
  title: string;
  artistId: string;
  status: 'Planificación' | 'Pre-producción' | 'Grabando' | 'Mezcla' | 'Masterización' | 'Completado';
  releaseDate?: string; // ISO 8601
  studio?: string;
  producer?: string;
  songs: RecordingSong[];
  costs?: ProjectCostItem[];
  payments?: ProjectPayment[];
  stages?: ProjectStage[];
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at: string | null; // ISO 8601 o null
}

/**
 * Gira musical
 */
export interface Tour {
  id: string;
  name: string;
  artistId: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  status: 'Planning' | 'Active' | 'Completed' | 'Cancelled';
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at: string | null; // ISO 8601 o null
}

/**
 * Filtros globales del sistema
 */
export interface FilterState {
  year: string;
  month: string;
  quarter: string;
  dateRangeStart: string; // ISO 8601
  dateRangeEnd: string; // ISO 8601
  artistId: string;
  tourId: string;
  venueId: string;
  city: string;
  state: string;
  status: string;
}

/**
 * Tipos de contratos
 */
export type ContractType = 'Management' | 'Booking' | 'Performance' | 'Co-production' | 'NDA' | 'Foro/Arrendamiento' | 'Other';

/**
 * Estados de contrato
 */
export type ContractStatus = 'Draft' | 'Pending' | 'Signed' | 'Rejected' | 'Active';

/**
 * Contrato legal
 */
export interface Contract {
  id: string;
  title: string;
  artistId?: string;
  venueId?: string;
  tourId?: string;
  eventId?: string;
  fileName: string;
  fileSize: string;
  status: ContractStatus;
  uploadedAt: string; // ISO 8601
  type: ContractType;
  notes?: string;
}

/**
 * Cuenta de usuario del sistema
 */
export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: string;
  password?: string;
  created_at: string; // ISO 8601
  updated_at?: string; // ISO 8601
  last_login?: string; // ISO 8601
}

// ===== UTILIDADES DE TIPOS =====

/**
 * Extrae valores de un tipo unión
 * @example UnionToIntersection<'a' | 'b' | 'c'>
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
