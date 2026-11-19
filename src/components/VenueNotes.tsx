import { useState } from 'react';
import { StickyNote, Trash2, Pencil, Check, X } from 'lucide-react';
import type { Event, VenueNote } from '../types';

interface Props {
  notes: VenueNote[];
  events: Event[];                 // shows de este venue (para relacionar la nota con uno)
  authorName?: string;
  onChange: (notes: VenueNote[]) => void;
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
};

/** Notas de seguimiento del recinto: se escriben después de un show (o en cualquier momento) y se guardan en el servidor. */
export default function VenueNotes({ notes, events, authorName, onChange }: Props) {
  const [text, setText] = useState('');
  const [eventId, setEventId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const eventName = (id?: string) => {
    const e = events.find((x) => x.id === id);
    return e ? `${e.name} · ${e.date}` : '';
  };
  // Primero los shows ya realizados, luego los demás.
  const eventOptions = [...events].sort((a, b) => (a.status === 'Completed' ? 0 : 1) - (b.status === 'Completed' ? 0 : 1) || b.date.localeCompare(a.date));

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const note: VenueNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      text: t,
      ...(authorName ? { author: authorName } : {}),
      ...(eventId ? { eventId } : {}),
    };
    onChange([...notes, note]);
    setText('');
    setEventId('');
  };

  const saveEdit = (id: string) => {
    const t = editText.trim();
    if (!t) return;
    onChange(notes.map((n) => (n.id === id ? { ...n, text: t } : n)));
    setEditingId(null);
  };

  return (
    <div className="mt-4" data-testid="venue-notes">
      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
        <StickyNote className="w-3 h-3" /> Notas del recinto ({notes.length})
      </span>

      <div className="bg-white border border-slate-150 rounded-lg p-2 space-y-1.5">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej. Después del show: sonido excelente, pagaron a tiempo, volver a contratar…"
          className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-[11px] text-slate-700 focus:outline-none focus:border-amber-500 resize-y"
        />
        <div className="flex items-center gap-1.5">
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            aria-label="Show relacionado con la nota"
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 text-[10px] text-slate-600"
          >
            <option value="">Sin show específico</option>
            {eventOptions.map((e) => (
              <option key={e.id} value={e.id}>{e.status === 'Completed' ? '✓ ' : ''}{e.name} · {e.date}</option>
            ))}
          </select>
          <button
            type="button" onClick={add} disabled={!text.trim()}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold text-[10px] px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            Agregar nota
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic mt-1.5">Aún no hay notas de este recinto.</p>
      ) : (
        <div className="mt-1.5 max-h-44 overflow-y-auto space-y-1.5 pr-1">
          {sorted.map((n) => (
            <div key={n.id} className="bg-white border border-slate-150 rounded-lg p-2 text-[11px]">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[9px] text-slate-400 font-mono truncate">
                  {fmt(n.date)}{n.author ? ` · ${n.author}` : ''}
                </span>
                {editingId !== n.id && (
                  <span className="flex items-center gap-1 shrink-0">
                    <button type="button" title="Editar nota" onClick={() => { setEditingId(n.id); setEditText(n.text); }} className="p-0.5 text-slate-300 hover:text-amber-600 cursor-pointer"><Pencil className="w-3 h-3" /></button>
                    <button type="button" title="Eliminar nota" onClick={() => { if (window.confirm('¿Eliminar esta nota?')) onChange(notes.filter((x) => x.id !== n.id)); }} className="p-0.5 text-slate-300 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
              {n.eventId && eventName(n.eventId) && (
                <span className="inline-block text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold mb-1">Show: {eventName(n.eventId)}</span>
              )}
              {editingId === n.id ? (
                <div className="space-y-1">
                  <textarea rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-[11px] text-slate-700 focus:outline-none focus:border-amber-500" />
                  <div className="flex gap-1 justify-end">
                    <button type="button" onClick={() => setEditingId(null)} className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer flex items-center gap-1"><X className="w-3 h-3" />Cancelar</button>
                    <button type="button" onClick={() => saveEdit(n.id)} disabled={!editText.trim()} className="px-2 py-0.5 text-[10px] bg-amber-500 text-zinc-950 font-bold rounded disabled:opacity-40 cursor-pointer flex items-center gap-1"><Check className="w-3 h-3" />Guardar</button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{n.text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
