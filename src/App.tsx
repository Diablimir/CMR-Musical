import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, Users, Music, DollarSign, Award, Trash2, Search, Plus,
  Database, Star, MapPin, ExternalLink, AlertCircle, Sparkles, Filter, Check, FileText, UserCheck, LayoutDashboard,
  Truck, Disc, Flame, Menu, X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Artist, Venue, Contact, Event, Tour, FilterState, Contract, UserAccount, Provider, RecordingProject } from './types';

import { api, integrations, CollectionName } from './lib/api';
import GlobalFilters from './components/GlobalFilters';
import VenueDrawer from './components/VenueDrawer';
import ArtistProfile from './components/ArtistProfile';
import FinancialSuite from './components/FinancialSuite';
import SchemaVisualizer from './components/SchemaVisualizer';
import UxSettings from './components/UxSettings';
import LegalSuite from './components/LegalSuite';
import LoginScreen from './components/LoginScreen';
import UserManagement from './components/UserManagement';
import HomeDashboard from './components/HomeDashboard';
import ProvidersSuite from './components/ProvidersSuite';
import ProductionSuite from './components/ProductionSuite';
import AddArtistModal from './components/AddArtistModal';

export default function App() {
  // 1. Core state — se carga desde el servidor (MySQL) tras iniciar sesión
  const [venues, setVenues] = useState<Venue[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [recordingProjects, setRecordingProjects] = useState<RecordingProject[]>([]);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastSaved = useRef<Record<string, string>>({});

  // 2. Navigation Tab State
  const [activeWorkspace, setActiveWorkspace] = useState<'inicio' | 'venues' | 'artists' | 'finances' | 'legal' | 'users' | 'database' | 'providers' | 'production'>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentication (sesión en el servidor) y gestión de usuarios
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [users, setUsers] = useState<UserAccount[]>([]);

  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('flamo_developer_mode');
    return saved !== null ? saved === 'true' : true; // Default true so they see it initially but can toggle it off
  });

  useEffect(() => {
    localStorage.setItem('flamo_developer_mode', developerMode ? 'true' : 'false');
    if (!developerMode && activeWorkspace === 'database') {
      setActiveWorkspace('inicio');
    }
  }, [developerMode, activeWorkspace]);

  const refreshUsers = async () => {
    try {
      setUsers((await api.listUsers()).users);
    } catch { /* se mostrará al reintentar */ }
  };

  const handleAddUser = (newUser: Omit<UserAccount, 'id' | 'created_at'>): boolean => {
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) return false;
    api.createUser({
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      password: newUser.password || '',
    }).then(refreshUsers).catch(e => window.alert(e.message));
    return true;
  };

  const handleUpdateUser = (id: string, updated: Partial<UserAccount>) => {
    api.updateUser(id, { name: updated.name, role: updated.role, password: updated.password })
      .then(refreshUsers).catch(e => window.alert(e.message));
  };

  const handleDeleteUser = (id: string) => {
    api.deleteUser(id).then(refreshUsers).catch(e => window.alert(e.message));
  };

  const handleLogout = () => {
    api.logout().catch(() => {}).finally(() => {
      setIsLoggedIn(false);
      setCurrentUser('');
      setDataLoaded(false);
      lastSaved.current = {};
      setVenues([]); setArtists([]); setContacts([]); setTours([]);
      setEvents([]); setContracts([]); setProviders([]); setRecordingProjects([]);
    });
  };

  // Restaurar sesión al abrir la app
  useEffect(() => {
    api.me()
      .then(({ user }) => { setCurrentUser(user.username); setIsLoggedIn(true); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  // Cargar datos y usuarios cuando hay sesión
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    Promise.all([api.loadData(), api.listUsers()])
      .then(([d, u]) => {
        if (cancelled) return;
        lastSaved.current = {
          venues: JSON.stringify(d.venues), artists: JSON.stringify(d.artists),
          contacts: JSON.stringify(d.contacts), tours: JSON.stringify(d.tours),
          events: JSON.stringify(d.events), contracts: JSON.stringify(d.contracts),
          providers: JSON.stringify(d.providers), recording_projects: JSON.stringify(d.recording_projects),
        };
        setVenues(d.venues); setArtists(d.artists); setContacts(d.contacts); setTours(d.tours);
        setEvents(d.events); setContracts(d.contracts); setProviders(d.providers);
        setRecordingProjects(d.recording_projects);
        setUsers(u.users);
        setDataLoaded(true);
      })
      .catch((e) => {
        if (e.status === 401) setIsLoggedIn(false);
        else setSyncError('No se pudieron cargar los datos del servidor.');
      });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  // Guardar en el servidor (con pequeña espera) cuando cambia una colección
  useEffect(() => {
    if (!dataLoaded) return;
    const t = setTimeout(() => {
      const current: Record<CollectionName, any[]> = {
        venues, artists, contacts, tours, events, contracts, providers, recording_projects: recordingProjects,
      };
      (Object.keys(current) as CollectionName[]).forEach((name) => {
        const json = JSON.stringify(current[name]);
        if (lastSaved.current[name] === json) return;
        lastSaved.current[name] = json;
        api.saveCollection(name, current[name])
          .then(() => setSyncError(null))
          .catch((e) => {
            delete lastSaved.current[name]; // reintentar en el siguiente cambio
            if (e.status === 401) setIsLoggedIn(false);
            else setSyncError('No se pudo guardar en el servidor. Revisa tu conexión.');
          });
      });
    }, 700);
    return () => clearTimeout(t);
  }, [dataLoaded, venues, artists, contacts, tours, events, contracts, providers, recordingProjects]);

  const handleClearAllData = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODOS los datos de muestra para comenzar desde 0? Esta acción vaciará eventos, artistas, venues, contratos y proveedores.')) {
      setVenues([]);
      setArtists([]);
      setContacts([]);
      setTours([]);
      setEvents([]);
      setContracts([]);
      setProviders([]);
      setRecordingProjects([]);
      setSelectedArtistId('');
      setSelectedVenueId(null);
    }
  };

  // 3. Filters State
  const initialFilterState: FilterState = {
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
  };
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  // 4. Selected Entities
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState<'info' | 'contacts' | 'events' | 'modalities' | 'followup' | 'finances' | 'docs' | 'history' | 'map' | 'providers' | 'local-bands'>('info');
  const [isAddArtistModalOpen, setIsAddArtistModalOpen] = useState(false);

  // 5. Autocomplete & Venue Addition Simulator
  const [mapsUrl, setMapsUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccess, setScrapeSuccess] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [lastScrapedVenue, setLastScrapedVenue] = useState<Venue | null>(null);

  // 6. Search within lists
  const [venueSearch, setVenueSearch] = useState('');

  // 7. Reset filters
  const handleResetFilters = () => setFilters(initialFilterState);

  // 8. Google Maps / Places Autocomplete & Scraping Engine
  const handleMapsScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsUrl.trim()) return;

    setIsScraping(true);
    setScrapeSuccess(false);
    setScrapeError(null);

    try {
      const data = await integrations.placesScrape(mapsUrl);
      if (data.venue) {
        const newVenue: Venue = data.venue;
        setVenues((prev) => [newVenue, ...prev]);
        setLastScrapedVenue(newVenue);
        setIsScraping(false);
        setScrapeSuccess(true);
        setMapsUrl('');

        // Auto-select and open detail of newly added venue
        setSelectedVenueId(newVenue.id);
        setIsDrawerOpen(true);
      }
    } catch (err: any) {
      setIsScraping(false);
      setScrapeError(err.message || 'No se pudo consultar el lugar. Inténtalo de nuevo.');
    }
  };

  // 9. Delete Venue Permanently
  const handleDeleteVenue = (venueId: string) => {
    setVenues((prev) => prev.filter((v) => v.id !== venueId));
    if (selectedVenueId === venueId) {
      setSelectedVenueId(null);
      setIsDrawerOpen(false);
    }
    if (lastScrapedVenue?.id === venueId) {
      setLastScrapedVenue(null);
      setScrapeSuccess(false);
    }
  };

  // 10. Update Venue Information & Scores
  const handleUpdateVenue = (updated: Venue) => {
    setVenues((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  // 11. Manage Venue Contacts
  const handleAddContact = (newContact: Omit<Contact, 'id'>) => {
    const contact: Contact = {
      ...newContact,
      id: `con-${Date.now()}`,
    };
    setContacts((prev) => [...prev, contact]);
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
  };

  // 12. Update Artist details
  const handleUpdateArtist = (updated: Artist) => {
    setArtists((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  // 12b. Soft Delete Artist
  const handleDeleteArtist = (artistId: string) => {
    setArtists((prev) =>
      prev.map((a) => (a.id === artistId ? { ...a, deleted_at: new Date().toISOString() } : a))
    );
    if (selectedArtistId === artistId) {
      const remaining = artists.filter((a) => a.id !== artistId && !a.deleted_at);
      if (remaining.length > 0) {
        setSelectedArtistId(remaining[0].id);
      } else {
        setSelectedArtistId('');
      }
    }
  };

  // 12c. Contract Handlers
  const handleAddContract = (newContract: Contract) => {
    setContracts((prev) => [newContract, ...prev]);
  };

  const handleDeleteContract = (contractId: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
  };

  // 12d. Event CRUD Handlers
  const handleAddEvent = (newEvent: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    const eventObj: Event = {
      ...newEvent,
      id: `evt-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null
    };
    setEvents((prev) => [eventObj, ...prev]);
  };

  const handleUpdateEvent = (id: string, updated: Partial<Event>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated, updated_at: new Date().toISOString() } : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, deleted_at: new Date().toISOString() } : e)));
  };

  // Provider CRUD Handlers
  const handleAddProvider = (newProv: Omit<Provider, 'id' | 'created_at'>) => {
    const provObj: Provider = {
      ...newProv,
      id: `prov-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setProviders((prev) => [provObj, ...prev]);
  };

  const handleUpdateProvider = (updated: Provider) => {
    setProviders((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  };

  const handleDeleteProvider = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  // Recording Project CRUD Handlers
  const handleAddRecordingProject = (newProject: RecordingProject) => {
    setRecordingProjects((prev) => [newProject, ...prev]);
  };

  const handleUpdateRecordingProject = (updated: RecordingProject) => {
    setRecordingProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  };

  const handleDeleteRecordingProject = (id: string) => {
    setRecordingProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // 13. Dynamic filtering of Events
  const filteredEvents = events.filter((evt) => {
    if (evt.deleted_at) return false;

    // Filter by Artist
    if (filters.artistId && evt.artistId !== filters.artistId) return false;

    // Filter by Venue
    if (filters.venueId && evt.venueId !== filters.venueId) return false;

    // Filter by Tour
    if (filters.tourId && evt.tourId !== filters.tourId) return false;

    // Filter by Status
    if (filters.status && evt.status !== filters.status) return false;

    // Filter by Year
    if (filters.year && !evt.date.startsWith(filters.year)) return false;

    // Filter by Month
    if (filters.month) {
      const monthPart = evt.date.substring(5, 7);
      if (monthPart !== filters.month) return false;
    }

    // Filter by Quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
    if (filters.quarter) {
      const monthPart = Number(evt.date.substring(5, 7));
      if (filters.quarter === 'Q1' && (monthPart < 1 || monthPart > 3)) return false;
      if (filters.quarter === 'Q2' && (monthPart < 4 || monthPart > 6)) return false;
      if (filters.quarter === 'Q3' && (monthPart < 7 || monthPart > 9)) return false;
      if (filters.quarter === 'Q4' && (monthPart < 10 || monthPart > 12)) return false;
    }

    // Filter by Date Ranges
    if (filters.dateRangeStart && evt.date < filters.dateRangeStart) return false;
    if (filters.dateRangeEnd && evt.date > filters.dateRangeEnd) return false;

    // Filter by Venue City/State
    const associatedVenue = venues.find((v) => v.id === evt.venueId);
    if (filters.city && associatedVenue?.city !== filters.city) return false;
    if (filters.state && associatedVenue?.state !== filters.state) return false;

    return true;
  });

  // 14. Active Venues (not soft-deleted)
  const activeVenues = venues.filter((v) => !v.deleted_at);
  const activeArtists = artists.filter((a) => !a.deleted_at);

  // Further filter Venues by Search and location filters
  const searchedVenues = activeVenues.filter((v) => {
    // Name or city search
    const matchesSearch =
      v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.city.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.establishmentType.toLowerCase().includes(venueSearch.toLowerCase());

    // Filter by City dropdown if specified
    if (filters.city && v.city !== filters.city) return false;

    // Filter by State dropdown if specified
    if (filters.state && v.state !== filters.state) return false;

    return matchesSearch;
  });

  // Calculate Global KPIs based on currently filtered events
  const totalCompletedEvents = filteredEvents.filter((e) => e.status === 'Completed');
  const kpiTotalRevenue = totalCompletedEvents.reduce((acc, curr) => acc + curr.totalIncome, 0);
  const kpiTotalExpenses = totalCompletedEvents.reduce((acc, curr) => acc + curr.expenses, 0);
  const kpiTotalProfit = kpiTotalRevenue - kpiTotalExpenses;
  const kpiAvgAttendance =
    totalCompletedEvents.length > 0
      ? Math.round(totalCompletedEvents.reduce((acc, curr) => acc + curr.attendance, 0) / totalCompletedEvents.length)
      : 0;

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || null;
  const currentArtist = activeArtists.find((a) => a.id === selectedArtistId) || activeArtists[0] || null;

  if (!authChecked) {
    return <div className="min-h-screen bg-white-chalk flex items-center justify-center text-xs font-bold uppercase tracking-wider text-slate-400">Cargando…</div>;
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={(user) => {
      setCurrentUser(user);
      setIsLoggedIn(true);
    }} />;
  }

  const loggedInUserProfile = users.find(u => u.username.toLowerCase() === currentUser.toLowerCase()) || {
    username: currentUser,
    name: currentUser.toUpperCase(),
    role: 'Admin'
  };

  return (
    <div className="min-h-screen bg-white-chalk text-cosmic-black flex flex-col font-sans select-none antialiased">
      {/* Top Header Workspace Control */}
      <header className="bg-white border-b border-silver-haze px-6 py-4 sticky top-0 z-30 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-4">
          
          {/* 1. FIRST: Logo & CRM Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-tomato-curry rounded-xl flex items-center justify-center font-bold text-white-chalk shadow-sm">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-cosmic-black tracking-tight uppercase">FLAMO CRM</h1>
                <span className="text-[10px] bg-white-chalk border border-silver-haze text-slate-500 font-mono px-2 py-0.5 rounded-full font-medium">
                  v2.0 Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold hidden sm:block">Operating System for Artists, Booking & Tour Management</p>
            </div>
          </div>

          {/* 3. THIRD: Modo Dev, Admin below it, and Cerrar Sesión to the right (Desktop only) */}
          <div className="hidden md:flex items-center gap-4 shrink-0 justify-end">
            
            {/* Dev Mode & Admin stacked vertically */}
            <div className="flex flex-col items-end gap-1">
              {/* Developer mode toggle & Clear data */}
              <div className="flex items-center gap-1.5 scale-90 origin-right">
                <button
                  onClick={handleClearAllData}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                  title="Eliminar todos los datos para comenzar desde 0"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Vaciar Datos</span>
                </button>
                <div className="flex items-center gap-2 bg-white-chalk border border-silver-haze rounded-lg px-2 py-0.5 shadow-3xs">
                  <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Modo Dev</span>
                  <button
                    onClick={() => setDeveloperMode(!developerMode)}
                    className={`w-7 h-4 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                      developerMode ? 'bg-tomato-curry' : 'bg-slate-300'
                    }`}
                    title={developerMode ? "Ocultar pestaña de Esquema & DB" : "Mostrar pestaña de Esquema & DB"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${
                        developerMode ? 'transform translate-x-3' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* User Account Details (Admin below) */}
              <div 
                className="bg-white-chalk border border-silver-haze rounded-lg px-2 py-0.5 text-[9px] font-bold text-slate-500 flex items-center gap-1.5 scale-90 origin-right" 
                title={`${loggedInUserProfile.name} (${loggedInUserProfile.role})`}
              >
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="uppercase tracking-wider truncate max-w-[85px]">{loggedInUserProfile.username}</span>
                <span className="text-[7px] bg-slate-200 text-slate-500 px-1 py-0.1 rounded font-mono truncate max-w-[110px]">{loggedInUserProfile.role}</span>
              </div>
            </div>

            <UxSettings />

            {/* Logout Button on the right */}
            <button
              onClick={() => {
                if (confirm('¿Estás seguro de que deseas cerrar sesión en el sistema?')) {
                  handleLogout();
                }
              }}
              className="bg-white hover:bg-slate-50 border border-silver-haze rounded-xl px-3 py-2 text-[10px] font-bold text-slate-400 hover:text-tomato-curry transition-all cursor-pointer uppercase tracking-wider"
            >
              Cerrar Sesión
            </button>

          </div>

          {/* Hamburger menu button for mobile devices */}
          <div className="flex md:hidden items-center shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-silver-haze text-slate-600 hover:text-tomato-curry transition-all cursor-pointer shadow-3xs"
              aria-label="Abrir menú"
              id="btn-mobile-hamburger"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Floating Bottom Navigation Dock - Desktop only (Hidden on Mobile) */}
      <nav className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-silver-haze p-2 rounded-2xl shadow-2xl z-40 items-center justify-between gap-1.5 w-[92%] max-w-5xl">
        {[
          { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
          { id: 'venues', label: 'Venues', icon: Building2 },
          { id: 'providers', label: 'Proveedores', icon: Truck },
          { id: 'production', label: 'Producción', icon: Disc },
          { id: 'artists', label: 'Artistas', icon: Users },
          { id: 'finances', label: 'Finanzas', icon: DollarSign },
          { id: 'legal', label: 'Legal', icon: FileText },
          { id: 'users', label: 'Usuarios', icon: UserCheck },
          { id: 'database', label: 'Esquema & DB', icon: Database },
        ].filter((tab) => tab.id !== 'database' || developerMode).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWorkspace === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveWorkspace(tab.id as any)}
              className={`md:px-3.5 md:py-2 px-2 py-1.5 flex flex-row items-center justify-center gap-2 rounded-xl transition-all cursor-pointer group ${
                isActive
                  ? 'bg-celestial-canvas text-white shadow-sm font-bold border border-celestial-canvas/30'
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
              }`} />
              <span className="text-xs font-semibold tracking-tight truncate block">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Floating Bottom Navigation Dock - Mobile only (Sleek, Simplified, Squeeze-free Layout) */}
      <nav className="flex md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-silver-haze p-1.5 rounded-2xl shadow-2xl z-40 items-center justify-around gap-1 w-[92%]">
        {[
          { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
          { id: 'venues', label: 'Venues', icon: Building2 },
          { id: 'artists', label: 'Artistas', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeWorkspace === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveWorkspace(tab.id as any)}
              className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-celestial-canvas/10 text-celestial-canvas font-bold'
                  : 'text-slate-500'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-celestial-canvas' : 'text-slate-400'}`} />
              <span className="text-[10px] font-semibold tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
        
        {/* Toggle mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer ${
            isMobileMenuOpen ? 'text-tomato-curry font-bold' : 'text-slate-500'
          }`}
        >
          <Menu className={`w-5 h-5 shrink-0 ${isMobileMenuOpen ? 'text-tomato-curry' : 'text-slate-400'}`} />
          <span className="text-[10px] font-semibold tracking-tight">
            Más
          </span>
        </button>
      </nav>

      {/* Modern, Animated Side Navigation Drawer for Mobile UX */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-cosmic-black/50 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white border-l border-silver-haze shadow-2xl z-55 md:hidden flex flex-col justify-between"
              id="mobile-navigation-drawer"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-silver-haze flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-tomato-curry rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                    <Flame className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Menú de Navegación</h2>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white border border-silver-haze text-slate-500 hover:text-slate-880 transition-colors shadow-3xs cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body - Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Active User Card */}
                <div className="bg-slate-50 border border-silver-haze rounded-2xl p-4 space-y-3 shadow-3xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold font-mono text-sm uppercase">
                      {loggedInUserProfile.username.substring(0, 2)}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block text-xs truncate">{loggedInUserProfile.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 truncate uppercase tracking-wider font-semibold font-mono">
                        {loggedInUserProfile.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span className="font-medium">Sesión activa como superusuario</span>
                  </div>
                </div>

                {/* Navigation Options List */}
                <div className="space-y-2.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block px-1">Módulos del Sistema</span>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'inicio', label: 'Inicio / Dashboard', desc: 'Panel principal y KPI financieros', icon: LayoutDashboard },
                      { id: 'venues', label: 'Venues / Recintos', desc: 'Base georreferenciada y mapas', icon: Building2 },
                      { id: 'artists', label: 'Artistas / Roster', desc: 'Gestión 360 y pipelines', icon: Users },
                      { id: 'providers', label: 'Proveedores', desc: 'Directorio de servicios y viáticos', icon: Truck },
                      { id: 'production', label: 'Producción', desc: 'Hojas técnicas y sonorización', icon: Disc },
                      { id: 'finances', label: 'Finanzas', desc: 'Control de taquilla y cobros', icon: DollarSign },
                      { id: 'legal', label: 'Contratos / Legal', desc: 'Suite jurídica y documentos', icon: FileText },
                      { id: 'users', label: 'Usuarios', desc: 'Control de acceso de personal', icon: UserCheck },
                      { id: 'database', label: 'Esquema & DB', desc: 'Estructura relacional de tablas', icon: Database, isDevOnly: true },
                    ].filter(tab => !tab.isDevOnly || developerMode).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeWorkspace === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveWorkspace(tab.id as any);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? 'bg-celestial-canvas text-white border-celestial-canvas shadow-sm'
                              : 'bg-white border-silver-haze hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                            <div className="truncate">
                              <span className={`text-[11px] font-bold block ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                {tab.label}
                              </span>
                              <span className={`text-[9px] block truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                                {tab.desc}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white/80' : 'text-slate-300'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear All Data Button */}
                <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-red-700 block">Vaciar Datos</span>
                    <span className="text-[9px] text-red-500 block">Reinicia todas las tablas a 0</span>
                  </div>
                  <button
                    onClick={() => {
                      handleClearAllData();
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar</span>
                  </button>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-5 border-t border-silver-haze bg-slate-50 space-y-4">
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className="w-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider block"
                >
                  Cerrar Sesión
                </button>
                <div className="text-center text-[9px] text-slate-400 font-semibold uppercase tracking-widest font-mono">
                  Flamo CRM v2.0 Enterprise
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 pb-28 flex flex-col overflow-x-hidden">
        
        {/* Global Filter Bar (Present in top-level dashboard contexts to update KPIs dynamically) */}
        {activeWorkspace === 'inicio' && (
          <GlobalFilters
            filters={filters}
            setFilters={setFilters}
            artists={activeArtists}
            venues={activeVenues}
            tours={tours}
            onReset={handleResetFilters}
          />
        )}

        {/* Dynamic Global KPIs Summary Box */}
        {activeWorkspace === 'inicio' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-2xl border border-silver-haze shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Shows Completados</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-light text-cosmic-black font-mono">{totalCompletedEvents.length}</span>
                <span className="text-xs text-slate-500 font-medium">Shows</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Con base en los filtros activos</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-silver-haze shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Taquilla Bruta</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-light text-cosmic-black font-mono">${kpiTotalRevenue.toLocaleString('es-MX')}</span>
                <span className="text-xs text-emerald-600 font-semibold">+100% Taquilla</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Ingreso bruto recolectado</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-silver-haze shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">Costo Operativo</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-light text-cosmic-black font-mono">${kpiTotalExpenses.toLocaleString('es-MX')}</span>
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Viáticos, honorarios y riders</span>
            </div>

            <div className="bg-celestial-canvas p-5 rounded-2xl shadow-md flex flex-col justify-between text-white-chalk border border-celestial-canvas">
              <span className="text-[11px] font-bold text-prairie-land uppercase tracking-widest block">Utilidad Neta</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-light font-mono text-white">${kpiTotalProfit.toLocaleString('es-MX')}</span>
                <span className="text-xs opacity-90 text-prairie-land">Neto</span>
              </div>
              <span className="text-[9px] text-white-chalk/85 block mt-1">Margen comercial neto</span>
            </div>
          </div>
        )}

        {/* WORKSPACE: INICIO (HOME DASHBOARD) */}
        {activeWorkspace === 'inicio' && (
          <HomeDashboard
            events={filteredEvents}
            allEvents={events}
            artists={activeArtists}
            venues={activeVenues}
            tours={tours}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {/* WORKSPACE 1: VENUES & EVENT MAP DIRECTORY */}
        {activeWorkspace === 'venues' && (
          <div className="space-y-6">
            {/* Google Places Autocomplete Link paste Simulator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Carga Inteligente de Recintos</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Pega un enlace de Google Maps o escribe el nombre y la ciudad del foro para autocompletar dirección y coordenadas reales. El rating y los puntajes se completan en la Ficha 360.
              </p>
              
              <form onSubmit={handleMapsScrape} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ej. Teatro Metropolitan, Ciudad de México  o un enlace de Google Maps"
                  value={mapsUrl}
                  onChange={(e) => setMapsUrl(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
                <button
                  type="submit"
                  disabled={isScraping}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isScraping ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Buscando recinto...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Autocompletar Foro</span>
                    </>
                  )}
                </button>
              </form>

              {scrapeError && (
                <div role="alert" className="mt-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl px-3 py-2">
                  {scrapeError}
                </div>
              )}

              {scrapeSuccess && lastScrapedVenue && (
                <div className="mt-4 bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 p-4 rounded-xl space-y-3 animate-fade-in shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-emerald-900">{lastScrapedVenue.name}</h4>
                          <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                            {lastScrapedVenue.city}, {lastScrapedVenue.state}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700/90">{lastScrapedVenue.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVenueId(lastScrapedVenue.id);
                          setIsDrawerOpen(true);
                        }}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Ver Ficha 360</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteVenue(lastScrapedVenue.id)}
                        className="text-xs bg-white hover:bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-mono">
                    {lastScrapedVenue.rating > 0 ? (
                      <span>⭐ Rating: <strong>{lastScrapedVenue.rating}</strong> ({lastScrapedVenue.userRatingsCount} reseñas)</span>
                    ) : (
                      <span>ℹ️ Sin rating de Google: completa los datos en la Ficha 360</span>
                    )}
                    <span>📍 GPS: {lastScrapedVenue.lat.toFixed(4)}, {lastScrapedVenue.lng.toFixed(4)}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lastScrapedVenue.lat},${lastScrapedVenue.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold"
                    >
                      Abrir en Google Maps ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Venues search and List Box */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre de recinto o ciudad..."
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono font-semibold">
                  Mostrando {searchedVenues.length} de {activeVenues.length} recintos activos
                </div>
              </div>

              {searchedVenues.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No se encontraron recintos con los criterios de búsqueda o filtros.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                        <th className="px-6 py-4">Recinto</th>
                        <th className="px-6 py-4">Ubicación</th>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">Maps Rating</th>
                        <th className="px-6 py-4">Flamo Score</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {searchedVenues.map((venue) => {
                        // Dynamically calculate individual venue scores
                        const globalScore = Math.round(
                          (venue.scoreRentabilidad * 0.25) +
                          (venue.scoreResponseTime * 0.15) +
                          (venue.scorePuntualidadPago * 0.20) +
                          (venue.scoreNegociacion * 0.15) +
                          (venue.scoreProduccion * 0.15) +
                          (venue.scoreHospitalidad * 0.10)
                        );

                        return (
                          <tr key={venue.id} className="hover:bg-slate-50/80 text-slate-600 transition-colors">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setSelectedVenueId(venue.id);
                                  setIsDrawerOpen(true);
                                }}
                                className="text-left group cursor-pointer"
                              >
                                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors block">
                                  {venue.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-sm mt-0.5 font-medium">
                                  {venue.address}
                                </span>
                              </button>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-500">
                              {venue.city}, {venue.state}
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-medium">
                              {venue.establishmentType}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg">
                                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                {venue.rating} ({venue.userRatingsCount})
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setDrawerInitialTab('modalities');
                                  setSelectedVenueId(venue.id);
                                  setIsDrawerOpen(true);
                                }}
                                className="flex items-center gap-2 group cursor-pointer hover:bg-amber-500/10 p-1.5 rounded-lg transition-colors text-left border border-transparent hover:border-amber-500/20"
                                title="Haz clic para definir o editar los porcentajes de Flamo Score"
                              >
                                <span className="font-mono font-bold text-indigo-600 group-hover:text-amber-600 transition-colors">{globalScore} / 100</span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                  <div className="bg-indigo-500 group-hover:bg-amber-500 h-full transition-colors" style={{ width: `${globalScore}%` }} />
                                </div>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setDrawerInitialTab('info');
                                    setSelectedVenueId(venue.id);
                                    setIsDrawerOpen(true);
                                  }}
                                  className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs transition-all font-bold cursor-pointer flex items-center gap-1.5"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Ver Ficha 360</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteVenue(venue.id)}
                                  className="p-2 text-slate-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100/50 cursor-pointer"
                                  title="Eliminar Recinto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WORKSPACE 2: ARTISTS PORTFOLIO */}
        {activeWorkspace === 'artists' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar for Artist Selection */}
            <div className="lg:col-span-1 space-y-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Portafolio Activo</span>
              {activeArtists.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-silver-haze rounded-2xl bg-white text-slate-400">
                  <Music className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No hay artistas en el portafolio</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeArtists.map((artist) => {
                    const isSelected = artist.id === selectedArtistId;
                    return (
                      <div key={artist.id} className="group relative">
                        <button
                          onClick={() => setSelectedArtistId(artist.id)}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-celestial-canvas/5 border-celestial-canvas/30 text-celestial-canvas shadow-sm font-semibold'
                              : 'bg-white border-silver-haze hover:bg-silver-haze/35 text-slate-700'
                          }`}
                        >
                          <img
                            src={artist.photo}
                            alt={artist.artisticName}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border border-silver-haze"
                          />
                          <div className="truncate pr-8">
                            <span className={`text-xs font-semibold block truncate ${isSelected ? 'text-celestial-canvas font-bold' : 'text-slate-800'}`}>
                              {artist.artisticName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate uppercase tracking-wider font-mono mt-0.5 font-medium">
                              {artist.stage}
                            </span>
                          </div>
                        </button>

                        {/* Hover Quick Delete Artist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Estás seguro de que deseas eliminar al artista "${artist.artisticName}" de tu portafolio?`)) {
                              handleDeleteArtist(artist.id);
                            }
                          }}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-tomato-curry hover:bg-tomato-curry/10 rounded-lg transition-all cursor-pointer"
                          title="Eliminar Artista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Artist button */}
              <button
                onClick={() => setIsAddArtistModalOpen(true)}
                className="w-full mt-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 rounded-xl border border-silver-haze hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-celestial-canvas" />
                <span>Agregar Nuevo Artista</span>
              </button>
            </div>

            {/* Profile 360 viewer */}
            <div className="lg:col-span-3">
              {currentArtist ? (
                <ArtistProfile
                  artist={currentArtist}
                  events={events}
                  venues={venues}
                  tours={tours}
                  onUpdateArtist={handleUpdateArtist}
                  onDeleteArtist={handleDeleteArtist}
                  contracts={contracts}
                  onAddContract={handleAddContract}
                  recordingProjects={recordingProjects}
                />
              ) : (
                <div className="bg-white border border-silver-haze rounded-2xl p-12 text-center text-slate-400">
                  <Music className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700 mb-1">Tu portafolio comercial está listo</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">Aún no tienes artistas registrados. Haz clic en "Agregar Nuevo Artista" para dar de alta tu primer talento.</p>
                  <button
                    onClick={() => setIsAddArtistModalOpen(true)}
                    className="px-4 py-2 bg-celestial-canvas hover:bg-celestial-canvas/90 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Primer Artista</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Artist Modal */}
        <AddArtistModal
          isOpen={isAddArtistModalOpen}
          onClose={() => setIsAddArtistModalOpen(false)}
          onAddArtist={(newArt) => {
            setArtists((prev) => [...prev, newArt]);
            setSelectedArtistId(newArt.id);
          }}
        />

        {/* WORKSPACE 3: FINANCIAL SUITE */}
        {activeWorkspace === 'finances' && (
          <FinancialSuite
            events={events}
            artists={artists}
            venues={activeVenues}
          />
        )}

        {/* WORKSPACE 4: LEGAL SUITE */}
        {activeWorkspace === 'legal' && (
          <LegalSuite
            contracts={contracts}
            onAddContract={handleAddContract}
            onDeleteContract={handleDeleteContract}
            artists={artists}
            venues={activeVenues}
            tours={tours}
            events={events}
          />
        )}

        {/* WORKSPACE: USER CREDENTIAL MANAGEMENT */}
        {activeWorkspace === 'users' && (
          <UserManagement
            users={users}
            currentUserUsername={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* WORKSPACE: PROVIDERS SUITE */}
        {activeWorkspace === 'providers' && (
          <ProvidersSuite
            providers={providers}
            onAddProvider={handleAddProvider}
            onUpdateProvider={handleUpdateProvider}
            onDeleteProvider={handleDeleteProvider}
            venues={activeVenues}
          />
        )}

        {/* WORKSPACE: PRODUCTION SUITE */}
        {activeWorkspace === 'production' && (
          <ProductionSuite
            recordingProjects={recordingProjects}
            events={events}
            artists={artists}
            onAddRecordingProject={handleAddRecordingProject}
            onUpdateRecordingProject={handleUpdateRecordingProject}
            onDeleteRecordingProject={handleDeleteRecordingProject}
            onUpdateEvent={handleUpdateEvent}
          />
        )}

        {/* WORKSPACE 5: DATABASE & NORMALIZATION */}
        {activeWorkspace === 'database' && (
          <SchemaVisualizer
            events={events}
            venues={venues}
            artists={artists}
            providers={providers}
            tours={tours}
            contracts={contracts}
          />
        )}
      </main>

      {syncError && (
        <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg">
          {syncError}
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white px-6 shrink-0 text-center text-[10px] text-slate-400 font-sans font-semibold tracking-wider uppercase">
        FLAMO CRM PRO CONSOLE — PROPIEDAD INTELECTUAL EXCLUSIVA DE GESTIÓN DE TALENTO DE MÚSICA — ENTERPRISE ENGINE OK
      </footer>

      {/* LATERAL DRAWER 75% OF SCREEN FOR VENUE DETAILS */}
      <VenueDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        venue={currentVenue}
        onDeleteVenue={handleDeleteVenue}
        onUpdateVenue={handleUpdateVenue}
        contacts={contacts}
        onAddContact={handleAddContact}
        onDeleteContact={handleDeleteContact}
        events={events}
        artists={artists}
        providers={providers}
        onUpdateProvider={handleUpdateProvider}
        initialTab={drawerInitialTab}
      />
    </div>
  );
}
