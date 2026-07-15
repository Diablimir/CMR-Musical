import React, { useState } from 'react';
import {
  Disc, Music, ListMusic, Plus, Trash2, Edit2, Check,
  Clock, Heart, Smile, Star, Sliders, ArrowUp, ArrowDown,
  Lightbulb, Save, X, Calendar, User, Info, MessageSquare, Flame,
  DollarSign, TrendingUp, Layers, Briefcase
} from 'lucide-react';
import { 
  RecordingProject, RecordingSong, Event, Artist, SetlistItem, EventFeedback,
  ProjectCostItem, ProjectPayment, RecordingInstrument, ProjectStage 
} from '../types';

interface ProductionSuiteProps {
  recordingProjects: RecordingProject[];
  events: Event[];
  artists: Artist[];
  onAddRecordingProject: (project: RecordingProject) => void;
  onUpdateRecordingProject: (updated: RecordingProject) => void;
  onDeleteRecordingProject: (id: string) => void;
  onUpdateEvent: (id: string, updated: Partial<Event>) => void;
}

export default function ProductionSuite({
  recordingProjects,
  events,
  artists,
  onAddRecordingProject,
  onUpdateRecordingProject,
  onDeleteRecordingProject,
  onUpdateEvent,
}: ProductionSuiteProps) {
  // Navigation inside Production tab: Discos vs Setlists
  const [activeTab, setActiveTab] = useState<'recordings' | 'setlists'>('recordings');

  // Selected artist filter
  const [selectedArtistId, setSelectedArtistId] = useState<string>(artists[0]?.id || '');

  // ---------------- RECORDING PROJECTS STATE ----------------
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Project forms
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projStatus, setProjStatus] = useState<RecordingProject['status']>('Planificación');
  const [projStudio, setProjStudio] = useState('');
  const [projProducer, setProjProducer] = useState('');
  const [projReleaseDate, setProjReleaseDate] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Song forms (inside a project)
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [songDuration, setSongDuration] = useState('');
  const [songComposer, setSongComposer] = useState('');
  const [songStatus, setSongStatus] = useState<RecordingSong['status']>('Composición');
  const [songProgress, setSongProgress] = useState(0);
  const [songNotes, setSongNotes] = useState('');
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // ---------------- RECORDING SUB-TABS & EXTRA FEATURES STATE ----------------
  const [projectSubTab, setProjectSubTab] = useState<'canciones' | 'etapas' | 'presupuesto' | 'liquidacion'>('canciones');

  // Costs form state
  const [costConcept, setCostConcept] = useState('');
  const [costCategory, setCostCategory] = useState<ProjectCostItem['category']>('Estudio/Grabación');
  const [costAmount, setCostAmount] = useState<number | ''>('');
  const [costNotes, setCostNotes] = useState('');

  // Payments form state
  const [paymentConcept, setPaymentConcept] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Stage editing / viewing state
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageStatus, setStageStatus] = useState<'Pendiente' | 'En Progreso' | 'Completado'>('Pendiente');
  const [stageStartDate, setStageStartDate] = useState('');
  const [stageEndDate, setStageEndDate] = useState('');
  const [stageNotes, setStageNotes] = useState('');

  // Instrument adding state
  const [instName, setInstName] = useState('');
  const [instMusician, setInstMusician] = useState('');
  const [instStatus, setInstStatus] = useState<'Pendiente' | 'Grabando' | 'Listo'>('Pendiente');

  // ---------------- CONCERT SETLISTS STATE ----------------
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null);
  
  // Setlist item forms
  const [newSetSongTitle, setNewSetSongTitle] = useState('');
  const [newSetSongDuration, setNewSetSongDuration] = useState('3:30');
  const [newSetSongTempo, setNewSetSongTempo] = useState<'Lento' | 'Medio' | 'Rápido'>('Medio');
  const [newSetSongTransition, setNewSetSongTransition] = useState('');

  // Post-show feedback form
  const [feedbackThoughts, setFeedbackThoughts] = useState('');
  const [feedbackReaction, setFeedbackReaction] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackOptimization, setFeedbackOptimization] = useState('');
  const [isFeedbackEditing, setIsFeedbackEditing] = useState(false);

  const activeArtistRecordings = recordingProjects.filter(r => r.artistId === selectedArtistId);
  const activeArtistEvents = events.filter(e => e.artistId === selectedArtistId && !e.deleted_at);

  const selectedProject = recordingProjects.find(r => r.id === selectedProjectId) || activeArtistRecordings[0] || null;
  const selectedEvent = events.find(e => e.id === selectedEventId) || activeArtistEvents[0] || null;

  // Set Project / Event IDs safely
  React.useEffect(() => {
    if (activeArtistRecordings.length > 0 && !selectedProjectId) {
      setSelectedProjectId(activeArtistRecordings[0].id);
    }
    if (activeArtistEvents.length > 0 && !selectedEventId) {
      setSelectedEventId(activeArtistEvents[0].id);
    }
  }, [selectedArtistId, activeArtistRecordings, activeArtistEvents, selectedProjectId, selectedEventId]);

  // Handle Event feedback form initialization
  React.useEffect(() => {
    if (selectedEvent) {
      setFeedbackThoughts(selectedEvent.feedback?.artistThoughts || '');
      setFeedbackReaction(selectedEvent.feedback?.crowdReaction || '');
      setFeedbackRating(selectedEvent.feedback?.pacingRating || 5);
      setFeedbackOptimization(selectedEvent.feedback?.optimizationNotes || '');
      setIsFeedbackEditing(false);
    }
  }, [selectedEvent]);

  // Reset sub-tab on selected project change
  React.useEffect(() => {
    setProjectSubTab('canciones');
    setSelectedStageId(null);
  }, [selectedProjectId]);

  // ---------------- RECORDING CRUD HANDLERS ----------------
  const handleOpenAddProject = () => {
    setProjTitle('');
    setProjStatus('Planificación');
    setProjStudio('');
    setProjProducer('');
    setProjReleaseDate('');
    setEditingProjectId(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (proj: RecordingProject) => {
    setProjTitle(proj.title);
    setProjStatus(proj.status);
    setProjStudio(proj.studio || '');
    setProjProducer(proj.producer || '');
    setProjReleaseDate(proj.releaseDate || '');
    setEditingProjectId(proj.id);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;

    if (editingProjectId) {
      const original = recordingProjects.find(r => r.id === editingProjectId);
      if (original) {
        const updated: RecordingProject = {
          ...original,
          title: projTitle,
          status: projStatus,
          studio: projStudio,
          producer: projProducer,
          releaseDate: projReleaseDate,
        };
        onUpdateRecordingProject(updated);
      }
    } else {
      const newProject: RecordingProject = {
        id: `rec-${Date.now()}`,
        title: projTitle,
        artistId: selectedArtistId,
        status: projStatus,
        studio: projStudio,
        producer: projProducer,
        releaseDate: projReleaseDate,
        songs: [],
        created_at: new Date().toISOString()
      };
      onAddRecordingProject(newProject);
      setSelectedProjectId(newProject.id);
    }
    setIsProjectModalOpen(false);
  };

  const handleOpenAddSong = () => {
    setSongTitle('');
    setSongDuration('3:30');
    setSongComposer(artists.find(a => a.id === selectedArtistId)?.artisticName || '');
    setSongStatus('Composición');
    setSongProgress(20);
    setSongNotes('');
    setEditingSongId(null);
    setIsSongModalOpen(true);
  };

  const handleOpenEditSong = (song: RecordingSong) => {
    setSongTitle(song.title);
    setSongDuration(song.duration || '');
    setSongComposer(song.composer || '');
    setSongStatus(song.status);
    setSongProgress(song.progress);
    setSongNotes(song.notes || '');
    setEditingSongId(song.id);
    setIsSongModalOpen(true);
  };

  const handleSaveSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !songTitle.trim()) return;

    let updatedSongs: RecordingSong[] = [];

    if (editingSongId) {
      updatedSongs = selectedProject.songs.map(s => 
        s.id === editingSongId
          ? { ...s, title: songTitle, duration: songDuration, composer: songComposer, status: songStatus, progress: songProgress, notes: songNotes }
          : s
      );
    } else {
      const newSong: RecordingSong = {
        id: `song-${Date.now()}`,
        title: songTitle,
        duration: songDuration,
        composer: songComposer,
        status: songStatus,
        progress: songProgress,
        notes: songNotes
      };
      updatedSongs = [...selectedProject.songs, newSong];
    }

    onUpdateRecordingProject({
      ...selectedProject,
      songs: updatedSongs
    });
    setIsSongModalOpen(false);
  };

  const handleDeleteSong = (songId: string) => {
    if (!selectedProject) return;
    if (confirm('¿Está seguro de que desea eliminar esta canción del tracklist de grabación?')) {
      onUpdateRecordingProject({
        ...selectedProject,
        songs: selectedProject.songs.filter(s => s.id !== songId)
      });
    }
  };

  // ---------------- PROJECT COSTS HANDLERS ----------------
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !costConcept.trim() || costAmount === '') return;

    const newCost: ProjectCostItem = {
      id: `cost-${Date.now()}`,
      concept: costConcept.trim(),
      category: costCategory,
      amount: Number(costAmount),
      notes: costNotes.trim() || undefined
    };

    const currentCosts = selectedProject.costs || [];
    onUpdateRecordingProject({
      ...selectedProject,
      costs: [...currentCosts, newCost]
    });

    setCostConcept('');
    setCostAmount('');
    setCostNotes('');
  };

  const handleDeleteCost = (costId: string) => {
    if (!selectedProject) return;
    const currentCosts = selectedProject.costs || [];
    onUpdateRecordingProject({
      ...selectedProject,
      costs: currentCosts.filter(c => c.id !== costId)
    });
  };

  // ---------------- PROJECT PAYMENTS HANDLERS ----------------
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !paymentConcept.trim() || paymentAmount === '') return;

    const newPayment: ProjectPayment = {
      id: `pay-${Date.now()}`,
      concept: paymentConcept.trim(),
      amount: Number(paymentAmount),
      dueDate: paymentDueDate || new Date().toISOString().substring(0, 10),
      status: 'Pendiente',
      notes: paymentNotes.trim() || undefined
    };

    const currentPayments = selectedProject.payments || [];
    onUpdateRecordingProject({
      ...selectedProject,
      payments: [...currentPayments, newPayment]
    });

    setPaymentConcept('');
    setPaymentAmount('');
    setPaymentDueDate('');
    setPaymentNotes('');
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!selectedProject) return;
    const currentPayments = selectedProject.payments || [];
    onUpdateRecordingProject({
      ...selectedProject,
      payments: currentPayments.filter(p => p.id !== paymentId)
    });
  };

  const handleTogglePaymentStatus = (paymentId: string) => {
    if (!selectedProject) return;
    const currentPayments = selectedProject.payments || [];
    onUpdateRecordingProject({
      ...selectedProject,
      payments: currentPayments.map(p => 
        p.id === paymentId 
          ? { ...p, status: p.status === 'Pagado' ? 'Pendiente' : 'Pagado' } 
          : p
      )
    });
  };

  // ---------------- PROJECT STAGES & INSTRUMENTS HANDLERS ----------------
  const getProjectStages = (proj: RecordingProject): ProjectStage[] => {
    if (proj.stages && proj.stages.length > 0) return proj.stages;
    return [
      { id: 'stg-1', name: 'Pre-producción', status: 'Pendiente', notes: 'Definición de canciones y maquetas iniciales' },
      { id: 'stg-2', name: 'Grabación', status: 'Pendiente', notes: 'Grabación de instrumentación y voces', instruments: [] },
      { id: 'stg-3', name: 'Revisión', status: 'Pendiente', notes: 'Control de calidad y selección de tomas' },
      { id: 'stg-4', name: 'Mezcla', status: 'Pendiente', notes: 'Balance de pistas y espacialización' },
      { id: 'stg-5', name: 'Masterización', status: 'Pendiente', notes: 'Optimización final para plataformas' },
      { id: 'stg-6', name: 'Listo', status: 'Pendiente', notes: 'Proyecto terminado y exportado' }
    ];
  };

  const handleUpdateStage = (stageId: string, updatedFields: Partial<ProjectStage>) => {
    if (!selectedProject) return;
    const stages = getProjectStages(selectedProject);
    const updatedStages = stages.map(stg => 
      stg.id === stageId ? { ...stg, ...updatedFields } : stg
    );
    onUpdateRecordingProject({
      ...selectedProject,
      stages: updatedStages
    });
  };

  const handleAddInstrument = (e: React.FormEvent, stageId: string) => {
    e.preventDefault();
    if (!selectedProject || !instName.trim()) return;

    const newInst: RecordingInstrument = {
      id: `inst-${Date.now()}`,
      name: instName.trim(),
      status: instStatus,
      musician: instMusician.trim() || undefined
    };

    const stages = getProjectStages(selectedProject);
    const updatedStages = stages.map(stg => {
      if (stg.id === stageId) {
        const currentInsts = stg.instruments || [];
        return {
          ...stg,
          instruments: [...currentInsts, newInst]
        };
      }
      return stg;
    });

    onUpdateRecordingProject({
      ...selectedProject,
      stages: updatedStages
    });

    setInstName('');
    setInstMusician('');
    setInstStatus('Pendiente');
  };

  const handleDeleteInstrument = (stageId: string, instId: string) => {
    if (!selectedProject) return;
    const stages = getProjectStages(selectedProject);
    const updatedStages = stages.map(stg => {
      if (stg.id === stageId) {
        const currentInsts = stg.instruments || [];
        return {
          ...stg,
          instruments: currentInsts.filter(i => i.id !== instId)
        };
      }
      return stg;
    });

    onUpdateRecordingProject({
      ...selectedProject,
      stages: updatedStages
    });
  };

  const handleToggleInstrumentStatus = (stageId: string, instId: string, nextStatus: 'Pendiente' | 'Grabando' | 'Listo') => {
    if (!selectedProject) return;
    const stages = getProjectStages(selectedProject);
    const updatedStages = stages.map(stg => {
      if (stg.id === stageId) {
        const currentInsts = stg.instruments || [];
        return {
          ...stg,
          instruments: currentInsts.map(i => i.id === instId ? { ...i, status: nextStatus } : i)
        };
      }
      return stg;
    });

    onUpdateRecordingProject({
      ...selectedProject,
      stages: updatedStages
    });
  };

  // ---------------- CONCERT SETLIST HANDLERS ----------------
  const handleAddSetlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !newSetSongTitle.trim()) return;

    const newItem: SetlistItem = {
      id: `set-item-${Date.now()}`,
      songTitle: newSetSongTitle,
      duration: newSetSongDuration,
      tempo: newSetSongTempo,
      transitionNotes: newSetSongTransition
    };

    const currentSetlist = selectedEvent.setlist || [];
    onUpdateEvent(selectedEvent.id, {
      setlist: [...currentSetlist, newItem]
    });

    setNewSetSongTitle('');
    setNewSetSongTransition('');
  };

  const handleDeleteSetlistItem = (itemId: string) => {
    if (!selectedEvent || !selectedEvent.setlist) return;
    onUpdateEvent(selectedEvent.id, {
      setlist: selectedEvent.setlist.filter(s => s.id !== itemId)
    });
  };

  const handleMoveSetlistItem = (index: number, direction: 'up' | 'down') => {
    if (!selectedEvent || !selectedEvent.setlist) return;
    const list = [...selectedEvent.setlist];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    onUpdateEvent(selectedEvent.id, { setlist: list });
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const newFeedback: EventFeedback = {
      artistThoughts: feedbackThoughts,
      crowdReaction: feedbackReaction,
      pacingRating: feedbackRating,
      optimizationNotes: feedbackOptimization
    };

    onUpdateEvent(selectedEvent.id, {
      feedback: newFeedback
    });
    setIsFeedbackEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Upper Control Bar */}
      <div className="bg-white border border-silver-haze p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-cosmic-black tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            Producción Artística y Dirección Escénica
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supervisa grabaciones de álbumes, tracklists de canciones y los setlists de conciertos con feedback de directores y artistas.
          </p>
        </div>

        {/* Filter Artist & Workspace Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Artista:</span>
            <select
              value={selectedArtistId}
              onChange={(e) => {
                setSelectedArtistId(e.target.value);
                setSelectedProjectId(null);
                setSelectedEventId(null);
              }}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
            >
              {artists.map(a => (
                <option key={a.id} value={a.id}>{a.artisticName}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('recordings')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'recordings' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/45' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Grabaciones (Discos)</span>
            </button>
            <button
              onClick={() => setActiveTab('setlists')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'setlists' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/45' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Setlists de Shows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'recordings' ? (
        // ======================== RECORDINGS COMPONENT ========================
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Album sidebar */}
          <div className="space-y-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Proyectos discográficos</span>
            
            {activeArtistRecordings.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-silver-haze rounded-2xl bg-white text-slate-400">
                <Disc className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No hay grabaciones activas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeArtistRecordings.map(proj => {
                  const isSelected = selectedProject?.id === proj.id;
                  const totalProgress = proj.songs.length > 0
                    ? Math.round(proj.songs.reduce((acc, curr) => acc + curr.progress, 0) / proj.songs.length)
                    : 0;

                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-xs'
                          : 'bg-white border-silver-haze hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold truncate">{proj.title}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                            {proj.status}
                          </span>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{proj.songs.length} Canciones</span>
                          <span>{totalProgress}% Grabado</span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5 border border-slate-200/50">
                          <div className="bg-indigo-500 h-full" style={{ width: `${totalProgress}%` }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleOpenAddProject}
              className="w-full mt-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 rounded-xl border border-silver-haze hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-500" />
              <span>Crear Álbum / Disco</span>
            </button>
          </div>

          {/* Song list inside selected album */}
          <div className="lg:col-span-3 space-y-4">
            {selectedProject ? (
              <div className="bg-white border border-silver-haze rounded-2xl p-6 shadow-sm space-y-6">
                {/* Album details card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Disc className="w-6 h-6 animate-spin-slow" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-800">{selectedProject.title}</h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 border border-emerald-100 rounded-md font-mono">
                          {selectedProject.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Producido por <span className="font-semibold text-slate-500">{selectedProject.producer || 'N/A'}</span> en <span className="font-semibold text-slate-500">{selectedProject.studio || 'N/A'}</span> — Lanzamiento proyectado: {selectedProject.releaseDate || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditProject(selectedProject)}
                      className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Editar Detalles
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Está seguro de que desea eliminar permanentemente el proyecto discográfico "${selectedProject.title}" del CRM?`)) {
                          onDeleteRecordingProject(selectedProject.id);
                        }
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Eliminar Proyecto
                    </button>
                  </div>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex border-b border-slate-100 pb-px overflow-x-auto gap-1">
                  <button
                    onClick={() => setProjectSubTab('canciones')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      projectSubTab === 'canciones'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span>Tracklist ({selectedProject.songs.length})</span>
                  </button>

                  <button
                    onClick={() => setProjectSubTab('etapas')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      projectSubTab === 'etapas'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Cronograma y Etapas</span>
                  </button>

                  <button
                    onClick={() => setProjectSubTab('presupuesto')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      projectSubTab === 'presupuesto'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Presupuesto y Músicos</span>
                  </button>

                  <button
                    onClick={() => setProjectSubTab('liquidacion')}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      projectSubTab === 'liquidacion'
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Esquema de Liquidación</span>
                  </button>
                </div>

                {/* Sub-tab Content Panels */}
                {projectSubTab === 'canciones' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lista de Canciones y Estado de Grabación</h4>
                      <button
                        onClick={handleOpenAddSong}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar Canción al Disco</span>
                      </button>
                    </div>

                    {selectedProject.songs.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        <Music className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No se han registrado canciones en este álbum aún.</p>
                        <button
                          onClick={handleOpenAddSong}
                          className="mt-3 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Registrar Primera Canción
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                              <th className="px-4 py-3">Pista</th>
                              <th className="px-4 py-3">Canción / Compositor</th>
                              <th className="px-4 py-3">Duración</th>
                              <th className="px-4 py-3">Estado de Grabación</th>
                              <th className="px-4 py-3">Avance</th>
                              <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedProject.songs.map((song, idx) => (
                              <tr key={song.id} className="hover:bg-slate-50/50 text-slate-600 transition-colors">
                                <td className="px-4 py-4 font-mono font-bold text-slate-400">
                                  {(idx + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="px-4 py-4">
                                  <span className="font-bold text-slate-700 block">{song.title}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">Autor: {song.composer || 'N/A'}</span>
                                </td>
                                <td className="px-4 py-4 font-mono font-medium text-slate-500">
                                  {song.duration || 'N/A'}
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                    song.status === 'Listo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    song.status === 'Mezcla' || song.status === 'Masterizado' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    song.status === 'Grabación de Instrumentos' || song.status === 'Grabación de Voces' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-slate-100 text-slate-500 border-slate-200'
                                  }`}>
                                    {song.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-700">{song.progress}%</span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200/50">
                                      <div className="bg-indigo-500 h-full" style={{ width: `${song.progress}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleOpenEditSong(song)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSong(song.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {projectSubTab === 'etapas' && (() => {
                  const stages = getProjectStages(selectedProject);
                  const activeStage = stages.find(s => s.id === selectedStageId) || stages.find(s => s.name === 'Grabación') || stages[0];

                  return (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Cronograma y Estado de Etapas</h4>
                        {/* Stages Grid Timeline */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          {stages.map((stg) => {
                            const isCurrentActive = activeStage?.id === stg.id;
                            return (
                              <button
                                type="button"
                                key={stg.id}
                                onClick={() => {
                                  setSelectedStageId(stg.id);
                                  setStageStatus(stg.status);
                                  setStageStartDate(stg.startDate || '');
                                  setStageEndDate(stg.endDate || '');
                                  setStageNotes(stg.notes || '');
                                }}
                                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer flex flex-col justify-between h-20 ${
                                  isCurrentActive
                                    ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-2xs ring-1 ring-indigo-500/10'
                                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="text-[10px] font-extrabold truncate uppercase tracking-tight block w-full">{stg.name}</div>
                                <div className="mt-1 flex items-center justify-between w-full">
                                  <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                                    stg.status === 'Completado' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    stg.status === 'En Progreso' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    'bg-slate-200 text-slate-500 border border-slate-300/70'
                                  }`}>
                                    {stg.status === 'En Progreso' ? 'En curso' : stg.status}
                                  </span>
                                  {stg.instruments && stg.instruments.length > 0 && (
                                    <span className="text-[9px] font-bold font-mono text-indigo-600 bg-white border border-slate-100 px-1 rounded">
                                      {stg.instruments.filter(i => i.status === 'Listo').length}/{stg.instruments.length}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expanded Active Stage Detail & Editor */}
                      {activeStage && (
                        <div className="bg-slate-50/60 border border-slate-200/50 rounded-2xl p-5 space-y-5">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200/60">
                            <div>
                              <span className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest block">Detalles de la Fase</span>
                              <h5 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                {activeStage.name}
                              </h5>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Cambiar Estado:</span>
                              <select
                                value={activeStage.status}
                                onChange={(e) => handleUpdateStage(activeStage.id, { status: e.target.value as any })}
                                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Completado">Completado</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-2 space-y-3">
                              {/* Stage Dates and Notes */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha de Inicio</label>
                                  <input
                                    type="date"
                                    value={activeStage.startDate || ''}
                                    onChange={(e) => handleUpdateStage(activeStage.id, { startDate: e.target.value })}
                                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha de Finalización</label>
                                  <input
                                    type="date"
                                    value={activeStage.endDate || ''}
                                    onChange={(e) => handleUpdateStage(activeStage.id, { endDate: e.target.value })}
                                    className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notas y Objetivos de la Fase</label>
                                <textarea
                                  rows={2}
                                  placeholder="Detalle los objetivos a cumplir, responsables o requerimientos de esta fase de producción..."
                                  value={activeStage.notes || ''}
                                  onChange={(e) => handleUpdateStage(activeStage.id, { notes: e.target.value })}
                                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex flex-col justify-between shadow-3xs">
                              <div className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest block">Guía de la Industria</div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                {activeStage.name === 'Pre-producción' && 'Define las estructuras de los temas, tonos, compás y graba maquetas básicas de guitarra/voz o piano de referencia.'}
                                {activeStage.name === 'Grabación' && 'Registra los instrumentos dinámicamente uno por uno. Agregue instrumentos con sus músicos de sesión para dar seguimiento técnico.'}
                                {activeStage.name === 'Revisión' && 'Escucha atenta de tomas grabadas. Limpieza de ruidos, afinación vocal manual, comping de mejores tomas y selección final.'}
                                {activeStage.name === 'Mezcla' && 'Combina todas las pistas grabadas. Ecualización, paneo, compresión y efectos de espacio como Reverb y Delay para dar balance.'}
                                {activeStage.name === 'Masterización' && 'Fase final de pulido. Ajuste de volumen competitivo global (LUFS), EQ general y preparación de metadatos de distribución.'}
                                {activeStage.name === 'Listo' && 'Exportación de archivos finales de alta calidad WAV y MP3 320kbps. El álbum está listo para subirse a agregadoras de streaming.'}
                              </p>
                              <div className="mt-2 text-[9px] text-slate-400 font-medium">Fase: {activeStage.name} — FLAMO CRM</div>
                            </div>
                          </div>

                          {/* Recording Instruments Checklist (renders for Grabación, or as general tracker) */}
                          {activeStage.name === 'Grabación' && (
                            <div className="pt-4 border-t border-slate-200/70 grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Instruments List */}
                              <div className="lg:col-span-2 space-y-3">
                                <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                  Instrumentos en proceso de Grabación
                                </h6>

                                {(!activeStage.instruments || activeStage.instruments.length === 0) ? (
                                  <div className="p-8 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                                    No hay instrumentos registrados en este proyecto de grabación aún. Regístrelos en el formulario de la derecha.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {activeStage.instruments.map((inst) => (
                                      <div key={inst.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-2 shadow-3xs transition-all">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                            inst.status === 'Listo' ? 'bg-emerald-500 shadow-xs' :
                                            inst.status === 'Grabando' ? 'bg-amber-500 animate-pulse shadow-xs' : 'bg-slate-300'
                                          }`} />
                                          <div className="truncate">
                                            <span className="text-xs font-bold text-slate-700 block truncate">{inst.name}</span>
                                            {inst.musician && (
                                              <span className="text-[10px] text-slate-400 block font-medium truncate">Músico: {inst.musician}</span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {/* Status Toggles */}
                                          <select
                                            value={inst.status}
                                            onChange={(e) => handleToggleInstrumentStatus(activeStage.id, inst.id, e.target.value as any)}
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border outline-none ${
                                              inst.status === 'Listo' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                              inst.status === 'Grabando' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                              'bg-slate-50 border-slate-200 text-slate-500'
                                            }`}
                                          >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Grabando">Grabando</option>
                                            <option value="Listo">Listo</option>
                                          </select>

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteInstrument(activeStage.id, inst.id)}
                                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                                            title="Eliminar"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Add Instrument Form */}
                              <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-3xs">
                                <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Añadir Instrumento / Músico</h6>
                                <form onSubmit={(e) => handleAddInstrument(e, activeStage.id)} className="space-y-3">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nombre Instrumento / Voz</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Ej. Batería, Voces, Bajo"
                                      value={instName}
                                      onChange={(e) => setInstName(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Músico Ejecutante (Opcional)</label>
                                    <input
                                      type="text"
                                      placeholder="Ej. Héctor Luna (Baterista)"
                                      value={instMusician}
                                      onChange={(e) => setInstMusician(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Estado Inicial</label>
                                    <select
                                      value={instStatus}
                                      onChange={(e) => setInstStatus(e.target.value as any)}
                                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                                    >
                                      <option value="Pendiente">Pendiente</option>
                                      <option value="Grabando">Grabando</option>
                                      <option value="Listo">Listo</option>
                                    </select>
                                  </div>

                                  <button
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Registrar Instrumento</span>
                                  </button>
                                </form>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {projectSubTab === 'presupuesto' && (() => {
                  const costs = selectedProject.costs || [];
                  const payments = selectedProject.payments || [];
                  
                  const totalBudget = costs.reduce((sum, item) => sum + item.amount, 0);
                  const totalPaid = payments.filter(p => p.status === 'Pagado').reduce((sum, item) => sum + item.amount, 0);
                  const remainingBalance = Math.max(0, totalBudget - totalPaid);

                  return (
                    <div className="space-y-6">
                      {/* Financial KPI Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center shrink-0">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Costo Total del Álbum</span>
                            <span className="text-base font-extrabold text-slate-800 font-mono">${totalBudget.toLocaleString('es-MX')}</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
                            <Check className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Monto Liquidado</span>
                            <span className="text-base font-extrabold text-emerald-600 font-mono">${totalPaid.toLocaleString('es-MX')}</span>
                          </div>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Saldos por Liquidar</span>
                            <span className="text-base font-extrabold text-amber-600 font-mono">${remainingBalance.toLocaleString('es-MX')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Cost items listing and inline additions */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Costs Table */}
                        <div className="lg:col-span-2 space-y-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Desglose de Costos del Proyecto</span>
                          {costs.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                              No hay conceptos de costo registrados en este proyecto discográfico aún. Registre sus costos en el formulario lateral.
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-3xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-100">
                                    <th className="px-4 py-2.5">Concepto / Destinatario</th>
                                    <th className="px-4 py-2.5">Categoría</th>
                                    <th className="px-4 py-2.5 text-right">Monto</th>
                                    <th className="px-4 py-2.5 text-right">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {costs.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <span className="font-bold text-slate-700 block">{c.concept}</span>
                                        {c.notes && <span className="text-[10px] text-slate-400 block italic mt-0.5">{c.notes}</span>}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                          c.category === 'Músicos de Sesión' ? 'bg-purple-50 border border-purple-100 text-purple-700' :
                                          c.category === 'Estudio/Grabación' ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' :
                                          c.category === 'Mezcla' ? 'bg-teal-50 border border-teal-100 text-teal-700' :
                                          c.category === 'Masterización' ? 'bg-cyan-50 border border-cyan-100 text-cyan-700' :
                                          'bg-slate-50 border border-slate-200 text-slate-600'
                                        }`}>
                                          {c.category}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold font-mono text-slate-700">
                                        ${c.amount.toLocaleString('es-MX')}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCost(c.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                          title="Eliminar costo"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Cost Adder Form */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Añadir Concepto / Músicos</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Agregue los costos de grabación, sesionistas, mezclas o master.</p>
                          </div>

                          <form onSubmit={handleAddCost} className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nombre de Concepto o Músico</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Pedro Torres (Baterista de sesión)"
                                value={costConcept}
                                onChange={(e) => setCostConcept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Categoría de Costo</label>
                              <select
                                value={costCategory}
                                onChange={(e) => setCostCategory(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                              >
                                <option value="Estudio/Grabación">Estudio/Grabación</option>
                                <option value="Músicos de Sesión">Músicos de Sesión</option>
                                <option value="Arreglos/Producción">Arreglos/Producción</option>
                                <option value="Mezcla">Mezcla</option>
                                <option value="Masterización">Masterización</option>
                                <option value="Otros">Otros</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Monto de Costo ($ MXN)</label>
                              <input
                                type="number"
                                required
                                placeholder="Ej. 12000"
                                value={costAmount}
                                onChange={(e) => setCostAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Notas / Detalles Técnicos</label>
                              <textarea
                                rows={2}
                                placeholder="Ej. Grabará 4 temas para el disco..."
                                value={costNotes}
                                onChange={(e) => setCostNotes(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Agregar al Presupuesto</span>
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {projectSubTab === 'liquidacion' && (() => {
                  const payments = selectedProject.payments || [];
                  const costs = selectedProject.costs || [];
                  const totalBudget = costs.reduce((sum, item) => sum + item.amount, 0);

                  const totalPaid = payments.filter(p => p.status === 'Pagado').reduce((sum, item) => sum + item.amount, 0);
                  const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((sum, item) => sum + item.amount, 0);
                  const liquidationPct = totalBudget > 0 ? Math.min(100, Math.round((totalPaid / totalBudget) * 100)) : 0;

                  return (
                    <div className="space-y-6">
                      {/* Financial KPI Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-3xs">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Presupuesto del Disco</span>
                          <span className="text-base font-extrabold text-slate-800 font-mono">${totalBudget.toLocaleString('es-MX')}</span>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-3xs">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Monto Liquidado</span>
                          <span className="text-base font-extrabold text-emerald-600 font-mono">${totalPaid.toLocaleString('es-MX')}</span>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl shadow-3xs">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Monto Pendiente</span>
                          <span className="text-base font-extrabold text-amber-600 font-mono">${totalPending.toLocaleString('es-MX')}</span>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl shadow-3xs">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">% Amortizado / Liquidado</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-base font-extrabold text-indigo-700 font-mono">{liquidationPct}%</span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                              <div className="bg-indigo-600 h-full" style={{ width: `${liquidationPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payments schedule list and adder form */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Payments Table */}
                        <div className="lg:col-span-2 space-y-3">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Calendario Temporal de Liquidación</span>
                          {payments.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-xs font-semibold">
                              No hay hitos de pago o liquidaciones registradas para este proyecto discográfico.
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-3xs">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] border-b border-slate-100">
                                    <th className="px-4 py-2.5">Hito de Pago / Etapa</th>
                                    <th className="px-4 py-2.5">Vencimiento</th>
                                    <th className="px-4 py-2.5 text-right">Monto</th>
                                    <th className="px-4 py-2.5">Estado</th>
                                    <th className="px-4 py-2.5 text-right">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3">
                                        <span className="font-bold text-slate-700 block">{p.concept}</span>
                                        {p.notes && <span className="text-[10px] text-slate-400 block italic mt-0.5">{p.notes}</span>}
                                      </td>
                                      <td className="px-4 py-3 font-mono text-slate-500 font-medium">
                                        {p.dueDate}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold font-mono text-slate-700">
                                        ${p.amount.toLocaleString('es-MX')}
                                      </td>
                                      <td className="px-4 py-3 font-medium">
                                        <button
                                          type="button"
                                          onClick={() => handleTogglePaymentStatus(p.id)}
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                                            p.status === 'Pagado'
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                          }`}
                                        >
                                          {p.status === 'Pagado' ? (
                                            <>
                                              <Check className="w-2.5 h-2.5" />
                                              <span>Pagado</span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                                              <span>Pendiente</span>
                                            </>
                                          )}
                                        </button>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePayment(p.id)}
                                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 cursor-pointer"
                                          title="Eliminar"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Payment Adder Form */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                          <div>
                            <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Registrar Hito de Pago</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Establezca los vencimientos de anticipos, saldos o pagos por etapas.</p>
                          </div>

                          <form onSubmit={handleAddPayment} className="space-y-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nombre o Etapa de Pago</label>
                              <input
                                type="text"
                                required
                                placeholder="Ej. Anticipo de Grabación (50%)"
                                value={paymentConcept}
                                onChange={(e) => setPaymentConcept(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Monto de Pago ($ MXN)</label>
                              <input
                                type="number"
                                required
                                placeholder="Ej. 15000"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Fecha de Vencimiento / Liquidación</label>
                              <input
                                type="date"
                                required
                                value={paymentDueDate}
                                onChange={(e) => setPaymentDueDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Notas del Pago</label>
                              <textarea
                                rows={2}
                                placeholder="Ej. Se pagará al completar la fase de pre-producción..."
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Registrar Pago</span>
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white border border-silver-haze p-12 text-center rounded-2xl">
                <Disc className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Por favor cree una grabación o seleccione un proyecto discográfico.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ======================== CONCERT SETLISTS ========================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Shows selection list (4cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Conciertos y Giras del Artista</span>
            {activeArtistEvents.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-silver-haze rounded-2xl bg-white text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No hay shows programados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeArtistEvents.map(evt => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const setlistCount = evt.setlist?.length || 0;
                  const hasFeedback = !!evt.feedback;

                  return (
                    <button
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-xs'
                          : 'bg-white border-silver-haze hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] text-slate-400 font-bold font-mono">{evt.date}</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                            evt.status === 'Completed' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {evt.status === 'Completed' ? 'Realizado' : 'Próximo'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold truncate mt-1 text-slate-800">{evt.name}</h4>
                        
                        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-semibold font-mono">
                          <span className="flex items-center gap-1">
                            <ListMusic className="w-3 h-3 text-indigo-500" />
                            {setlistCount} Canciones
                          </span>
                          {hasFeedback && (
                            <span className="flex items-center gap-0.5 text-emerald-600 font-sans">
                              <Check className="w-3.5 h-3.5" />
                              Con Feedback
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Setlist Planner and Artist Feedback details (8cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedEvent ? (
              <div className="space-y-6">
                {/* Active Setlist Card */}
                <div className="bg-white border border-silver-haze rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="pb-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">{selectedEvent.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Programado para el <span className="font-semibold text-slate-500">{selectedEvent.date}</span> — Capacidad: {selectedEvent.capacity} personas
                    </p>
                  </div>

                  {/* Lineup / Bandas Invitadas */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-xs font-bold text-slate-700">Lineup de Gira / Bandas Invitadas:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedEvent.guestBands && selectedEvent.guestBands.length > 0 ? (
                        selectedEvent.guestBands.map((b, bIdx) => (
                          <span key={bIdx} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                            {b}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Sólo el artista principal</span>
                      )}
                      <button
                        onClick={() => {
                          const bandsInput = prompt('Escriba las bandas invitadas separadas por coma:', selectedEvent.guestBands?.join(', ') || '');
                          if (bandsInput === null) return;
                          const array = bandsInput.split(',').map(s => s.trim()).filter(Boolean);
                          onUpdateEvent(selectedEvent.id, { guestBands: array });
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline ml-2 cursor-pointer"
                      >
                        [Editar Bandas]
                      </button>
                    </div>
                  </div>

                  {/* Tracklist table */}
                  <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Orden del Setlist</span>
                    
                    {!selectedEvent.setlist || selectedEvent.setlist.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <ListMusic className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-slate-400 font-semibold">El setlist de este concierto está vacío.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedEvent.setlist.map((item, index) => (
                          <div
                            key={item.id}
                            className="bg-slate-50 border border-slate-200/70 hover:border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-4 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-400 text-xs w-6 text-center shrink-0">
                                {(index + 1).toString().padStart(2, '0')}
                              </span>
                              
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{item.songTitle}</span>
                                {item.transitionNotes && (
                                  <span className="text-[10px] text-slate-400 italic block mt-0.5">Nota: {item.transitionNotes}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[10px] text-slate-400 shrink-0">{item.duration}</span>
                              <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold font-mono uppercase tracking-wider shrink-0 ${
                                item.tempo === 'Rápido' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                item.tempo === 'Lento' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                                'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {item.tempo || 'Medio'}
                              </span>

                              {/* Ordering & delete actions */}
                              <div className="flex items-center gap-1 shrink-0 border-l border-slate-200 pl-3">
                                <button
                                  onClick={() => handleMoveSetlistItem(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveSetlistItem(index, 'down')}
                                  disabled={index === (selectedEvent.setlist?.length || 0) - 1}
                                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSetlistItem(item.id)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 ml-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add song to setlist form */}
                  <form onSubmit={handleAddSetlistItem} className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        required
                        placeholder="Título de la Canción..."
                        value={newSetSongTitle}
                        onChange={(e) => setNewSetSongTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Ej: 3:30"
                        value={newSetSongDuration}
                        onChange={(e) => setNewSetSongDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono text-center font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={newSetSongTempo}
                        onChange={(e) => setNewSetSongTempo(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                      >
                        <option value="Lento">Lento</option>
                        <option value="Medio">Medio</option>
                        <option value="Rápido">Rápido</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl border border-indigo-600 shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Añadir</span>
                      </button>
                    </div>
                    <div className="sm:col-span-12">
                      <input
                        type="text"
                        placeholder="Nota de Transición (Ej. Solo de piano, transicón directa, cambio de guitarra...)"
                        value={newSetSongTransition}
                        onChange={(e) => setNewSetSongTransition(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 text-[10px] text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                      />
                    </div>
                  </form>
                </div>

                {/* ARTIST SESSION FEEDBACK PANEL ("como se vivio el concierto... que penso el artista") */}
                <div className="bg-white border border-silver-haze rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      Sesión de Feedback y Bitácora del Concierto
                    </h3>
                    
                    {!isFeedbackEditing ? (
                      <button
                        onClick={() => setIsFeedbackEditing(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar Bitácora</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsFeedbackEditing(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  {!isFeedbackEditing ? (
                    // Display mode
                    selectedEvent.feedback ? (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">¿Qué pensó el artista?</span>
                            <p className="text-slate-600 italic">
                              "{selectedEvent.feedback.artistThoughts || 'Sin comentarios registrados del artista.'}"
                            </p>
                          </div>

                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4.5 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">¿Cómo se vivió el show? (Público)</span>
                            <p className="text-slate-600 italic">
                              "{selectedEvent.feedback.crowdReaction || 'Sin comentarios registrados sobre el público.'}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ritmo del Show:</span>
                            <div className="flex ml-1.5">
                              {Array.from({ length: 5 }).map((_, rIdx) => (
                                <Star
                                  key={rIdx}
                                  className={`w-4 h-4 ${
                                    rIdx < (selectedEvent.feedback?.pacingRating || 5)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {selectedEvent.feedback.optimizationNotes && (
                          <div className="bg-amber-50/50 border border-amber-100 text-amber-900 rounded-xl p-4.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                              <Lightbulb className="w-4 h-4" />
                              <span>Sugerencias para Optimizar el Setlist en el Futuro:</span>
                            </div>
                            <p className="text-amber-800 leading-relaxed font-medium">
                              {selectedEvent.feedback.optimizationNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-slate-50/40 rounded-xl border border-slate-100">
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-medium">No se ha registrado feedback post-show para este concierto.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Registra de qué forma se sintió el ritmo de canciones y qué optimizaciones realizar para la próxima fecha.</p>
                        <button
                          onClick={() => setIsFeedbackEditing(true)}
                          className="mt-4 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-100 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer"
                        >
                          Escribir Bitácora Post-Show
                        </button>
                      </div>
                    )
                  ) : (
                    // Edit Form
                    <form onSubmit={handleSaveFeedback} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pensamientos del Artista / Director</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Ej. Me sentí muy cómodo con el sonido, pero la primera canción tardó en levantar..."
                            value={feedbackThoughts}
                            onChange={(e) => setFeedbackThoughts(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reacción de la Audiencia / Vibración del Show</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Ej. El público gritó mucho en los solos acústicos. Excelente vibra a media noche..."
                            value={feedbackReaction}
                            onChange={(e) => setFeedbackReaction(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Calificación del Flujo / Ritmo de Canciones (1-5)</label>
                          <div className="flex gap-2">
                            {Array.from({ length: 5 }).map((_, rIdx) => (
                              <button
                                key={rIdx}
                                type="button"
                                onClick={() => setFeedbackRating(rIdx + 1)}
                                className="focus:outline-none cursor-pointer"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    rIdx < feedbackRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300 hover:text-amber-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notas de Optimización (Sugerencias de cambios en el orden de canciones)</label>
                          <textarea
                            rows={3}
                            placeholder="Ej. Sugiero mover 'Modular Waves' (tempo Rápido) como segunda o incluso primera canción para enganchar de golpe, y dejar 'Overture to the Cosmos' para el encore."
                            value={feedbackOptimization}
                            onChange={(e) => setFeedbackOptimization(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsFeedbackEditing(false)}
                          className="bg-white hover:bg-slate-100 text-slate-500 font-semibold text-xs px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl border border-indigo-600 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Feedback</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-silver-haze p-12 text-center rounded-2xl">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Por favor cree un show en el Inicio o seleccione un concierto para planificar el setlist.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- RECORDING ALBUM DIALOG MODAL ---------------- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProjectId ? 'Editar Álbum / Grabación' : 'Registrar Nuevo Álbum'}
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título del Disco / Proyecto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Symphony of the Future"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estado del Proyecto</label>
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                >
                  <option value="Planificación">Planificación</option>
                  <option value="Pre-producción">Pre-producción</option>
                  <option value="Grabando">Grabando</option>
                  <option value="Mezcla">Mezcla</option>
                  <option value="Masterización">Masterización</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estudio de Grabación</label>
                <input
                  type="text"
                  placeholder="Ej. Estudios Sony CDMX"
                  value={projStudio}
                  onChange={(e) => setProjStudio(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Productor Principal</label>
                <input
                  type="text"
                  placeholder="Ej. Vladimir Belmont"
                  value={projProducer}
                  onChange={(e) => setProjProducer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fecha Estimada de Lanzamiento</label>
                <input
                  type="date"
                  value={projReleaseDate}
                  onChange={(e) => setProjReleaseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="bg-white hover:bg-slate-100 text-slate-500 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Guardar Álbum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- RECORDING SONG DIALOG MODAL ---------------- */}
      {isSongModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingSongId ? 'Editar Canción de Grabación' : 'Añadir Canción de Grabación'}
              </h3>
              <button
                onClick={() => setIsSongModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre de la Canción</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Modular Waves"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duración (Ej: 3:50)</label>
                  <input
                    type="text"
                    placeholder="3:50"
                    value={songDuration}
                    onChange={(e) => setSongDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono text-center font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Compositor / Autor</label>
                  <input
                    type="text"
                    placeholder="Vladimir Belmont"
                    value={songComposer}
                    onChange={(e) => setSongComposer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Estado de la Pista</label>
                <select
                  value={songStatus}
                  onChange={(e) => setSongStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                >
                  <option value="Composición">Composición</option>
                  <option value="Demo">Demo</option>
                  <option value="Grabación de Instrumentos">Grabación de Instrumentos</option>
                  <option value="Grabación de Voces">Grabación de Voces</option>
                  <option value="Mezcla">Mezcla</option>
                  <option value="Masterizado">Masterizado</option>
                  <option value="Listo">Listo</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progreso de la Canción</label>
                  <span className="text-xs font-bold font-mono text-indigo-600">{songProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={songProgress}
                  onChange={(e) => setSongProgress(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notas de Grabación / Ajustes</label>
                <textarea
                  rows={2}
                  placeholder="Ej. Falta grabar la guitarra acústica la próxima semana..."
                  value={songNotes}
                  onChange={(e) => setSongNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSongModalOpen(false)}
                  className="bg-white hover:bg-slate-100 text-slate-500 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Guardar Canción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
