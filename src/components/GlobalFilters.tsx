import React from 'react';
import { Filter, RotateCcw, Calendar, User, MapPin, Tag } from 'lucide-react';
import { FilterState, Artist, Venue, Tour } from '../types';

interface GlobalFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  artists: Artist[];
  venues: Venue[];
  tours: Tour[];
  onReset: () => void;
}

export default function GlobalFilters({
  filters,
  setFilters,
  artists,
  venues,
  tours,
  onReset,
}: GlobalFiltersProps) {
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];
  const statuses = [
    { value: 'Draft', label: 'Borrador' },
    { value: 'Confirmed', label: 'Confirmado' },
    { value: 'Completed', label: 'Completado' },
    { value: 'Cancelled', label: 'Cancelado' },
  ];

  // Dynamically extract unique cities and states from active venues
  const cities = Array.from(new Set(venues.map((v) => v.city))).filter(Boolean);
  const states = Array.from(new Set(venues.map((v) => v.state))).filter(Boolean);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Clear month or ranges if needed or keep standard
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 font-sans mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtros Globales de Control</h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. ARTISTA PRINCIPAL (FIRST) */}
        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Artista Principal</label>
          <select
            value={filters.artistId}
            onChange={(e) => handleFilterChange('artistId', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          >
            <option value="">Todos</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.artisticName}</option>
            ))}
          </select>
        </div>

        {/* 2. DATE RANGE START */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Inicio</label>
          <input
            type="date"
            value={filters.dateRangeStart}
            onChange={(e) => handleFilterChange('dateRangeStart', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
        </div>

        {/* 3. DATE RANGE END */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha Fin</label>
          <input
            type="date"
            value={filters.dateRangeEnd}
            onChange={(e) => handleFilterChange('dateRangeEnd', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
        </div>

        {/* 4. MONTH */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mes</label>
          <select
            value={filters.month}
            onChange={(e) => handleFilterChange('month', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          >
            <option value="">Todos</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* 5. TOUR */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tour</label>
          <select
            value={filters.tourId}
            onChange={(e) => handleFilterChange('tourId', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          >
            <option value="">Todos</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* 6. CIUDAD */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ciudad</label>
          <select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          >
            <option value="">Todas</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* 7. ESTADO */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado</label>
          <select
            value={filters.state}
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          >
            <option value="">Todos</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 8. STATUS */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estatus Evento</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          >
            <option value="">Todos</option>
            {statuses.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
