import React, { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, RotateCcw, X } from 'lucide-react';

export interface UxPrefs {
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'comfortable';
  highContrast: boolean;
  reduceMotion: boolean;
  showOutlines: boolean;
}

export const DEFAULT_UX_PREFS: UxPrefs = {
  fontSize: 'md',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  showOutlines: false,
};

const STORAGE_KEY = 'flamo_ux_prefs';

export function loadUxPrefs(): UxPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_UX_PREFS, ...JSON.parse(raw) } : DEFAULT_UX_PREFS;
  } catch {
    return DEFAULT_UX_PREFS;
  }
}

/** Aplica las preferencias como atributos data-* en <html> (estilos en index.css). */
export function applyUxPrefs(prefs: UxPrefs) {
  const root = document.documentElement;
  root.dataset.uxFont = prefs.fontSize;
  root.dataset.uxDensity = prefs.density;
  root.dataset.uxContrast = prefs.highContrast ? 'high' : 'normal';
  root.dataset.uxMotion = prefs.reduceMotion ? 'reduce' : 'normal';
  root.dataset.uxOutlines = prefs.showOutlines ? 'on' : 'off';
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex bg-white-chalk border border-silver-haze rounded-lg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
            value === o.value ? 'bg-cosmic-black text-white' : 'text-slate-500 hover:text-cosmic-black'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span>
        <span className="block text-[11px] font-bold text-cosmic-black">{label}</span>
        <span className="block text-[10px] text-slate-400">{hint}</span>
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-8 h-4.5 h-[18px] rounded-full relative shrink-0 transition-colors cursor-pointer ${
          checked ? 'bg-tomato-curry' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${
            checked ? 'translate-x-3.5' : ''
          }`}
        />
      </button>
    </label>
  );
}

export default function UxSettings() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<UxPrefs>(loadUxPrefs);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyUxPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const set = <K extends keyof UxPrefs>(key: K, value: UxPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Visualizar y mejorar la interfaz (UX)"
        className="bg-white hover:bg-slate-50 border border-silver-haze rounded-xl px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-tomato-curry transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Interfaz</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-silver-haze rounded-2xl shadow-xl p-4 z-50 space-y-4 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cosmic-black">Visualización & UX</h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-slate-400 hover:text-cosmic-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tamaño de texto</span>
            <Segmented
              value={prefs.fontSize}
              onChange={(v) => set('fontSize', v)}
              options={[
                { value: 'sm', label: 'Pequeño' },
                { value: 'md', label: 'Normal' },
                { value: 'lg', label: 'Grande' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Densidad</span>
            <Segmented
              value={prefs.density}
              onChange={(v) => set('density', v)}
              options={[
                { value: 'compact', label: 'Compacta' },
                { value: 'comfortable', label: 'Cómoda' },
              ]}
            />
          </div>

          <div className="space-y-3 pt-1">
            <Toggle
              label="Alto contraste"
              hint="Textos y bordes más marcados"
              checked={prefs.highContrast}
              onChange={(v) => set('highContrast', v)}
            />
            <Toggle
              label="Reducir animaciones"
              hint="Desactiva transiciones y pulsos"
              checked={prefs.reduceMotion}
              onChange={(v) => set('reduceMotion', v)}
            />
            <Toggle
              label="Inspeccionar layout"
              hint="Dibuja contornos de cada elemento"
              checked={prefs.showOutlines}
              onChange={(v) => set('showOutlines', v)}
            />
          </div>

          <button
            onClick={() => setPrefs(DEFAULT_UX_PREFS)}
            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-tomato-curry border border-silver-haze rounded-lg py-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer
          </button>
        </div>
      )}
    </div>
  );
}
