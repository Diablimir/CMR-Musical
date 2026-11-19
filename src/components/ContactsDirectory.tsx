import React, { useMemo, useState } from 'react';
import { Contact2, Plus, Search, Trash2, Edit2, X, Mail, Phone, Link2, Star } from 'lucide-react';
import { Artist, Contact, ContactChannel, ContactLink, Provider, Venue } from '../types';

interface ContactsDirectoryProps {
  contacts: Contact[];
  venues: Venue[];
  artists: Artist[];
  providers: Provider[];
  onSave: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_ROLES = ['Manager', 'Booking', 'Promotor', 'Técnico', 'Hospitalidad', 'Producción', 'Administración', 'Contacto comercial', 'Contacto'];
const TYPE_LABEL: Record<ContactLink['type'], string> = { venue: 'Venue', artist: 'Artista', provider: 'Proveedor' };

export default function ContactsDirectory({ contacts, venues, artists, providers, onSave, onDelete }: ContactsDirectoryProps) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Contact | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emails, setEmails] = useState<ContactChannel[]>([]);
  const [phones, setPhones] = useState<ContactChannel[]>([]);
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  const entityName = (l: ContactLink): string => {
    if (l.type === 'venue') return venues.find((v) => v.id === l.id)?.name || 'Venue eliminado';
    if (l.type === 'artist') return artists.find((a) => a.id === l.id)?.artisticName || 'Artista archivado';
    return providers.find((p) => p.id === l.id)?.name || 'Proveedor eliminado';
  };
  const entityOptions = (type: ContactLink['type']) =>
    type === 'venue' ? venues.map((v) => ({ id: v.id, name: v.name }))
      : type === 'artist' ? artists.map((a) => ({ id: a.id, name: a.artisticName }))
      : providers.map((p) => ({ id: p.id, name: p.name }));
  const roleSuggestions = useMemo(
    () => Array.from(new Set([...DEFAULT_ROLES, ...contacts.flatMap((c) => (c.links || []).map((l) => l.role)).filter(Boolean)])),
    [contacts]
  );

  const filtered = contacts.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const text = [c.name, c.email, c.phone, ...(c.emails || []).map((e) => e.value), ...(c.links || []).map((l) => `${l.role} ${entityName(l)}`)].join(' ').toLowerCase();
    return text.includes(q);
  });

  const openNew = () => {
    setIsNew(true); setEditing({ id: '', name: '', email: '', phone: '', role: '', venueId: '' });
    setFirstName(''); setLastName(''); setEmails([{ value: '', primary: true }]); setPhones([{ value: '', primary: true }]); setLinks([]); setError(null);
  };
  const openEdit = (c: Contact) => {
    setIsNew(false); setEditing(c);
    setFirstName(c.firstName ?? c.name); setLastName(c.lastName ?? '');
    setEmails(c.emails?.length ? c.emails : c.email ? [{ value: c.email, primary: true }] : [{ value: '', primary: true }]);
    setPhones(c.phones?.length ? c.phones : c.phone ? [{ value: c.phone, primary: true }] : [{ value: '', primary: true }]);
    setLinks(c.links?.length ? c.links : c.venueId ? [{ type: 'venue', id: c.venueId, role: c.role, isPrincipal: false }] : []);
    setError(null);
  };

  const setPrimary = (list: ContactChannel[], i: number) => list.map((x, k) => ({ ...x, primary: k === i }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!firstName.trim()) { setError('El nombre es obligatorio.'); return; }
    const cleanEmails = emails.filter((x) => x.value.trim()).map((x) => ({ ...x, value: x.value.trim() }));
    const cleanPhones = phones.filter((x) => x.value.trim()).map((x) => ({ ...x, value: x.value.trim() }));
    const cleanLinks = links.filter((l) => l.id);
    if (cleanLinks.some((l) => !l.role.trim())) { setError('Cada vínculo necesita un rol (por ejemplo, Booking o Manager).'); return; }
    const venueLink = cleanLinks.find((l) => l.type === 'venue');
    const contact: Contact = {
      ...editing,
      id: isNew ? `con-${Date.now()}` : editing.id,
      firstName: firstName.trim(), lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      emails: cleanEmails, phones: cleanPhones, links: cleanLinks,
      email: (cleanEmails.find((x) => x.primary) || cleanEmails[0])?.value || '',
      phone: (cleanPhones.find((x) => x.primary) || cleanPhones[0])?.value || '',
      role: (venueLink || cleanLinks[0])?.role || '',
      venueId: venueLink?.id || '',
    };
    onSave(contact);
    setEditing(null);
  };

  const inputCls = 'w-full bg-white border border-silver-haze rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-celestial-canvas/20';

  return (
    <div className="space-y-5">
      <div className="bg-white border border-silver-haze rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Contact2 className="w-5 h-5 text-tomato-curry" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-cosmic-black">Directorio de contactos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cada persona existe una sola vez y puede estar vinculada a varios venues, artistas y proveedores, con un rol en cada uno.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, correo, rol o entidad…" className={inputCls + ' pl-9 w-72'} />
          </div>
          <button onClick={openNew} className="bg-cosmic-black hover:bg-celestial-canvas text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Nuevo contacto
          </button>
        </div>
      </div>

      <div className="bg-white border border-silver-haze rounded-2xl shadow-sm overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">{contacts.length === 0 ? 'Aún no hay contactos. Crea el primero con «Nuevo contacto».' : 'Ningún contacto coincide con la búsqueda.'}</p>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-white-chalk text-slate-500 uppercase tracking-wider">
              <tr><th className="px-5 py-3">Persona</th><th className="px-5 py-3">Vínculos y rol</th><th className="px-5 py-3">Correo</th><th className="px-5 py-3">Teléfono</th><th className="px-5 py-3 w-24" /></tr>
            </thead>
            <tbody className="divide-y divide-silver-haze">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white-chalk/60">
                  <td className="px-5 py-3 font-bold text-cosmic-black">{c.name}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(c.links || []).length === 0 && <span className="text-slate-400">Sin vínculos</span>}
                      {(c.links || []).map((l, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 text-slate-700">
                          {l.isPrincipal && <Star className="w-3 h-3 text-amber-600" />}
                          <b>{l.role}</b> · {TYPE_LABEL[l.type]}: {entityName(l)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.email || '—'}{(c.emails?.length || 0) > 1 && <span className="text-slate-400"> +{(c.emails!.length - 1)}</span>}</td>
                  <td className="px-5 py-3 text-slate-600">{c.phone || '—'}{(c.phones?.length || 0) > 1 && <span className="text-slate-400"> +{(c.phones!.length - 1)}</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} title="Editar" className="p-1.5 rounded-lg text-slate-500 hover:text-celestial-canvas hover:bg-slate-100 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (window.confirm(`¿Eliminar a ${c.name}? Se quitarán todos sus vínculos.`)) onDelete(c.id); }} title="Eliminar" className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-cosmic-black/60 flex items-center justify-center p-4 z-50" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <form onSubmit={handleSave} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 bg-white-chalk border-b border-silver-haze flex items-center justify-between sticky top-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cosmic-black">{isNew ? 'Nuevo contacto' : 'Editar contacto'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-cosmic-black cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-5">
              {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl px-3 py-2">{error}</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1"><span className="text-[10px] uppercase font-bold text-slate-500">Nombre *</span><input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus /></label>
                <label className="space-y-1"><span className="text-[10px] uppercase font-bold text-slate-500">Apellidos</span><input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
              </div>

              {([['Correos', Mail, emails, setEmails, 'correo@dominio.com'], ['Teléfonos', Phone, phones, setPhones, '+52 55 0000 0000']] as const).map(([title, Icon, list, setList, ph]) => (
                <div key={title} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" />{title}</span>
                    <button type="button" onClick={() => setList([...list, { value: '', primary: list.length === 0 }])} className="text-xs font-bold text-celestial-canvas hover:underline cursor-pointer">+ Añadir</button>
                  </div>
                  {list.map((x, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input className={inputCls} placeholder={ph} value={x.value} onChange={(e) => setList(list.map((y, k) => (k === i ? { ...y, value: e.target.value } : y)))} />
                      <input className={inputCls + ' max-w-[7.5rem]'} placeholder="Etiqueta" value={x.label ?? ''} onChange={(e) => setList(list.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)))} />
                      <label className="flex items-center gap-1 text-xs text-slate-600 whitespace-nowrap cursor-pointer"><input type="radio" checked={!!x.primary} onChange={() => setList(setPrimary(list, i))} /> Principal</label>
                      <button type="button" onClick={() => setList(list.filter((_, k) => k !== i))} className="text-slate-400 hover:text-red-600 cursor-pointer" title="Quitar"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ))}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" />Vínculos (venue, artista o proveedor) y rol</span>
                  <button type="button" onClick={() => setLinks([...links, { type: 'venue', id: '', role: '', isPrincipal: false }])} className="text-xs font-bold text-celestial-canvas hover:underline cursor-pointer">+ Añadir vínculo</button>
                </div>
                {links.length === 0 && <p className="text-xs text-slate-400">Sin vínculos: la persona queda en el directorio sin ligarse a ninguna entidad.</p>}
                {links.map((l, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <select className={inputCls + ' col-span-3'} value={l.type} onChange={(e) => setLinks(links.map((y, k) => (k === i ? { ...y, type: e.target.value as ContactLink['type'], id: '' } : y)))}>
                      <option value="venue">Venue</option><option value="artist">Artista</option><option value="provider">Proveedor</option>
                    </select>
                    <select className={inputCls + ' col-span-4'} value={l.id} onChange={(e) => setLinks(links.map((y, k) => (k === i ? { ...y, id: e.target.value } : y)))}>
                      <option value="">Elegir…</option>
                      {entityOptions(l.type).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                    <input className={inputCls + ' col-span-3'} list="roles-contacto" placeholder="Rol" value={l.role} onChange={(e) => setLinks(links.map((y, k) => (k === i ? { ...y, role: e.target.value } : y)))} />
                    <label className="col-span-1 flex items-center justify-center cursor-pointer" title="Contacto principal de esa entidad"><input type="checkbox" checked={!!l.isPrincipal} onChange={(e) => setLinks(links.map((y, k) => (k === i ? { ...y, isPrincipal: e.target.checked } : y)))} /></label>
                    <button type="button" onClick={() => setLinks(links.filter((_, k) => k !== i))} className="col-span-1 text-slate-400 hover:text-red-600 cursor-pointer" title="Quitar"><X className="w-4 h-4 mx-auto" /></button>
                  </div>
                ))}
                <datalist id="roles-contacto">{roleSuggestions.map((r) => <option key={r} value={r} />)}</datalist>
              </div>
            </div>
            <div className="p-4 border-t border-silver-haze flex justify-end gap-2 sticky bottom-0 bg-white">
              <button type="button" onClick={() => setEditing(null)} className="text-xs font-bold text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">Cancelar</button>
              <button type="submit" className="bg-cosmic-black hover:bg-celestial-canvas text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer">Guardar contacto</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
