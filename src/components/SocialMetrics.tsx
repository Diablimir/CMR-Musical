import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Plus, Trash2, Link2, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import type { Artist, Event } from '../types';
import { social, type SocialData, type SocialPlatform, type ActionType } from '../lib/api';
import {
  PLATFORMS, PLATFORM_LABEL, AUTO_PLATFORMS, ACTION_TYPES, handleOf, seriesOf, latestOf, impactOf, buildTimeline, summaryByType,
  fmtNum, fmtSigned, fmtPct, fmtDate, addDays, type Impact,
} from '../lib/socialAnalytics';

interface Props {
  artist: Artist;
  events: Event[];                              // agenda (se filtran los shows del artista)
  onUpdateArtist: (a: Artist) => void;
}

const TYPE_COLOR: Record<string, string> = {
  Show: '#0A2538', Lanzamiento: '#E84A2E', Campaña: '#B7791F', Publicación: '#2F6F5E', Colaboración: '#7C3AED', Prensa: '#0EA5E9', Gira: '#DB2777', Otro: '#64748B',
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-amber-500';

function Delta({ delta, pct }: { delta: number | null; pct: number | null }) {
  if (delta === null) return <span className="text-slate-400">—</span>;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const color = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500';
  return <span className={`inline-flex items-center gap-1 font-bold ${color}`}><Icon className="w-3 h-3" />{fmtSigned(delta)}{pct !== null ? ` (${fmtPct(pct)})` : ''}</span>;
}

export default function SocialMetrics({ artist, events, onUpdateArtist }: Props) {
  const [data, setData] = useState<SocialData>({ metrics: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [chartPlat, setChartPlat] = useState<SocialPlatform | 'all'>('instagram');
  const [range, setRange] = useState<30 | 90 | 365 | 0>(90);
  const [windowDays, setWindowDays] = useState<7 | 14 | 30>(14);
  const [manualFor, setManualFor] = useState<SocialPlatform | ''>('');
  const [mf, setMf] = useState({ date: todayStr(), followers: '', following: '', posts: '', engagement: '' });
  const [af, setAf] = useState<{ date: string; type: ActionType; title: string; platform: '' | SocialPlatform; notes: string }>({ date: todayStr(), type: 'Publicación', title: '', platform: '', notes: '' });
  const [addNet, setAddNet] = useState<SocialPlatform | ''>('');
  const [addHandle, setAddHandle] = useState('');
  const [netErrors, setNetErrors] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const refreshedFor = useRef<string>('');

  const sm = (artist.socialMedia || {}) as Record<string, string | boolean | undefined>;
  const linkOf = (p: SocialPlatform) => (typeof sm[p] === 'string' ? (sm[p] as string) : '');
  // Usuario efectivo: el enlace guardado o, si no hay, el usuario que quedó de la conexión anterior (p. ej. instagramConnectedUser)
  const handleFor = (p: SocialPlatform) => handleOf(linkOf(p)) || handleOf(typeof sm[p + 'ConnectedUser'] === 'string' ? (sm[p + 'ConnectedUser'] as string) : '');

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    social.get(artist.id).then(async (d) => {
      if (!d || !Array.isArray(d.metrics)) throw new Error('El servidor no devolvió el historial.');
      if (!alive) return;
      setData(d);
      setLoading(false);
      // Actualización automática: trae de cada red conectada la captura de hoy (el servidor omite lo que ya tiene)
      if (refreshedFor.current !== artist.id && AUTO_PLATFORMS.some((p) => handleFor(p))) {
        refreshedFor.current = artist.id;
        setRefreshing(true);
        try {
          const r = await social.refresh(artist.id);
          if (alive && r && Array.isArray(r.metrics)) { setData({ metrics: r.metrics, actions: r.actions }); setNetErrors(r.errors || {}); }
        } catch (e: any) { if (alive) setError(e.message || 'No se pudo actualizar automáticamente.'); }
        finally { if (alive) setRefreshing(false); }
      }
    }).catch((e) => { if (alive) setError(e.message || 'No se pudo cargar el historial.'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [artist.id]);

  const run = async (key: string, fn: () => Promise<SocialData | void>, ok?: string) => {
    setBusy(key); setError(''); setNotice('');
    try { const d = await fn(); if (d && Array.isArray(d.metrics)) setData({ metrics: d.metrics, actions: d.actions }); if (ok) setNotice(ok); }
    catch (e: any) { setError(e.message || 'No se pudo completar la operación.'); }
    finally { setBusy(''); }
  };

  // Redes a mostrar: las que tienen enlace guardado o historial
  const nets = useMemo(() => PLATFORMS.filter((p) => handleFor(p) || linkOf(p) || data.metrics.some((m) => m.platform === p)), [artist.socialMedia, data.metrics]);
  const withData = useMemo(() => PLATFORMS.filter((p) => data.metrics.some((m) => m.platform === p)), [data.metrics]);
  useEffect(() => { if (chartPlat !== 'all' && withData.length && !withData.includes(chartPlat)) setChartPlat(withData[0]); }, [withData]);

  const myShows = useMemo(() => events.filter((e) => !e.deleted_at && (e.artistId === artist.id || (e as any).artists?.some((a: any) => a.artistId === artist.id))).map((e) => ({ id: e.id, name: e.name, date: e.date, status: e.status })), [events, artist.id]);
  const timeline = useMemo(() => buildTimeline(data.actions, myShows), [data.actions, myShows]);

  /** Conecta una red: guarda el usuario/enlace y, si tiene captura automática, trae los datos de inmediato. */
  const connect = async (p: SocialPlatform, raw: string) => {
    const value = raw.trim();
    const handle = handleOf(value);
    if (!handle) { setError('Escribe el usuario (por ejemplo @mibanda) o pega el enlace del perfil.'); return; }
    setError(''); setNotice('');
    if (value !== linkOf(p)) onUpdateArtist({ ...artist, socialMedia: { ...artist.socialMedia, [p]: value }, updated_at: new Date().toISOString() });
    if (!AUTO_PLATFORMS.includes(p)) { setNotice(`${PLATFORM_LABEL[p]} guardada. Esta red aún no tiene captura automática: puedes capturar sus números a mano.`); return; }
    setBusy('fetch-' + p); setNetErrors((e) => ({ ...e, [p]: undefined }));
    try {
      const d = await social.fetchLive(artist.id, p, handle);
      if (d && Array.isArray(d.metrics)) setData({ metrics: d.metrics, actions: d.actions });
      setNotice(`${PLATFORM_LABEL[p]} conectada: datos de @${handle} cargados automáticamente.`);
    } catch (e: any) { setNetErrors((x) => ({ ...x, [p]: e.message || 'No se pudo conectar.' })); }
    finally { setBusy(''); }
  };

  const setHandle = (p: SocialPlatform, value: string) => {
    if (value.trim() === linkOf(p) || !value.trim()) return;
    void connect(p, value);   // al cambiar el usuario/enlace, se vuelve a conectar solo
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFor) return;
    const num = (v: string) => (v.trim() === '' ? null : Number(v));
    void run('manual', () => social.addMetric(artist.id, { platform: manualFor, date: mf.date, followers: Number(mf.followers), following: num(mf.following), posts: num(mf.posts), engagement: num(mf.engagement) }),
      `Captura de ${PLATFORM_LABEL[manualFor]} guardada.`).then(() => { setMf({ date: todayStr(), followers: '', following: '', posts: '', engagement: '' }); setManualFor(''); });
  };

  const submitAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!af.title.trim()) return;
    void run('action', () => social.saveAction(artist.id, { date: af.date, type: af.type, title: af.title.trim(), notes: af.notes.trim() || undefined, platform: af.platform || undefined }), 'Acción guardada.')
      .then(() => setAf({ ...af, title: '', notes: '' }));
  };

  // ───────── Gráfica ─────────
  const chart = useMemo(() => {
    const platforms = chartPlat === 'all' ? withData : withData.includes(chartPlat as SocialPlatform) ? [chartPlat as SocialPlatform] : [];
    const minDate = range ? addDays(todayStr(), -range) : '0000-00-00';
    const lines = platforms.map((p) => ({ p, pts: seriesOf(data.metrics, p).filter((m) => m.date >= minDate) })).filter((l) => l.pts.length);
    if (!lines.length) return null;
    const all = lines.flatMap((l) => l.pts);
    const d0 = all.reduce((a, m) => (m.date < a ? m.date : a), all[0].date), d1 = all.reduce((a, m) => (m.date > a ? m.date : a), all[0].date);
    const span = Math.max(1, (Date.parse(d1) - Date.parse(d0)) / 86400000);
    const rel = chartPlat === 'all';   // varias redes: % de cambio desde su primer dato
    const val = (l: typeof lines[number], m: typeof all[number]) => (rel ? ((m.followers - l.pts[0].followers) / Math.max(1, l.pts[0].followers)) * 100 : m.followers);
    const vals = lines.flatMap((l) => l.pts.map((m) => val(l, m)));
    let lo = Math.min(...vals), hi = Math.max(...vals); if (hi === lo) { hi += 1; lo -= 1; }
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    const W = 760, H = 260, L = 56, R = 16, T = 14, B = 34;
    const x = (d: string) => L + ((Date.parse(d) - Date.parse(d0)) / 86400000 / span) * (W - L - R);
    const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const marks = timeline.filter((t) => t.date >= d0 && t.date <= d1);
    return { lines, d0, d1, W, H, L, R, T, B, x, y, lo, hi, rel, val, marks };
  }, [data.metrics, chartPlat, range, withData, timeline]);

  const COLORS = ['#E84A2E', '#0A2538', '#2F6F5E', '#B7791F', '#7C3AED', '#0EA5E9', '#DB2777', '#64748B'];

  // ───────── Cruce acción ↔ cambio de seguidores ─────────
  const crossing = useMemo(() => timeline.map((t) => {
    const targets = t.platform ? [t.platform] : withData;
    return { ...t, impacts: targets.map((p) => impactOf(t.date, data.metrics, p, windowDays)) as Impact[] };
  }).reverse(), [timeline, data.metrics, withData, windowDays]);
  const byType = useMemo(() => summaryByType(crossing.map((c) => ({ type: c.type, impacts: c.impacts }))), [crossing]);

  const hasAny = data.metrics.length > 0;

  return (
    <div className="space-y-6 pt-6 text-xs" data-testid="social-metrics">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-slate-800">Audiencia & Captación</h3>
        <p className="text-[11px] text-slate-500 max-w-3xl">
          Historial <strong>real</strong> de seguidores por red, una captura por día. Al conectar una red (solo el usuario o el enlace) se trae sola desde la red, y se vuelve a actualizar automáticamente cada día y al abrir esta pantalla. Hoy Instagram, TikTok, YouTube y Facebook (datos públicos); las demás redes se capturan a mano.
          Nada se estima: donde no hay captura aparece «sin datos».
        </p>
      </div>

      {refreshing && <div className="bg-sky-50 border border-sky-200 text-sky-700 rounded-xl px-3 py-2 text-[11px] font-semibold flex items-center gap-2" data-testid="auto-refresh"><RefreshCw className="w-3 h-3 animate-spin" />Actualizando tus redes automáticamente… (puede tardar unos segundos)</div>}
      {error && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-[11px] font-semibold">{error}</div>}
      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-2 text-[11px] font-semibold">{notice}</div>}

      {/* Redes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Redes del artista</h4>
          <div className="flex items-center gap-1.5">
            <select value={addNet} onChange={(e) => setAddNet(e.target.value as SocialPlatform | '')} aria-label="Agregar red" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-600">
              <option value="">Agregar red…</option>
              {PLATFORMS.filter((p) => !nets.includes(p)).map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}{AUTO_PLATFORMS.includes(p) ? ' (automática)' : ''}</option>)}
            </select>
            {addNet && (
              <>
                <input value={addHandle} onChange={(e) => setAddHandle(e.target.value)} placeholder="@usuario o enlace del perfil" aria-label="Usuario o enlace de la nueva red"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void connect(addNet, addHandle).then(() => { setAddNet(''); setAddHandle(''); }); } }} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 w-52" />
                <button type="button" disabled={!handleOf(addHandle)} onClick={() => void connect(addNet, addHandle).then(() => { setAddNet(''); setAddHandle(''); })}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1"><Link2 className="w-3 h-3" />Conectar</button>
              </>
            )}
          </div>
        </div>

        {loading ? <p className="text-slate-400">Cargando historial…</p> : nets.length === 0 && !manualFor ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-500">
            Este artista aún no tiene redes registradas. Agrega una arriba (usuario o enlace) y captura su primer dato.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nets.map((p) => {
              const lt = latestOf(data.metrics, p);
              const handle = handleFor(p);
              const auto = AUTO_PLATFORMS.includes(p);
              const connecting = busy === 'fetch-' + p || (refreshing && auto && !!handle && !lt);
              const netErr = netErrors[p];
              return (
                <div key={p} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2" data-testid={`net-${p}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{PLATFORM_LABEL[p]}</span>
                      <span className="text-xl font-black text-slate-800 font-mono">{lt ? fmtNum(lt.last.followers) : connecting ? 'Conectando…' : 'Sin datos'}</span>
                      <span className="text-[10px] text-slate-400 ml-1">{lt ? 'seguidores' : ''}</span>
                    </div>
                    {lt && <div className="text-right text-[10px] text-slate-500"><div><Delta delta={lt.delta} pct={lt.pct} /></div><div>{lt.prev ? `vs ${fmtDate(lt.prev.date)}` : 'primera captura'}</div></div>}
                  </div>
                  {lt && (
                    <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>Capturado: {fmtDate(lt.last.date)}</span>
                      <span className={`px-1.5 rounded font-bold ${lt.last.source === 'apify' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>{lt.last.source === 'apify' ? 'Apify (automático)' : 'Manual'}</span>
                      {lt.last.following !== null && <span>Siguiendo: {fmtNum(lt.last.following)}</span>}
                      {lt.last.posts !== null && <span>Publicaciones: {fmtNum(lt.last.posts)}</span>}
                      {lt.last.engagement !== null && <span>Interacción: {lt.last.engagement}%</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <input
                      defaultValue={linkOf(p) || (handle ? '@' + handle : '')} key={artist.id + p + linkOf(p) + handle} placeholder="@usuario o enlace del perfil" aria-label={`Usuario o enlace de ${PLATFORM_LABEL[p]}`}
                      onBlur={(e) => setHandle(p, e.target.value)} className={inputCls}
                    />
                  </div>
                  {netErr && <p role="alert" className="text-[11px] text-rose-600 font-semibold" data-testid={`net-error-${p}`}>{netErr}</p>}
                  <div className="flex gap-2 flex-wrap items-center">
                    {auto && (
                      <button type="button" disabled={!handle || busy === 'fetch-' + p}
                        title={handle ? 'Consulta el perfil público y guarda la captura de hoy' : 'Primero escribe el usuario o enlace'}
                        onClick={() => void connect(p, linkOf(p) || '@' + handle)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1">
                        <RefreshCw className={`w-3 h-3 ${connecting ? 'animate-spin' : ''}`} />{connecting ? 'Consultando…' : netErr ? 'Reintentar' : 'Actualizar ahora'}
                      </button>
                    )}
                    {auto && <span className="text-[10px] text-slate-400">Se actualiza sola cada día.</span>}
                    <button type="button" onClick={() => { setManualFor(p); setMf({ ...mf, date: todayStr() }); }} className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer">{auto ? 'Corregir / capturar a mano' : 'Capturar a mano'}</button>
                    {!auto && <span className="text-[10px] text-slate-400">Esta red aún no tiene captura automática.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {manualFor && (
          <form onSubmit={submitManual} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2" data-testid="manual-form">
            <span className="text-[11px] font-bold text-slate-700">Captura manual · {PLATFORM_LABEL[manualFor]}</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Fecha</span><input type="date" required max={todayStr()} value={mf.date} onChange={(e) => setMf({ ...mf, date: e.target.value })} className={inputCls} /></label>
              <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Seguidores *</span><input type="number" required min={0} step={1} value={mf.followers} onChange={(e) => setMf({ ...mf, followers: e.target.value })} className={inputCls} aria-label="Seguidores" /></label>
              <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Siguiendo</span><input type="number" min={0} step={1} value={mf.following} onChange={(e) => setMf({ ...mf, following: e.target.value })} className={inputCls} /></label>
              <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Publicaciones</span><input type="number" min={0} step={1} value={mf.posts} onChange={(e) => setMf({ ...mf, posts: e.target.value })} className={inputCls} /></label>
              <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Interacción %</span><input type="number" min={0} max={100} step="0.01" value={mf.engagement} onChange={(e) => setMf({ ...mf, engagement: e.target.value })} className={inputCls} /></label>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setManualFor('')} className="px-3 py-1.5 text-[11px] text-slate-600 hover:bg-white rounded-lg cursor-pointer">Cancelar</button>
              <button type="submit" disabled={busy === 'manual' || mf.followers === ''} className="px-3 py-1.5 text-[11px] bg-slate-800 text-white font-bold rounded-lg disabled:opacity-40 cursor-pointer">Guardar captura</button>
            </div>
          </form>
        )}
      </section>

      {/* Histórico */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Histórico de seguidores</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={chartPlat} onChange={(e) => setChartPlat(e.target.value as SocialPlatform | 'all')} aria-label="Red de la gráfica" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]">
              {withData.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
              {withData.length > 1 && <option value="all">Comparar redes (% de cambio)</option>}
            </select>
            <select value={range} onChange={(e) => setRange(Number(e.target.value) as 30 | 90 | 365 | 0)} aria-label="Rango" className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]">
              <option value={30}>30 días</option><option value={90}>90 días</option><option value={365}>1 año</option><option value={0}>Todo</option>
            </select>
          </div>
        </div>
        {!hasAny ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">Todavía no hay capturas. Cuando guardes la primera, aquí verás la evolución.</div>
        ) : !chart ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">No hay capturas en este rango. Prueba con «Todo».</div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-x-auto" data-testid="social-chart">
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full min-w-[520px]" role="img" aria-label="Histórico de seguidores con acciones marcadas">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => { const v = chart.lo + (chart.hi - chart.lo) * t; const yy = chart.y(v); return (
                <g key={t}><line x1={chart.L} x2={chart.W - chart.R} y1={yy} y2={yy} stroke="#e2e8f0" strokeWidth={1} /><text x={chart.L - 6} y={yy + 3} fontSize={9} textAnchor="end" fill="#64748b">{chart.rel ? v.toFixed(0) + '%' : fmtNum(Math.round(v))}</text></g>); })}
              <text x={chart.L} y={chart.H - 10} fontSize={9} fill="#64748b">{fmtDate(chart.d0)}</text>
              <text x={chart.W - chart.R} y={chart.H - 10} fontSize={9} textAnchor="end" fill="#64748b">{fmtDate(chart.d1)}</text>
              {chart.marks.map((m) => (
                <g key={m.key} data-testid="chart-mark"><line x1={chart.x(m.date)} x2={chart.x(m.date)} y1={chart.T} y2={chart.H - chart.B} stroke={TYPE_COLOR[m.type]} strokeWidth={1.2} strokeDasharray="3 3" opacity={0.75} />
                  <circle cx={chart.x(m.date)} cy={chart.T + 3} r={4} fill={TYPE_COLOR[m.type]}><title>{`${fmtDate(m.date)} · ${m.type}: ${m.title}`}</title></circle></g>
              ))}
              {chart.lines.map((l, i) => {
                const c = COLORS[PLATFORMS.indexOf(l.p) % COLORS.length];
                const d = l.pts.map((m, k) => `${k ? 'L' : 'M'}${chart.x(m.date).toFixed(1)},${chart.y(chart.val(l, m)).toFixed(1)}`).join(' ');
                return (<g key={l.p}><path d={d} fill="none" stroke={c} strokeWidth={2} />
                  {l.pts.map((m) => (<circle key={m.date} cx={chart.x(m.date)} cy={chart.y(chart.val(l, m))} r={3} fill={c} stroke="#fff" strokeWidth={1}><title>{`${PLATFORM_LABEL[l.p]} · ${fmtDate(m.date)}: ${fmtNum(m.followers)} seguidores (${m.source === 'apify' ? 'Apify' : 'manual'})`}</title></circle>))}
                  {chart.lines.length > 1 && <text x={chart.L + 6 + i * 90} y={chart.T + 22} fontSize={10} fill={c} fontWeight={700}>● {PLATFORM_LABEL[l.p]}</text>}</g>);
              })}
            </svg>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-slate-500">
              {['Show', ...ACTION_TYPES].map((t) => <span key={t} className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[t] }} />{t}</span>)}
            </div>
          </div>
        )}
        {hasAny && chart && chart.lines.some((l) => l.pts.length === 1) && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" />Con una sola captura no hay curva todavía: captura de nuevo otro día (o activa la captura diaria) para ver la evolución.</p>}
      </section>

      {/* Acciones */}
      <section className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Acciones (lo que hacemos y cuándo)</h4>
        <form onSubmit={submitAction} className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end" data-testid="action-form">
          <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Fecha</span><input type="date" required value={af.date} onChange={(e) => setAf({ ...af, date: e.target.value })} className={inputCls} /></label>
          <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Tipo</span><select value={af.type} onChange={(e) => setAf({ ...af, type: e.target.value as ActionType })} className={inputCls}>{ACTION_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="space-y-0.5 md:col-span-2"><span className="text-[10px] text-slate-500 font-bold">Qué se hizo *</span><input required value={af.title} onChange={(e) => setAf({ ...af, title: e.target.value })} placeholder="Ej. Lanzamiento del sencillo «X», campaña de Reels…" className={inputCls} aria-label="Título de la acción" /></label>
          <label className="space-y-0.5"><span className="text-[10px] text-slate-500 font-bold">Red (opcional)</span><select value={af.platform} onChange={(e) => setAf({ ...af, platform: e.target.value as '' | SocialPlatform })} className={inputCls}><option value="">Todas</option>{PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}</select></label>
          <button type="submit" disabled={!af.title.trim() || busy === 'action'} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-[11px] disabled:opacity-40 cursor-pointer">Agregar acción</button>
          <label className="space-y-0.5 col-span-2 md:col-span-6"><span className="text-[10px] text-slate-500 font-bold">Notas (opcional)</span><input value={af.notes} onChange={(e) => setAf({ ...af, notes: e.target.value })} className={inputCls} /></label>
        </form>
        {timeline.length === 0 ? <p className="text-slate-400">Aún no hay acciones ni shows en la agenda de este artista.</p> : (
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl">
            {[...timeline].reverse().map((t) => (
              <div key={t.key} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLOR[t.type] }} />
                  <span className="font-mono text-[10px] text-slate-400 shrink-0">{fmtDate(t.date)}</span>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">{t.type}</span>
                  <span className="truncate text-slate-700 font-semibold">{t.title}</span>
                  {t.platform && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 rounded shrink-0">{PLATFORM_LABEL[t.platform]}</span>}
                  {t.fromAgenda && <span className="text-[9px] bg-sky-50 text-sky-700 px-1.5 rounded shrink-0">de la agenda</span>}
                </div>
                {!t.fromAgenda && t.id && <button type="button" title="Eliminar acción" onClick={() => { if (window.confirm('¿Eliminar esta acción?')) void run('del-' + t.id, () => social.deleteAction(artist.id, t.id!)); }} className="p-1 text-slate-300 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3 h-3" /></button>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cruce */}
      <section className="space-y-2" data-testid="crossing">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Cruce: ¿qué pasó con los seguidores después de cada acción?</h4>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-600">Ventana después de la acción
            <select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value) as 7 | 14 | 30)} className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"><option value={7}>7 días</option><option value={14}>14 días</option><option value={30}>30 días</option></select>
          </label>
        </div>
        {crossing.length === 0 || withData.length === 0 ? <p className="text-slate-400">Para cruzar necesitas acciones (o shows) y capturas de redes.</p> : (
          <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
            <table className="w-full text-[11px]">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 tracking-wider"><tr><th className="text-left px-3 py-2">Acción</th><th className="text-left px-2">Red</th><th className="text-right px-2">Antes</th><th className="text-right px-2">Después</th><th className="text-right px-3">Cambio</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {crossing.flatMap((c) => c.impacts.length ? c.impacts.map((i, k) => (
                  <tr key={c.key + i.platform} data-testid="crossing-row">
                    <td className="px-3 py-1.5"><span className="font-mono text-[10px] text-slate-400 mr-1.5">{fmtDate(c.date)}</span><span className="font-bold text-slate-500 mr-1">{c.type}</span><span className="text-slate-700">{k === 0 ? c.title : '↳'}</span></td>
                    <td className="px-2">{PLATFORM_LABEL[i.platform]}</td>
                    <td className="px-2 text-right font-mono">{i.before ? fmtNum(i.before.followers) : '—'}</td>
                    <td className="px-2 text-right font-mono">{i.after ? fmtNum(i.after.followers) : '—'}</td>
                    <td className="px-3 text-right">{i.delta !== null ? <Delta delta={i.delta} pct={i.pct} /> : <span className="text-slate-400">{i.reason}</span>}</td>
                  </tr>)) : [])}
              </tbody>
            </table>
          </div>
        )}
        {byType.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="crossing-summary">
            {byType.map((s) => (
              <span key={s.type} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px]">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOR[s.type] }} /><strong>{s.type}</strong> promedio {fmtPct(s.avgPct)} ({fmtSigned(Math.round(s.avgDelta))} seg.) · {s.n} medición{s.n === 1 ? '' : 'es'}
              </span>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0" />Es el cambio observado entre dos capturas reales (la última antes de la acción y la última dentro de la ventana). Muestra coincidencia en el tiempo, no prueba que la acción lo causó; entre más seguidas sean las capturas, más confiable es la lectura.</p>
      </section>
    </div>
  );
}
