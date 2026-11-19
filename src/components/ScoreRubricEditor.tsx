import { SCORE_METRICS, levelFor, type ScoreKey } from '../lib/venueScoreRubric';

interface Props {
  values: Record<ScoreKey, number | null>;
  onChange: (key: ScoreKey, value: number | null) => void;
  compact?: boolean;
}

/** Selector por niveles (20/40/60/80/100 %) con la descripción de lo que significa cada uno. */
export default function ScoreRubricEditor({ values, onChange, compact = false }: Props) {
  return (
    <div className={compact ? 'grid grid-cols-1 lg:grid-cols-2 gap-3' : 'space-y-4'}>
      {SCORE_METRICS.map((m) => {
        const isNP = values[m.key] === null || values[m.key] === undefined;
        const val = values[m.key] || 0;
        const lvl = isNP ? null : levelFor(m, val);
        const exact = lvl && lvl.value === val;
        return (
          <div key={m.key} className={`border rounded-xl p-3 space-y-2 ${isNP ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-800 block">{m.label} <span className="text-slate-400 font-normal">({m.weight}% del Score)</span></span>
                {!compact && <p className="text-[10px] text-slate-500">{m.desc}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number" min={0} max={100} value={isNP ? '' : val} placeholder="NP" disabled={isNP} aria-label={`${m.label} en porcentaje`}
                  onChange={(e) => onChange(m.key, Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-14 bg-slate-100 border border-slate-200 text-amber-700 font-mono font-bold text-xs text-center rounded-lg px-1 py-1 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <span className="text-xs font-mono font-bold text-slate-500">%</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1">
              {m.levels.map((l) => {
                const active = lvl?.value === l.value;
                return (
                  <button
                    key={l.value} type="button" onClick={() => onChange(m.key, active && exact ? 0 : l.value)}
                    title={l.detail} aria-pressed={active}
                    className={`rounded-lg border px-1 py-1.5 text-center transition-colors cursor-pointer ${active ? 'bg-amber-500 border-amber-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300'}`}
                  >
                    <span className="block text-[11px] font-black font-mono">{l.value}%</span>
                    {!compact && <span className="block text-[9px] leading-tight mt-0.5">{l.short}</span>}
                  </button>
                );
              })}
              <button
                type="button" onClick={() => onChange(m.key, isNP ? 0 : null)} aria-pressed={isNP}
                title="No aplica: esta métrica no se toma en cuenta en el Flamo Score"
                className={`rounded-lg border px-1 py-1.5 text-center transition-colors cursor-pointer ${isNP ? 'bg-slate-600 border-slate-700 text-white shadow-sm' : 'bg-slate-50 border-dashed border-slate-300 text-slate-500 hover:bg-slate-100'}`}
              >
                <span className="block text-[11px] font-black font-mono">NP</span>
                {!compact && <span className="block text-[9px] leading-tight mt-0.5">No aplica</span>}
              </button>
            </div>

            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className={`h-full ${m.color} transition-all duration-300`} style={{ width: `${val}%` }} />
            </div>
            <p className="text-[11px] text-slate-600 min-h-[1.5rem]">
              {isNP
                ? <><strong className="text-slate-800">NP · No aplica:</strong> <span className="text-slate-500">esta métrica no se toma en cuenta; el resto del Score se reajusta.</span></>
                : lvl
                ? <><strong className="text-slate-800">{exact ? `${lvl.value} %` : `≈ ${lvl.value} % (valor ${val} %)`}:</strong> {lvl.detail}</>
                : <span className="text-slate-400">Sin evaluar. Elige un nivel o escribe el porcentaje.</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
