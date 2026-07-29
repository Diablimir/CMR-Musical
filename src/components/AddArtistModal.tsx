import React, { useState } from 'react';
import { X, UserPlus, Music, MapPin, Sparkles } from 'lucide-react';
import { Artist, ArtistStage } from '../types';
import { createDefaultPipeline } from '../data/mockData';

interface AddArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArtist: (artist: Artist) => void;
}

export default function AddArtistModal({ isOpen, onClose, onAddArtist }: AddArtistModalProps) {
  const [artisticName, setArtisticName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [genre, setGenre] = useState('Alternativo');
  const [stage, setStage] = useState<ArtistStage>('Desarrollo');
  const [city, setCity] = useState('Ciudad de México');
  const [country, setCountry] = useState('México');
  const [manager, setManager] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artisticName.trim()) return;

    const defaultPhoto = photoUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';

    const newArtist: Artist = {
      id: `art-${Date.now()}`,
      artisticName: artisticName.trim(),
      legalName: legalName.trim() || `${artisticName.trim()} Entertainment S.A.`,
      photo: defaultPhoto,
      bio: `${artisticName.trim()} es un artista en etapa ${stage} dentro del portafolio comercial de Flamo CRM.`,
      genre: genre.trim() || 'Alternativo',
      subgenres: ['Indie', 'Alternative'],
      languages: ['Español'],
      startDate: new Date().toISOString().substring(0, 10),
      city: city.trim() || 'CDMX',
      state: 'CDMX',
      country: country.trim() || 'México',
      members: [`${artisticName.trim()} (Vocal/Líder)`],
      manager: manager.trim() || 'Flamo Management',
      bookingAgent: 'Flamo Booking Agency',
      label: 'Independiente',
      publisher: 'Flamo Publishing',
      distributor: 'TuneCore',
      stage: stage,
      socialMedia: {
        instagram: `https://instagram.com/${artisticName.toLowerCase().replace(/\s+/g, '_')}`,
        spotify: `https://spotify.com`,
      },
      pipeline: createDefaultPipeline(),
      history: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString().substring(0, 10),
          title: 'Creación de Registro CRM',
          description: 'Artista dado de alta en el sistema comercial Flamo.',
          type: 'milestone'
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    onAddArtist(newArtist);

    // Reset form
    setArtisticName('');
    setLegalName('');
    setGenre('Alternativo');
    setStage('Desarrollo');
    setCity('Ciudad de México');
    setCountry('México');
    setManager('');
    setPhotoUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-silver-haze rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-silver-haze flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-celestial-canvas/10 border border-celestial-canvas/20 flex items-center justify-center text-celestial-canvas">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Agregar Nuevo Artista</h3>
              <p className="text-[11px] text-slate-500">Registra un nuevo talento en tu portafolio comercial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre Artístico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={artisticName}
              onChange={(e) => setArtisticName(e.target.value)}
              placeholder="Ej. Vladimir Belmont, Sol de Medianoche, etc."
              className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Género Principal
              </label>
              <div className="relative">
                <Music className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ej. Indie Rock, Pop, Urbano"
                  className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Etapa de Carrera
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as ArtistStage)}
                className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all cursor-pointer"
              >
                <option value="Desarrollo">Desarrollo</option>
                <option value="Aficionado">Aficionado</option>
                <option value="Emergente">Emergente</option>
                <option value="Media carrera">Media carrera</option>
                <option value="Consolidado">Consolidado</option>
                <option value="Consagrado">Consagrado</option>
                <option value="Internacional">Internacional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ciudad Origen
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Ciudad de México"
                  className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                País
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. México"
                className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Razón Social / Entidad Legal (Opcional)
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Ej. Empresa / Titular de derechos de cobro"
              className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manager / Representante
            </label>
            <input
              type="text"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="Ej. Andrés Mendoza (Flamo Management)"
              className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL Foto de Perfil (Opcional)
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-50 border border-silver-haze focus:border-celestial-canvas rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none transition-all font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-celestial-canvas hover:bg-celestial-canvas/90 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Guardar Artista en Portafolio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
