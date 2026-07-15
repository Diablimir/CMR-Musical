import React from 'react';
import { Event, Artist, Venue } from '../types';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles, Building, Music } from 'lucide-react';

interface FinancialSuiteProps {
  events: Event[];
  artists: Artist[];
  venues: Venue[];
}

export default function FinancialSuite({
  events,
  artists,
  venues,
}: FinancialSuiteProps) {
  // Filter only Completed or Confirmed events for financial forecasting
  const activeEvents = events.filter((e) => e.status === 'Completed' || e.status === 'Confirmed');

  // Global calculations
  const totalIncome = activeEvents.reduce((acc, curr) => acc + curr.totalIncome, 0);
  const totalExpenses = activeEvents.reduce((acc, curr) => acc + curr.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;
  
  const globalROI = totalExpenses > 0 ? ((totalProfit / totalExpenses) * 100).toFixed(1) : '0.0';
  const globalMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : '0.0';

  // Rentabilidad (Average occupancy)
  const totalCapacity = activeEvents.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalAttendance = activeEvents.reduce((acc, curr) => acc + curr.attendance, 0);
  const globalRentabilidad = totalCapacity > 0 ? ((totalAttendance / totalCapacity) * 100).toFixed(1) : '0.0';

  // Averages per Artist
  const artistFinances = artists.map((art) => {
    const artEvts = activeEvents.filter((e) => e.artistId === art.id);
    const inc = artEvts.reduce((acc, curr) => acc + curr.totalIncome, 0);
    const exp = artEvts.reduce((acc, curr) => acc + curr.expenses, 0);
    const prof = inc - exp;
    const count = artEvts.length;
    const avgProf = count > 0 ? Math.round(prof / count) : 0;
    return {
      artistName: art.artisticName,
      income: inc,
      expenses: exp,
      profit: prof,
      count,
      avgProfit: avgProf,
    };
  }).sort((a, b) => b.profit - a.profit);

  // Averages per Venue
  const venueFinances = venues.map((ven) => {
    const venEvts = activeEvents.filter((e) => e.venueId === ven.id);
    const inc = venEvts.reduce((acc, curr) => acc + curr.totalIncome, 0);
    const exp = venEvts.reduce((acc, curr) => acc + curr.expenses, 0);
    const prof = inc - exp;
    const count = venEvts.length;
    const avgProf = count > 0 ? Math.round(prof / count) : 0;
    return {
      venueName: ven.name,
      city: ven.city,
      income: inc,
      expenses: exp,
      profit: prof,
      count,
      avgProfit: avgProf,
    };
  }).sort((a, b) => b.profit - a.profit);

  // SVG Bar Chart helper
  const maxProfit = Math.max(...artistFinances.map(a => a.profit), 100000);

  return (
    <div className="space-y-6 font-sans">
      {/* Global Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ingresos Totales (SaaS)</span>
            <span className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold font-mono text-slate-800">${totalIncome.toLocaleString('es-MX')}</span>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>100% de taquilla</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gastos Consolidados</span>
            <span className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold font-mono text-slate-800">${totalExpenses.toLocaleString('es-MX')}</span>
            <p className="text-[10px] text-slate-400 block mt-1 font-semibold">Viáticos, Riders, Honorarios</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Utilidad Operativa</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold font-mono text-emerald-600">${totalProfit.toLocaleString('es-MX')}</span>
            <p className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{globalMargin}% Margen neto</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Retorno Inversión (ROI)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold font-mono text-indigo-600">{globalROI}%</span>
            <p className="text-[10px] text-slate-400 block mt-1 font-semibold">Eficiencia de capital</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Rentabilidad Promedio</span>
            <span className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xl font-bold font-mono text-slate-800">{globalRentabilidad}%</span>
            <p className="text-[10px] text-slate-400 block mt-1 font-semibold">Porcentaje de ocupación</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Rentabilidad por Artista (Native Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Music className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rentabilidad Consolidada por Artista</h3>
          </div>

          <div className="space-y-4">
            {artistFinances.map((art) => {
              const pct = maxProfit > 0 ? (art.profit / maxProfit) * 100 : 0;
              return (
                <div key={art.artistName} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{art.artistName} ({art.count} shows)</span>
                    <span className="font-mono text-emerald-600 font-bold">${art.profit.toLocaleString('es-MX')} MXN</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200/50 shadow-inner">
                    <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono">
                    <span>Ingreso: ${art.income.toLocaleString()}</span>
                    <span>Gastos: ${art.expenses.toLocaleString()}</span>
                    <span>Promedio/Show: ${art.avgProfit.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Rentabilidad por Recinto */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rentabilidad Consolidada por Recinto</h3>
          </div>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-2">
            {venueFinances.map((ven) => (
              <div key={ven.venueName} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-all shadow-sm font-semibold">
                <div>
                  <span className="font-bold text-slate-700 block truncate max-w-[200px]">{ven.venueName}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold">{ven.city} — {ven.count} shows</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-emerald-600 font-bold block">${ven.profit.toLocaleString('es-MX')}</span>
                  <span className="text-[10px] text-slate-400 font-semibold font-mono">Avg: ${ven.avgProfit.toLocaleString()}/show</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
