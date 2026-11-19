import { useEffect, useState } from 'react';
import { Check, X, RefreshCw, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { changes, type PendingChange, type MyChange, type ApproveResult } from '../lib/api';

interface Props {
  isApprover: boolean;          // Super Admin: aprueba/rechaza. Los demás: ven el estado de SUS cambios.
  onChanged: () => void;        // tras aprobar/rechazar: recargar datos y contadores
}

const COLLECTION_LABEL: Record<string, string> = { artists: 'Artista', venues: 'Venue', providers: 'Proveedor', contacts: 'Contacto', tours: 'Gira', events: 'Evento', contracts: 'Contrato', recording_projects: 'Proyecto de grabación' };
const FIELD_LABEL: Record<string, string> = {
  name: 'Nombre', artisticName: 'Nombre artístico', legalName: 'Nombre legal', title: 'Título', bio: 'Biografía', genre: 'Género', subgenres: 'Subgéneros', languages: 'Idiomas',
  city: 'Ciudad', state: 'Estado', country: 'País', address: 'Dirección', phone: 'Teléfono', email: 'Correo', website: 'Sitio web', manager: 'Manager', bookingAgent: 'Agente de booking',
  label: 'Sello', publisher: 'Editorial', distributor: 'Distribución', stage: 'Etapa', startDate: 'Inicio de carrera', rfc: 'RFC', pro: 'Sociedad de gestión', isrc: 'ISRC', iswc: 'ISWC',
  date: 'Fecha', status: 'Estado', capacity: 'Aforo', attendance: 'Asistencia', ticketPrice: 'Precio de boleto', totalIncome: 'Ingreso', expenses: 'Gastos', profit: 'Utilidad', venueId: 'Venue', artistId: 'Artista',
  lat: 'Latitud', lng: 'Longitud', rating: 'Rating', category: 'Categoría', costPerShow: 'Costo por show', notes: 'Notas', photo: 'Foto', deleted_at: 'Archivado',
  scoreRentabilidad: 'Rentabilidad', scoreResponseTime: 'Respuesta', scorePuntualidadPago: 'Puntualidad de pago', scoreNegociacion: 'Negociación', scoreProduccion: 'Producción', scoreHospitalidad: 'Hospitalidad',
};
const SKIP = new Set(['id', 'version', 'created_at', 'updated_at']);

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') { const j = JSON.stringify(v); return j.length > 90 ? j.slice(0, 90) + '…' : j; }
  const t = String(v); return t.length > 90 ? t.slice(0, 90) + '…' : t;
};
const labelOf = (o: Record<string, any>) => String(o?.name ?? o?.artisticName ?? o?.title ?? o?.id ?? '');
const ago = (iso: string) => { const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };

/** Vacío es vacío: null, '', [] y {} se consideran iguales (PHP devuelve [] para un objeto vacío). */
const norm = (v: unknown): unknown => (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && v && Object.keys(v as object).length === 0)) ? null : v;

/** Campos que cambian entre el registro actual y la propuesta (o, si es nuevo, los campos con contenido). */
function diffOf(c: PendingChange): { key: string; before: unknown; after: unknown }[] {
  const keys = Object.keys(c.data).filter((k) => !SKIP.has(k));
  if (!c.current) return keys.filter((k) => { const v = c.data[k]; return !(v === '' || v === null || v === undefined || (Array.isArray(v) && !v.length) || (typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length)); }).slice(0, 14).map((k) => ({ key: k, before: undefined, after: c.data[k] }));
  return keys.filter((k) => JSON.stringify(norm(c.data[k])) !== JSON.stringify(norm(c.current![k]))).map((k) => ({ key: k, before: c.current![k], after: c.data[k] }));
}

const STATUS_STYLE = { pendiente: 'bg-amber-50 text-amber-700 border-amber-200', aprobado: 'bg-emerald-50 text-emerald-700 border-emerald-200', rechazado: 'bg-rose-50 text-rose-700 border-rose-200' } as const;
const STATUS_TEXT = { pendiente: 'Pendiente de aprobación', aprobado: 'Aprobado', rechazado: 'Rechazado' } as const;

