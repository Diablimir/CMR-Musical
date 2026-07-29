import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Info, Users, Calendar, BarChart3, MessageSquare, DollarSign,
  FileText, History, MapPin, Star, Phone, Globe, Clock, Award,
  Plus, Check, Trash2, HeartHandshake, Zap, ShieldAlert, FileCode,
  Wrench, Flame
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import LeafletMap from './LeafletMap';
import { Venue, Contact, Event, Artist, Provider } from '../types';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim().length > 10;

interface VenueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
  onDeleteVenue: (venueId: string) => void;
  onUpdateVenue: (updated: Venue) => void;
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  events: Event[];
  artists: Artist[];
  providers?: Provider[];
  onUpdateProvider?: (updated: Provider) => void;
  initialTab?: 'info' | 'contacts' | 'events' | 'modalities' | 'followup' | 'finances' | 'docs' | 'history' | 'map' | 'providers' | 'local-bands';
}

export default function VenueDrawer({
  isOpen,
  onClose,
  venue,
  onDeleteVenue,
  onUpdateVenue,
  contacts,
  onAddContact,
  onDeleteContact,
  events,
  artists,
  providers = [],
  onUpdateProvider,
  initialTab = 'info',
}: VenueDrawerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'events' | 'modalities' | 'followup' | 'finances' | 'docs' | 'history' | 'map' | 'providers' | 'local-bands'>('info');
  const [isEditing, setIsEditing] = useState(false);

  // Form states for Venue editing
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editRatingsCount, setEditRatingsCount] = useState(0);
  const [editPlaceId, setEditPlaceId] = useState('');
  const [editEstType, setEditEstType] = useState('');
  
  // Custom socials
  const [editInsta, setEditInsta] = useState('');
  const [editFB, setEditFB] = useState('');
  const [editTikTok, setEditTikTok] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWA, setEditWA] = useState('');

  // New contact form state
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Booking & Contratación');

  // New followup logs state
  const [followupLogs, setFollowupLogs] = useState<{ id: string, date: string, type: string, comment: string, author: string }[]>([
    { id: 'f-1', date: '2026-06-15 11:30', type: 'Llamada', comment: 'Confirmada la facturación del show del 12 de marzo. Todo pagado a tiempo.', author: 'Andrés Mendoza' },
    { id: 'f-2', date: '2026-07-01 15:45', type: 'Email', comment: 'Enviado Rider Técnico actualizado para la fecha de septiembre.', author: 'Sofia Cárdenas' },
    { id: 'f-3', date: '2026-07-10 09:12', type: 'Reunión', comment: 'Negociando la tasa de bar (split de bebidas). Ofrecen 15% de barras extras para el artista.', author: 'Clara Domínguez' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [newCommentType, setNewCommentType] = useState('Llamada');

  // Mock document checklist
  const [docsList, setDocsList] = useState<{ id: string, name: string, date: string, status: 'signed' | 'pending' | 'draft', size: string }[]>([
    { id: 'd-1', name: 'Contrato de Presentación Artística.pdf', date: '2026-03-02', status: 'signed', size: '1.4 MB' },
    { id: 'd-2', name: 'Rider Técnico & Contra-Rider v4.pdf', date: '2026-04-10', status: 'signed', size: '3.8 MB' },
    { id: 'd-3', name: 'Rider de Hospitalidad & Catering.pdf', date: '2026-04-12', status: 'signed', size: '650 KB' },
    { id: 'd-4', name: 'Póliza de Seguro de Responsabilidad Civil.pdf', date: '2026-05-01', status: 'signed', size: '2.1 MB' },
    { id: 'd-5', name: 'Comprobante de Depósito Garantía (Anticipo 50%).pdf', date: '2026-05-02', status: 'signed', size: '820 KB' },
  ]);

  React.useEffect(() => {
    if (venue) {
      setEditName(venue.name);
      setEditAddress(venue.address);
      setEditCity(venue.city);
      setEditState(venue.state);
      setEditWebsite(venue.website);
      setEditPhone(venue.phone);
      setEditRating(venue.rating);
      setEditRatingsCount(venue.userRatingsCount);
      setEditPlaceId(venue.placeId);
      setEditEstType(venue.establishmentType);
      setEditInsta(venue.instagram || '');
      setEditFB(venue.facebook || '');
      setEditTikTok(venue.tiktok || '');
      setEditEmail(venue.email || '');
      setEditWA(venue.whatsapp || '');
      setIsEditing(false);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [venue, initialTab]);

  if (!venue) return null;

  // Filter contacts associated with this venue
  const venueContacts = contacts.filter((c) => c.venueId === venue.id);

  // Filter events associated with this venue
  const venueEvents = events.filter((e) => e.venueId === venue.id);

  // Calculations for Score
  const calculateScore = (v: Venue) => {
    return Math.round(
      (v.scoreRentabilidad * 0.25) +
      (v.scoreResponseTime * 0.15) +
      (v.scorePuntualidadPago * 0.20) +
      (v.scoreNegociacion * 0.15) +
      (v.scoreProduccion * 0.15) +
      (v.scoreHospitalidad * 0.10)
    );
  };

  const globalScore = calculateScore(venue);

  // Financial statistics
  const totalIncome = venueEvents.reduce((acc, curr) => acc + (curr.status === 'Completed' || curr.status === 'Confirmed' ? curr.totalIncome : 0), 0);
  const totalExpenses = venueEvents.reduce((acc, curr) => acc + (curr.status === 'Completed' || curr.status === 'Confirmed' ? curr.expenses : 0), 0);
  const totalProfit = totalIncome - totalExpenses;
  const roi = totalExpenses > 0 ? ((totalProfit / totalExpenses) * 100).toFixed(1) : '0.0';

  const handleSaveInfo = () => {
    const updated: Venue = {
      ...venue,
      name: editName,
      address: editAddress,
      city: editCity,
      state: editState,
      website: editWebsite,
      phone: editPhone,
      rating: Number(editRating) || 0,
      userRatingsCount: Number(editRatingsCount) || 0,
      placeId: editPlaceId,
      establishmentType: editEstType,
      instagram: editInsta,
      facebook: editFB,
      tiktok: editTikTok,
      email: editEmail,
      whatsapp: editWA,
      updated_at: new Date().toISOString(),
    };
    onUpdateVenue(updated);
    setIsEditing(false);
  };

  const handleScoreChange = (metric: keyof Venue, val: number) => {
    const updated = {
      ...venue,
      [metric]: val,
      updated_at: new Date().toISOString(),
    };
    onUpdateVenue(updated);
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactEmail.trim()) return;
    onAddContact({
      name: newContactName,
      email: newContactEmail,
      phone: newContactPhone,
      role: newContactRole,
      venueId: venue.id,
    });
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const newLog = {
      id: `f-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: newCommentType,
      comment: newComment,
      author: 'Principal Administrator',
    };
    setFollowupLogs([newLog, ...followupLogs]);
    setNewComment('');
  };

  const handleSetPrincipalContact = (contactId: string) => {
    const updated = {
      ...venue,
      contactoPrincipalId: contactId,
      updated_at: new Date().toISOString(),
    };
    onUpdateVenue(updated);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="fixed top-0 right-0 h-full w-full md:w-[75vw] lg:w-[70vw] max-w-[1000px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col font-sans text-slate-600 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-celestial-canvas/10 text-celestial-canvas rounded-xl flex items-center justify-center font-mono font-bold text-lg border border-celestial-canvas/15">
                  {venue.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">{venue.name}</h2>
                    <span className="flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 font-semibold font-mono">
                      <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                      {venue.rating} ({venue.userRatingsCount})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {venue.city}, {venue.state} — {venue.establishmentType}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onDeleteVenue(venue.id);
                    onClose();
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 border border-transparent cursor-pointer"
                  title="Eliminar Recinto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score Bar Section */}
            <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold tracking-wider">ESTADO DE INTEGRIDAD:</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-mono border border-emerald-100 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Activo (InnoDB Index OK)
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-mono border border-slate-200 font-semibold">
                  ID: Binary(16)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold font-sans uppercase tracking-wider text-[10px]">Flamo Score:</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('modalities')}
                  title="Haz clic para definir o editar el Flamo Score"
                  className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-xl text-amber-600 font-mono text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{globalScore} / 100</span>
                  <span className="text-[10px] font-sans font-bold underline ml-1">Definir</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 border-b border-slate-100 bg-white shrink-0 overflow-x-auto flex gap-6 scrollbar-none">
              {[
                { id: 'info', label: 'Información', icon: Info },
                { id: 'contacts', label: 'Contactos', icon: Users },
                { id: 'providers', label: 'Proveedores Técnicos', icon: Wrench },
                { id: 'local-bands', label: 'Bandas Recomendadas', icon: Flame },
                { id: 'events', label: 'Eventos', icon: Calendar },
                { id: 'modalities', label: 'Modalidades (Scores)', icon: Star },
                { id: 'followup', label: 'Seguimiento', icon: MessageSquare },
                { id: 'finances', label: 'Finanzas', icon: DollarSign },
                { id: 'docs', label: 'Documentos', icon: FileText },
                { id: 'history', label: 'Historial', icon: History },
                { id: 'map', label: 'Mapa GPS', icon: MapPin },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3.5 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap focus:outline-none cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-celestial-canvas text-celestial-canvas font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {/* TAB 1: INFO */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-800">Ficha Técnica del Recinto</h3>
                    <button
                      onClick={() => {
                        if (isEditing) handleSaveInfo();
                        else setIsEditing(true);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs border border-slate-200 font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {isEditing ? 'Guardar Cambios' : 'Editar Información'}
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Nombre de Recinto</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Tipo de Establecimiento</label>
                        <input
                          type="text"
                          value={editEstType}
                          onChange={(e) => setEditEstType(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[11px] text-zinc-500 font-medium">Dirección Completa</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Ciudad</label>
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Estado</label>
                        <input
                          type="text"
                          value={editState}
                          onChange={(e) => setEditState(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Website</label>
                        <input
                          type="text"
                          value={editWebsite}
                          onChange={(e) => setEditWebsite(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Teléfono / Conmutador</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Maps Rating</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editRating}
                          onChange={(e) => setEditRating(Number(e.target.value))}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-zinc-500 font-medium">Cantidad de Reseñas</label>
                        <input
                          type="number"
                          value={editRatingsCount}
                          onChange={(e) => setEditRatingsCount(Number(e.target.value))}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200"
                        />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[11px] text-zinc-500 font-medium">Google Place ID (API Reference)</label>
                        <input
                          type="text"
                          value={editPlaceId}
                          onChange={(e) => setEditPlaceId(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 font-mono rounded-lg px-3 py-2 text-xs text-amber-400"
                        />
                      </div>

                      <div className="md:col-span-2 mt-2">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Redes Sociales & Canales</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            placeholder="Instagram URL"
                            value={editInsta}
                            onChange={(e) => setEditInsta(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                          <input
                            placeholder="Facebook URL"
                            value={editFB}
                            onChange={(e) => setEditFB(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                          <input
                            placeholder="TikTok URL"
                            value={editTikTok}
                            onChange={(e) => setEditTikTok(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                          <input
                            placeholder="Email General"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                          <input
                            placeholder="WhatsApp Directo"
                            value={editWA}
                            onChange={(e) => setEditWA(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Dirección</span>
                            <span className="text-xs text-zinc-200 font-medium">{venue.address}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Ciudad / Región</span>
                              <span className="text-xs text-zinc-200 font-medium">{venue.city}, {venue.state}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Código Postal</span>
                              <span className="text-xs text-zinc-200 font-mono font-medium">{venue.postalCode || 'N/D'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4 flex items-start gap-3">
                            <Phone className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Contacto Telefónico</span>
                              <span className="text-xs text-zinc-200 font-medium">{venue.phone}</span>
                            </div>
                          </div>

                          <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4 flex items-start gap-3">
                            <Globe className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Sitio Web Oficial</span>
                              <a href={venue.website} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                                Visitar Portal
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Redes Sociales Section */}
                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Redes del Recinto</h4>
                          <div className="flex flex-wrap gap-2">
                            {venue.instagram && (
                              <a href={venue.instagram} target="_blank" rel="noreferrer" className="bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors">
                                <span>Instagram</span>
                              </a>
                            )}
                            {venue.facebook && (
                              <a href={venue.facebook} target="_blank" rel="noreferrer" className="bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors">
                                <span>Facebook</span>
                              </a>
                            )}
                            {venue.whatsapp && (
                              <a href={`https://wa.me/${venue.whatsapp}`} target="_blank" rel="noreferrer" className="bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors">
                                <span>WhatsApp</span>
                              </a>
                            )}
                            {venue.email && (
                              <a href={`mailto:${venue.email}`} className="bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors">
                                <span>Email Directo</span>
                              </a>
                            )}
                            {!venue.instagram && !venue.facebook && !venue.whatsapp && !venue.email && (
                              <span className="text-xs text-zinc-500">No se han registrado redes sociales para este foro.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4">
                          <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Horarios Populares</span>
                          </div>
                          <ul className="space-y-1.5">
                            {(venue.hours && venue.hours.length > 0 ? venue.hours : [
                              'Lunes a Viernes: 11:00 - 19:00',
                              'Sábados de Show: 14:00 - 23:00'
                            ]).map((h, i) => (
                              <li key={i} className="text-xs text-zinc-300 border-b border-zinc-800/40 pb-1.5 last:border-b-0 last:pb-0 font-sans">
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4">
                          <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold">Place ID de Google</span>
                          </div>
                          <code className="text-[10px] text-amber-500 bg-zinc-950 p-2 rounded block border border-zinc-800/60 font-mono break-all leading-tight">
                            {venue.placeId}
                          </code>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FLAMO SCORE DEFINITION SECTION IN TAB 1 */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span>Definición Manual de Flamo Score</span>
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Tú defines el porcentaje de cada criterio comercial en base a tu experiencia con {venue.name}.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-zinc-300 font-mono">Global: <strong className="text-amber-400 font-bold">{globalScore}%</strong></span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('modalities')}
                          className="text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver Desglose Completo</span>
                          <Star className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'scoreRentabilidad', label: 'Rentabilidad (25%)', color: 'bg-amber-500' },
                        { key: 'scoreResponseTime', label: 'Respuesta (15%)', color: 'bg-emerald-500' },
                        { key: 'scorePuntualidadPago', label: 'Puntualidad (20%)', color: 'bg-amber-500' },
                        { key: 'scoreNegociacion', label: 'Negociación (15%)', color: 'bg-indigo-500' },
                        { key: 'scoreProduccion', label: 'Producción (15%)', color: 'bg-rose-500' },
                        { key: 'scoreHospitalidad', label: 'Hospitalidad (10%)', color: 'bg-purple-500' },
                      ].map((item) => {
                        const scoreVal = (venue[item.key as keyof Venue] as number) || 0;
                        return (
                          <div key={item.key} className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-center gap-1">
                              <span className="text-[11px] font-semibold text-zinc-200">{item.label}</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scoreVal}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    handleScoreChange(item.key as keyof Venue, val);
                                  }}
                                  className="w-12 bg-zinc-950 border border-zinc-700 text-amber-400 font-mono font-bold text-xs text-center rounded px-1 py-0.5 focus:outline-none focus:border-amber-500"
                                />
                                <span className="text-[10px] text-zinc-400 font-mono">%</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={scoreVal}
                              onChange={(e) => handleScoreChange(item.key as keyof Venue, Number(e.target.value))}
                              className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PROVIDERS */}
              {activeTab === 'providers' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Proveedores Técnicos Vinculados</h3>
                      <p className="text-xs text-slate-400 mt-1">Ingenieros, sonido local, PA crews o iluminadores preferenciales de este recinto.</p>
                    </div>
                  </div>

                  {/* List of associated providers */}
                  {(() => {
                    const linked = providers.filter(p => p.venueIds?.includes(venue.id));
                    const unlinked = providers.filter(p => !p.venueIds?.includes(venue.id));

                    return (
                      <div className="space-y-6">
                        {linked.length === 0 ? (
                          <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white">
                            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-semibold">No hay proveedores vinculados a este recinto</p>
                            <p className="text-[10px] text-slate-400 mt-1">Usa la sección de abajo para vincular un proveedor técnico existente.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {linked.map(p => (
                              <div key={p.id} className="bg-white border border-silver-haze p-4 rounded-xl shadow-xs flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase font-mono">
                                        {p.category}
                                      </span>
                                      <h4 className="text-xs font-bold text-slate-800 mt-2">{p.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-0.5 bg-amber-50 text-amber-600 border border-amber-100 px-1 rounded text-[9px] font-bold font-mono">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                      {p.rating}
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-500 font-medium">
                                    <div>Contacto: <span className="font-semibold text-slate-700">{p.contactName}</span></div>
                                    <div>Teléfono: <span className="font-semibold text-slate-700">{p.phone}</span></div>
                                    <div>Email: <span className="font-semibold text-slate-700 truncate block max-w-[200px]">{p.email}</span></div>
                                    <div>Costo por show: <span className="font-bold text-slate-800 font-mono">${p.costPerShow.toLocaleString('es-MX')}</span></div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
                                  <button
                                    onClick={() => {
                                      if (onUpdateProvider) {
                                        onUpdateProvider({
                                          ...p,
                                          venueIds: p.venueIds.filter(vId => vId !== venue.id)
                                        });
                                      }
                                    }}
                                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                  >
                                    Desvincular Recinto
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Assign Existing Section */}
                        <div className="bg-white border border-slate-200/60 rounded-xl p-5 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-indigo-500" />
                            <span>Vincular un Proveedor del CRM</span>
                          </h4>
                          
                          {unlinked.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">Todos los proveedores del CRM ya están vinculados a este recinto.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {unlinked.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    if (onUpdateProvider) {
                                      onUpdateProvider({
                                        ...p,
                                        venueIds: [...(p.venueIds || []), venue.id]
                                      });
                                    }
                                  }}
                                  className="text-[10px] bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>{p.name}</span>
                                  <span className="text-[9px] text-slate-400 font-normal">({p.category})</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB: LOCAL BANDS */}
              {activeTab === 'local-bands' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Bandas de Soporte Recomendadas</h3>
                      <p className="text-xs text-slate-400 mt-1">Agrupaciones locales recomendadas en la plaza para complementar lineups.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* List of current local bands */}
                    {!venue.localBands || venue.localBands.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white">
                        <Flame className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-semibold">No se han registrado bandas soporte en este recinto</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {venue.localBands.map((band, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-silver-haze rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <span className="text-xs font-bold text-slate-700">{band}</span>
                            <button
                              onClick={() => {
                                const list = venue.localBands?.filter((_, i) => i !== idx) || [];
                                onUpdateVenue({
                                  ...venue,
                                  localBands: list
                                });
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Remover banda"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add local band form */}
                    <div className="bg-white border border-slate-200/60 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-slate-700 mb-3">Registrar Nueva Banda Sugerida</h4>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = (e.currentTarget.elements.namedItem('bandName') as HTMLInputElement);
                          const val = input.value.trim();
                          if (!val) return;
                          
                          const list = venue.localBands || [];
                          if (list.includes(val)) {
                            alert('Esta banda ya se encuentra registrada para este recinto.');
                            return;
                          }

                          onUpdateVenue({
                            ...venue,
                            localBands: [...list, val]
                          });
                          input.value = '';
                        }}
                        className="flex gap-2 max-w-md"
                      >
                        <input
                          name="bandName"
                          required
                          type="text"
                          placeholder="Nombre de la Banda (Ej. Los Amigos Invisibles)"
                          className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                        >
                          Añadir Banda
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">Contactos del Recinto</h3>
                      <p className="text-[11px] text-zinc-500">Un solo contacto principal asignado como relación directa en la tabla venues.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Contacts list */}
                    <div className="lg:col-span-2 space-y-3">
                      {venueContacts.length === 0 ? (
                        <div className="border border-zinc-800/60 rounded-xl p-8 text-center bg-zinc-900/20">
                          <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs text-zinc-400">No hay contactos registrados para este recinto.</p>
                        </div>
                      ) : (
                        venueContacts.map((contact) => {
                          const isPrincipal = venue.contactoPrincipalId === contact.id;
                          return (
                            <div
                              key={contact.id}
                              className={`p-4 rounded-lg border transition-all flex items-center justify-between ${
                                isPrincipal
                                  ? 'bg-amber-500/5 border-amber-500/30'
                                  : 'bg-zinc-900/30 border-zinc-900 hover:border-zinc-800'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-zinc-100">{contact.name}</span>
                                  {isPrincipal && (
                                    <span className="text-[9px] uppercase tracking-wider bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">
                                      Contacto Principal
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 font-medium">{contact.role}</p>
                                <div className="flex items-center gap-4 text-[10px] text-zinc-500 pt-1">
                                  <span>{contact.email}</span>
                                  <span>•</span>
                                  <span>{contact.phone}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {!isPrincipal && (
                                  <button
                                    onClick={() => handleSetPrincipalContact(contact.id)}
                                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700 font-sans transition-colors"
                                  >
                                    Hacer Principal
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar al contacto "${contact.name}"?`)) {
                                      // If deleted was principal, clear that reference first
                                      if (isPrincipal) {
                                        onUpdateVenue({ ...venue, contactoPrincipalId: undefined });
                                      }
                                      onDeleteContact(contact.id);
                                    }
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                                  title="Eliminar Contacto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Contact Form */}
                    <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 self-start">
                      <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-4 pb-2 border-b border-zinc-800/60">Nuevo Contacto</h4>
                      <form onSubmit={handleAddContactSubmit} className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-zinc-500">Nombre Completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Rodrigo Flores"
                            value={newContactName}
                            onChange={(e) => setNewContactName(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-zinc-500">Correo Electrónico</label>
                          <input
                            type="email"
                            required
                            placeholder="rodrigo@c3stage.com"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-zinc-500">Teléfono / Celular</label>
                          <input
                            type="text"
                            placeholder="33 1234 5678"
                            value={newContactPhone}
                            onChange={(e) => setNewContactPhone(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-zinc-500">Rol o Puesto</label>
                          <select
                            value={newContactRole}
                            onChange={(e) => setNewContactRole(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="Booking & Contratación">Booking & Contratación</option>
                            <option value="Director Técnico / Rider">Director Técnico / Rider</option>
                            <option value="Hospitalidad & Viáticos">Hospitalidad & Viáticos</option>
                            <option value="Administrador General">Administrador General</option>
                            <option value="Seguridad & Logística">Seguridad & Logística</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs py-2 rounded-lg transition-all"
                        >
                          Agregar Contacto
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EVENTS */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">Historial de Eventos & Fechas</h3>
                      <p className="text-[11px] text-zinc-500">Shows gestionados para artistas vinculados a través de llaves foráneas.</p>
                    </div>
                  </div>

                  {venueEvents.length === 0 ? (
                    <div className="border border-zinc-800/60 rounded-xl p-12 text-center bg-zinc-900/20">
                      <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-xs text-zinc-400 font-medium">No se han registrado shows o eventos en este recinto.</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-900/20 rounded-xl border border-zinc-900 overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-zinc-900 bg-zinc-900/40 text-zinc-400 font-medium font-sans">
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Evento</th>
                            <th className="p-3">Artista</th>
                            <th className="p-3">Ocupación / Aforo</th>
                            <th className="p-3">Utilidad Neta</th>
                            <th className="p-3 text-right">Estatus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {venueEvents.map((evt) => {
                            const artist = artists.find((a) => a.id === evt.artistId);
                            const percent = ((evt.attendance / evt.capacity) * 100).toFixed(0);
                            return (
                              <tr key={evt.id} className="hover:bg-zinc-900/40 text-zinc-300">
                                <td className="p-3 font-mono text-[11px]">{evt.date}</td>
                                <td className="p-3 font-semibold text-zinc-200">{evt.name}</td>
                                <td className="p-3">{artist ? artist.artisticName : 'N/D'}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono">{evt.attendance} / {evt.capacity}</span>
                                    <span className={`text-[10px] px-1 rounded ${
                                      Number(percent) >= 90 ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500'
                                    }`}>
                                      ({percent}%)
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono font-medium text-emerald-400">
                                  ${evt.profit.toLocaleString('es-MX')} MXN
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider ${
                                    evt.status === 'Completed' ? 'bg-zinc-800 text-zinc-400' :
                                    evt.status === 'Confirmed' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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

              {/* TAB 4: MODALITIES / SCORES */}
              {activeTab === 'modalities' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-zinc-900">
                    <h3 className="text-sm font-semibold text-zinc-200">Modalidades & Score Comercial</h3>
                    <p className="text-[11px] text-zinc-500">Métricas dinámicas de desempeño recalculadas automáticamente sin procesos redundantes en la DB.</p>
                  </div>

                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/80">
                      <div>
                        <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block flex items-center gap-1.5">
                          <span>✨ Calificación de Desempeño Personalizada</span>
                        </span>
                        <h4 className="text-sm text-zinc-200 font-bold">Algoritmo Comercial Flamo CRM</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Puedes ajustar o ingresar manualmente el porcentaje de cada criterio según tu experiencia comercial con este recinto.</p>
                      </div>
                      <div className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-xl text-center shrink-0">
                        <span className="text-[9px] uppercase tracking-wider block font-semibold text-amber-300">Global Score</span>
                        <span className="text-2xl font-black font-mono">{globalScore} / 100</span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {[
                        { key: 'scoreRentabilidad', label: 'Rentabilidad Comercial (25%)', color: 'bg-amber-500', desc: 'Retorno de inversión del boletaje y viáticos en giras pasadas.' },
                        { key: 'scoreResponseTime', label: 'Tiempo de Respuesta en Negociación (15%)', color: 'bg-emerald-500', desc: 'Velocidad de cotización, envío de fechas disponibles y comunicación.' },
                        { key: 'scorePuntualidadPago', label: 'Puntualidad de Pago de Garantía / Splits (20%)', color: 'bg-amber-500', desc: 'Cumplimiento de plazos de anticipo contratado y liquidación de taquilla.' },
                        { key: 'scoreNegociacion', label: 'Facilidad de Negociación (15%)', color: 'bg-indigo-500', desc: 'Apertura a esquemas mixtos (split, garantía versus porcentaje).' },
                        { key: 'scoreProduccion', label: 'Calidad Técnica & Rider de Producción (15%)', color: 'bg-rose-500', desc: 'Sistemas PA, iluminación y técnicos locales certificados.' },
                        { key: 'scoreHospitalidad', label: 'Hospitalidad, Catering & Experiencia (10%)', color: 'bg-purple-500', desc: 'Trato al artista, camerinos acondicionados e integridad general.' },
                      ].map((item) => {
                        const scoreVal = venue[item.key as keyof Venue] as number || 0;
                        return (
                          <div key={item.key} className="space-y-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex justify-between items-center gap-2">
                              <div>
                                <span className="text-xs font-semibold text-zinc-200 block">{item.label}</span>
                                <p className="text-[10px] text-zinc-400">{item.desc}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={scoreVal}
                                  onChange={(e) => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    handleScoreChange(item.key as keyof Venue, val);
                                  }}
                                  className="w-14 bg-zinc-800 border border-zinc-700 text-amber-400 font-mono font-bold text-xs text-center rounded-lg px-1 py-1 focus:outline-none focus:border-amber-500"
                                />
                                <span className="text-xs font-mono font-bold text-zinc-400">%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pt-1">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={scoreVal}
                                onChange={(e) => handleScoreChange(item.key as keyof Venue, Number(e.target.value))}
                                className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                              />
                              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden shrink-0 border border-zinc-700/50">
                                <div className={`h-full ${item.color} transition-all duration-300`} style={{ width: `${scoreVal}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FOLLOWUP */}
              {activeTab === 'followup' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-zinc-900">
                    <h3 className="text-sm font-semibold text-zinc-200">Seguimiento Comercial (CRM Core)</h3>
                    <p className="text-[11px] text-zinc-500">Bitácora central de interacciones y comentarios comerciales.</p>
                  </div>

                  <form onSubmit={handleAddComment} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 space-y-3">
                    <span className="text-xs font-semibold text-zinc-300">Registrar Nueva Interacción</span>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <textarea
                          rows={2}
                          required
                          placeholder="Escribe un comentario sobre negociaciones, estatus del rider, etc."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <select
                          value={newCommentType}
                          onChange={(e) => setNewCommentType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300"
                        >
                          <option value="Llamada">📞 Llamada</option>
                          <option value="Email">✉️ Correo</option>
                          <option value="Reunión">🤝 Reunión</option>
                          <option value="Rider Técnico">⚙️ Rider Técnico</option>
                        </select>
                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs py-2 rounded-lg transition-all"
                        >
                          Registrar
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="relative border-l-2 border-zinc-800 pl-6 ml-3 space-y-6">
                    {followupLogs.map((log) => (
                      <div key={log.id} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-amber-500 border-4 border-zinc-950" />
                        <div className="bg-zinc-900/10 border border-zinc-900 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
                                {log.type}
                              </span>
                              <span className="text-xs text-zinc-400 font-semibold">{log.author}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">{log.date}</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{log.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: FINANCES */}
              {activeTab === 'finances' && (
                <div className="space-y-6">
                  <div className="pb-2 border-b border-zinc-900">
                    <h3 className="text-sm font-semibold text-zinc-200">Métricas Financieras del Recinto</h3>
                    <p className="text-[11px] text-zinc-500">Consolidado comercial directo extraído de los shows agendados y confirmados.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Ingreso Bruto</span>
                      <span className="text-lg font-bold font-mono text-zinc-200">${totalIncome.toLocaleString('es-MX')}</span>
                      <span className="text-[9px] text-zinc-500 block mt-1">Suma acumulada de taquilla</span>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Gastos / Operación</span>
                      <span className="text-lg font-bold font-mono text-zinc-200">${totalExpenses.toLocaleString('es-MX')}</span>
                      <span className="text-[9px] text-zinc-500 block mt-1">Producción, riders, viáticos</span>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Utilidad Neta</span>
                      <span className={`text-lg font-bold font-mono ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${totalProfit.toLocaleString('es-MX')}
                      </span>
                      <span className="text-[9px] text-zinc-500 block mt-1">Margen neto de retorno</span>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Retorno de Inversión</span>
                      <span className="text-lg font-bold font-mono text-amber-400">{roi}%</span>
                      <span className="text-[9px] text-zinc-500 block mt-1">ROI histórico promedio</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Rendimiento Comparativo por Show</h4>
                    {venueEvents.length === 0 ? (
                      <p className="text-xs text-zinc-500">Sin datos financieros para graficar.</p>
                    ) : (
                      <div className="space-y-3">
                        {venueEvents.map((evt) => {
                          const profitPct = evt.totalIncome > 0 ? ((evt.profit / evt.totalIncome) * 100).toFixed(0) : '0';
                          return (
                            <div key={evt.id} className="text-xs border-b border-zinc-900 pb-3 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-zinc-300">{evt.name}</span>
                                <span className="font-mono text-emerald-400 font-semibold">${evt.profit.toLocaleString('es-MX')}</span>
                              </div>
                              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(0, Number(profitPct))}%` }} />
                                <div className="bg-rose-500 h-full" style={{ width: `${Math.max(0, 100 - Number(profitPct))}%` }} />
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
                                <span>Ingreso: ${evt.totalIncome.toLocaleString()}</span>
                                <span>Gastos: ${evt.expenses.toLocaleString()}</span>
                                <span>ROI: {profitPct}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: DOCS */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">Expediente Digital (Documentos)</h3>
                      <p className="text-[11px] text-zinc-500">Gestión de riders, contratos, seguros y facturación.</p>
                    </div>
                    <button
                      onClick={() => {
                        const name = prompt('Nombre del documento (ej. Rider Tecnico CDMX.pdf):');
                        if (name) {
                          setDocsList([
                            ...docsList,
                            { id: `d-${Date.now()}`, name, date: '2026-07-13', status: 'pending', size: '1.2 MB' }
                          ]);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Subir Archivo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {docsList.map((doc) => (
                      <div key={doc.id} className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-lg flex items-center justify-between text-xs hover:border-zinc-800 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-amber-500/70" />
                          <div>
                            <span className="font-medium text-zinc-200">{doc.name}</span>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-0.5">
                              <span>Subido: {doc.date}</span>
                              <span>•</span>
                              <span>Tamaño: {doc.size}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider font-semibold ${
                            doc.status === 'signed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {doc.status === 'signed' ? 'Firmado / Listo' : 'Pendiente'}
                          </span>
                          <button
                            onClick={() => {
                              if (doc.status === 'signed') {
                                setDocsList(docsList.map(d => d.id === doc.id ? { ...d, status: 'pending' } : d));
                              } else {
                                setDocsList(docsList.map(d => d.id === doc.id ? { ...d, status: 'signed' } : d));
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-colors"
                            title="Cambiar Estado"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-zinc-900">
                    <h3 className="text-sm font-semibold text-zinc-200">Historial de Auditoría (Bitácora)</h3>
                    <p className="text-[11px] text-zinc-500">Sello temporal de creación, modificaciones de esquema y autorías.</p>
                  </div>

                  <div className="bg-zinc-900/10 border border-zinc-900 rounded-xl p-4 font-mono text-[10px] space-y-3 leading-relaxed">
                    <div className="text-zinc-500">
                      [2025-01-01 12:00:00 UTC] <span className="text-zinc-300 font-semibold">SISTEMA:</span> Creación de registro inicial de recinto <span className="text-amber-500">{venue.name}</span>. UUID asignado.
                    </div>
                    <div className="text-zinc-500">
                      [2026-03-12 10:00:00 UTC] <span className="text-zinc-300 font-semibold">EVENTO:</span> Agendado show estelar "Vladimir Belmont Live" con vinculación foránea exitosa.
                    </div>
                    <div className="text-zinc-500">
                      [2026-05-18 23:45:00 UTC] <span className="text-zinc-300 font-semibold">FINANZAS:</span> Auditoría de taquilla completada. Utilidad auditada y consolidada en panel de control.
                    </div>
                    <div className="text-zinc-500">
                      [2026-07-13 11:10:00 UTC] <span className="text-zinc-300 font-semibold">ADMIN_USER:</span> Actualización de métricas de hospitalidad e infraestructura local.
                    </div>
                    <div className="text-emerald-500">
                      [INFO] Tabla venues auditada con Soft Delete activo (deleted_at = NULL). Listado de llaves e índices correctos en base de datos.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: MAP */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-zinc-900 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 font-sans">Ubicación Satelital & Coordenadas</h3>
                      <p className="text-[11px] text-zinc-500 font-medium">Georreferenciación cargada dinámicamente desde el Place ID y coordenadas de Google Maps.</p>
                    </div>
                    {hasValidKey && (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                        API GOOGLE MAPS: ACTIVA
                      </span>
                    )}
                  </div>

                  true ? (
                    <div className="space-y-3">
                      <div className="h-64 w-full rounded-xl border border-zinc-800 overflow-hidden shadow-lg bg-zinc-950 relative">
                        <LeafletMap
                          venues={[{
                            id: venue.id,
                            name: venue.name,
                            lat: Number(venue.lat) || 19.4326,
                            lng: Number(venue.lng) || -99.1332,
                            address: venue.address,
                            city: venue.city,
                            state: venue.state,
                            statusState: 'highlight'
                          }]}
                          selectedVenueId={venue.id}
                          defaultCenter={[Number(venue.lat) || 19.4326, Number(venue.lng) || -99.1332]}
                          defaultZoom={15}
                          singleVenueHighlight={true}
                        />
                      </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-xl flex items-center justify-between text-[11px] text-zinc-400">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Dirección Georreferenciada</span>
                        <span className="font-bold text-zinc-200">{venue.address}</span>
                        <span className="block text-zinc-400">{venue.city}, {venue.state}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800 font-bold text-amber-400 block">
                          LAT: {Number(venue.lat).toFixed(5)} / LNG: {Number(venue.lng).toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps/place/?q=place_id:${venue.placeId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline mt-1.5 inline-block font-bold"
                        >
                          Abrir en Google Maps ↗
                        </a>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
