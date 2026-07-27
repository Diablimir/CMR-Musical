import { Artist, Venue, Contact, Event, Tour, PipelineItem, Contract, Provider, RecordingProject } from '../types';

// Standard Pipeline Checklist template for Artists
export const createDefaultPipeline = (): PipelineItem[] => [
  { id: 'p1', name: 'Identity Branding', category: 'Branding', completed: false },
  { id: 'p2', name: 'Logotipo & Isotipo Oficial', category: 'Branding', completed: false },
  { id: 'p3', name: 'Photoshoot Editorial / Prensa', category: 'Branding', completed: false },
  { id: 'p4', name: 'Electronic Press Kit (EPK) 2026', category: 'Branding', completed: false },
  { id: 'p5', name: 'Biografía Oficial Multi-lenguaje', category: 'Branding', completed: false },
  { id: 'p6', name: 'Distribuidora Premium (Amuse/TuneCore)', category: 'Distribución', completed: false },
  { id: 'p7', name: 'Registro de Obras INDAUTOR', category: 'Distribución', completed: false },
  { id: 'p8', name: 'Registro ISRC & ISWC', category: 'Distribución', completed: false },
  { id: 'p9', name: 'Afiliación SACM / ASCAP / BMI', category: 'Distribución', completed: false },
  { id: 'p10', name: 'Verificación Spotify for Artists', category: 'Presencia', completed: false },
  { id: 'p11', name: 'Verificación Apple Music for Artists', category: 'Presencia', completed: false },
  { id: 'p12', name: 'Redes Sociales unificadas (@handle)', category: 'Presencia', completed: false },
  { id: 'p13', name: 'Merchandising Oficial (Diseño & Stock)', category: 'Presencia', completed: false },
  { id: 'p14', name: 'Sponsorships & Patrocinios', category: 'Presencia', completed: false },
  { id: 'p15', name: 'Booking Nacional Activo', category: 'Booking & Management', completed: false },
  { id: 'p16', name: 'Booking Internacional En Progreso', category: 'Booking & Management', completed: false },
  { id: 'p17', name: 'Legal & Management Retainer', category: 'Booking & Management', completed: false },
  { id: 'p18', name: 'Gira de Prensa / Radiodifusión', category: 'Booking & Management', completed: false },
];

export const initialArtists: Artist[] = [];
export const initialVenues: Venue[] = [];
export const initialContacts: Contact[] = [];
export const initialTours: Tour[] = [];
export const initialEvents: Event[] = [];
export const initialContracts: Contract[] = [];
export const initialProviders: Provider[] = [];
export const initialRecordingProjects: RecordingProject[] = [];
