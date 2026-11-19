import { RefreshCw, Link2, Unlink, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import type { MetaData } from '../lib/api';
import { fmtNum, fmtDate } from '../lib/socialAnalytics';

interface Props {
  configured: boolean | null;          // null = aún cargando
  missing: string[];
  data: MetaData | null;
  busy: '' | 'connect' | 'sync' | 'disconnect';
  error: string;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}

const DEM_TITLES: Record<string, string> = { edad: 'Edad', genero: 'Género', ciudad: 'Ciudades', pais: 'Países' };
const countryName = (c: string) => { try { return new Intl.DisplayNames(['es'], { type: 'region' }).of(c) || c; } catch { return c; } };

function Bars({ title, rows, label }: { title: string; rows: { key: string; value: number }[]; label?: (k: string) => string }) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  const top = rows.slice(0, 6);
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5" data-testid={`dem-${title}`}>
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{title}</span>
      {top.length === 0 ? <p className="text-[11px] text-slate-400 italic">Sin dato (Meta lo entrega con 100 seguidores o más).</p> : top.map((r) => {
        const pct = total ? (r.value / total) * 100 : 0;
        return (
          <div key={r.key} className="text-[11px]">
            <div className="flex justify-between gap-2"><span className="text-slate-700 truncate">{label ? label(r.key) : r.key}</span><span className="font-mono text-slate-500 shrink-0">{pct.toFixed(1)} %</span></div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

/** Cuenta oficial de Instagram: alcance, demografía e interacción por publicación (API de Meta). */
export default function OfficialInstagram({ configured, missing, data, busy, error, onConnect, onSync, onDisconnect }: Props) {
  const conn = data?.connection;
  const reach = data?.reach ?? [];
  const maxReach = Math.max(1, ...reach.map((r) => r.reach));
  const reachTotal = reach.reduce((a, r) => a + r.reach, 0);
  const days = reach.length;

  return (
    <section className="space-y-3" data-testid="official-instagram">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Instagram oficial: alcance, demografía y publicaciones</h4>
        {conn && (
          <div className="flex items-center gap-1.5" data-admin-only>
            <button type="button" onClick={onSync} disabled={busy !== ''} className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"><RefreshCw className={`w-3 h-3 ${busy === 'sync' ? 'animate-spin' : ''}`} />{busy === 'sync' ? 'Actualizando…' : 'Actualizar'}</button>
            <button type="button" onClick={() => { if (window.confirm('¿Desconectar la cuenta oficial? El historial ya guardado se conserva.')) onDisconnect(); }} disabled={busy !== ''} className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-600 font-bold text-[11px] hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center gap-1"><Unlink className="w-3 h-3" />Desconectar</button>
          </div>
        )}
      </div>

      {error && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-[11px] font-semibold" data-testid="meta-error">{error}</div>}

      {configured === false && !conn && (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 space-y-2" data-testid="meta-not-configured">
          <p className="text-xs text-slate-700 font-semibold">Falta un paso en el servidor para conectar la cuenta oficial.</p>
          <p className="text-[11px] text-slate-500">Con la API oficial de Meta se obtiene lo que no es público: <strong>alcance, edad, género, ciudades y países de la audiencia, y la interacción real de cada publicación</strong>. Hay que crear una app de Meta propia y pegar sus claves en <code>api/config.php</code> (<code>{missing.join(', ')}</code>). Los pasos están en <code>HOSTINGER.md</code>.</p>
          <button type="button" disabled className="px-3 py-1.5 rounded-lg bg-slate-300 text-white font-bold text-[11px] cursor-not-allowed flex items-center gap-1"><Link2 className="w-3 h-3" />Conectar Instagram oficial</button>
        </div>
      )}

      {configured && !conn && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2" data-testid="meta-connect" data-admin-only>
          <p className="text-[11px] text-slate-600">Autoriza la cuenta de Instagram del artista para traer alcance, demografía e interacción por publicación. Debe ser una cuenta <strong>profesional</strong> (creador o negocio) ligada a una página de Facebook, y quien autoriza debe administrar esa página.</p>
          <button type="button" onClick={onConnect} disabled={busy !== ''} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] disabled:opacity-40 cursor-pointer flex items-center gap-1"><Link2 className="w-3 h-3" />{busy === 'connect' ? 'Abriendo Meta…' : 'Conectar Instagram oficial'}</button>
        </div>
      )}

      {conn && (
        <>
          <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-4 gap-y-0.5" data-testid="meta-conn">
            <span>Conectado como <strong className="text-slate-700">@{conn.username || '—'}</strong></span>
            {conn.lastSync && <span>Última sincronización: {fmtDate(conn.lastSync.slice(0, 10))}</span>}
            {conn.expiresAt && <span>La autorización vence: {fmtDate(conn.expiresAt.slice(0, 10))}</span>}
          </div>
          {conn.lastError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-[11px] font-semibold flex items-center justify-between gap-2" data-testid="meta-conn-error" data-admin-only>
              <span>{conn.lastError}</span>
              {configured && <button type="button" onClick={onConnect} className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold text-[11px] cursor-pointer shrink-0">Reconectar</button>}
            </div>
          )}

          {/* Alcance */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5" data-testid="reach-chart">
            <div className="flex items-baseline justify-between"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alcance diario (últimos 30 días)</span>
              {days > 0 && <span className="text-[11px] text-slate-500">Promedio <strong className="text-slate-700">{fmtNum(Math.round(reachTotal / days))}</strong> cuentas por día · máx. {fmtNum(maxReach)}</span>}</div>
            {days === 0 ? <p className="text-[11px] text-slate-400 italic">Meta aún no entregó alcance para esta cuenta.</p> : (
              <svg viewBox={`0 0 ${days * 10} 60`} className="w-full h-24" preserveAspectRatio="none" role="img" aria-label="Alcance diario">
                {reach.map((r, i) => <rect key={r.date} x={i * 10 + 1} y={58 - (r.reach / maxReach) * 56} width={8} height={(r.reach / maxReach) * 56} fill="#E84A2E" opacity={0.85}><title>{`${fmtDate(r.date)}: ${fmtNum(r.reach)} cuentas alcanzadas`}</title></rect>)}
              </svg>
            )}
          </div>

          {/* Demografía */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Demografía de los seguidores{data?.demographics.date ? ` · foto del ${fmtDate(data.demographics.date)}` : ''}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {(['edad', 'genero', 'ciudad', 'pais'] as const).map((d) => <div key={d}><Bars title={DEM_TITLES[d]} rows={data?.demographics[d] ?? []} label={d === 'pais' ? countryName : undefined} /></div>)}
            </div>
          </div>

          {/* Publicaciones */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Publicaciones recientes</div>
            {(data?.posts.length ?? 0) === 0 ? <p className="text-[11px] text-slate-400 italic">Sin publicaciones.</p> : (
              <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl" data-testid="posts-table">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 tracking-wider"><tr><th className="text-left px-3 py-2">Publicación</th><th className="text-right px-2">Me gusta</th><th className="text-right px-2">Coment.</th><th className="text-right px-2">Alcance</th><th className="text-right px-2">Guardados</th><th className="text-right px-2">Compart.</th><th className="text-right px-3">Interacción</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {data!.posts.map((p) => (
                      <tr key={p.id} data-testid="post-row">
                        <td className="px-3 py-1.5 max-w-[260px]"><span className="font-mono text-[10px] text-slate-400 mr-1.5">{p.date ? fmtDate(p.date.slice(0, 10)) : ''}</span><span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 rounded mr-1">{p.type}</span>
                          <span className="text-slate-700">{p.text ? (p.text.length > 40 ? p.text.slice(0, 40) + '…' : p.text) : <em className="text-slate-400">sin texto</em>}</span>
                          {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-1 inline-block text-slate-300 hover:text-slate-600" aria-label="Abrir publicación"><ExternalLink className="w-3 h-3" /></a>}</td>
                        {[p.likes, p.comments, p.reach, p.saves, p.shares].map((v, i) => <td key={i} className="px-2 text-right font-mono">{v === null ? <span className="text-slate-300">—</span> : fmtNum(v)}</td>)}
                        <td className="px-3 text-right font-bold">{p.engagement === null ? <span className="text-slate-300 font-normal">—</span> : `${p.engagement.toFixed(2)} %`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[10px] text-slate-400 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" />Interacción = (me gusta + comentarios + guardados + compartidos) ÷ alcance de esa publicación. «—» significa que Meta no entregó ese dato (no se estima).</p>
          </div>
        </>
      )}
    </section>
  );
}
