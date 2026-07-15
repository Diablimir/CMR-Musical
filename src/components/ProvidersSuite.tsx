import React, { useState } from 'react';
import {
  Truck, Star, Phone, Mail, Plus, Trash2, Edit2, Search,
  Building2, Tag, DollarSign, Wrench, Check, User, FileText, X
} from 'lucide-react';
import { Provider, Venue } from '../types';

interface ProvidersSuiteProps {
  providers: Provider[];
  venues: Venue[];
  onAddProvider: (provider: Provider) => void;
  onUpdateProvider: (updated: Provider) => void;
  onDeleteProvider: (id: string) => void;
}

export default function ProvidersSuite({
  providers,
  venues,
  onAddProvider,
  onUpdateProvider,
  onDeleteProvider,
}: ProvidersSuiteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal / Form state for Adding/Editing Provider
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Provider['category']>('Sonido');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [costPerShow, setCostPerShow] = useState(10000);
  const [notes, setNotes] = useState('');
  const [associatedVenueIds, setAssociatedVenueIds] = useState<string[]>([]);

  const categories: Provider['category'][] = [
    'Sonido', 'Ingeniero de Audio', 'Iluminación', 'Catering',
    'Backline', 'Escenografía', 'Seguridad', 'Personal de Apoyo', 'Otros'
  ];

  const handleOpenAdd = () => {
    setName('');
    setCategory('Sonido');
    setContactName('');
    setPhone('');
    setEmail('');
    setRating(5);
    setCostPerShow(10000);
    setNotes('');
    setAssociatedVenueIds([]);
    setEditingProviderId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prov: Provider) => {
    setName(prov.name);
    setCategory(prov.category);
    setContactName(prov.contactName);
    setPhone(prov.phone);
    setEmail(prov.email);
    setRating(prov.rating);
    setCostPerShow(prov.costPerShow);
    setNotes(prov.notes || '');
    setAssociatedVenueIds(prov.venueIds || []);
    setEditingProviderId(prov.id);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactName.trim()) return;

    if (editingProviderId) {
      const updated: Provider = {
        id: editingProviderId,
        name,
        category,
        contactName,
        phone,
        email,
        rating,
        costPerShow,
        notes,
        venueIds: associatedVenueIds,
        created_at: new Date().toISOString(),
      };
      onUpdateProvider(updated);
    } else {
      const newProvider: Provider = {
        id: `prov-${Date.now()}`,
        name,
        category,
        contactName,
        phone,
        email,
        rating,
        costPerShow,
        notes,
        venueIds: associatedVenueIds,
        created_at: new Date().toISOString(),
      };
      onAddProvider(newProvider);
    }
    setIsFormOpen(false);
  };

  const handleToggleVenueAssociation = (venueId: string) => {
    setAssociatedVenueIds((prev) =>
      prev.includes(venueId)
        ? prev.filter((id) => id !== venueId)
        : [...prev, venueId]
    );
  };

  // Filtered list
  const filteredProviders = providers.filter((prov) => {
    const matchesSearch =
      prov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prov.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prov.notes && prov.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || prov.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white border border-silver-haze rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-cosmic-black tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Directorio de Proveedores y Staff Técnico
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestiona ingenieros de audio, servicios de sonido (PA), iluminación y proveedores contratados en los recintos.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Proveedor</span>
        </button>
      </div>

      {/* Filters and List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Panel */}
        <div className="bg-white border border-silver-haze p-5 rounded-2xl shadow-sm h-fit space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Filtrar Categoría</h3>
            <div className="mt-3 flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                  selectedCategory === 'All'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span>Todos los Proveedores</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md font-mono">{providers.length}</span>
              </button>
              {categories.map((cat) => {
                const count = providers.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md font-mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Directory Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search box */}
          <div className="bg-white border border-silver-haze p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por nombre de proveedor, contacto o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>

          {/* Directory list */}
          {filteredProviders.length === 0 ? (
            <div className="bg-white border border-silver-haze p-12 text-center rounded-2xl">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No se encontraron proveedores que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProviders.map((prov) => {
                const associatedVenues = venues.filter((v) => prov.venueIds?.includes(v.id));
                return (
                  <div
                    key={prov.id}
                    className="bg-white border border-silver-haze rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100/60 px-2 py-0.5 rounded-md font-mono">
                            {prov.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 mt-2">{prov.name}</h3>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {prov.rating}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prov.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`tel:${prov.phone}`} className="hover:underline hover:text-indigo-600">
                            {prov.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`mailto:${prov.email}`} className="hover:underline hover:text-indigo-600 truncate max-w-[200px]">
                            {prov.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-mono text-slate-700 font-semibold">
                            ${prov.costPerShow.toLocaleString('es-MX')} <span className="text-[10px] text-slate-400 font-normal">por show</span>
                          </span>
                        </div>
                      </div>

                      {prov.notes && (
                        <div className="mt-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[11px] text-slate-500 italic">
                          "{prov.notes}"
                        </div>
                      )}

                      {/* Associated Venues tags */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Recintos Vinculados ({associatedVenues.length})
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {associatedVenues.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Sin vincular a venues</span>
                          ) : (
                            associatedVenues.map((v) => (
                              <span
                                key={v.id}
                                className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/50 font-medium font-sans"
                              >
                                {v.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(prov)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-all cursor-pointer"
                        title="Editar Proveedor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Está seguro de que desea eliminar al proveedor "${prov.name}" del CRM?`)) {
                            onDeleteProvider(prov.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer"
                        title="Eliminar Proveedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProviderId ? 'Editar Proveedor Técnico' : 'Registrar Nuevo Proveedor'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sonido Crew CDMX"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Provider['category'])}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Costo Base por Show ($ MXN)</label>
                  <input
                    type="number"
                    value={costPerShow}
                    onChange={(e) => setCostPerShow(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contacto Principal</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Miguel Juárez"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej. 55 4321 0987"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email de Contacto</label>
                  <input
                    type="email"
                    placeholder="Ej. miguel@sonidocrew.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Valoración / Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-mono font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notas y Especificaciones Técnicas</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Incluye monitores, microfonía Shure y soporte de sala..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Vincular a Recintos (Venues)</label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1.5">
                    {venues.map((v) => {
                      const isLinked = associatedVenueIds.includes(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer hover:text-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={() => handleToggleVenueAssociation(v.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span>{v.name} <span className="text-[10px] text-slate-400 font-normal">({v.city}, {v.state})</span></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-white hover:bg-slate-100 text-slate-500 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-indigo-600 shadow-sm transition-all cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
