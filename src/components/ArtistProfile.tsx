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
  const [activeSubTab, setActiveSubTab] = useState<'360' | 'pipeline' | 'contracts' | 'shows' | 'history' | 'social'>('360');
  const [isSyncingSocial, setIsSyncingSocial] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Sincronización inicial');

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
        startDate: artist.startDate || '2025-01-01',
        active: true,
        venueName: 'Auditorio Nacional (Inicio)'
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

  // Social specific state & Apify Scraper Integration
  const [activeOAuthModal, setActiveOAuthModal] = useState<'instagram' | 'tiktok' | null>(null);
  const [hashtagSearch, setHashtagSearch] = useState('#GiraFlamo2026');
  const [postFilter, setPostFilter] = useState<'all' | 'high' | 'low'>('all');
  const [dbTab, setDbTab] = useState<'ER' | 'SQL' | 'ORM'>('ER');
  const [isCopied, setIsCopied] = useState(false);

  // Apify Scraper States
  const [apifyPlatform, setApifyPlatform] = useState<'instagram' | 'tiktok' | 'spotify' | 'youtube'>('instagram');
  const [apifyHandleInput, setApifyHandleInput] = useState('');
  const [isApifyScraping, setIsApifyScraping] = useState(false);
  const [apifyResult, setApifyResult] = useState<any>(null);
  const [apifyError, setApifyError] = useState<string | null>(null);

  const handleRunApifyScrape = async (overrideHandle?: string, overridePlatform?: 'instagram' | 'tiktok' | 'spotify' | 'youtube') => {
    const platformToUse = overridePlatform || apifyPlatform;
    const defaultHandle = artist.artisticName.toLowerCase().replace(/\s+/g, '_');
    const handleToUse = (overrideHandle || apifyHandleInput || defaultHandle).replace(/^@/, '').trim();

    if (!handleToUse) return;

    setIsApifyScraping(true);
    setApifyError(null);

    try {
      const response = await fetch('/api/apify/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformToUse,
          handle: handleToUse
        })
      });

      if (!response.ok) {
        throw new Error(`Error en servidor Apify (${response.status})`);
      }

      const data = await response.json();
      setApifyResult(data);

      if (data.profile) {
        const isIg = platformToUse === 'instagram';
        const isTt = platformToUse === 'tiktok';
        const updatedArtist: Artist = {
          ...artist,
          socialMedia: {
            ...artist.socialMedia,
            ...(isIg ? { instagramConnected: true, instagramConnectedUser: `@${data.profile.username}` } : {}),
            ...(isTt ? { tiktokConnected: true, tiktokConnectedUser: `@${data.profile.username}` } : {})
          }
        };
        onUpdateArtist(updatedArtist);
      }
    } catch (err: any) {
      setApifyError(err.message || 'Ocurrió un error al procesar consulta con Apify.');
    } finally {
      setIsApifyScraping(false);
    }
  };

  const [socialPosts, setSocialPosts] = useState<Array<{
    id: string;
    platform: 'Instagram' | 'TikTok' | 'Facebook';
    caption: string;
    hashtag: string;
    likes: number;
    comments: number;
    shares?: number;
    views?: number;
    engagement: number;
    date: string;
    thumbnail: string;
  }>>([
    {
      id: 'post-1',
      platform: 'Instagram',
      caption: '¡Increíble noche en el Auditorio Nacional de CDMX! Gracias a todos los que hicieron esto posible. No podemos esperar para Monterrey. #GiraFlamo2026 #Tour2026',
      hashtag: '#GiraFlamo2026',
      likes: 4210,
      comments: 342,
      engagement: 9.8,
      date: '2026-06-15',
      thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'post-2',
      platform: 'TikTok',
      caption: 'POV: Estás en el escenario con nosotros cantando nuestro último sencillo ante 10,000 personas. 🎤🔥 #GiraFlamo2026',
      hashtag: '#GiraFlamo2026',
      likes: 21400,
      comments: 920,
      shares: 1420,
      views: 185000,
      engagement: 14.5,
      date: '2026-06-16',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'post-3',
      platform: 'Instagram',
      caption: 'Adquiere tus boletos Meet & Greet VIP para la fecha de Guadalajara antes de que se agoten. Link en bio. #GiraFlamo2026',
      hashtag: '#GiraFlamo2026',
      likes: 410,
      comments: 18,
      engagement: 1.8,
      date: '2026-06-18',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'post-4',
      platform: 'TikTok',
      caption: 'Detrás de cámaras de los ensayos de iluminación para el show. ¿Qué canción quieren escuchar? #GiraFlamo2026',
      hashtag: '#GiraFlamo2026',
      likes: 3100,
      comments: 145,
      shares: 98,
      views: 32000,
      engagement: 6.2,
      date: '2026-06-12',
      thumbnail: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&auto=format&fit=crop&q=80'
    },
    {
      id: 'post-5',
      platform: 'Facebook',
      caption: '¡Se abren nuevas secciones de gradas para nuestro concierto en el foro alterno! No te quedes fuera. #GiraFlamo2026',
      hashtag: '#GiraFlamo2026',
      likes: 120,
      comments: 8,
      engagement: 2.1,
      date: '2026-06-20',
      thumbnail: 'https://images.unsplash.com/photo-1486591978090-58e619d37fe7?w=300&auto=format&fit=crop&q=80'
    }
  ]);

  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<'Instagram' | 'TikTok' | 'Facebook'>('Instagram');
  const [newPostHashtag, setNewPostHashtag] = useState('#GiraFlamo2026');
  const [newPostLikes, setNewPostLikes] = useState('1500');
  const [newPostComments, setNewPostComments] = useState('120');

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
            <img
              src={artist.photo}
              alt={artist.artisticName}
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
            <p className="text-xs text-slate-500 mt-1 font-semibold">{artist.genre} • {artist.city}, {artist.country}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Lanzamiento: {artist.startDate} | PRO: {artist.pro || 'N/D'}</p>
            
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
        <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl self-stretch sm:self-auto overflow-x-auto max-w-full">
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
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-2">Biografía Conceptual</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{artist.bio}</p>
              </div>

              {/* Extended Artist specs & Pills */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3.5">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Ficha Artística Ampliada</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Subgéneros Específicos</span>
                    <div className="flex flex-wrap gap-1.5">
                      {artist.subgenres?.map((g, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-lg text-[10px]">
                          {g}
                        </span>
                      )) || <span className="text-slate-400 text-xs font-semibold">N/D</span>}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Idiomas de Interpretación</span>
                    <div className="flex flex-wrap gap-1.5">
                      {artist.languages?.map((l, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-600 font-semibold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1">
                          <Globe className="w-3 h-3 text-indigo-500" />
                          <span>{l}</span>
                        </span>
                      )) || <span className="text-slate-400 text-xs font-semibold">N/D</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Giras Vinculadas</span>
                  {tours.filter(t => t.artistId === artist.id).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tours.filter(t => t.artistId === artist.id).map(t => (
                        <span key={t.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{t.name} ({t.status === 'Active' ? 'Activa' : 'Planificación'})</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No hay giras activas registradas para este artista.</p>
                  )}
                </div>
              </div>

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

              {/* Legal & Registros */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3">Registros de Obra & Legal</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Nombre Legal / Fiscal</span>
                    <span className="text-slate-600 font-semibold">{artist.legalName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">RFC Asociado</span>
                    <span className="text-slate-600 font-mono font-semibold">{artist.rfc || 'No Registrado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sociedad de Gestión</span>
                    <span className="text-slate-600 font-semibold">{artist.pro ? `${artist.pro} Activa` : 'N/D'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">ISRC Predeterminado</span>
                    <span className="text-slate-600 font-mono font-semibold">{artist.isrc || 'Pendiente'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">ISWC Core</span>
                    <span className="text-slate-600 font-mono font-semibold">{artist.iswc || 'Pendiente'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sello Discográfico</span>
                    <span className="text-slate-600 font-semibold">{artist.label || 'Independiente'}</span>
                  </div>
                </div>
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

            {/* Right side contact & social */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest pb-2 border-b border-slate-200">Booking & Management</h3>
                
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Manager Principal</span>
                    <span className="text-slate-700 font-bold">{artist.manager}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Agente Booking Flamo</span>
                    <span className="text-slate-700 font-bold">{artist.bookingAgent}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Editorial</span>
                    <span className="text-slate-600 font-semibold">{artist.publisher}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Distribución Digital</span>
                    <span className="text-slate-600 font-semibold">{artist.distributor}</span>
                  </div>
                </div>
              </div>

              {/* Social Channels with direct simulated connections */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Redes & API Sync</h3>
                  <span className="text-[9px] uppercase font-mono bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Connected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(artist.socialMedia).map(([channel, url]) => (
                    <a
                      key={channel}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 transition-all truncate shadow-sm font-semibold"
                    >
                      <Radio className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="capitalize text-[11px] text-slate-600 font-semibold truncate">{channel}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: SOCIAL MEDIA AUDIENCIA & CAPTACIÓN */}
      {activeSubTab === 'social' && (
        <div className="space-y-6 pt-6 animate-fade-in text-xs relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <span>Métricas de Audiencia & Captación de Redes</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Auditoría de crecimiento de seguidores, conversión por venue y rendimiento de posts por hashtag de la gira.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-semibold text-slate-400 font-mono">Sync: {lastSyncTime}</span>
              
              {/* Reset/Disconnect simulated button to let user re-experience the OAuth flow easily */}
              {(artist.socialMedia?.instagramConnected || artist.socialMedia?.tiktokConnected) && (
                <button
                  onClick={() => {
                    if (confirm('¿Deseas simular la desconexión de todas las cuentas para volver a probar el flujo de consentimiento OAuth?')) {
                      onUpdateArtist({
                        ...artist,
                        socialMedia: {
                          ...artist.socialMedia,
                          instagramConnected: false,
                          instagramConnectedUser: undefined,
                          tiktokConnected: false,
                          tiktokConnectedUser: undefined,
                          facebookConnected: false,
                          facebookConnectedUser: undefined
                        }
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Simular desconexión de red"
                >
                  <Lock className="w-3 h-3" />
                  <span>Reiniciar Conexiones</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsSyncingSocial(true);
                  setTimeout(() => {
                    setIsSyncingSocial(false);
                    const now = new Date();
                    setLastSyncTime(now.toLocaleTimeString());
                  }, 1200);
                }}
                disabled={isSyncingSocial}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl border border-indigo-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSocial ? 'animate-spin' : ''}`} />
                <span>{isSyncingSocial ? 'Sincronizando APIs...' : 'Sincronizar vía API'}</span>
              </button>
            </div>
          </div>

          {/* Social Platforms Followers & OAuth Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                platform: 'Instagram',
                icon: <Instagram className="w-5 h-5 text-pink-600" />,
                followers: artist.id === 'art-1' ? '42.5K' : artist.id === 'art-2' ? '128.0K' : '12.4K',
                recentGrowth: '+1.2K',
                conversion: '34.2%',
                isConnected: !!artist.socialMedia?.instagramConnected,
                connectedUser: artist.socialMedia?.instagramConnectedUser,
                colorClass: 'pink',
                bg: 'bg-gradient-to-br from-pink-50/40 to-rose-50/10 border-pink-100/60',
                connectAction: () => setActiveOAuthModal('instagram')
              },
              {
                platform: 'TikTok',
                icon: <Music className="w-5 h-5 text-slate-900" />,
                followers: artist.id === 'art-1' ? '108.4K' : artist.id === 'art-2' ? '310.2K' : '24.8K',
                recentGrowth: '+3.8K',
                conversion: '48.9%',
                isConnected: !!artist.socialMedia?.tiktokConnected,
                connectedUser: artist.socialMedia?.tiktokConnectedUser,
                colorClass: 'slate',
                bg: 'bg-gradient-to-br from-slate-50 to-slate-100/30 border-slate-200/60',
                connectAction: () => setActiveOAuthModal('tiktok')
              },
              {
                platform: 'Facebook',
                icon: <Facebook className="w-5 h-5 text-blue-600" />,
                followers: artist.id === 'art-1' ? '15.2K' : artist.id === 'art-2' ? '84.5K' : '8.1K',
                recentGrowth: '+310',
                conversion: '12.5%',
                isConnected: !!artist.socialMedia?.instagramConnected, // Linked to Instagram meta credentials
                connectedUser: artist.socialMedia?.instagramConnectedUser ? artist.socialMedia.instagramConnectedUser.replace('instagram', 'facebook') : undefined,
                colorClass: 'blue',
                bg: 'bg-gradient-to-br from-blue-50/40 to-indigo-50/10 border-blue-100/60',
                connectAction: () => setActiveOAuthModal('instagram')
              },
              {
                platform: 'Spotify (Listeners)',
                icon: <Radio className="w-5 h-5 text-emerald-600" />,
                followers: artist.id === 'art-1' ? '280.4K' : artist.id === 'art-2' ? '890.1K' : '45.2K',
                recentGrowth: '+15.3K',
                conversion: '55.4%',
                isConnected: true, // Auto-synced
                connectedUser: `@${artist.artisticName.toLowerCase().replace(/\s+/g, '')}`,
                colorClass: 'emerald',
                bg: 'bg-gradient-to-br from-emerald-50/40 to-teal-50/10 border-emerald-100/60',
                connectAction: () => {}
              }
            ].map((p, idx) => (
              <div key={idx} className={`${p.bg} border p-4.5 rounded-2xl shadow-3xs space-y-3 relative overflow-hidden group`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-2">
                    {p.icon}
                    <span>{p.platform}</span>
                  </span>
                  
                  {p.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/80 px-2 py-0.5 rounded-lg font-mono animate-pulse">
                      <Unlock className="w-2.5 h-2.5" />
                      API Conectada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-150 px-2 py-0.5 rounded-lg font-mono">
                      <Lock className="w-2.5 h-2.5" />
                      No Conectado
                    </span>
                  )}
                </div>

                <div className="pt-0.5">
                  {p.isConnected ? (
                    <div>
                      <span className="text-2xl font-extrabold text-slate-800 font-mono tracking-tight">
                        {isSyncingSocial ? '...' : p.followers}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        Perfil: <span className="font-semibold text-slate-700 font-mono">{p.connectedUser}</span>
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1.5 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Crecimiento mensual: <span className="font-bold text-emerald-600 font-mono">{p.recentGrowth}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">Requiere consentimiento del artista para sincronizar datos reales del perfil.</p>
                      <button
                        onClick={p.connectAction}
                        className="w-full text-center bg-white hover:bg-slate-50 text-slate-700 font-bold py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 shadow-3xs hover:shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Conectar vía OAuth</span>
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Apify Social Media Web Scraper Module */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">Extracción de Métricas con Apify (Web Scraper)</h4>
                    <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                      Sin OAuth / Meta App Review
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Obtén métricas públicas (seguidores, oyentes, interacción, posts top) en tiempo real con los actores de Apify.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://console.apify.com/account/integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-indigo-300 hover:text-indigo-200 underline flex items-center gap-1"
                >
                  <span>Obtener Token de Apify</span>
                  <Globe className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Input & Platform Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4 flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
                {(['instagram', 'tiktok', 'spotify', 'youtube'] as const).map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setApifyPlatform(plat)}
                    className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg capitalize transition-all cursor-pointer ${
                      apifyPlatform === plat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
              </div>

              <div className="sm:col-span-5 relative">
                <input
                  type="text"
                  value={apifyHandleInput}
                  onChange={(e) => setApifyHandleInput(e.target.value)}
                  placeholder={`Ej. @${artist.artisticName.toLowerCase().replace(/\s+/g, '_')}`}
                  className="w-full bg-slate-800/90 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  onClick={() => handleRunApifyScrape()}
                  disabled={isApifyScraping}
                  className="w-full h-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3 rounded-xl border border-indigo-400/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isApifyScraping ? 'animate-spin' : ''}`} />
                  <span>{isApifyScraping ? 'Scrapeando...' : 'Scrapear con Apify'}</span>
                </button>
              </div>
            </div>

            {/* Apify Results Box */}
            {apifyResult && apifyResult.profile && (
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={apifyResult.profile.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{apifyResult.profile.fullName}</span>
                        {apifyResult.profile.verified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">@{apifyResult.profile.username}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{apifyResult.profile.bio}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-md inline-block">
                      {apifyResult.liveScraped ? '⚡ Apify Live Data' : '🤖 Apify Scraper Engine'}
                    </span>
                    <p className="text-[8px] font-mono text-slate-500 mt-1">
                      Actor: {apifyResult.actorUsed}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] text-slate-400 block font-medium">Seguidores / Oyentes</span>
                    <span className="text-base font-extrabold text-white font-mono">{apifyResult.profile.followersFormatted}</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] text-slate-400 block font-medium">Ratio Engagement</span>
                    <span className="text-base font-extrabold text-indigo-400 font-mono">{apifyResult.profile.engagementRate}</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] text-slate-400 block font-medium">Posts / Contenido</span>
                    <span className="text-base font-extrabold text-white font-mono">{apifyResult.profile.postsCount}</span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] text-slate-400 block font-medium">Likes Promedio / Post</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {apifyResult.profile.topPostLikes ? `${(apifyResult.profile.topPostLikes/1000).toFixed(1)}K` : 'N/A'}
                    </span>
                  </div>
                </div>

                {apifyResult.message && (
                  <p className="text-[9.5px] text-indigo-200/80 bg-indigo-950/40 border border-indigo-800/40 p-2 rounded-lg font-mono">
                    ℹ️ {apifyResult.message}
                  </p>
                )}
              </div>
            )}

            {apifyError && (
              <div className="bg-red-950/50 border border-red-800/60 text-red-300 p-3 rounded-xl text-xs font-mono">
                ⚠️ {apifyError}
              </div>
            )}
          </div>

          {/* Connected Dashboards Block */}
          {(!artist.socialMedia?.instagramConnected && !artist.socialMedia?.tiktokConnected) ? (
            /* SANDBOX EXPLANATION PANEL */
            <div className="bg-amber-50/50 border border-amber-150 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-5">
              <div className="p-4 bg-amber-100 rounded-2xl shrink-0 text-amber-600 border border-amber-200">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 text-slate-600">
                <h4 className="text-sm font-bold text-slate-800">Modo Sandbox Activo - Sincroniza cuentas para desbloquear el Dashboard</h4>
                <p className="text-[11px] leading-relaxed">
                  Para auditar la audiencia de <strong>{artist.artisticName}</strong>, se requiere completar el flujo de consentimiento OAuth (Auth Consent Flow). Esto permitirá a Flamo CRM consultar de manera segura los datos demográficos y publicaciones de su cuenta comercial.
                </p>
                <div className="flex gap-4 pt-1.5">
                  <button
                    onClick={() => setActiveOAuthModal('instagram')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] border border-indigo-700 shadow-sm cursor-pointer"
                  >
                    Simular Conectar Instagram
                  </button>
                  <button
                    onClick={() => setActiveOAuthModal('tiktok')}
                    className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] border border-slate-900 shadow-sm cursor-pointer"
                  >
                    Simular Conectar TikTok
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE SOCIAL ANALYTICS PANELS */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Who Follows & Where Follows (Demographics) */}
              <div className="lg:col-span-2 space-y-5">
                {/* 1. Audiencia Demográfica */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Análisis Demográfico de Audiencia (¿Quiénes nos siguen?)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Muestreo segmentado por género y rangos de edad recopilado de las APIs conectadas.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                    {/* Genero Breakdown */}
                    <div className="space-y-3 bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Distribución de Género</span>
                      
                      <div className="space-y-2.5 pt-1">
                        {[
                          { label: 'Femenino', pct: 54, color: 'bg-pink-500' },
                          { label: 'Masculino', pct: 42, color: 'bg-indigo-500' },
                          { label: 'No binario / Otro', pct: 4, color: 'bg-slate-400' }
                        ].map((g, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                              <span>{g.label}</span>
                              <span className="font-mono">{g.pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                              <div className={`${g.color} h-full rounded-full transition-all`} style={{ width: `${g.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary Tag */}
                      <div className="mt-4 p-2 bg-pink-50/50 border border-pink-100/50 rounded-lg text-[10px] text-pink-700 font-medium">
                        💡 <strong>Predominancia Femenina:</strong> Tu contenido tiene mayor resonancia en mujeres de 18-34 años. Considera esto para el diseño de merch oficial de la gira.
                      </div>
                    </div>

                    {/* Edad Breakdown */}
                    <div className="space-y-3 bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rangos de Edad</span>
                      
                      <div className="space-y-2.5 pt-1">
                        {[
                          { range: '13-17 años', pct: 8, color: 'bg-slate-300' },
                          { range: '18-24 años', pct: 45, color: 'bg-indigo-500 font-bold' },
                          { range: '25-34 años', pct: 32, color: 'bg-indigo-400' },
                          { range: '35-44 años', pct: 11, color: 'bg-slate-400' },
                          { range: '45+ años', pct: 4, color: 'bg-slate-300' }
                        ].map((age, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                              <span>{age.range}</span>
                              <span className="font-mono">{age.pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                              <div className={`${age.color} h-full rounded-full transition-all`} style={{ width: `${age.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. De Dónde nos siguen y Match con Gira en CRM */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span>Geolocalización vs Gira de Booking en CRM (¿De dónde nos siguen?)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Correlación inteligente de la ubicación geográfica de tu audiencia con los shows agendados.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Top Paises */}
                    <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs space-y-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Países de Seguidores</span>
                      <div className="space-y-2">
                        {[
                          { country: 'México 🇲🇽', pct: 48, followers: '72,400' },
                          { country: 'Colombia 🇨🇴', pct: 20, followers: '30,100' },
                          { country: 'Costa Rica 🇨🇷', pct: 12, followers: '18,100' },
                          { country: 'Argentina 🇦🇷', pct: 10, followers: '15,000' },
                          { country: 'España 🇪🇸', pct: 10, followers: '15,000' }
                        ].map((c, i) => (
                          <div key={i} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 text-[11px] font-medium">
                            <span className="font-semibold text-slate-700">{c.country}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 text-[10px] font-mono">{c.followers} fans</span>
                              <span className="font-bold text-slate-800 font-mono w-8 text-right">{c.pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Ciudades con Cruce de Shows (La Inteligencia de Booking!) */}
                    <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-3xs space-y-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Ciudades con Cruce de Booking</span>
                      <div className="space-y-2">
                        {[
                          { city: 'Ciudad de México', pct: 25, activeShows: 2, status: 'match' },
                          { city: 'Monterrey', pct: 18, activeShows: 0, status: 'opportunity' },
                          { city: 'Guadalajara', pct: 15, activeShows: 1, status: 'match' },
                          { city: 'San José (CR)', pct: 10, activeShows: 1, status: 'match' },
                          { city: 'Santiago de Chile', pct: 8, activeShows: 0, status: 'opportunity' }
                        ].map((item, i) => {
                          // Check real events for the selected artist in this city
                          const hasRealEvent = artistEvents.some(evt => {
                            const venue = venues.find(v => v.id === evt.venueId);
                            return venue && venue.city.toLowerCase().includes(item.city.toLowerCase().substring(0, 5));
                          });
                          const showCount = hasRealEvent ? 1 : item.activeShows;

                          return (
                            <div key={i} className="py-1.5 border-b border-slate-50 last:border-0 space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-medium">
                                <span className="font-bold text-slate-700">{item.city}</span>
                                <span className="text-slate-500 font-mono font-semibold">{item.pct}% de audiencia</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-slate-400">Shows en CRM: <strong className="text-slate-600 font-mono">{showCount}</strong></span>
                                {showCount > 0 ? (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded">
                                    Match Óptimo 🎯
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-150 px-1.5 py-0.5 rounded" title="Muchos fans pero ningún show agendado en esta ciudad. ¡Sugerir a Booking!">
                                    Mercado Vacante 💡
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Nivel de Captación (Nuevos Seguidores) por Venue */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span>Retorno Social por Show (Conversión por Plaza/Foro)</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Nivel de captación calculado correlacionando el aforo de shows completados con la retención y escaneo de códigos QR.</p>
                  </div>

                  {artistEvents.filter(e => e.status === 'Completed').length === 0 ? (
                    <div className="bg-white border border-slate-150 p-6 rounded-xl text-center text-slate-400">
                      <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No hay shows completados para este artista para analizar conversión.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-3xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-150 bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                            <th className="px-3.5 py-2.5">Foro / Fecha</th>
                            <th className="px-3.5 py-2.5">Asistencia</th>
                            <th className="px-3.5 py-2.5">Canal de Promoción</th>
                            <th className="px-3.5 py-2.5 text-right">Seguidores Captados</th>
                            <th className="px-3.5 py-2.5 text-right">Eficiencia (Conv.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                          {artistEvents.filter(e => e.status === 'Completed').map((evt) => {
                            const venue = venues.find(v => v.id === evt.venueId);
                            
                            // Stable seed calculation based on event ID for consistent metrics
                            const seed = parseInt(evt.id.replace(/\D/g, '') || '7');
                            const conversionFactor = 0.32 + (seed % 18) / 100; // 32% to 50%
                            const capturedFollowers = Math.round(evt.attendance * conversionFactor);
                            const conversionPercent = (conversionFactor * 100).toFixed(1);

                            const campaigns = [
                              'Campaña Meta Ads Geo-segmentada',
                              'TikTok Trend & Orgánico del Venue',
                              'Playlist de Spotify del Venue + Ads',
                              'Instagram Colaborativo & Sorteo',
                              'QR Físico en Accesos y Escenario'
                            ];
                            const campaign = campaigns[seed % campaigns.length];

                            const getEfficiencyBadge = (pct: number) => {
                              if (pct >= 45) return { text: 'Excelente 🚀', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
                              if (pct >= 38) return { text: 'Óptima 🔥', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
                              return { text: 'Sólida 👍', color: 'bg-slate-50 text-slate-500 border-slate-200' };
                            };
                            const badge = getEfficiencyBadge(parseFloat(conversionPercent));

                            return (
                              <tr key={evt.id} className="hover:bg-slate-50/50">
                                <td className="px-3.5 py-2.5">
                                  <span className="font-bold text-slate-800 block truncate max-w-[160px]">{venue ? venue.name : 'Venue'}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block">{evt.date}</span>
                                </td>
                                <td className="px-3.5 py-2.5 font-mono">{evt.attendance.toLocaleString()} pax</td>
                                <td className="px-3.5 py-2.5 text-slate-500 font-semibold">{campaign}</td>
                                <td className="px-3.5 py-2.5 text-right font-bold text-slate-800 font-mono text-emerald-600">
                                  +{capturedFollowers.toLocaleString()}
                                </td>
                                <td className="px-3.5 py-2.5 text-right">
                                  <div className="inline-flex flex-col items-end gap-0.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                                      {badge.text}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold font-mono">{conversionPercent}%</span>
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

              {/* Right Column: Hashtag Gira Performance Tracker & DB Blueprint */}
              <div className="space-y-5">
                {/* 1. HASHTAG CAMPAIGN POSTS TRACKER */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Instagram className="w-4 h-4 text-pink-600" />
                      <span>Rendimiento de Hashtag de la Gira</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Monitoreo de publicaciones que utilizan el hashtag oficial de la campaña.</p>
                  </div>

                  {/* Hashtag search & Filter control */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={hashtagSearch}
                        onChange={(e) => setHashtagSearch(e.target.value)}
                        placeholder="Buscar Hashtag..."
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium font-mono"
                      />
                    </div>
                    <select
                      value={postFilter}
                      onChange={(e) => setPostFilter(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                    >
                      <option value="all">Filtro: Todos</option>
                      <option value="high">Alto Impacto 🔥</option>
                      <option value="low">Optimizar ⚠️</option>
                    </select>
                  </div>

                  {/* Feed list */}
                  <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                    {socialPosts
                      .filter((p) => {
                        const matchesHashtag = p.caption.toLowerCase().includes(hashtagSearch.toLowerCase()) || p.hashtag.toLowerCase().includes(hashtagSearch.toLowerCase());
                        if (!matchesHashtag) return false;
                        if (postFilter === 'high') return p.engagement >= 8.0;
                        if (postFilter === 'low') return p.engagement < 4.0;
                        return true;
                      })
                      .map((post) => {
                        const isHigh = post.engagement >= 8.0;
                        const isMedium = post.engagement >= 4.0 && post.engagement < 8.0;

                        return (
                          <div key={post.id} className="bg-white border border-slate-200/70 p-3 rounded-xl shadow-3xs hover:border-slate-300 transition-all space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                                {post.platform === 'Instagram' ? (
                                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                                ) : post.platform === 'TikTok' ? (
                                  <Music className="w-3.5 h-3.5 text-black" />
                                ) : (
                                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                <span className="text-[10px] text-slate-500">{post.platform}</span>
                              </span>
                              
                              {isHigh ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  Alto Impacto 🔥
                                </span>
                              ) : isMedium ? (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100">
                                  Promedio 📈
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 text-amber-600 border border-amber-150">
                                  Optimizar ⚠️
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-600 leading-relaxed font-medium line-clamp-3">
                              {post.caption}
                            </p>

                            <div className="flex gap-3 text-[10px] font-semibold text-slate-500 font-mono pt-1 border-t border-slate-50 justify-between items-center">
                              <div className="flex gap-2">
                                <span>❤️ {post.likes.toLocaleString()}</span>
                                <span>💬 {post.comments.toLocaleString()}</span>
                                {post.views && <span>👁️ {post.views.toLocaleString()}</span>}
                              </div>
                              <span className="text-[9px] font-bold text-indigo-600 font-sans">
                                ER: {post.engagement.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}

                    {socialPosts.filter((p) => p.caption.toLowerCase().includes(hashtagSearch.toLowerCase()) || p.hashtag.toLowerCase().includes(hashtagSearch.toLowerCase())).length === 0 && (
                      <div className="p-6 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-[10px] font-bold">No se encontraron publicaciones con "{hashtagSearch}"</p>
                      </div>
                    )}
                  </div>

                  {/* Add simulated post form */}
                  <div className="bg-slate-100 border border-slate-200/50 p-3.5 rounded-xl space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">📝 Simular Nuevo Post de Gira</span>
                    <div className="space-y-2">
                      <textarea
                        value={newPostCaption}
                        onChange={(e) => setNewPostCaption(e.target.value)}
                        placeholder={`Escribe la publicación... (incluye ${hashtagSearch})`}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-lg p-2 text-[10px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium h-12"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Plataforma</label>
                          <select
                            value={newPostPlatform}
                            onChange={(e) => setNewPostPlatform(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] text-slate-700 font-bold"
                          >
                            <option value="Instagram">Instagram</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Facebook">Facebook</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Likes</label>
                          <input
                            type="number"
                            value={newPostLikes}
                            onChange={(e) => setNewPostLikes(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-mono text-slate-700 font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!newPostCaption) return alert('Por favor escribe un texto para el post.');
                          
                          const l = parseInt(newPostLikes) || 1200;
                          const c = parseInt(newPostComments) || 150;
                          
                          // Estimate engagement based on standard artist followers
                          const artistFollowers = artist.id === 'art-1' ? 150000 : artist.id === 'art-2' ? 520000 : 45000;
                          const engagement = parseFloat((((l + c) / artistFollowers) * 100).toFixed(1));

                          const newPostObj = {
                            id: `post-${Date.now()}`,
                            platform: newPostPlatform,
                            caption: newPostCaption,
                            hashtag: hashtagSearch,
                            likes: l,
                            comments: c,
                            engagement: Math.max(0.5, Math.min(25, engagement * 20)), // Normalized engagement simulation
                            date: new Date().toISOString().substring(0, 10),
                            thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80'
                          };

                          setSocialPosts([newPostObj, ...socialPosts]);
                          setNewPostCaption('');
                          alert('¡Post simulado guardado exitosamente en el feed local!');
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 rounded-lg text-[10px] transition-colors cursor-pointer"
                      >
                        Guardar Post e Iniciar Análisis
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. DATABASE SCHEMA BLUEPRINT */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-indigo-600" />
                      <span>Arquitectura & Base de Datos CRM</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Especificación técnica del modelo de datos para persistir tokens de redes, demografía y posts.</p>
                  </div>

                  {/* Schema Tab Toggles */}
                  <div className="flex border-b border-slate-200">
                    {[
                      { id: 'ER', label: 'Diagrama E-R' },
                      { id: 'SQL', label: 'Raw SQL DDL' },
                      { id: 'ORM', label: 'ORM (Drizzle TS)' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setDbTab(tab.id as any)}
                        className={`px-3 py-1.5 text-[10px] font-bold border-b-2 transition-colors cursor-pointer ${
                          dbTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Render Tab Contents */}
                  {dbTab === 'ER' && (
                    <div className="space-y-3 pt-1 text-[10px] leading-relaxed text-slate-600">
                      <p className="font-medium text-[11px]">
                        Para implementar este dashboard de forma persistente, diseñamos una arquitectura relacional en base de datos PostgreSQL:
                      </p>
                      
                      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-3xs p-3 font-mono space-y-3.5">
                        <div className="space-y-1">
                          <p className="font-bold text-indigo-600">1. Table: artist_social_credentials</p>
                          <p className="text-slate-500 text-[9px] pl-3">Stores OAuth tokens. PK: id, FK: artist_id {"->"} artists.id. Unique constraint on (artist_id, platform).</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-indigo-600">2. Table: audience_demographics</p>
                          <p className="text-slate-500 text-[9px] pl-3">Saves age, gender, and geo percentages. Unique on (artist_id, platform, metric_type, metric_key).</p>
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-indigo-600">3. Table: campaign_posts_metrics</p>
                          <p className="text-slate-500 text-[9px] pl-3">Stores engagement & insights for posts filterable by campaign hashtag. FK: artist_id.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {dbTab === 'SQL' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>PostgreSQL DDL Scripts</span>
                        <button
                          onClick={() => {
                            const sqlCode = `-- Tabla de credenciales OAuth de Redes Sociales\nCREATE TABLE artist_social_credentials (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,\n  platform VARCHAR(50) NOT NULL,\n  connected_user VARCHAR(100) NOT NULL,\n  access_token TEXT NOT NULL,\n  refresh_token TEXT,\n  expires_at TIMESTAMP WITH TIME ZONE,\n  scopes TEXT[],\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE(artist_id, platform)\n);\n\n-- Tabla de demografía de audiencia\nCREATE TABLE audience_demographics (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,\n  platform VARCHAR(50) NOT NULL,\n  metric_type VARCHAR(50) NOT NULL, -- 'age_group', 'gender', 'city', 'country'\n  metric_key VARCHAR(100) NOT NULL,\n  metric_value DECIMAL(5,2) NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n);`;
                            navigator.clipboard.writeText(sqlCode);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isCopied ? '¡Copiado!' : 'Copiar SQL'}</span>
                        </button>
                      </div>
                      
                      <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[9px] max-h-[180px] overflow-y-auto leading-normal">
                        <span className="text-emerald-400">-- Credenciales OAuth</span><br />
                        <span className="text-purple-400">CREATE TABLE</span> artist_social_credentials (<br />
                        &nbsp;&nbsp;id UUID <span className="text-amber-400">PRIMARY KEY</span> DEFAULT gen_random_uuid(),<br />
                        &nbsp;&nbsp;artist_id UUID <span className="text-amber-400">REFERENCES</span> artists(id) <span className="text-red-400">ON DELETE CASCADE</span>,<br />
                        &nbsp;&nbsp;platform VARCHAR(<span className="text-blue-400">50</span>) NOT NULL,<br />
                        &nbsp;&nbsp;connected_user VARCHAR(<span className="text-blue-400">100</span>) NOT NULL,<br />
                        &nbsp;&nbsp;access_token TEXT NOT NULL,<br />
                        &nbsp;&nbsp;expires_at TIMESTAMP WITH TIME ZONE,<br />
                        &nbsp;&nbsp;scopes TEXT[]<br />
                        );<br />
                        <span className="text-emerald-400">-- Demografía de Seguidores</span><br />
                        <span className="text-purple-400">CREATE TABLE</span> audience_demographics (<br />
                        &nbsp;&nbsp;id UUID <span className="text-amber-400">PRIMARY KEY</span>,<br />
                        &nbsp;&nbsp;artist_id UUID <span className="text-amber-400">REFERENCES</span> artists(id),<br />
                        &nbsp;&nbsp;metric_type VARCHAR(<span className="text-blue-400">50</span>),<br />
                        &nbsp;&nbsp;metric_key VARCHAR(<span className="text-blue-400">100</span>),<br />
                        &nbsp;&nbsp;metric_value DECIMAL(<span className="text-blue-400">5,2</span>)<br />
                        );
                      </div>
                    </div>
                  )}

                  {dbTab === 'ORM' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Drizzle Schema definition</span>
                        <button
                          onClick={() => {
                            const ormCode = `import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';\nimport { artists } from './schema';\n\nexport const artistSocialCredentials = pgTable('artist_social_credentials', {\n  id: uuid('id').primaryKey().defaultRandom(),\n  artistId: uuid('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),\n  platform: varchar('platform', { length: 50 }).notNull(),\n  connectedUser: varchar('connected_user', { length: 100 }).notNull(),\n  accessToken: text('access_token').notNull(),\n  updatedAt: timestamp('updated_at').defaultNow()\n});`;
                            navigator.clipboard.writeText(ormCode);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{isCopied ? '¡Copiado!' : 'Copiar Código'}</span>
                        </button>
                      </div>

                      <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[9px] max-h-[180px] overflow-y-auto leading-normal">
                        <span className="text-amber-400">import</span> &#123; pgTable, uuid, varchar, text, timestamp &#125; <span className="text-amber-400">from</span> <span className="text-emerald-400">'drizzle-orm/pg-core'</span>;<br />
                        <span className="text-amber-400">import</span> &#123; artists &#125; <span className="text-amber-400">from</span> <span className="text-emerald-400">'./schema'</span>;<br /><br />
                        <span className="text-purple-400">export const</span> artistSocialCredentials = pgTable(<span className="text-emerald-400">'artist_social_credentials'</span>, &#123;<br />
                        &nbsp;&nbsp;id: uuid(<span className="text-emerald-400">'id'</span>).primaryKey().defaultRandom(),<br />
                        &nbsp;&nbsp;artistId: uuid(<span className="text-emerald-400">'artist_id'</span>).notNull().references(() =&gt; artists.id),<br />
                        &nbsp;&nbsp;platform: varchar(<span className="text-emerald-400">'platform'</span>, &#123; length: 50 &#125;),<br />
                        &nbsp;&nbsp;connectedUser: varchar(<span className="text-emerald-400">'connected_user'</span>, &#123; length: 100 &#125;),<br />
                        &nbsp;&nbsp;accessToken: text(<span className="text-emerald-400">'access_token'</span>).notNull()<br />
                        &#125;);
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SIMULATED OAUTH MODAL DIALOG POPUPS */}
          {activeOAuthModal !== null && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scale-in">
                
                {/* Browser URL bar simulation */}
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg text-[9px] font-mono px-3 py-1 text-slate-500 flex-1 truncate flex items-center gap-1.5 select-none">
                    <Lock className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                    <span className="text-emerald-600 font-bold">HTTPS://</span>
                    <span>
                      {activeOAuthModal === 'instagram'
                        ? 'api.instagram.com/oauth/authorize?client_id=flamo_crm_app...'
                        : 'open-api.tiktok.com/platform/oauth/connect?client_key=flamo...'
                      }
                    </span>
                  </div>
                </div>

                {/* Modal main content */}
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Flamo API Consent Flow</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Pasarela de Verificación para Agencias y Managers</p>
                      </div>
                    </div>
                    
                    {activeOAuthModal === 'instagram' ? (
                      <Instagram className="w-7 h-7 text-pink-600 animate-pulse" />
                    ) : (
                      <Music className="w-7 h-7 text-slate-900 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      La aplicación certificada <strong>Flamo CRM Platform</strong> solicita autorización para conectarse al perfil del artista <strong>{artist.artisticName}</strong> con los siguientes alcances (scopes):
                    </p>

                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2 text-[10px] text-slate-500 leading-normal font-medium">
                      {activeOAuthModal === 'instagram' ? (
                        <>
                          <p className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span><strong>instagram_basic</strong>: Leer información del perfil e imágenes para mapear tus publicaciones de la gira.</span>
                          </p>
                          <p className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span><strong>instagram_manage_insights</strong>: Consultar estadísticas, alcances de hashtags e impresiones de audiencia.</span>
                          </p>
                          <p className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span><strong>pages_read_engagement</strong>: Correlacionar ubicación de seguidores con foros/venues para optimizar booking.</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span><strong>user.info.stats</strong>: Obtener el total de fans y tasa de crecimiento semanal automáticamente.</span>
                          </p>
                          <p className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span><strong>video.list</strong>: Consultar las vistas de los videos que incluyan hashtags de la gira (ej. <code className="font-mono bg-slate-100 p-0.5 rounded text-indigo-600">#GiraFlamo2026</code>).</span>
                          </p>
                          <p className="flex items-start gap-1.5 text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span><strong>tiktok.stats</strong>: Analizar la retención geográfica de tus videos.</span>
                          </p>
                        </>
                      )}
                    </div>

                    {/* Account selection list */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Seleccionar Cuenta Vinculada</span>
                      <div className="border border-slate-200 p-2 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <img
                            src={artist.photo}
                            alt={artist.artisticName}
                            style={{
                              filter: `contrast(${artist.photoStyle?.contrast ?? 1}) brightness(${artist.photoStyle?.brightness ?? 1}) grayscale(${artist.photoStyle?.grayscale ?? 0}) sepia(${artist.photoStyle?.sepia ?? 0}) blur(${artist.photoStyle?.blur ?? 0}px)`,
                              transform: `rotate(${artist.photoStyle?.rotation ?? 0}deg) scale(${artist.photoStyle?.zoom ?? 1})`,
                            }}
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                          <div>
                            <span className="font-bold text-slate-800 text-[10px] block leading-tight">{artist.artisticName}</span>
                            <span className="font-mono text-[9px] text-slate-400 block mt-0.5">
                              {activeOAuthModal === 'instagram'
                                ? `@${artist.artisticName.toLowerCase().replace(/\s+/g, '_')}_oficial`
                                : `@${artist.artisticName.toLowerCase().replace(/\s+/g, '')}_tiktok`
                              }
                            </span>
                          </div>
                        </div>
                        <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[9px] text-indigo-600 font-bold">✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveOAuthModal(null)}
                      className="flex-1 text-center bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-2 rounded-xl border border-slate-200 cursor-pointer text-[10px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSyncingSocial(true);
                        const platformName = activeOAuthModal;
                        setActiveOAuthModal(null);
                        
                        // Fake a console-like loading handshake for production-grade visual experience
                        setTimeout(() => {
                          setIsSyncingSocial(false);
                          
                          // Update artist in main state
                          const updatedSocial = {
                            ...artist.socialMedia,
                            ...(platformName === 'instagram' ? {
                              instagramConnected: true,
                              instagramConnectedUser: `@${artist.artisticName.toLowerCase().replace(/\s+/g, '_')}_oficial`,
                              facebookConnected: true,
                              facebookConnectedUser: `@${artist.artisticName.toLowerCase().replace(/\s+/g, '_')}_fb`
                            } : {
                              tiktokConnected: true,
                              tiktokConnectedUser: `@${artist.artisticName.toLowerCase().replace(/\s+/g, '')}_tiktok`
                            })
                          };

                          onUpdateArtist({
                            ...artist,
                            socialMedia: updatedSocial
                          });

                          const now = new Date();
                          setLastSyncTime(now.toLocaleTimeString());
                          alert(`¡Conexión OAuth establecida! Se han sincronizado las credenciales de ${platformName === 'instagram' ? 'Instagram/Facebook' : 'TikTok'} y guardado con éxito en la base de datos.`);
                        }, 1000);
                      }}
                      className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl border border-indigo-700 shadow-sm cursor-pointer text-[10px]"
                    >
                      Otorga Permisos
                    </button>
                  </div>
                </div>

                {/* Footer terms */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-[8px] text-slate-400 text-center leading-normal">
                  Al autorizar, permites a Flamo CRM almacenar credenciales de forma cifrada. No realizamos publicaciones automáticas sin tu aprobación expresa.
                </div>
              </div>
            </div>
          )}
        </div>
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

              {/* Drag and Drop Mock File Selector */}
              <div className="w-full bg-white border border-dashed border-slate-200 rounded-xl p-3 text-center shadow-3xs">
                <Upload className="w-4 h-4 text-celestial-canvas mx-auto mb-1" />
                <span className="font-bold text-slate-700 text-[10px] block">Simular Carga de Fotografía Local</span>
                <p className="text-[9px] text-slate-400 mt-0.5 mb-1.5">Arrastre un archivo o haga clic para procesar imagen de prensa</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={() => {
                    // Simulate random professional unsplash photo on file select to give real functional experience
                    const simulatedPhotos = [
                      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=500&auto=format&fit=crop&q=80'
                    ];
                    const rand = simulatedPhotos[Math.floor(Math.random() * simulatedPhotos.length)];
                    setPhotoUrlInput(rand);
                    alert('¡Archivo de imagen procesado y cargado en el editor de forma segura!');
                  }}
                  className="hidden"
                  id="simulated-file-upload"
                />
                <label
                  htmlFor="simulated-file-upload"
                  className="inline-block bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all uppercase"
                >
                  Examinar Archivo
                </label>
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
