import ArtistFicha from './ArtistFicha';
import Avatar from './Avatar';
import SocialMetrics from './SocialMetrics';
import { integrations } from '../lib/api';
import PhotoPicker from './PhotoPicker';
import React, { useState } from 'react';
import {
  Artist, Event, Venue, Tour, PipelineItem, HistoryEvent, Contract, RecordingProject, MemberHistory
} from '../types';
import {
  TrendingUp, Award, Calendar, DollarSign, BarChart3, Users,
  Heart, Plus, Check, Globe, Instagram, Youtube, Phone, Music,
  CheckSquare, Square, ChevronRight, User, Shield, Info, Radio, Trash2,
  Upload, FileText, Eye, Download, Building2, Layers, Facebook, RefreshCw, CheckCircle2,
  Database, Copy, Lock, Unlock, AlertTriangle, Sparkles, X, RotateCw, Sliders, Image
} from 'lucide-react';

interface ArtistProfileProps {
  artist: Artist;
  events: Event[];
  venues: Venue[];
  tours: Tour[];
  onUpdateArtist: (updated: Artist) => void;
  onDeleteArtist?: (artistId: string) => void;
  contracts?: Contract[];
  onAddContract?: (contract: Contract) => void;
  recordingProjects?: RecordingProject[];
}