export default function ApprovalsPanel({ isApprover, onChanged }: Props) {
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [mine, setMine] = useState<MyChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [problems, setProblems] = useState<Record<string, ApproveResult>>({});

  const load = async () => {
    setLoading(true); setError('');
    try {
      if (isApprover) setPending((await changes.pending()).items); else setMine((await changes.mine()).items);
    } catch (e: any) { setError(e.message || 'No se pudo cargar.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [isApprover]);

  const approve = async (ids: string[], force = false) => {
    setBusy('approve'); setError(''); setNotice('');
    try {
      const r = await changes.approve(ids, force);
      const p: Record<string, ApproveResult> = {}; r.results.filter((x) => !x.ok).forEach((x) => { p[x.id] = x; });
      setProblems((prev) => ({ ...Object.fromEntries(Object.entries(prev).filter(([k]) => !ids.includes(k))), ...p }));
      setNotice(r.approved ? `${r.approved} cambio${r.approved === 1 ? '' : 's'} aprobado${r.approved === 1 ? '' : 's'} y aplicado${r.approved === 1 ? '' : 's'}.` : '');
      await load(); onChanged();
    } catch (e: any) { setError(e.message || 'No se pudo aprobar.'); }
    finally { setBusy(''); }
  };
  const withdraw = async (id: string) => {
    if (!window.confirm('¿Retirar este cambio? Se descarta y dejará de verse en tu pantalla.')) return;
    setBusy('withdraw'); setError(''); setNotice('');
    try { await changes.withdraw([id]); setNotice('Cambio retirado.'); await load(); onChanged(); }
    catch (e: any) { setError(e.message || 'No se pudo retirar.'); }
    finally { setBusy(''); }
  };
  const reject = async (ids: string[]) => {
    const reason = window.prompt('Motivo del rechazo (lo verá quien hizo el cambio; puede quedar vacío):', '');
    if (reason === null) return;
    setBusy('reject'); setError(''); setNotice('');
    try { const r = await changes.reject(ids, reason); setNotice(`${r.rejected} cambio${r.rejected === 1 ? '' : 's'} rechazado${r.rejected === 1 ? '' : 's'}.`); await load(); onChanged(); }
    catch (e: any) { setError(e.message || 'No se pudo rechazar.'); }
    finally { setBusy(''); }
  };

  const head = (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{isApprover ? 'Aprobaciones' : 'Mis cambios'}</h2>
        <p className="text-sm text-slate-500 max-w-2xl">{isApprover
          ? 'Los cambios de los demás roles quedan aquí hasta que los apruebes. Al aprobar se aplican con las mismas validaciones; al rechazar no se aplica nada y quien lo propuso ve tu motivo.'
          : 'Tus cambios se aplican cuando el Super Admin los aprueba. Aquí ves en qué estado está cada uno.'}</p>
      </div>
      <button type="button" onClick={() => void load()} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Actualizar</button>
    </div>
  );

  return (
    <div className="space-y-4" data-testid={isApprover ? 'approvals-panel' : 'my-changes-panel'}>
      {head}
      {error && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-sm font-semibold">{error}</div>}
      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-sm font-semibold" data-testid="approvals-notice">{notice}</div>}

      {isApprover ? (
        pending.length === 0 && !loading ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500"><CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />No hay cambios pendientes de aprobación.</div>
        ) : (
          <>
            {pending.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <button type="button" disabled={!!busy} onClick={() => void approve(pending.map((p) => p.id))} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5" data-testid="approve-all"><Check className="w-4 h-4" />Aprobar todo ({pending.length})</button>
              </div>
            )}
            <ul className="space-y-3">
              {pending.map((c) => {
                const d = diffOf(c); const prob = problems[c.id];
                return (
                  <li key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3" data-testid="pending-item">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{COLLECTION_LABEL[c.collection] ?? c.collection}</span>
                          <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${c.action === 'crear' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.action === 'crear' ? 'Nuevo' : 'Edición'}</span>
                        </div>
                        <p className="text-base font-bold text-slate-800 mt-1 truncate">{labelOf(c.data)}</p>
                        <p className="text-sm text-slate-500"><strong className="text-slate-700">{c.byName}</strong> · {ago(c.at)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button type="button" disabled={!!busy} onClick={() => void approve([c.id])} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5" data-testid="approve-one"><Check className="w-4 h-4" />Aprobar</button>
                        <button type="button" disabled={!!busy} onClick={() => void reject([c.id])} className="px-3 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5" data-testid="reject-one"><X className="w-4 h-4" />Rechazar</button>
                      </div>
                    </div>
                    {d.length > 0 ? (
                      <div className="overflow-x-auto"><table className="w-full text-sm" data-testid="diff-table">
                        <thead><tr className="text-[11px] uppercase text-slate-400 tracking-wide"><th className="text-left py-1 pr-3">Campo</th>{c.current && <th className="text-left py-1 pr-3">Antes</th>}<th className="text-left py-1">{c.current ? 'Después' : 'Valor'}</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{d.map((f) => (
                          <tr key={f.key}><td className="py-1 pr-3 font-semibold text-slate-600 whitespace-nowrap">{FIELD_LABEL[f.key] ?? f.key}</td>
                            {c.current && <td className="py-1 pr-3 text-slate-400 line-through break-all">{show(f.before)}</td>}
                            <td className="py-1 text-slate-800 font-medium break-all">{show(f.after)}</td></tr>))}</tbody>
                      </table></div>
                    ) : <p className="text-sm text-slate-400 italic">Sin diferencias visibles respecto al registro actual.</p>}
                    {prob && (
                      <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-sm flex items-center justify-between gap-2 flex-wrap" data-testid="approve-problem">
                        <span className="flex items-start gap-1.5"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{prob.error}</span>
                        {prob.code === 'conflict' && <button type="button" disabled={!!busy} onClick={() => void approve([c.id], true)} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-sm cursor-pointer" data-testid="approve-force">Aprobar de todos modos</button>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )
      ) : (
        mine.length === 0 && !loading ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center text-slate-500">Todavía no has enviado cambios.</div>
        ) : (
          <ul className="space-y-2">
            {mine.map((c) => (
              <li key={c.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-3 flex-wrap" data-testid="my-change">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-800 truncate">{COLLECTION_LABEL[c.collection] ?? c.collection}: {c.label || c.recordId}</p>
                  <p className="text-sm text-slate-500">{c.action === 'crear' ? 'Nuevo' : 'Edición'} · enviado {ago(c.at)}{c.resolvedBy ? ` · resuelto por ${c.resolvedBy}` : ''}</p>
                  {c.status === 'rechazado' && c.reason && <p className="text-sm text-rose-700 mt-1"><strong>Motivo:</strong> {c.reason}</p>}
                </div>
                {c.status === 'pendiente' && <button type="button" disabled={!!busy} onClick={() => void withdraw(c.id)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer shrink-0" data-testid="withdraw-one">Retirar</button>}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${STATUS_STYLE[c.status]}`}>
                  {c.status === 'pendiente' ? <Clock className="w-3.5 h-3.5" /> : c.status === 'aprobado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}{STATUS_TEXT[c.status]}
                </span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
