import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { resizeImage } from '../lib/image';
import { uploadImage } from '../lib/api';

interface PhotoPickerProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function PhotoPicker({ value, onChange, label = 'Foto de perfil' }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Elige un archivo de imagen (JPG, PNG o WEBP).');
      return;
    }
    setBusy(true);
    try {
      const blob = await resizeImage(file);
      onChange(await uploadImage(blob, file.name.replace(/\.[^.]+$/, '') + '.jpg'));
    } catch (e: any) {
      setError(e.message || 'No se pudo subir la imagen.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <span className="block text-xs font-bold text-slate-700 mb-1">{label} (opcional)</span>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-silver-haze flex items-center justify-center shrink-0">
          {value ? (
            <img src={value} alt="Vista previa" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-7 h-7 text-slate-300" />
          )}
        </div>
        <div className="space-y-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="bg-white hover:bg-slate-50 border border-silver-haze text-slate-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {busy ? 'Subiendo…' : value ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {value && !busy && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs font-bold text-slate-400 hover:text-red-600 px-2 py-2 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Quitar
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">JPG, PNG o WEBP. Se ajusta automáticamente.</p>
          {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
