import type React from 'react';
import { useState } from 'react';
import { Pencil, Check, X, Layers } from 'lucide-react';
import type { Artist, ArtistStage, Tour } from '../types';

interface Props {
  artist: Artist;
  tours: Tour[];
  onSave: (updated: Artist) => void;
}

const STAGES: ArtistStage[] = ['Desarrollo', 'Aficionado', 'Emergente', 'Media carrera', 'Consolidado', 'Consagrado', 'Internacional'];
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-amber-500';

/** Valor mostrado: el real o «Sin dato» (nunca un supuesto como «Independiente» o «Pendiente»). */
function V({ v, mono = false }: { v?: string | null; mono?: boolean }) {
  return v && v.trim() ? <span className={`text-slate-700 font-semibold ${mono ? 'font-mono' : ''}`}>{v}</span> : <span className="text-slate-400 italic">Sin dato</span>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">{label}</span><div className="text-xs">{children}</div></div>;
}

/** Ficha del artista del Resumen 360: todo editable, sin valores supuestos. */
export default function ArtistFicha({ artist, tours, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(() => toForm(artist));
  function toForm(a: Artist) {
    return {
      artisticName: a.artisticName, legalName: a.legalName, bio: a.bio, genre: a.genre, subgenres: (a.subgenres || []).join(', '), languages: (a.languages || []).join(', '),
      stage: a.stage, startDate: a.startDate || '', city: a.city, state: a.state, country: a.country,
      rfc: a.rfc || '', pro: a.pro || '', isrc: a.isrc || '', iswc: a.iswc || '', label: a.label, publisher: a.publisher, distributor: a.distributor,
      manager: a.manager, bookingAgent: a.bookingAgent,
    };
  }
  const set = (k: keyof ReturnType<typeof toForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const myTours = tours.filter((t) => t.artistId === artist.id || (t as any).artistIds?.includes(artist.id));

  const save = () => {
    if (!f.artisticName.trim()) return;
    onSave({
      ...artist, artisticName: f.artisticName.trim(), legalName: f.legalName.trim(), bio: f.bio.trim(), genre: f.genre.trim(),
      subgenres: list(f.subgenres), languages: list(f.languages), stage: f.stage, startDate: f.startDate, city: f.city.trim(), state: f.state.trim(), country: f.country.trim(),
      rfc: f.rfc.trim() || undefined, pro: f.pro.trim() || undefined, isrc: f.isrc.trim() || undefined, iswc: f.iswc.trim() || undefined,
      label: f.label.trim(), publisher: f.publisher.trim(), distributor: f.distributor.trim(), manager: f.manager.trim(), bookingAgent: f.bookingAgent.trim(),
      updated_at: new Date().toISOString(),
    });
    setEditing(false);
  };

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4" data-testid="artist-ficha">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Ficha del artista</h3>
        {editing ? (
          <div className="flex gap-1.5">
            <button type="button" onClick={() => { setF(toForm(artist)); setEditing(false); }} className="px-2.5 py-1 text-[11px] text-slate-600 hover:bg-white rounded-lg flex items-center gap-1 cursor-pointer"><X className="w-3 h-3" />Cancelar</button>
            <button type="button" onClick={save} disabled={!f.artisticName.trim()} className="px-3 py-1 text-[11px] bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg flex items-center gap-1 disabled:opacity-40 cursor-pointer"><Check className="w-3 h-3" />Guardar cambios</button>
          </div>
        ) : (
          <button type="button" onClick={() => { setF(toForm(artist)); setEditing(true); }} className="px-3 py-1 text-[11px] bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer"><Pencil className="w-3 h-3" />Editar ficha</button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <Section title="Identidad">
            <label className="space-y-0.5"><L>Nombre artístico *</L><input className={inputCls} value={f.artisticName} onChange={set('artisticName')} aria-label="Nombre artístico" /></label>
            <label className="space-y-0.5"><L>Nombre legal / fiscal</L><input className={inputCls} value={f.legalName} onChange={set('legalName')} /></label>
            <label className="space-y-0.5"><L>Etapa de carrera</L><select className={inputCls} value={f.stage} onChange={set('stage')}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="space-y-0.5"><L>Inicio de carrera</L><input type="date" className={inputCls} value={f.startDate} onChange={set('startDate')} /></label>
            <label className="space-y-0.5"><L>Ciudad</L><input className={inputCls} value={f.city} onChange={set('city')} /></label>
            <label className="space-y-0.5"><L>Estado</L><input className={inputCls} value={f.state} onChange={set('state')} /></label>
            <label className="space-y-0.5"><L>País</L><input className={inputCls} value={f.country} onChange={set('country')} /></label>
          </Section>
          <Section title="Música">
            <label className="space-y-0.5"><L>Género principal</L><input className={inputCls} value={f.genre} onChange={set('genre')} aria-label="Género principal" /></label>
            <label className="space-y-0.5"><L>Subgéneros (separados por coma)</L><input className={inputCls} value={f.subgenres} onChange={set('subgenres')} aria-label="Subgéneros" /></label>
            <label className="space-y-0.5"><L>Idiomas (separados por coma)</L><input className={inputCls} value={f.languages} onChange={set('languages')} aria-label="Idiomas" /></label>
          </Section>
          <label className="space-y-0.5 block"><L>Biografía</L><textarea rows={4} className={inputCls} value={f.bio} onChange={set('bio')} aria-label="Biografía" /></label>
          <Section title="Equipo">
            <label className="space-y-0.5"><L>Manager</L><input className={inputCls} value={f.manager} onChange={set('manager')} aria-label="Manager" /></label>
            <label className="space-y-0.5"><L>Agente de booking</L><input className={inputCls} value={f.bookingAgent} onChange={set('bookingAgent')} aria-label="Agente de booking" /></label>
            <label className="space-y-0.5"><L>Sello discográfico</L><input className={inputCls} value={f.label} onChange={set('label')} aria-label="Sello" /></label>
            <label className="space-y-0.5"><L>Editorial</L><input className={inputCls} value={f.publisher} onChange={set('publisher')} /></label>
            <label className="space-y-0.5"><L>Distribución digital</L><input className={inputCls} value={f.distributor} onChange={set('distributor')} /></label>
          </Section>
          <Section title="Registros de obra y legal">
            <label className="space-y-0.5"><L>RFC</L><input className={inputCls} value={f.rfc} onChange={set('rfc')} aria-label="RFC" /></label>
            <label className="space-y-0.5"><L>Sociedad de gestión</L><input className={inputCls} value={f.pro} onChange={set('pro')} placeholder="SACM, ASCAP, BMI…" /></label>
            <label className="space-y-0.5"><L>ISRC predeterminado</L><input className={inputCls} value={f.isrc} onChange={set('isrc')} /></label>
            <label className="space-y-0.5"><L>ISWC</L><input className={inputCls} value={f.iswc} onChange={set('iswc')} /></label>
          </Section>
          <p className="text-[10px] text-slate-400">Los campos vacíos se guardan vacíos: el sistema no rellena nada por su cuenta.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Nombre artístico"><V v={artist.artisticName} /></Field>
            <Field label="Nombre legal / fiscal"><V v={artist.legalName} /></Field>
            <Field label="Etapa de carrera"><V v={artist.stage} /></Field>
            <Field label="Inicio de carrera"><V v={artist.startDate} mono /></Field>
            <Field label="Ciudad"><V v={artist.city} /></Field>
            <Field label="Estado"><V v={artist.state} /></Field>
            <Field label="País"><V v={artist.country} /></Field>
            <Field label="Género principal"><V v={artist.genre} /></Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Subgéneros">{artist.subgenres?.length ? <div className="flex flex-wrap gap-1.5">{artist.subgenres.map((g) => <span key={g} className="bg-white border border-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-lg text-[10px]">{g}</span>)}</div> : <V />}</Field>
            <Field label="Idiomas">{artist.languages?.length ? <div className="flex flex-wrap gap-1.5">{artist.languages.map((g) => <span key={g} className="bg-white border border-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-lg text-[10px]">{g}</span>)}</div> : <V />}</Field>
          </div>
          <Field label="Biografía">{artist.bio?.trim() ? <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{artist.bio}</p> : <V />}</Field>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60">
            <Field label="Manager"><V v={artist.manager} /></Field>
            <Field label="Agente de booking"><V v={artist.bookingAgent} /></Field>
            <Field label="Sello discográfico"><V v={artist.label} /></Field>
            <Field label="Editorial"><V v={artist.publisher} /></Field>
            <Field label="Distribución digital"><V v={artist.distributor} /></Field>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200/60">
            <Field label="RFC"><V v={artist.rfc} mono /></Field>
            <Field label="Sociedad de gestión"><V v={artist.pro} /></Field>
            <Field label="ISRC predeterminado"><V v={artist.isrc} mono /></Field>
            <Field label="ISWC"><V v={artist.iswc} mono /></Field>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-200/60">
        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Giras vinculadas</span>
        {myTours.length ? (
          <div className="flex flex-wrap gap-2">{myTours.map((t) => <span key={t.id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{t.name}</span>)}</div>
        ) : <p className="text-[10px] text-slate-400 italic">Este artista no tiene giras registradas.</p>}
      </div>
    </div>
  );
}

function L({ children }: { children: React.ReactNode }) { return <span className="text-[10px] text-slate-500 font-bold block">{children}</span>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{title}</span><div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">{children}</div></div>;
}
