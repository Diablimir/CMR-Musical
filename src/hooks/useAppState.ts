/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Venue, Artist, Contact, Event, Tour, FilterState, Contract, UserAccount, Provider, RecordingProject } from '@/types';
import { initialArtists, initialVenues, initialContacts, initialTours, initialEvents, initialContracts, initialProviders, initialRecordingProjects } from '@/data/mockData';
import { useLocalStorage, useCRUD, useEventFiltering, useEventKPIs, useSearch } from '@/hooks/useAppData';

/**
 * Tipo para el estado global de la aplicación
 */
export interface AppState {
  // Datos principales
  venues: Venue[];
  artists: Artist[];
  contacts: Contact[];
  tours: Tour[];
  events: Event[];
  contracts: Contract[];
  providers: Provider[];
  recordingProjects: RecordingProject[];
  
  // Autenticación y UI
  isLoggedIn: boolean;
  currentUser: string;
  users: UserAccount[];
  developerMode: boolean;
  activeWorkspace: 'inicio' | 'venues' | 'artists' | 'finances' | 'legal' | 'users' | 'database' | 'providers' | 'production';
  isMobileMenuOpen: boolean;
  
  // Selecciones y filtros
  filters: FilterState;
  selectedVenueId: string | null;
  selectedArtistId: string;
  isDrawerOpen: boolean;
  venueSearch: string;
}

/**
 * Hook personalizado para gestionar el estado global de la app
 */
export function useAppState(): AppState & {
  updateVenue: (venue: Venue) => void;
  updateArtist: (artist: Artist) => void;
  deleteVenue: (id: string) => void;
  deleteArtist: (id: string) => void;
  // ... más métodos según sea necesario
} {
  // Usar hooks de localStorage para todas las colecciones
  const [venues, setVenues] = useLocalStorage<Venue[]>('flamo_venues', initialVenues);
  const [artists, setArtists] = useLocalStorage<Artist[]>('flamo_artists', initialArtists);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('flamo_contacts', initialContacts);
  const [tours, setTours] = useLocalStorage<Tour[]>('flamo_tours', initialTours);
  const [events, setEvents] = useLocalStorage<Event[]>('flamo_events', initialEvents);
  const [contracts, setContracts] = useLocalStorage<Contract[]>('flamo_contracts', initialContracts);
  const [providers, setProviders] = useLocalStorage<Provider[]>('flamo_providers', initialProviders);
  const [recordingProjects, setRecordingProjects] = useLocalStorage<RecordingProject[]>('flamo_recording_projects', initialRecordingProjects);
  
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('flamo_is_logged_in', false);
  const [currentUser, setCurrentUser] = useLocalStorage('flamo_current_user', 'admin');
  const [users, setUsers] = useLocalStorage<UserAccount[]>('flamo_users', [
    { id: 'usr-1', username: 'admin', name: 'Administrador Principal', role: 'Super Admin', password: 'flamo2026', created_at: '2026-07-13' },
    { id: 'usr-2', username: 'vlad', name: 'Vlad Mendoza', role: 'Director de Booking', password: 'vlad2026', created_at: '2026-07-13' }
  ]);
  const [developerMode, setDeveloperMode] = useLocalStorage('flamo_developer_mode', true);
  const [activeWorkspace, setActiveWorkspace] = useState<AppState['activeWorkspace']>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    month: '',
    quarter: '',
    dateRangeStart: '',
    dateRangeEnd: '',
    artistId: '',
    tourId: '',
    venueId: '',
    city: '',
    state: '',
    status: '',
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState('art-1');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');

  // Métodos para actualizar datos
  const updateVenue = (venue: Venue) => {
    setVenues((prev) => prev.map((v) => (v.id === venue.id ? venue : v)));
  };

  const updateArtist = (artist: Artist) => {
    setArtists((prev) => prev.map((a) => (a.id === artist.id ? artist : a)));
  };

  const deleteVenue = (id: string) => {
    setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, deleted_at: new Date().toISOString() } : v)));
  };

  const deleteArtist = (id: string) => {
    setArtists((prev) => prev.map((a) => (a.id === id ? { ...a, deleted_at: new Date().toISOString() } : a)));
    if (selectedArtistId === id) {
      const active = artists.filter((a) => !a.deleted_at && a.id !== id);
      setSelectedArtistId(active[0]?.id || '');
    }
  };

  return {
    venues,
    artists,
    contacts,
    tours,
    events,
    contracts,
    providers,
    recordingProjects,
    isLoggedIn,
    currentUser,
    users,
    developerMode,
    activeWorkspace,
    isMobileMenuOpen,
    filters,
    selectedVenueId,
    selectedArtistId,
    isDrawerOpen,
    venueSearch,
    updateVenue,
    updateArtist,
    deleteVenue,
    deleteArtist,
  } as any;
}