export default function ArtistProfile({
  artist,
  events,
  venues,
  tours,
  onUpdateArtist,
  onDeleteArtist,
  contracts = [],
  onAddContract,
  recordingProjects = []
}: ArtistProfileProps) {
  const [activeSubTab, setActiveSubTab] = useState<'360' | 'pipeline' | 'contracts' | 'shows' | 'history' | 'social'>(() => { try { if (sessionStorage.getItem('flamo_open_social')) { sessionStorage.removeItem('flamo_open_social'); return 'social'; } } catch { /* sin almacenamiento */ } return '360'; });
  // NEW: MemberHistory and Photo Editor States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<MemberHistory | null>(null);
  const [newMemberForm, setNewMemberForm] = useState<{
    name: string;
    role: string;
    startDate: string;
    endDate: string;
    venueName: string;
    active: boolean;
  }>({
    name: '',
    role: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: '',
    venueName: '',
    active: true
  });

  // Photo Editor States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState(artist.photo);
  const [photoZoom, setPhotoZoom] = useState(artist.photoStyle?.zoom ?? 1);
  const [photoRotation, setPhotoRotation] = useState(artist.photoStyle?.rotation ?? 0);
  const [photoContrast, setPhotoContrast] = useState(artist.photoStyle?.contrast ?? 1);
  const [photoBrightness, setPhotoBrightness] = useState(artist.photoStyle?.brightness ?? 1);
  const [photoGrayscale, setPhotoGrayscale] = useState(artist.photoStyle?.grayscale ?? 0);
  const [photoSepia, setPhotoSepia] = useState(artist.photoStyle?.sepia ?? 0);
  const [photoBlur, setPhotoBlur] = useState(artist.photoStyle?.blur ?? 0);

  // Sync state if artist changes
  React.useEffect(() => {
    setPhotoUrlInput(artist.photo);
    setPhotoZoom(artist.photoStyle?.zoom ?? 1);
    setPhotoRotation(artist.photoStyle?.rotation ?? 0);
    setPhotoContrast(artist.photoStyle?.contrast ?? 1);
    setPhotoBrightness(artist.photoStyle?.brightness ?? 1);
    setPhotoGrayscale(artist.photoStyle?.grayscale ?? 0);
    setPhotoSepia(artist.photoStyle?.sepia ?? 0);
    setPhotoBlur(artist.photoStyle?.blur ?? 0);
  }, [artist]);

  // Member History Helpers
  const getMemberHistory = (): MemberHistory[] => {
    if (artist.memberHistory && artist.memberHistory.length > 0) {
      return artist.memberHistory;
    }
    return artist.members.map((m, idx) => {
      const parts = m.split('(');
      const name = parts[0].trim();
      const role = parts[1] ? parts[1].replace(')', '').trim() : 'Músico';
      return {
        id: `m-${idx}-${artist.id}`,
        name,
        role,
        startDate: artist.startDate || '',
        active: true
      };
    });
  };

  const saveMemberHistory = (newHistory: MemberHistory[]) => {
    const updatedArtist: Artist = {
      ...artist,
      memberHistory: newHistory,
      members: newHistory.filter(m => m.active).map(m => `${m.name} (${m.role})`),
      updated_at: new Date().toISOString()
    };
    onUpdateArtist(updatedArtist);
  };

  // Contracts related states for Shows tab
  const [uploadingForEvent, setUploadingForEvent] = useState<Event | null>(null);
  const [previewingContract, setPreviewingContract] = useState<Contract | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFile, setUploadFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Submit in-show uploaded contract
  const handleShowContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingForEvent || !onAddContract) return;

    const fileDetails = uploadFile || {
      name: `CONTRATO_ESCANEADO_${uploadingForEvent.id.toUpperCase()}.pdf`,
      size: '1.4 MB'
    };

    const newContract: Contract = {
      id: `con-show-${Date.now()}`,
      title: uploadTitle || `Contrato Foro - ${venues.find(v => v.id === uploadingForEvent.venueId)?.name || 'Foro'}`,
      artistId: artist.id,
      venueId: uploadingForEvent.venueId,
      eventId: uploadingForEvent.id,
      tourId: uploadingForEvent.tourId,
      fileName: fileDetails.name,
      fileSize: fileDetails.size,
      status: 'Signed',
      uploadedAt: new Date().toISOString(),
      notes: uploadNotes || undefined,
      type: 'Foro/Arrendamiento'
    };

    onAddContract(newContract);
    setUploadingForEvent(null);
    setUploadTitle('');
    setUploadNotes('');
    setUploadFile(null);
  };

  // Filter events by this artist
  const artistEvents = events.filter((e) => e.artistId === artist.id);

  // Compute Artist KPIs
  const completedShows = artistEvents.filter((e) => e.status === 'Completed');
  const showsCount = completedShows.length;
  const totalIncome = completedShows.reduce((acc, curr) => acc + curr.totalIncome, 0);
  const totalExpenses = completedShows.reduce((acc, curr) => acc + curr.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  
  // Avg Attendance
  const avgAttendance = showsCount > 0 
    ? Math.round(completedShows.reduce((acc, curr) => acc + curr.attendance, 0) / showsCount)
    : 0;
  
  // Avg Capacity Occupancy %
  const totalCapacity = completedShows.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalAttendance = completedShows.reduce((acc, curr) => acc + curr.attendance, 0);
  const avgOccupancy = totalCapacity > 0 ? ((totalAttendance / totalCapacity) * 100).toFixed(1) : '0.0';

  // Venue and city frequency
  const getFrequencies = () => {
    const venueCounts: Record<string, number> = {};
    const cityCounts: Record<string, number> = {};
    completedShows.forEach((sh) => {
      venueCounts[sh.venueId] = (venueCounts[sh.venueId] || 0) + 1;
      const v = venues.find(ven => ven.id === sh.venueId);
      if (v) {
        cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
      }
    });

    let topVenueId = '';
    let maxVCount = 0;
    Object.entries(venueCounts).forEach(([vId, cnt]) => {
      if (cnt > maxVCount) {
        maxVCount = cnt;
        topVenueId = vId;
      }
    });

    let topCity = '';
    let maxCCount = 0;
    Object.entries(cityCounts).forEach(([city, cnt]) => {
      if (cnt > maxCCount) {
        maxCCount = cnt;
        topCity = city;
      }
    });

    const topVenueObj = venues.find(ven => ven.id === topVenueId);
    return {
      topVenue: topVenueObj ? topVenueObj.name : 'N/D',
      topCity: topCity || 'N/D'
    };
  };

  const frequencies = getFrequencies();

  // Next / Last Show
  const sortedCompleted = [...completedShows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastShow = sortedCompleted[0]?.date || 'Ninguno';

  const upcomingShows = artistEvents.filter((e) => e.status === 'Confirmed' || e.status === 'Draft')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextShow = upcomingShows[0]?.date || 'Ninguno';

  // Toggle Pipeline completion
  const handleTogglePipelineItem = (itemId: string) => {
    const updatedPipeline = artist.pipeline.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const updatedArtist: Artist = {
      ...artist,
      pipeline: updatedPipeline,
      updated_at: new Date().toISOString()
    };
    onUpdateArtist(updatedArtist);
  };

  // Pipeline % calculation
  const totalPipelineItems = artist.pipeline.length;
  const completedPipelineItems = artist.pipeline.filter((i) => i.completed).length;
  const pipelineProgress = totalPipelineItems > 0 
    ? Math.round((completedPipelineItems / totalPipelineItems) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 font-sans shadow-sm">
      {/* Profile Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div 
            onClick={() => {
              setPhotoUrlInput(artist.photo);
              setPhotoZoom(artist.photoStyle?.zoom ?? 1);
              setPhotoRotation(artist.photoStyle?.rotation ?? 0);
              setPhotoContrast(artist.photoStyle?.contrast ?? 1);
              setPhotoBrightness(artist.photoStyle?.brightness ?? 1);
              setPhotoGrayscale(artist.photoStyle?.grayscale ?? 0);
              setPhotoSepia(artist.photoStyle?.sepia ?? 0);
              setPhotoBlur(artist.photoStyle?.blur ?? 0);
              setIsPhotoModalOpen(true);
            }}
            className="group relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 shadow-sm cursor-pointer shrink-0"
            title="Haga clic para cambiar o editar la fotografía del artista"
          >
            <Avatar
              src={artist.photo}
              name={artist.artisticName}
              textClass="text-xl"
              style={{
                filter: `contrast(${artist.photoStyle?.contrast ?? 1}) brightness(${artist.photoStyle?.brightness ?? 1}) grayscale(${artist.photoStyle?.grayscale ?? 0}) sepia(${artist.photoStyle?.sepia ?? 0}) blur(${artist.photoStyle?.blur ?? 0}px)`,
                transform: `rotate(${artist.photoStyle?.rotation ?? 0}deg) scale(${artist.photoStyle?.zoom ?? 1})`,
                transition: 'all 0.3s ease',
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[8px] font-bold uppercase tracking-wider">
              <Upload className="w-3.5 h-3.5 text-white mb-0.5" />
              <span>Editar</span>
            </div>
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{artist.artisticName}</h2>
              <span className="text-[10px] bg-celestial-canvas/10 text-celestial-canvas px-2.5 py-0.5 rounded-full font-bold border border-celestial-canvas/20 uppercase tracking-wider">
                {artist.stage}
              </span>
            </div>
            {[artist.genre, [artist.city, artist.state, artist.country].filter(Boolean).join(', ')].filter(Boolean).length > 0 && (
              <p className="text-xs text-slate-500 mt-1 font-semibold">{[artist.genre, [artist.city, artist.state, artist.country].filter(Boolean).join(', ')].filter(Boolean).join(' • ')}</p>
            )}
            {(artist.startDate || artist.pro) && (
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{[artist.startDate && `Inicio de carrera: ${artist.startDate}`, artist.pro && `Sociedad de gestión: ${artist.pro}`].filter(Boolean).join(' | ')}</p>
            )}
            
            {/* Elegant Brand Delete Button */}
            <button
              onClick={() => {
                if (confirm(`¿Estás seguro de que deseas eliminar al artista "${artist.artisticName}" del portafolio comercial?`)) {
                  onDeleteArtist?.(artist.id);
                }
              }}
              className="mt-2 text-[10px] bg-tomato-curry/5 hover:bg-tomato-curry hover:text-white border border-tomato-curry/25 text-tomato-curry px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all uppercase tracking-wider shadow-sm"
              title="Eliminar Artista"
            >
              <Trash2 className="w-3 h-3" />
              <span>Eliminar del Portafolio</span>
            </button>
          </div>
        </div>

        {/* Dynamic subtabs */}
        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl self-stretch sm:self-auto flex-wrap gap-1 max-w-full">
          {[
            { id: '360', label: 'Resumen 360°' },
            { id: 'pipeline', label: `Pipeline Dev (${pipelineProgress}%)` },
            { id: 'contracts', label: `Contratos (${contracts.filter(c => c.artistId === artist.id).length})` },
            { id: 'shows', label: `Shows Históricos (${artistEvents.length})` },
            { id: 'social', label: 'Audiencia & Captación 📊' },
            { id: 'history', label: 'Hitos & Timeline' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeSubTab === tab.id ? 'bg-celestial-canvas text-white-chalk shadow-sm border border-celestial-canvas/35' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: 360 RESUMEN */}
      {activeSubTab === '360' && (
        <div className="space-y-6 pt-6 animate-fade-in">
          {/* Artist KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Shows Realizados', value: showsCount, suffix: 'Conciertos' },
              { label: 'Utilidad Neta', value: `$${totalProfit.toLocaleString()}`, suffix: 'MXN' },
              { label: 'Ingreso Bruto', value: `$${totalIncome.toLocaleString()}`, suffix: 'Suma Taquilla' },
              { label: 'Aforo Promedio', value: avgAttendance, suffix: 'Boletos/Show' },
              { label: 'Porcentaje Ocupación', value: `${avgOccupancy}%`, suffix: 'Capacidad' },
              { label: 'Foro Frecuente', value: frequencies.topVenue, suffix: 'Sede' },
              { label: 'Ciudad Frecuente', value: frequencies.topCity, suffix: 'Plaza' },
              { label: 'Próximo Show', value: nextShow, suffix: 'Cronograma' }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between shadow-sm">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold leading-tight">{kpi.label}</span>
                <span className="text-xs font-bold text-slate-700 mt-2 block truncate font-mono">{kpi.value}</span>
                <span className="text-[9px] text-slate-400 block mt-1 leading-none font-medium">{kpi.suffix}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left bio & general details */}
            <div className="lg:col-span-3 space-y-4">
              <ArtistFicha artist={artist} tours={tours} onSave={onUpdateArtist} />

              {/* Recording Projects & Song Progress */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Monitoreo de Grabación & Álbumes</h3>
                
                {recordingProjects.filter(p => p.artistId === artist.id).length > 0 ? (
                  <div className="space-y-3.5">
                    {recordingProjects.filter(p => p.artistId === artist.id).map(proj => {
                      const totalSongs = proj.songs.length;
                      const completedSongs = proj.songs.filter(s => s.status === 'Listo' || s.status === 'Masterizado').length;
                      const recordingProgress = totalSongs > 0 ? Math.round((completedSongs / totalSongs) * 100) : 0;
                      
                      return (
                        <div key={proj.id} className="bg-white border border-slate-150 p-3 rounded-xl space-y-2.5 shadow-3xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded uppercase">
                                {proj.status}
                              </span>
                              <h4 className="text-xs font-black text-slate-800 mt-1">{proj.title}</h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-bold">PROGRESO</span>
                              <span className="text-xs font-bold text-indigo-600 font-mono">{recordingProgress}%</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${recordingProgress}%` }} />
                          </div>

                          <div className="text-[10px] text-slate-500 font-medium flex justify-between">
                            <span>Estudio: <span className="font-semibold text-slate-700">{proj.studio || 'N/D'}</span></span>
                            <span>{completedSongs} de {totalSongs} canciones listas</span>
                          </div>

                          {/* Song grid snapshot */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100">
                            {proj.songs.slice(0, 4).map(song => (
                              <div key={song.id} className="bg-slate-50 p-1.5 rounded border border-slate-100 text-[10px] flex items-center justify-between">
                                <span className="font-bold text-slate-700 truncate pr-1">{song.title}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                  song.status === 'Listo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                  song.status === 'Grabación de Instrumentos' || song.status === 'Grabación de Voces' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                  'bg-slate-100 text-slate-400'
                                }`}>
                                  {song.status}
                                </span>
                              </div>
                            ))}
                            {totalSongs > 4 && (
                              <div className="col-span-2 text-center text-[9px] text-slate-400 font-bold pt-1">
                                + {totalSongs - 4} canciones adicionales en producción
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white border border-slate-150 rounded-xl">
                    <Music className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-400 font-semibold">No se reportan proyectos de grabación activos para este artista.</p>
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-celestial-canvas" />
                    <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Integrantes de Gira (Lineup)</h3>
                  </div>
                  <button
                    onClick={() => {
                      setNewMemberForm({
                        name: '',
                        role: '',
                        startDate: new Date().toISOString().substring(0, 10),
                        endDate: '',
                        venueName: '',
                        active: true
                      });
                      setSelectedMemberForEdit(null);
                      setIsMemberModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] bg-celestial-canvas hover:bg-celestial-canvas/90 text-white font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-3xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Active lineup */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Alineación Activa (Click para dar de baja / Editar)</span>
                  {getMemberHistory().filter(m => m.active).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No hay integrantes activos en esta gira.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {getMemberHistory().filter(m => m.active).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberForEdit(m);
                            setNewMemberForm({
                              name: m.name,
                              role: m.role,
                              startDate: m.startDate,
                              endDate: m.endDate || new Date().toISOString().substring(0, 10),
                              venueName: m.venueName || '',
                              active: m.active
                            });
                            setIsMemberModalOpen(true);
                          }}
                          className="bg-white hover:bg-slate-100 hover:border-celestial-canvas text-slate-700 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 font-bold shadow-3xs transition-all cursor-pointer text-left"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <div>
                            <span className="text-[11px] text-slate-800 font-bold block">{m.name}</span>
                            <span className="text-[9px] text-slate-400 block leading-none mt-0.5">{m.role}</span>
                          </div>
                          {m.venueName && (
                            <span className="text-[9px] bg-slate-50 text-slate-400 border border-slate-100 px-1 py-0.5 rounded ml-1 font-semibold truncate max-w-[100px]">
                              📍 {m.venueName}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historical Records */}
                <div className="pt-2 border-t border-slate-200/55">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Registro Histórico (Tiempo de Estancia y Último Venue)</span>
                  {getMemberHistory().filter(m => !m.active).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No hay ex-integrantes registrados en el historial de la gira.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200/60 rounded-xl bg-white shadow-3xs">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 uppercase text-[8px] font-bold tracking-wider">
                            <th className="p-2">Músico / Rol</th>
                            <th className="p-2">Periodo</th>
                            <th className="p-2">Estancia</th>
                            <th className="p-2">Último Venue</th>
                            <th className="p-2 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                          {getMemberHistory().filter(m => !m.active).map((m) => {
                            const start = new Date(m.startDate);
                            const end = m.endDate ? new Date(m.endDate) : new Date();
                            const diffTime = Math.abs(end.getTime() - start.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                            let durationText = `${diffDays} d`;
                            if (diffDays >= 365) {
                              durationText = `${(diffDays / 365).toFixed(1)} a`;
                            } else if (diffDays >= 30) {
                              durationText = `${(diffDays / 30).toFixed(1)} m`;
                            }

                            return (
                              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-2">
                                  <div>
                                    <span className="font-bold text-slate-800 block">{m.name}</span>
                                    <span className="text-[9px] text-slate-400 block">{m.role}</span>
                                  </div>
                                </td>
                                <td className="p-2 font-mono text-slate-500 text-[9px]">
                                  {m.startDate} / {m.endDate}
                                </td>
                                <td className="p-2">
                                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] rounded font-bold font-mono">
                                    {durationText}
                                  </span>
                                </td>
                                <td className="p-2 font-bold text-slate-500 max-w-[100px] truncate">
                                  📍 {m.venueName || 'N/D'}
                                </td>
                                <td className="p-2 text-right">
                                  <button
                                    onClick={() => {
                                      const updated = getMemberHistory().map(x => 
                                        x.id === m.id ? { ...x, active: true, endDate: undefined } : x
                                      );
                                      saveMemberHistory(updated);
                                    }}
                                    className="text-[9px] text-celestial-canvas hover:text-white bg-celestial-canvas/10 hover:bg-celestial-canvas px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                                  >
                                    Activar
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
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUBTAB: AUDIENCIA & CAPTACIÓN (historial real de redes + acciones) */}
      {activeSubTab === 'social' && (
        <SocialMetrics artist={artist} events={events} onUpdateArtist={onUpdateArtist} />
      )}

      {/* SUBTAB 2: PIPELINE */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6 pt-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Pipeline de Desarrollo Artístico</h3>
              <p className="text-[11px] text-slate-400 font-medium">Checklist comercial estructurado de avance e hitos promocionales.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Progreso de Carrera:</span>
              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${pipelineProgress}%` }} />
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600">{pipelineProgress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Branding', 'Distribución', 'Presencia', 'Booking & Management'] as const).map((category) => {
              const items = artist.pipeline.filter((item) => item.category === category);
              const completedCount = items.filter((i) => i.completed).length;
              const percent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
              return (
                <div key={category} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{category}</span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600">{percent}%</span>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleTogglePipelineItem(item.id)}
                          className="w-full text-left flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-white/80 transition-all text-xs text-slate-600 cursor-pointer"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <span className={item.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-600 font-semibold'}>
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center font-semibold font-mono">
                    {completedCount} de {items.length} completados
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: SHOWS */}
      {activeSubTab === 'shows' && (
        <div className="space-y-4 pt-6 animate-fade-in">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Shows Realizados & Próximos</h3>
            <p className="text-[11px] text-slate-400 font-medium">Historial completo de fechas vinculadas a este artista con expedientes de contratos de gira.</p>
          </div>

          {artistEvents.length === 0 ? (
            <div className="border border-slate-200 p-8 text-center rounded-2xl bg-slate-50">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">Este artista no tiene shows programados.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Recinto / Sede</th>
                    <th className="px-4 py-3">Ubicación</th>
                    <th className="px-4 py-3">Ocupación</th>
                    <th className="px-4 py-3">Gira (Tour)</th>
                    <th className="px-4 py-3">Contrato Gira</th>
                    <th className="px-4 py-3 text-right">Estatus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {artistEvents.map((evt) => {
                    const venue = venues.find((v) => v.id === evt.venueId);
                    const occupancy = evt.capacity > 0 ? ((evt.attendance / evt.capacity) * 100).toFixed(0) : '0';
                    const tourOfShow = tours.find((t) => t.id === evt.tourId);
                    const showContract = contracts.find((c) => c.eventId === evt.id);

                    return (
                      <tr key={evt.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-[11px] font-semibold">{evt.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{venue ? venue.name : 'N/D'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{venue ? `${venue.city}, ${venue.state}` : 'N/D'}</td>
                        <td className="px-4 py-3 font-mono">
                          {evt.status === 'Completed' ? `${evt.attendance} / ${evt.capacity} (${occupancy}%)` : `Aforo: ${evt.capacity}`}
                        </td>
                        <td className="px-4 py-3">
                          {tourOfShow ? (
                            <span className="bg-prairie-land/20 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-prairie-land/30">
                              {tourOfShow.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Evento Individual</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {showContract ? (
                            <button
                              onClick={() => setPreviewingContract(showContract)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>Ver Contrato</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setUploadingForEvent(evt);
                                setUploadTitle(`Contrato de Arrendamiento - ${venue?.name || 'Foro'}`);
                                setUploadFile({
                                  name: `CONTRATO_ESCANEADO_${venue?.name.toUpperCase().replace(/\s+/g, '_') || 'FORO'}_${evt.id.toUpperCase()}.pdf`,
                                  size: '1.4 MB'
                                });
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-tomato-curry hover:text-tomato-curry/90 hover:underline cursor-pointer bg-tomato-curry/5 px-2 py-1 rounded-lg border border-tomato-curry/15 transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5 shrink-0" />
                              <span>Subir Escaneado</span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold font-mono tracking-wider ${
                            evt.status === 'Completed' ? 'bg-slate-100 text-slate-400' :
                            evt.status === 'Confirmed' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {evt.status}
                          </span>
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

      {/* MODAL: PREVIEW IN-SHOW CONTRACT */}
      {previewingContract && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[75vh]">
            <div className="p-4 bg-white-chalk border-b border-silver-haze flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-tomato-curry" />
                <div>
                  <h4 className="text-xs font-bold text-cosmic-black uppercase tracking-tight">{previewingContract.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">{previewingContract.fileName} | {previewingContract.fileSize}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingContract(null)}
                className="text-slate-400 hover:text-cosmic-black text-xs font-bold p-1 hover:bg-slate-100 rounded"
              >
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 font-mono text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap">
              <div className="bg-white border border-silver-haze p-8 shadow-sm">
                <div className="text-center font-bold text-slate-900 border-b border-slate-200 pb-4 mb-4 text-xs uppercase">
                  EXPEDIENTE DIGITAL DE CONCIERTO - GIRA DE {artist.artisticName.toUpperCase()}
                </div>
                {`CONTRATO DE PRESTACIÓN DE SERVICIOS ARTÍSTICOS PARA ESPECTÁCULO EN VIVO

Por una parte "FLAMO CONCIERTOS / LA AGENCIA" y por otra parte el administrador del Foro ${venues.find(v => v.id === previewingContract.venueId)?.name.toUpperCase() || 'DESIGNADO'} (en adelante "EL RECINTO"), para la presentación en vivo del artista ${artist.artisticName.toUpperCase()}.

ACUERDOS COMERCIALES DE PRODUCCIÓN:
1.- FECHA DE PRESENTACIÓN: El evento se llevará a cabo el día pactado en el calendario oficial de giras.
2.- PRECIO Y TAQUILLA: Se establece un precio único de boleto. Los ingresos brutos se concentrarán en la cuenta de depósito fiduciario.
3.- RETRIBUCIÓN (SPLIT COMERCIAL): Las partes pactan un esquema de co-producción con recuperación preferencial de gastos operativos comprobables. El remanente de taquilla neta se distribuirá en proporción 70% para el Artista y 30% para el Recinto.
4.- RIDER TÉCNICO: EL RECINTO se obliga a proveer el sistema de audio (PA), iluminación profesional, backline primario y personal de staff técnico conforme al Rider Oficial provisto por el Artista.

NOTAS DEL EXPEDIENTE DIGITAL:
"${previewingContract.notes || 'Sin anotaciones particulares.'}"

DOCUMENTO OFICIAL DIGITALIZADO Y GUARDADO EN EL CRM`}
              </div>
            </div>
            <div className="p-3 bg-white-chalk border-t border-silver-haze flex justify-end gap-2 text-xs">
              <button
                onClick={() => setPreviewingContract(null)}
                className="bg-celestial-canvas text-white-chalk font-bold px-4 py-2 rounded-xl"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD CONTRACT IN SHOW */}
      {uploadingForEvent && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans text-xs">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-white-chalk border-b border-silver-haze flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-cosmic-black tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-tomato-curry" />
                <span>Subir Contrato Escaneado</span>
              </h4>
              <button
                onClick={() => setUploadingForEvent(null)}
                className="text-slate-400 hover:text-cosmic-black text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleShowContractSubmit} className="p-5 space-y-4">
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1.5">
                <p className="font-bold text-slate-700">Detalles del Concierto:</p>
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">Fecha:</span> {uploadingForEvent.date}
                </p>
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">Foro:</span> {venues.find(v => v.id === uploadingForEvent.venueId)?.name || 'Foro'}
                </p>
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">Gira (Tour):</span> {tours.find(t => t.id === uploadingForEvent.tourId)?.name || 'N/D'}
                </p>
              </div>

              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const f = e.dataTransfer.files[0];
                    setUploadFile({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` });
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  isDragOver ? 'border-tomato-curry bg-tomato-curry/5 text-tomato-curry' : 'border-silver-haze text-slate-500 bg-slate-50'
                }`}
              >
                <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                {uploadFile ? (
                  <div>
                    <p className="font-semibold text-slate-700">Archivo seleccionado:</p>
                    <p className="font-mono text-[10px] text-slate-400 mt-0.5">{uploadFile.name} ({uploadFile.size})</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-[11px]">Arrastra tu contrato escaneado aquí</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">O pulsa para seleccionar</p>
                    <input
                      type="file"
                      id="inshow-file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          setUploadFile({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` });
                        }
                      }}
                    />
                    <label
                      htmlFor="inshow-file"
                      className="mt-2 inline-block bg-white hover:bg-slate-50 border border-silver-haze text-slate-700 px-2 py-1 rounded cursor-pointer text-[10px] font-bold"
                    >
                      Explorar
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Título del Documento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Contrato Arrendamiento Lunario Escaneado"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Notas Adicionales</label>
                <textarea
                  placeholder="Ej. Firmado por el promotor local. Split 70/30 de taquilla asegurado."
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadingForEvent(null)}
                  className="bg-white border border-silver-haze text-slate-700 font-bold px-3 py-1.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-tomato-curry hover:bg-tomato-curry/90 text-white-chalk font-bold px-3 py-1.5 rounded-xl shadow-sm"
                >
                  Guardar Contrato
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 4: HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 pt-6 animate-fade-in">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Línea del Tiempo del Artista (Hitos)</h3>
            <p className="text-[11px] text-slate-400 font-medium">Historial cronológico de lanzamientos, firmas, sold-outs y giras.</p>
          </div>

          <div className="relative border-l border-slate-200 pl-6 ml-4 space-y-6">
            {artist.history.map((item) => (
              <div key={item.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl max-w-2xl shadow-sm">
                  <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-wider">{item.date}</span>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-700 mt-1">{item.title}</h4>
                    <span className="text-[9px] uppercase tracking-widest bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-lg border border-indigo-100/50">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: CONTRACTS ASSOCIATED WITH ARTIST */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-6 pt-6 animate-fade-in text-xs text-slate-600">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Contratos & Acuerdos Asociados</h3>
              <p className="text-[11px] text-slate-400 font-medium">Expediente completo de acuerdos de Management, Booking, NDA y Co-producción.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* List of Contracts (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              {contracts.filter(c => c.artistId === artist.id).length === 0 ? (
                <div className="border border-slate-200 p-8 text-center rounded-2xl bg-slate-50">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-semibold">Este artista no tiene contratos guardados.</p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                        <th className="px-4 py-3">Tipo / Documento</th>
                        <th className="px-4 py-3">Estatus</th>
                        <th className="px-4 py-3">Fecha Alta</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium text-[11px]">
                      {contracts.filter(c => c.artistId === artist.id).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-tomato-curry shrink-0" />
                              <div>
                                <span className="font-bold text-slate-800 block">{c.title}</span>
                                <span className="text-[9px] text-slate-400 font-mono block">{c.fileName} ({c.fileSize})</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold border ${
                              c.status === 'Signed' || c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              c.status === 'Pending' || c.status === 'Draft' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">{c.uploadedAt}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setPreviewingContract(c)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Expediente</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Register Form (1 col) */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Registrar Nuevo Acuerdo</span>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!onAddContract) return;

                  const form = e.currentTarget;
                  const titleIn = form.elements.namedItem('title') as HTMLInputElement;
                  const typeIn = form.elements.namedItem('type') as HTMLSelectElement;
                  const notesIn = form.elements.namedItem('notes') as HTMLTextAreaElement;

                  const newCon: Contract = {
                    id: `con-art-${Date.now()}`,
                    title: titleIn.value.trim(),
                    artistId: artist.id,
                    type: typeIn.value as any,
                    fileName: `CONTRATO_${artist.artisticName.toUpperCase().replace(/\s+/g, '_')}_${typeIn.value.toUpperCase()}_2026.pdf`,
                    fileSize: '1.8 MB',
                    status: 'Active',
                    uploadedAt: new Date().toISOString().substring(0, 10),
                    notes: notesIn.value.trim() || 'Registrado por el CRM'
                  };

                  onAddContract(newCon);
                  titleIn.value = '';
                  notesIn.value = '';
                  alert('¡Contrato legal registrado exitosamente en el expediente!');
                }}
                className="space-y-3 text-xs"
              >
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Título del Contrato *</label>
                  <input
                    name="title"
                    required
                    placeholder="Ej. Contrato Management Flamo 2026"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Tipo de Acuerdo *</label>
                  <select name="type" className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold">
                    <option value="Management">Management</option>
                    <option value="Booking">Booking</option>
                    <option value="Performance">Performance (Concierto)</option>
                    <option value="NDA">NDA (Confidencialidad)</option>
                    <option value="Co-production">Co-producción</option>
                    <option value="Other">Otro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Notas Adicionales</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Escribe términos clave del acuerdo comercial aquí..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Registrar Contrato
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: GESTIÓN DE INTEGRANTE DE GIRA */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-fade-in text-xs">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-celestial-canvas" />
                <h3 className="font-bold text-slate-800 text-sm">
                  {selectedMemberForEdit ? 'Editar Integrante de Gira' : 'Agregar Integrante a la Gira'}
                </h3>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Nombre del Músico / Staff *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Vladimir Belmont"
                  value={newMemberForm.name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-800 focus:outline-none focus:border-celestial-canvas"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Instrumento / Rol *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Teclados, Sintetizadores"
                  value={newMemberForm.role}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-800 focus:outline-none focus:border-celestial-canvas"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Fecha de Alta *</label>
                  <input
                    type="date"
                    required
                    value={newMemberForm.startDate}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, startDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:border-celestial-canvas"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Recinto / Venue Inicio</label>
                  <input
                    type="text"
                    placeholder="Ej. Auditorio Nacional"
                    value={newMemberForm.venueName}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, venueName: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:border-celestial-canvas"
                  />
                </div>
              </div>

              {selectedMemberForEdit && selectedMemberForEdit.active && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block">Dar de Baja de Gira (Archivo Histórico)</span>
                  <p className="text-[10px] text-rose-600">Al dar de baja, se conservará el registro histórico de estancia y el recinto de despedida.</p>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-rose-400">Fecha de Salida</label>
                      <input
                        type="date"
                        value={newMemberForm.endDate}
                        onChange={(e) => setNewMemberForm({ ...newMemberForm, endDate: e.target.value })}
                        className="w-full bg-white border border-rose-200 rounded-lg p-1.5 font-semibold text-rose-800"
                      />
                    </div>
                    <div className="space-y-1 flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = getMemberHistory().map(x => {
                            if (x.id === selectedMemberForEdit.id) {
                              return {
                                ...x,
                                active: false,
                                endDate: newMemberForm.endDate || new Date().toISOString().substring(0, 10),
                                venueName: newMemberForm.venueName || 'Último Venue de Gira'
                              };
                            }
                            return x;
                          });
                          saveMemberHistory(updated);
                          setIsMemberModalOpen(false);
                          alert(`¡${selectedMemberForEdit.name} ha sido dado de baja en la gira! Registro histórico guardado.`);
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer text-center text-[10px] uppercase tracking-wider animate-pulse"
                      >
                        Baja de Gira
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 border-t border-slate-200/60 p-4 flex items-center justify-between">
              <div>
                {selectedMemberForEdit && (
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de que deseas eliminar permanentemente este registro del historial?')) {
                        const updated = getMemberHistory().filter(x => x.id !== selectedMemberForEdit.id);
                        saveMemberHistory(updated);
                        setIsMemberModalOpen(false);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg font-bold cursor-pointer"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsMemberModalOpen(false)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!newMemberForm.name || !newMemberForm.role) {
                      alert('Nombre y Rol son obligatorios.');
                      return;
                    }

                    let updated: MemberHistory[];
                    if (selectedMemberForEdit) {
                      updated = getMemberHistory().map(x => 
                        x.id === selectedMemberForEdit.id 
                          ? { 
                              ...x, 
                              name: newMemberForm.name, 
                              role: newMemberForm.role, 
                              startDate: newMemberForm.startDate, 
                              venueName: newMemberForm.venueName || undefined 
                            } 
                          : x
                      );
                    } else {
                      const newM: MemberHistory = {
                        id: `m-${Date.now()}`,
                        name: newMemberForm.name,
                        role: newMemberForm.role,
                        startDate: newMemberForm.startDate,
                        venueName: newMemberForm.venueName || undefined,
                        active: true
                      };
                      updated = [...getMemberHistory(), newM];
                    }

                    saveMemberHistory(updated);
                    setIsMemberModalOpen(false);
                  }}
                  className="bg-celestial-canvas hover:bg-celestial-canvas/90 text-white font-bold px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
                >
                  {selectedMemberForEdit ? 'Guardar Cambios' : 'Agregar Integrante'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITOR DE FOTOGRAFÍA */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in text-xs flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh]">
            {/* Left side: Preview & Preset Selection */}
            <div className="bg-slate-50 p-5 border-r border-slate-200/60 flex-1 flex flex-col items-center justify-between space-y-4">
              <div className="text-center w-full">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest mb-1">Vista Previa (Alineación / Filtro)</span>
                {/* Circular Preview Area */}
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-md mx-auto overflow-hidden relative bg-slate-200 flex items-center justify-center">
                  {photoUrlInput ? (
                    <img
                      src={photoUrlInput}
                      alt="Preview"
                      style={{
                        filter: `contrast(${photoContrast}) brightness(${photoBrightness}) grayscale(${photoGrayscale}) sepia(${photoSepia}) blur(${photoBlur}px)`,
                        transform: `rotate(${photoRotation}deg) scale(${photoZoom})`,
                        transition: 'none' // Immediate update while editing
                      }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="w-12 h-12 text-slate-300" />
                  )}
                </div>
              </div>

              {/* Preset Curated Images */}
              <div className="w-full space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Ajuste de Fotos (Presets Flamo)</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { label: 'Mic', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80' },
                    { label: 'Guitar', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=80' },
                    { label: 'Synth', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80' },
                    { label: 'Singer', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80' },
                    { label: 'Vintage', url: 'https://images.unsplash.com/photo-1486591978090-58e619d37fe7?w=500&auto=format&fit=crop&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPhotoUrlInput(preset.url)}
                      className={`h-11 rounded-lg border overflow-hidden relative group cursor-pointer ${
                        photoUrlInput === preset.url ? 'border-celestial-canvas ring-2 ring-celestial-canvas/25' : 'border-slate-200'
                      }`}
                    >
                      <img src={preset.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/50 text-[8px] font-bold text-white text-center py-0.5 leading-none">
                        {preset.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subida real de fotografía */}
              <div className="w-full bg-white border border-dashed border-slate-200 rounded-xl p-3 shadow-3xs">
                <PhotoPicker value={photoUrlInput} onChange={setPhotoUrlInput} label="Subir desde tu equipo" />
              </div>
            </div>

            {/* Right side: Editing Controls Sliders */}
            <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-celestial-canvas" />
                  <span className="font-bold text-slate-800 text-sm">Controles de Edición</span>
                </div>
                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* URL input */}
              <div className="space-y-1 py-3">
                <label className="text-[10px] uppercase font-bold text-slate-400">URL de la Imagen del Artista</label>
                <input
                  type="text"
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  placeholder="Pegue el enlace de cualquier imagen de internet..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-[10px] text-slate-700 focus:outline-none focus:border-celestial-canvas"
                />
              </div>

              {/* Sliders container */}
              <div className="space-y-3 flex-1 pb-4">
                {/* Scale / Zoom Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Encuadre / Zoom</span>
                    <span>{photoZoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2.5"
                    step="0.05"
                    value={photoZoom}
                    onChange={(e) => setPhotoZoom(parseFloat(e.target.value))}
                    className="w-full accent-celestial-canvas"
                  />
                </div>

                {/* Rotation Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Rotación de Ángulo</span>
                    <span>{photoRotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={photoRotation}
                      onChange={(e) => setPhotoRotation(parseInt(e.target.value))}
                      className="w-full accent-celestial-canvas flex-1"
                    />
                    <button
                      onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 cursor-pointer shadow-3xs"
                      title="Girar 90 grados"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Brightness Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Brillo / Luminosidad</span>
                    <span>{Math.round(photoBrightness * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={photoBrightness}
                    onChange={(e) => setPhotoBrightness(parseFloat(e.target.value))}
                    className="w-full accent-celestial-canvas"
                  />
                </div>

                {/* Contrast Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Contraste Dinámico</span>
                    <span>{Math.round(photoContrast * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={photoContrast}
                    onChange={(e) => setPhotoContrast(parseFloat(e.target.value))}
                    className="w-full accent-celestial-canvas"
                  />
                </div>

                {/* Grayscale Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Filtro Blanco y Negro (Grayscale)</span>
                    <span>{Math.round(photoGrayscale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={photoGrayscale}
                    onChange={(e) => setPhotoGrayscale(parseFloat(e.target.value))}
                    className="w-full accent-celestial-canvas"
                  />
                </div>

                {/* Sepia Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Filtro Sepia (Vintage vibe)</span>
                    <span>{Math.round(photoSepia * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={photoSepia}
                    onChange={(e) => setPhotoSepia(parseFloat(e.target.value))}
                    className="w-full accent-celestial-canvas"
                  />
                </div>

                {/* Blur Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Desenfoque (Blur)</span>
                    <span>{photoBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={photoBlur}
                    onChange={(e) => setPhotoBlur(parseFloat(e.target.value))}
                    className="w-full accent-celestial-canvas"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/50">
                <button
                  onClick={() => {
                    // Reset all filters
                    setPhotoZoom(1);
                    setPhotoRotation(0);
                    setPhotoContrast(1);
                    setPhotoBrightness(1);
                    setPhotoGrayscale(0);
                    setPhotoSepia(0);
                    setPhotoBlur(0);
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold px-3 py-2 rounded-xl cursor-pointer transition-all shadow-3xs"
                >
                  Restaurar Filtros
                </button>
                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    if (!photoUrlInput) {
                      alert('Ingrese una URL válida o seleccione un preset.');
                      return;
                    }
                    const updatedArtist: Artist = {
                      ...artist,
                      photo: photoUrlInput,
                      photoStyle: {
                        zoom: photoZoom,
                        rotation: photoRotation,
                        contrast: photoContrast,
                        brightness: photoBrightness,
                        grayscale: photoGrayscale,
                        sepia: photoSepia,
                        blur: photoBlur
                      },
                      updated_at: new Date().toISOString()
                    };
                    onUpdateArtist(updatedArtist);
                    setIsPhotoModalOpen(false);
                    alert('¡Fotografía de prensa guardada y filtros de renderizado aplicados exitosamente!');
                  }}
                  className="bg-tomato-curry hover:bg-tomato-curry/90 text-white font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Guardar Imagen Editada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
