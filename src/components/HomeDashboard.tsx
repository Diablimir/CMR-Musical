import React, { useState } from 'react';
import {
  Calendar, Music, Building2, TrendingUp, Sparkles, Plus, Search, Trash2,
  Check, AlertCircle, RefreshCw, Layers, DollarSign, Award, Clock,
  ChevronLeft, ChevronRight, MapPin, Eye, Info, List, CalendarDays, X, Phone, Globe, Star
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import LeafletMap from './LeafletMap';
import { Event, Artist, Venue, Tour } from '../types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim().length > 10;

interface HomeDashboardProps {
  events: Event[];
  allEvents: Event[];
  artists: Artist[];
  venues: Venue[];
  tours: Tour[];
  onAddEvent: (newEvent: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => void;
  onUpdateEvent: (id: string, updated: Partial<Event>) => void;
  onDeleteEvent: (id: string) => void;
  onSelectVenue?: (venueId: string) => void;
}

export default function HomeDashboard({
  events,
  allEvents,
  artists,
  venues,
  tours,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onSelectVenue
}: HomeDashboardProps) {
  // Navigation Tab inside Historial (Calendar vs List)
  const [showView, setShowView] = useState<'calendar' | 'list'>('calendar');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Map state
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(venues[0]?.id || null);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'vector' | 'leaflet' | 'satellite'>('leaflet');

  // Calendar states
  // We initialize the calendar to July 2026 since local time is July 2026 and mock data events live around there
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 6, 1)); // 6 = Julio
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<Event | null>(null);

  // Form states for creating a new Show
  const [showName, setShowName] = useState('');
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedVenueIdForm, setSelectedVenueIdForm] = useState('');
  const [selectedTourId, setSelectedTourId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [capacity, setCapacity] = useState('1000');
  const [attendance, setAttendance] = useState('0');
  const [ticketPrice, setTicketPrice] = useState('400');
  const [expenses, setExpenses] = useState('100000');
  const [status, setStatus] = useState<'Draft' | 'Confirmed' | 'Completed' | 'Cancelled'>('Confirmed');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Map Projection calculations for Mexico
  // Longitude range: -118° (West) to -86° (East)
  // Latitude range: 14° (South) to 33° (North)
  const mapLngToX = (lng: number) => {
    const minLng = -118;
    const maxLng = -86;
    return ((lng - minLng) / (maxLng - minLng)) * 100;
  };

  const mapLatToY = (lat: number) => {
    const minLat = 14;
    const maxLat = 33;
    return 100 - (((lat - minLat) / (maxLat - minLat)) * 100);
  };

  // Get status state for each venue based on events
  const venuesWithStatus = venues.map(v => {
    // Find all events associated with this venue (active, non-deleted)
    const venueEvents = allEvents.filter(e => e.venueId === v.id && !e.deleted_at);
    
    const hasCompleted = venueEvents.some(e => e.status === 'Completed');
    const hasUpcoming = venueEvents.some(e => e.status === 'Confirmed' || e.status === 'Draft');

    let statusState: 'completed' | 'upcoming' | 'none' = 'none';
    if (hasCompleted) {
      statusState = 'completed'; // Verde
    } else if (hasUpcoming) {
      statusState = 'upcoming';  // Amarillo
    }

    return {
      ...v,
      statusState,
      eventsCount: venueEvents.length,
      completedCount: venueEvents.filter(e => e.status === 'Completed').length,
      upcomingCount: venueEvents.filter(e => e.status === 'Confirmed' || e.status === 'Draft').length,
    };
  });

  // Selected venue details for the side-panel
  const selectedVenueDetail = venuesWithStatus.find(v => v.id === selectedVenueId);

  // Filter list events based on search query (for table/search view)
  const searchedEvents = events.filter(evt => {
    const artistName = artists.find(a => a.id === evt.artistId)?.artisticName || '';
    const venueName = venues.find(v => v.id === evt.venueId)?.name || '';
    const matchText = `${evt.name} ${artistName} ${venueName}`.toLowerCase();
    return matchText.includes(searchQuery.toLowerCase());
  });

  const handleOpenAddModal = (initialDate?: string) => {
    setShowName('');
    setSelectedArtistId(artists[0]?.id || '');
    setSelectedVenueIdForm(venues[0]?.id || '');
    setSelectedTourId('');
    setShowDate(initialDate || new Date().toISOString().substring(0, 10));
    setCapacity('1000');
    setAttendance('0');
    setTicketPrice('400');
    setExpenses('100000');
    setStatus('Confirmed');
    setFormError(null);
    setFormSuccess(false);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!showName.trim()) {
      setFormError('El nombre del show es obligatorio.');
      return;
    }
    if (!selectedArtistId) {
      setFormError('Por favor selecciona un artista.');
      return;
    }
    if (!selectedVenueIdForm) {
      setFormError('Por favor selecciona un recinto.');
      return;
    }
    if (!showDate) {
      setFormError('La fecha es obligatoria.');
      return;
    }

    const price = Number(ticketPrice) || 0;
    const att = Number(attendance) || 0;
    const exp = Number(expenses) || 0;
    const cap = Number(capacity) || 0;
    const calculatedIncome = att * price;
    const calculatedProfit = calculatedIncome - exp;

    onAddEvent({
      name: showName.trim(),
      artistId: selectedArtistId,
      venueId: selectedVenueIdForm,
      tourId: selectedTourId || undefined,
      date: showDate,
      capacity: cap,
      attendance: att,
      ticketPrice: price,
      totalIncome: calculatedIncome,
      expenses: exp,
      profit: calculatedProfit,
      status: status
    });

    setFormSuccess(true);
    setTimeout(() => {
      setShowAddModal(false);
      setFormSuccess(false);
    }, 1000);
  };

  const toggleStatus = (id: string, current: string) => {
    let next: 'Draft' | 'Confirmed' | 'Completed' | 'Cancelled' = 'Draft';
    if (current === 'Draft') next = 'Confirmed';
    else if (current === 'Confirmed') next = 'Completed';
    else if (current === 'Completed') next = 'Cancelled';
    else if (current === 'Cancelled') next = 'Draft';

    onUpdateEvent(id, { status: next });
    
    // Also update selected event modal if open
    if (selectedCalendarEvent && selectedCalendarEvent.id === id) {
      setSelectedCalendarEvent(prev => prev ? { ...prev, status: next } : null);
    }
  };

  // Calendar render math (Lunes to Domingo)
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleGoToToday = () => {
    setCalendarDate(new Date(2026, 6, 1)); // Back to our simulation anchor July 2026
  };

  const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  // Day of week index (0 = Sun, 1 = Mon ... 6 = Sat)
  const rawStartDay = new Date(calendarYear, calendarMonth, 1).getDay();
  // Adjust to Monday start: 0 = Mon, 1 = Tue ... 6 = Sun
  const startDayIndex = (rawStartDay + 6) % 7;

  // Month names in Spanish
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Days of previous month to pad calendar start
  const prevMonthTotalDays = new Date(calendarYear, calendarMonth, 0).getDate();

  // Create grid cells
  const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    const prevMonthIdx = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    const mStr = String(prevMonthIdx + 1).padStart(2, '0');
    const dStr = String(prevDay).padStart(2, '0');
    cells.push({
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      dayNum: prevDay,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const mStr = String(calendarMonth + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    cells.push({
      dateStr: `${calendarYear}-${mStr}-${dStr}`,
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill grid to multiple of 7
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthIdx = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    const mStr = String(nextMonthIdx + 1).padStart(2, '0');
    const dStr = String(n).padStart(2, '0');
    cells.push({
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      dayNum: n,
      isCurrentMonth: false,
    });
  }

  // Group events by YYYY-MM-DD
  const calendarEventsByDate: Record<string, Event[]> = {};
  events.forEach(evt => {
    if (!evt.deleted_at) {
      if (!calendarEventsByDate[evt.date]) {
        calendarEventsByDate[evt.date] = [];
      }
      calendarEventsByDate[evt.date].push(evt);
    }
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* CARD 1: MAP OF VENUES & TOUR STATUS */}
      <div className="bg-white border border-silver-haze rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-tomato-curry" />
              <span>Mapa Geográfico de Booking</span>
            </span>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Realizados (Verde)
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Por realizar (Amarillo)
              </span>
            </div>
          </div>
          <h3 className="text-sm font-bold text-cosmic-black">Ruta de Recintos Contratados</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Monitorea el estatus de tus foros agendados en la República Mexicana. Haz clic en los pines para consultar datos de rentabilidad.
          </p>
        </div>

        {/* Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SVG Map (7cols) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-4 flex flex-col justify-between relative min-h-[340px]">
            
            {/* Map Mode Toggles */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-950/90 backdrop-blur-xs p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setMapMode('vector')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  mapMode === 'vector' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mapa Vectorial
              </button>
              <button
                onClick={() => setMapMode('leaflet')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                  mapMode === 'leaflet' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mapa Interactivo (OSM)
              </button>
              <button
                onClick={() => {
                  if (hasValidKey) {
                    setMapMode('satellite');
                  } else {
                    alert('Para activar la vista de Google Maps, configura tu secreto GOOGLE_MAPS_PLATFORM_KEY en la configuración del proyecto (icono de engranaje ⚙️ arriba a la derecha).');
                  }
                }}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                  mapMode === 'satellite' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Google Maps</span>
                {!hasValidKey && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            </div>

            {/* Georeference Box Title */}
            <div className="absolute top-3 left-3 bg-slate-800/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700/50 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest z-10 flex items-center gap-2">
              <Globe className="w-3 h-3 text-sky-400" />
              <span>
                {mapMode === 'leaflet' ? 'OPEN STREET MAP : LIVE' : mapMode === 'satellite' ? 'GOOGLE MAPS LIVE' : 'MÉXICO GPS SYSTEM : UTM PROJ'}
              </span>
            </div>

            {mapMode === 'leaflet' ? (
              <div className="relative w-full flex-1 min-h-[300px] rounded-lg overflow-hidden border border-slate-800 mt-8">
                <LeafletMap
                  venues={venuesWithStatus}
                  selectedVenueId={selectedVenueId}
                  onSelectVenue={(id) => setSelectedVenueId(id)}
                />
              </div>
            ) : mapMode === 'satellite' && hasValidKey ? (
              <div className="relative w-full flex-1 min-h-[300px] rounded-lg overflow-hidden border border-slate-800 mt-8">
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={{ lat: 23.6345, lng: -102.5528 }}
                    defaultZoom={5}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    gestureHandling={'cooperative'}
                    disableDefaultUI={false}
                  >
                    {venuesWithStatus.map((v) => {
                      const lat = Number(v.lat) || 19.42;
                      const lng = Number(v.lng) || -99.13;
                      const isSelected = selectedVenueId === v.id;
                      
                      // Color based on status: Completed (Green), Upcoming (Yellow), None (Gray)
                      let pinColor = '#94a3b8'; // gray
                      let glyphColor = '#fff';
                      let borderColor = '#64748b';
                      
                      if (v.statusState === 'completed') {
                        pinColor = '#10b981'; // emerald-500
                        borderColor = '#047857';
                      } else if (v.statusState === 'upcoming') {
                        pinColor = '#fbbf24'; // amber-400
                        borderColor = '#b45309';
                      }

                      return (
                        <AdvancedMarker
                          key={v.id}
                          position={{ lat, lng }}
                          title={v.name}
                          onClick={() => setSelectedVenueId(v.id)}
                        >
                          <Pin 
                            background={pinColor} 
                            glyphColor={glyphColor} 
                            borderColor={borderColor}
                            scale={isSelected ? 1.25 : 1.0}
                          />
                        </AdvancedMarker>
                      );
                    })}
                  </Map>
                </APIProvider>
              </div>
            ) : (
              <>
                {/* Background Map Graphic Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10 select-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* SVG Canvas Area */}
                <div className="relative w-full flex-1 flex items-center justify-center pt-6">
                  <svg 
                    viewBox="0 0 500 300" 
                    className="w-full max-w-lg aspect-[5/3] text-slate-700"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="mexicoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                      </linearGradient>
                      <linearGradient id="bajaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#111827" />
                      </linearGradient>
                    </defs>

                    {/* Grid coordinates */}
                    <line x1="50" y1="0" x2="50" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="150" y1="0" x2="150" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="250" y1="0" x2="250" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="350" y1="0" x2="350" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="450" y1="0" x2="450" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
                    <line x1="0" y1="220" x2="500" y2="220" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />

                    {/* Oceans & Gulfs labels */}
                    <text x="80" y="220" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="monospace" letterSpacing="2">OCÉANO PACÍFICO</text>
                    <text x="350" y="160" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="monospace" letterSpacing="2">GOLFO DE MÉXICO</text>

                    {/* Stylized Abstract Coastlines of Mexico */}
                    {/* Baja Peninsula */}
                    <path
                      d="M 15,35 
                         C 20,45 35,65 40,85
                         C 45,105 55,120 60,135
                         C 62,139 65,140 65,135
                         C 60,120 50,100 45,80
                         C 40,60 30,45 25,35
                         Z"
                      fill="url(#bajaGradient)"
                      stroke="#334155"
                      strokeWidth="1.2"
                    />

                    {/* Mainland Mexico Silhouette */}
                    <path
                      d="M 68,90 
                         C 80,85 100,75 120,70
                         C 150,65 170,75 200,65
                         C 220,55 240,40 280,35
                         C 310,30 330,40 360,40
                         C 390,40 400,65 410,75
                         C 420,85 415,100 395,115
                         C 385,120 375,130 365,140
                         C 355,150 370,165 385,185
                         C 395,195 425,195 445,190
                         C 465,185 480,195 490,210
                         C 495,220 480,230 460,225
                         C 440,220 420,210 405,200
                         C 390,190 380,185 365,185
                         C 350,185 330,195 320,210
                         C 310,225 290,240 270,255
                         C 250,270 210,285 190,285
                         C 170,285 150,275 130,260
                         C 115,250 100,240 95,230
                         C 90,220 100,210 110,195
                         C 115,185 105,175 95,160
                         C 85,145 70,135 72,125
                         C 74,115 68,100 68,90
                         Z"
                      fill="url(#mexicoGradient)"
                      stroke="#334155"
                      strokeWidth="1.2"
                    />

                    {/* Major Reference City Dots (CDMX, Monterrey, Guadalajara, Mérida, Tijuana) */}
                    <circle cx="294" cy="214" r="2" fill="#475569" />
                    <text x="298" y="217" fill="#64748b" fontSize="6" fontWeight="bold">CDMX</text>

                    <circle cx="276" cy="116" r="2" fill="#475569" />
                    <text x="280" y="119" fill="#64748b" fontSize="6" fontWeight="bold">MTY</text>

                    <circle cx="229" cy="195" r="2" fill="#475569" />
                    <text x="202" y="198" fill="#64748b" fontSize="6" fontWeight="bold">GDL</text>

                    <circle cx="456" cy="190" r="2" fill="#475569" />
                    <text x="450" y="184" fill="#64748b" fontSize="6" fontWeight="bold">MID</text>

                    <circle cx="33" cy="34" r="2" fill="#475569" />
                    <text x="37" y="37" fill="#64748b" fontSize="6" fontWeight="bold">TIJ</text>
                  </svg>

                  {/* DOM Overlay of Interactive Venue Pins */}
                  {venuesWithStatus.map((v) => {
                    const lat = typeof v.lat === 'number' ? v.lat : 19.42;
                    const lng = typeof v.lng === 'number' ? v.lng : -99.13;
                    const xPct = mapLngToX(lng);
                    const yPct = mapLatToY(lat);

                    // Skip drawing pins that fallback outside valid coordinates or map ranges
                    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return null;

                    const isSelected = selectedVenueId === v.id;
                    const isHovered = hoveredVenueId === v.id;

                    // Color based on status: Completed (Green), Upcoming (Yellow), None (Gray)
                    let pinBgColor = 'bg-slate-400';
                    let pinBorderColor = 'border-slate-500';
                    let pinRingColor = 'ring-slate-400/20';

                    if (v.statusState === 'completed') {
                      pinBgColor = 'bg-emerald-500';
                      pinBorderColor = 'border-emerald-300';
                      pinRingColor = 'ring-emerald-500/30';
                    } else if (v.statusState === 'upcoming') {
                      pinBgColor = 'bg-amber-400';
                      pinBorderColor = 'border-amber-200';
                      pinRingColor = 'ring-amber-400/30';
                    }

                    return (
                      <div
                        key={v.id}
                        className="absolute cursor-pointer transition-transform duration-300 z-20 group"
                        style={{
                          left: `${xPct}%`,
                          top: `${yPct}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => setSelectedVenueId(v.id)}
                        onMouseEnter={() => setHoveredVenueId(v.id)}
                        onMouseLeave={() => setHoveredVenueId(null)}
                      >
                        {/* Ring highlight animation if selected */}
                        {isSelected && (
                          <span className={`absolute -inset-2.5 rounded-full border border-dashed animate-spin ${
                            v.statusState === 'completed' ? 'border-emerald-500/50' : 'border-amber-400/50'
                          }`} />
                        )}

                        {/* Ping pulsing background effect */}
                        <span className={`absolute inline-flex h-4 w-4 rounded-full opacity-60 animate-ping -left-0.5 -top-0.5 ${pinBgColor}`} />

                        {/* Dot pin */}
                        <div className={`relative w-3.5 h-3.5 rounded-full border-2 shadow-md transition-all ${pinBgColor} ${pinBorderColor} ${
                          isSelected ? 'scale-150 ring-4 ' + pinRingColor : 'hover:scale-125'
                        }`} />

                        {/* Label tooltip trigger */}
                        <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 bg-cosmic-black text-white text-[9px] px-2 py-1 rounded-lg shadow-lg pointer-events-none transition-all duration-200 whitespace-nowrap border border-slate-800 z-30 ${
                          isHovered || isSelected ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-1'
                        }`}>
                          <p className="font-bold">{v.name}</p>
                          <p className="text-[8px] text-slate-400">{v.city} · {v.establishmentType}</p>
                          <div className="flex items-center gap-2 mt-1 pt-0.5 border-t border-slate-800">
                            <span className="text-emerald-400 font-bold">{v.completedCount} realizado(s)</span>
                            <span className="text-amber-400 font-bold">{v.upcomingCount} programado(s)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Scale/Disclaimer */}
            <div className="text-[8px] font-mono text-slate-500 text-center">
              Coordenadas geográficas mapeadas en tiempo real para Lunario, C3 Stage, Café Iguana, Teatro Metropólitan y Foro Indie Rocks.
            </div>
          </div>

          {/* Venue detail side-card (5cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
            {selectedVenueDetail ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        selectedVenueDetail.statusState === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedVenueDetail.statusState === 'upcoming'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedVenueDetail.statusState === 'completed' ? 'Shows Completados' : selectedVenueDetail.statusState === 'upcoming' ? 'Shows Próximos' : 'Sin shows agendados'}
                      </span>
                      <h4 className="text-xs font-bold text-cosmic-black mt-1.5">{selectedVenueDetail.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{selectedVenueDetail.city}, {selectedVenueDetail.state}</p>
                    </div>

                    <div className="bg-white border border-slate-200 px-2 py-1 rounded-xl text-center shadow-2xs shrink-0">
                      <span className="text-[9px] text-slate-400 block font-bold">FLAMO SCORE</span>
                      <span className="text-xs font-black text-indigo-600 font-mono">
                        {Math.round(
                          (selectedVenueDetail.scoreRentabilidad * 0.25) +
                          (selectedVenueDetail.scoreResponseTime * 0.15) +
                          (selectedVenueDetail.scorePuntualidadPago * 0.20) +
                          (selectedVenueDetail.scoreNegociacion * 0.15) +
                          (selectedVenueDetail.scoreProduccion * 0.15) +
                          (selectedVenueDetail.scoreHospitalidad * 0.10)
                        )}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 italic mt-2.5 bg-white border border-slate-150 p-2 rounded-lg font-medium">
                    {selectedVenueDetail.address}
                  </p>

                  {/* Financial metrics / Performance */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Métricas del Recinto</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                      <div className="bg-white p-2 border border-slate-150 rounded-lg">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">Rentabilidad</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${selectedVenueDetail.scoreRentabilidad}%` }} />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{selectedVenueDetail.scoreRentabilidad}%</span>
                        </div>
                      </div>

                      <div className="bg-white p-2 border border-slate-150 rounded-lg">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">Puntualidad Pago</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${selectedVenueDetail.scorePuntualidadPago}%` }} />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{selectedVenueDetail.scorePuntualidadPago}%</span>
                        </div>
                      </div>

                      <div className="bg-white p-2 border border-slate-150 rounded-lg">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">Hospitalidad</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-pink-500 h-full" style={{ width: `${selectedVenueDetail.scoreHospitalidad}%` }} />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{selectedVenueDetail.scoreHospitalidad}%</span>
                        </div>
                      </div>

                      <div className="bg-white p-2 border border-slate-150 rounded-lg">
                        <span className="text-[8px] text-slate-400 block uppercase font-bold">Producción/Rider</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full" style={{ width: `${selectedVenueDetail.scoreProduccion}%` }} />
                          </div>
                          <span className="font-mono font-bold text-slate-700">{selectedVenueDetail.scoreProduccion}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shows booked list */}
                  <div className="mt-4">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1.5">Agenda Vinculada ({selectedVenueDetail.eventsCount})</span>
                    {selectedVenueDetail.eventsCount === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">No hay shows programados en este foro actualmente.</p>
                    ) : (
                      <div className="max-h-[100px] overflow-y-auto divide-y divide-slate-200/60 pr-1 space-y-1.5 pt-0.5">
                        {allEvents.filter(e => e.venueId === selectedVenueDetail.id && !e.deleted_at).map(evt => (
                          <div key={evt.id} className="flex justify-between items-center text-[10px] py-1 bg-white border border-slate-150/60 p-1.5 rounded-lg">
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-700 block truncate">{evt.name}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{evt.date}</span>
                            </div>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              evt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : evt.status === 'Confirmed'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : evt.status === 'Draft'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {evt.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main contact link actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-slate-200/60 mt-auto">
                  <div className="flex gap-2 text-[10px] font-bold">
                    {selectedVenueDetail.website && (
                      <a
                        href={selectedVenueDetail.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 text-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 p-2 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Web Oficial</span>
                      </a>
                    )}
                    {selectedVenueDetail.phone && (
                      <a
                        href={`tel:${selectedVenueDetail.phone}`}
                        className="flex-1 text-center bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 p-2 rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Contactar</span>
                      </a>
                    )}
                  </div>

                  {onSelectVenue && (
                    <button
                      onClick={() => onSelectVenue(selectedVenueDetail.id)}
                      className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-bold"
                    >
                      <Eye className="w-3.5 h-3.5 text-white" />
                      <span>Ver Ficha Completa (CRM)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                <MapPin className="w-8 h-8 text-slate-300 animate-bounce" />
                <p className="text-xs font-bold text-slate-600">Ningún recinto seleccionado</p>
                <p className="text-[11px] text-slate-400">Haz clic en cualquier pin brillante del mapa nacional para ver ratings, datos de contacto y estatus financiero del foro.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* CARD 2: INTERACTIVE CALENDAR & AGENDA WITH VIEW TOGGLE */}
      <div className="bg-white border border-silver-haze rounded-2xl shadow-sm overflow-hidden">
        
        {/* Card Header with View Switcher */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CalendarDays className="w-4 h-4 text-tomato-curry" />
              <h3 className="text-xs font-bold uppercase text-cosmic-black tracking-wider">Historial & Agenda de Shows (Event Hub)</h3>
            </div>
            <p className="text-[11px] text-slate-400">Consulta de fechas de giras y shows de tus artistas en formato de calendario o tabla rápida.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Tab Swapper Toggle */}
            <div className="bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50 flex items-center gap-0.5 text-[10px] font-bold">
              <button
                onClick={() => setShowView('calendar')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  showView === 'calendar'
                    ? 'bg-white text-cosmic-black shadow-sm'
                    : 'text-slate-500 hover:text-cosmic-black'
                }`}
              >
                Calendario
              </button>
              <button
                onClick={() => setShowView('list')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                  showView === 'list'
                    ? 'bg-white text-cosmic-black shadow-sm'
                    : 'text-slate-500 hover:text-cosmic-black'
                }`}
              >
                Lista de Shows
              </button>
            </div>

            <button
              onClick={() => handleOpenAddModal()}
              className="bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Planificar Show</span>
            </button>
          </div>
        </div>

        {/* CALENDAR VIEW INTERACTIVE ELEMENT */}
        {showView === 'calendar' && (
          <div className="p-5 space-y-4">
            
            {/* Calendar Month Selector Header */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-150">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 text-slate-500 hover:text-cosmic-black hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Mes Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 text-slate-500 hover:text-cosmic-black hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Mes Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <h4 className="text-xs font-bold text-cosmic-black ml-1 uppercase tracking-wider font-mono">
                  {monthNames[calendarMonth]} {calendarYear}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">Tip: Haz clic en un día libre para planificar show</span>
                <button
                  onClick={handleGoToToday}
                  className="bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] border border-slate-250 px-2.5 py-1 rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  Hoy (Julio 2026)
                </button>
              </div>
            </div>

            {/* Calendar Grid Lunes-start */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/10">
              {/* Day Titles */}
              <div className="grid grid-cols-7 border-b border-slate-200 text-center bg-slate-50 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div className="text-rose-400">Dom</div>
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 border-l border-t border-transparent text-xs bg-white">
                {cells.map((cell, idx) => {
                  const dayEvents = calendarEventsByDate[cell.dateStr] || [];
                  const isSunday = (idx + 1) % 7 === 0;

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      onClick={() => {
                        // Prefill the planify modal if clicking on current month cells
                        if (cell.isCurrentMonth && dayEvents.length === 0) {
                          handleOpenAddModal(cell.dateStr);
                        }
                      }}
                      className={`min-h-[90px] p-2 flex flex-col justify-between transition-all group ${
                        cell.isCurrentMonth 
                          ? 'bg-white hover:bg-indigo-50/20' 
                          : 'bg-slate-50/50 text-slate-300'
                      }`}
                    >
                      {/* Day Number and Quick Plus on hover */}
                      <div className="flex items-center justify-between">
                        <span className={`font-mono font-bold text-[10px] ${
                          cell.isCurrentMonth 
                            ? isSunday 
                              ? 'text-rose-500' 
                              : 'text-slate-700'
                            : 'text-slate-300'
                        }`}>
                          {cell.dayNum}
                        </span>

                        {cell.isCurrentMonth && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAddModal(cell.dateStr);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                            title="Añadir show este día"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Day events badges */}
                      <div className="mt-1.5 space-y-1 flex-1 flex flex-col justify-end">
                        {dayEvents.map((evt) => {
                          const artist = artists.find(a => a.id === evt.artistId);
                          const venue = venues.find(v => v.id === evt.venueId);

                          // Colors depending on status
                          let badgeStyle = 'bg-slate-50 border-slate-200 text-slate-600';
                          if (evt.status === 'Completed') badgeStyle = 'bg-emerald-50 border-emerald-150 text-emerald-700 hover:bg-emerald-100';
                          else if (evt.status === 'Confirmed') badgeStyle = 'bg-sky-50 border-sky-150 text-sky-700 hover:bg-sky-100';
                          else if (evt.status === 'Draft') badgeStyle = 'bg-amber-50 border-amber-150 text-amber-700 hover:bg-amber-100';
                          else if (evt.status === 'Cancelled') badgeStyle = 'bg-rose-50 border-rose-150 text-rose-700 hover:bg-rose-100';

                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCalendarEvent(evt);
                              }}
                              className={`border px-1.5 py-0.5 rounded text-[8px] font-bold truncate tracking-tight transition-colors cursor-pointer flex items-center justify-between gap-1 ${badgeStyle}`}
                              title={`${evt.name} en ${venue?.name || ''}`}
                            >
                              <span className="truncate flex-1">
                                <span className="text-slate-500">[{artist?.artisticName || '...'}]</span> {evt.name}
                              </span>
                              <span className="w-1 h-1 rounded-full shrink-0 bg-current" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ORIGINAL LIST / SEARCH VIEW */}
        {showView === 'list' && (
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Table Search */}
              <div className="relative flex-1 md:w-64 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
                <input
                  type="text"
                  placeholder="Buscar show, artista, recinto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tomato-curry/15 transition-all font-medium"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">
                Mostrando {searchedEvents.length} shows en base a tus filtros
              </span>
            </div>

            {searchedEvents.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <Calendar className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold">No se encontraron shows</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">Prueba reiniciando los filtros globales o realizando otra búsqueda para visualizar resultados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      <th className="px-6 py-4">Evento / Show</th>
                      <th className="px-6 py-4">Artista</th>
                      <th className="px-6 py-4">Recinto (Foro)</th>
                      <th className="px-6 py-4">Gira</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4">Capacidad / Asist.</th>
                      <th className="px-6 py-4">Utilidad Neta</th>
                      <th className="px-6 py-4">Estatus</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {searchedEvents.map((evt) => {
                      const artist = artists.find(a => a.id === evt.artistId);
                      const venue = venues.find(v => v.id === evt.venueId);
                      const tour = tours.find(t => t.id === evt.tourId);

                      const rentability = evt.capacity > 0 ? Math.round((evt.attendance / evt.capacity) * 100) : 0;
                      const isProfitable = evt.profit >= 0;

                      return (
                        <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800 block">{evt.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Ref: {evt.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {artist?.photo && (
                                <img src={artist.photo} alt={artist.artisticName} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                              )}
                              <span className="font-semibold text-slate-700">{artist?.artisticName || 'Desconocido'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {venue ? (
                              <button
                                onClick={() => onSelectVenue?.(venue.id)}
                                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors text-left cursor-pointer"
                              >
                                {venue.name}
                              </button>
                            ) : (
                              <span className="text-slate-400">Recinto No Encontrado</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {tour ? (
                              <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {tour.name}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-mono font-semibold text-slate-500">
                            {evt.date}
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            <div className="flex flex-col">
                              <span>{evt.attendance.toLocaleString()} / {evt.capacity.toLocaleString()}</span>
                              <span className="text-[9px] text-slate-400 font-normal">{rentability}% de aforo</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">
                            <span className={isProfitable ? 'text-emerald-600' : 'text-rose-500'}>
                              {isProfitable ? '+' : '-'}${Math.abs(evt.profit).toLocaleString('es-MX')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleStatus(evt.id, evt.status)}
                              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                                evt.status === 'Completed'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  : evt.status === 'Confirmed'
                                  ? 'bg-sky-50 border-sky-200 text-sky-600'
                                  : evt.status === 'Draft'
                                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                                  : 'bg-rose-50 border-rose-200 text-rose-600'
                              }`}
                              title="Haga clic para cambiar de estado secuencialmente"
                            >
                              {evt.status}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el show "${evt.name}"?`)) {
                                  onDeleteEvent(evt.id);
                                }
                              }}
                              className="p-1.5 text-slate-300 hover:text-tomato-curry hover:bg-tomato-curry/10 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Evento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAILED CALENDAR EVENT PREVIEW MODAL */}
      {selectedCalendarEvent && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-silver-haze flex items-center justify-between">
              <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                selectedCalendarEvent.status === 'Completed'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : selectedCalendarEvent.status === 'Confirmed'
                  ? 'bg-sky-50 border-sky-200 text-sky-600'
                  : selectedCalendarEvent.status === 'Draft'
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
                Show {selectedCalendarEvent.status}
              </span>
              <button
                onClick={() => setSelectedCalendarEvent(null)}
                className="p-1 text-slate-400 hover:text-cosmic-black hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs font-sans">
              
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">CONCIERTO</span>
                <h4 className="text-sm font-black text-slate-800 mt-0.5">{selectedCalendarEvent.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedCalendarEvent.id} · Fecha: {selectedCalendarEvent.date}</p>
              </div>

              {/* Artist and Venue details */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Artist panel */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Artista</span>
                  {(() => {
                    const art = artists.find(a => a.id === selectedCalendarEvent.artistId);
                    return (
                      <div className="flex items-center gap-2">
                        {art?.photo && (
                          <img src={art.photo} alt={art.artisticName} className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-700 truncate">{art?.artisticName || 'Desconocido'}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Venue panel */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Recinto</span>
                  {(() => {
                    const ven = venues.find(v => v.id === selectedCalendarEvent.venueId);
                    return (
                      <div className="truncate">
                        <span className="font-semibold text-slate-700 block truncate" title={ven?.name}>{ven?.name || 'Recinto No Encontrado'}</span>
                        <span className="text-[9px] text-slate-400 truncate block">{ven?.city}, {ven?.state}</span>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Setlist Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-tomato-curry" />
                    <span>Setlist de Canciones</span>
                  </span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-150/50">
                    {selectedCalendarEvent.setlist?.length || 0} canciones
                  </span>
                </div>

                {selectedCalendarEvent.setlist && selectedCalendarEvent.setlist.length > 0 ? (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {selectedCalendarEvent.setlist.map((song, sIdx) => (
                      <div key={song.id || sIdx} className="bg-slate-50 border border-slate-150/50 p-2 rounded-lg text-[11px] flex items-center justify-between gap-1.5">
                        <div className="truncate flex-1">
                          <span className="font-bold text-slate-500 font-mono text-[9px] mr-1.5 bg-slate-200 px-1 rounded-sm">
                            {(sIdx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="font-bold text-slate-800">{song.songTitle}</span>
                          {song.transitionNotes && (
                            <span className="block text-[9px] text-slate-400 truncate mt-0.5 font-medium">
                              Nota: {song.transitionNotes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {song.tempo && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              song.tempo === 'Rápido' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              song.tempo === 'Medio' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                              'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {song.tempo}
                            </span>
                          )}
                          {song.duration && (
                            <span className="font-mono text-slate-400 text-[10px] font-semibold">{song.duration}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const updatedSetlist = (selectedCalendarEvent.setlist || []).filter((_, idx) => idx !== sIdx);
                              onUpdateEvent(selectedCalendarEvent.id, { setlist: updatedSetlist });
                              setSelectedCalendarEvent(prev => prev ? { ...prev, setlist: updatedSetlist } : null);
                            }}
                            className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors"
                            title="Quitar canción"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold">No se ha registrado un setlist de canciones aún.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultSongs = [
                          { id: `song-1`, songTitle: 'Overture / Intro', duration: '3:30', tempo: 'Lento' as const, transitionNotes: 'Entrada con luces tenues, directo a piano acústico' },
                          { id: `song-2`, songTitle: 'Modular Waves (Single)', duration: '4:15', tempo: 'Rápido' as const, transitionNotes: 'Aumentar velocidad de arpegios de golpe' },
                          { id: `song-3`, songTitle: 'Digital Dawn (Acoustic)', duration: '3:45', tempo: 'Medio' as const, transitionNotes: 'Fades slowly con solos de violín' },
                          { id: `song-4`, songTitle: 'Symphonic Climax (Encore)', duration: '5:10', tempo: 'Rápido' as const, transitionNotes: 'Despedida emotiva y clímax del concierto' },
                        ];
                        onUpdateEvent(selectedCalendarEvent.id, { setlist: defaultSongs });
                        setSelectedCalendarEvent(prev => prev ? { ...prev, setlist: defaultSongs } : null);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer bg-white px-2 py-1 rounded border border-slate-200 shadow-3xs"
                    >
                      + Cargar Setlist Recomendado
                    </button>
                  </div>
                )}

                {/* Quick Add Song Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const titleInput = form.elements.namedItem('songTitle') as HTMLInputElement;
                    const durationInput = form.elements.namedItem('songDuration') as HTMLInputElement;
                    const tempoInput = form.elements.namedItem('songTempo') as HTMLSelectElement;
                    
                    const title = titleInput.value.trim();
                    if (!title) return;

                    const newSong = {
                      id: `song-${Date.now()}`,
                      songTitle: title,
                      duration: durationInput.value.trim() || '3:30',
                      tempo: (tempoInput.value || 'Medio') as any,
                      transitionNotes: 'Agregado desde el Calendario'
                    };

                    const currentSetlist = selectedCalendarEvent.setlist || [];
                    const updatedSetlist = [...currentSetlist, newSong];
                    
                    onUpdateEvent(selectedCalendarEvent.id, { setlist: updatedSetlist });
                    setSelectedCalendarEvent(prev => prev ? { ...prev, setlist: updatedSetlist } : null);

                    titleInput.value = '';
                    durationInput.value = '';
                  }}
                  className="flex gap-1.5 pt-2 border-t border-slate-100"
                >
                  <input
                    name="songTitle"
                    required
                    placeholder="Añadir canción..."
                    className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 text-[10px] text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    name="songDuration"
                    placeholder="Min:Seg"
                    className="w-12 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-1.5 py-1 text-[10px] font-mono text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <select name="songTempo" className="bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-[10px] text-slate-600 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="Lento">Lento</option>
                    <option value="Medio">Medio</option>
                    <option value="Rápido">Rápido</option>
                  </select>
                  <button type="submit" className="bg-indigo-600 text-white font-bold px-2.5 rounded-lg hover:bg-indigo-700 text-[11px] cursor-pointer">
                    +
                  </button>
                </form>
              </div>

              {/* Financial Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Análisis Financiero</span>
                
                <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-3 text-center">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">Boletos Vendidos</span>
                    <span className="font-mono text-xs font-bold block mt-0.5">{selectedCalendarEvent.attendance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">Precio Promedio</span>
                    <span className="font-mono text-xs font-bold block mt-0.5">${selectedCalendarEvent.ticketPrice}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">Aforo Contratado</span>
                    <span className="font-mono text-xs font-bold block mt-0.5">{selectedCalendarEvent.capacity.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-400">Ingreso Bruto de Taquilla:</span>
                  <span className="font-mono font-bold">${selectedCalendarEvent.totalIncome.toLocaleString()} MXN</span>
                </div>

                <div className="flex justify-between text-[11px] font-semibold text-rose-400">
                  <span>Gastos de Producción/Gira:</span>
                  <span className="font-mono font-bold">-${selectedCalendarEvent.expenses.toLocaleString()} MXN</span>
                </div>

                <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-800">
                  <span className="text-slate-300">Utilidad Neta (Net Profit):</span>
                  <span className={`font-mono ${selectedCalendarEvent.profit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {selectedCalendarEvent.profit >= 0 ? '+' : '-'}${Math.abs(selectedCalendarEvent.profit).toLocaleString()} MXN
                  </span>
                </div>

              </div>

              {/* Tour metadata */}
              {selectedCalendarEvent.tourId && (
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-2 rounded-xl text-[10px] font-semibold">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Vinculado a la Gira: {tours.find(t => t.id === selectedCalendarEvent.tourId)?.name || 'Gira activa'}</span>
                </div>
              )}

              {/* Action buttons inside detail modal */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 text-[10px] font-bold">
                <button
                  onClick={() => toggleStatus(selectedCalendarEvent.id, selectedCalendarEvent.status)}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-xl shadow-2xs cursor-pointer text-center"
                >
                  Cambiar Estado
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el show "${selectedCalendarEvent.name}"?`)) {
                      onDeleteEvent(selectedCalendarEvent.id);
                      setSelectedCalendarEvent(null);
                    }
                  }}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 p-2.5 rounded-xl shadow-2xs cursor-pointer text-center"
                >
                  Eliminar Fecha
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PLANIFICAR SHOW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-4 bg-slate-50 border-b border-silver-haze flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-cosmic-black tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-tomato-curry" />
                <span>Planificar Nuevo Evento / Show</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-cosmic-black text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="bg-tomato-curry/10 border border-tomato-curry/20 text-tomato-curry rounded-xl p-3 flex items-start gap-2.5 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-3 flex items-start gap-2.5 font-semibold animate-fade-in">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>¡Show guardado y programado con éxito en el sistema!</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Nombre Oficial del Concierto / Show *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Vladimir Belmont - Symphonic CDMX"
                    value={showName}
                    onChange={(e) => setShowName(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Artista del Portafolio *</label>
                  <select
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  >
                    {artists.map(a => (
                      <option key={a.id} value={a.id}>{a.artisticName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Recinto / Foro Contratado *</label>
                  <select
                    value={selectedVenueIdForm}
                    onChange={(e) => setSelectedVenueIdForm(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  >
                    {venues.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Gira Vinculada (Opcional)</label>
                  <select
                    value={selectedTourId}
                    onChange={(e) => setSelectedTourId(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  >
                    <option value="">Ninguna - Show Individual</option>
                    {tours.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Fecha del Concierto *</label>
                  <input
                    type="date"
                    required
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Aforo Total (Capacidad)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 font-semibold text-slate-500">Boletos Vendidos (Asistencia)</label>
                  <input
                    type="number"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  />
                  <span className="text-[9px] text-slate-400 block">Dejar en 0 si aún no ha sucedido</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Precio de Boleto Promedio ($ MXN)</label>
                  <input
                    type="number"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Gastos Operativos Proyectados ($ MXN)</label>
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Estado de la Fecha *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                  >
                    <option value="Draft">Borrador - Cotizando recinto</option>
                    <option value="Confirmed">Confirmado - Boletos en venta</option>
                    <option value="Completed">Completado - Concierto liquidado</option>
                    <option value="Cancelled">Cancelado / Pospuesto</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-silver-haze text-slate-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm cursor-pointer"
                >
                  Programar Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
