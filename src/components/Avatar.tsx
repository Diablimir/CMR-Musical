import { useState } from 'react';
import type React from 'react';

interface Props { src?: string; name: string; className?: string; style?: React.CSSProperties; textClass?: string }

/** Foto del artista; si no hay foto o no carga, muestra sus iniciales (nunca la imagen rota ni el texto alternativo encima). */
export default function Avatar({ src, name, className = '', style, textClass = 'text-sm' }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
  if (src && !failed) return <img src={src} alt={name} style={style} className={className} onError={() => setFailed(true)} />;
  return (
    <span role="img" aria-label={name} className={`${className} inline-flex items-center justify-center bg-celestial-canvas text-white font-bold select-none ${textClass}`}>{initials}</span>
  );
}
