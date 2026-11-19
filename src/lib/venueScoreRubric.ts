// Escala por niveles (cada 20 %) de las métricas del Flamo Score de un venue.
// Cada nivel describe QUÉ debe cumplir el foro para merecer ese porcentaje, de modo que asignar el número sea objetivo.
// Los niveles son acumulativos: cada uno incluye lo del anterior.
import type { Venue } from '../types';

export type ScoreKey = 'scoreRentabilidad' | 'scoreResponseTime' | 'scorePuntualidadPago' | 'scoreNegociacion' | 'scoreProduccion' | 'scoreHospitalidad';

export interface ScoreLevel { value: number; short: string; detail: string }
export interface ScoreMetric { key: ScoreKey; label: string; weight: number; color: string; desc: string; levels: ScoreLevel[] }

export const SCORE_STEPS = [20, 40, 60, 80, 100] as const;

export const SCORE_METRICS: ScoreMetric[] = [
  {
    key: 'scoreRentabilidad', label: 'Rentabilidad', weight: 25, color: 'bg-amber-500',
    desc: 'Qué tanto del show cubre el foro y cuánto deja de utilidad.',
    levels: [
      { value: 20, short: 'Invertimos todo', detail: 'Invertimos todo nosotros: el foro no aporta nada al show.' },
      { value: 40, short: 'Equipo de audio', detail: 'El foro tiene equipo de audio.' },
      { value: 60, short: 'Audio + ingeniero', detail: 'Equipo de audio e ingeniero de sonido.' },
      { value: 80, short: 'Audio + ing. + boletos', detail: 'Equipo de audio, ingeniero y venta de boletos (taquilla del foro).' },
      { value: 100, short: '100 % rentable', detail: 'El foro cubre todo y el show deja utilidad: 100 % rentable.' },
    ],
  },
  {
    key: 'scoreResponseTime', label: 'Tiempo de respuesta', weight: 15, color: 'bg-emerald-500',
    desc: 'Velocidad para cotizar, dar fechas disponibles y comunicarse.',
    levels: [
      { value: 20, short: 'No responde', detail: 'No responde o tarda más de 2 semanas.' },
      { value: 40, short: '1–2 semanas', detail: 'Responde en 1 a 2 semanas y hay que insistir.' },
      { value: 60, short: '3–7 días', detail: 'Responde en 3 a 7 días.' },
      { value: 80, short: '24–48 h', detail: 'Responde en 24 a 48 horas con información útil.' },
      { value: 100, short: 'Mismo día', detail: 'Responde el mismo día con fechas disponibles y cotización.' },
    ],
  },
  {
    key: 'scorePuntualidadPago', label: 'Puntualidad de pago', weight: 20, color: 'bg-amber-500',
    desc: 'Cumplimiento del anticipo, la garantía y la liquidación de taquilla.',
    levels: [
      { value: 20, short: 'Hay que reclamar', detail: 'Paga muy tarde y hay que reclamarle varias veces.' },
      { value: 40, short: 'Retrasos > 15 días', detail: 'Paga con retrasos frecuentes de más de 15 días.' },
      { value: 60, short: 'Retrasos menores', detail: 'Paga con retrasos menores (hasta una semana).' },
      { value: 80, short: 'A tiempo', detail: 'Paga a tiempo lo pactado.' },
      { value: 100, short: 'Anticipo + liquidación', detail: 'Anticipo puntual y liquidación el mismo día del show.' },
    ],
  },
  {
    key: 'scoreNegociacion', label: 'Facilidad de negociación', weight: 15, color: 'bg-indigo-500',
    desc: 'Apertura a esquemas mixtos (split, garantía contra porcentaje).',
    levels: [
      { value: 20, short: 'Solo su esquema', detail: 'Solo acepta su propio esquema; no negocia.' },
      { value: 40, short: 'Un esquema', detail: 'Negocia solo un esquema (garantía o porcentaje).' },
      { value: 60, short: 'Ajustes menores', detail: 'Acepta ajustes menores a su propuesta.' },
      { value: 80, short: 'Esquemas mixtos', detail: 'Abierto a esquemas mixtos (split + garantía).' },
      { value: 100, short: 'Flexible y rápido', detail: 'Flexible en todo, cierra rápido y por escrito.' },
    ],
  },
  {
    key: 'scoreProduccion', label: 'Calidad técnica y rider', weight: 15, color: 'bg-rose-500',
    desc: 'Sistema PA, iluminación y técnicos locales.',
    levels: [
      { value: 20, short: 'Sin sistema', detail: 'Sin sistema de sonido ni iluminación propios.' },
      { value: 40, short: 'Sonido básico', detail: 'Sonido básico, sin técnico.' },
      { value: 60, short: 'PA + luces + técnico', detail: 'PA e iluminación suficientes con técnico local.' },
      { value: 80, short: 'Rider casi completo', detail: 'Cumple casi todo el rider de producción.' },
      { value: 100, short: 'Rider completo', detail: 'Cumple el rider completo con técnicos certificados.' },
    ],
  },
  {
    key: 'scoreHospitalidad', label: 'Hospitalidad y experiencia', weight: 10, color: 'bg-purple-500',
    desc: 'Trato al artista, camerinos y catering.',
    levels: [
      { value: 20, short: 'Sin camerino', detail: 'Sin camerino ni atención al artista.' },
      { value: 40, short: 'Camerino básico', detail: 'Camerino básico.' },
      { value: 60, short: 'Camerino + agua', detail: 'Camerino acondicionado y agua.' },
      { value: 80, short: 'Camerino + catering', detail: 'Camerino, catering y trato atento.' },
      { value: 100, short: 'Experiencia completa', detail: 'Catering completo y hospitalidad sobresaliente.' },
    ],
  },
];

/** Nivel correspondiente a un valor: el más alto cuyo umbral se alcanza (null si es 0). */
export function levelFor(metric: ScoreMetric, value: number): ScoreLevel | null {
  let found: ScoreLevel | null = null;
  for (const l of metric.levels) if (value >= l.value) found = l;
  return found;
}

/** Métricas que sí aplican (valor distinto de null). */
export function applicableMetrics(v: Pick<Venue, ScoreKey>): ScoreMetric[] {
  return SCORE_METRICS.filter((m) => v[m.key] !== null && v[m.key] !== undefined);
}

/** Flamo Score 0–100. Las métricas «No aplica» (NP) no cuentan: los pesos de las restantes se reajustan a 100 %. Si ninguna aplica, 0. */
export function computeGlobalScore(v: Pick<Venue, ScoreKey>): number {
  const ms = applicableMetrics(v);
  const totalWeight = ms.reduce((a, m) => a + m.weight, 0);
  if (!totalWeight) return 0;
  return Math.round(ms.reduce((acc, m) => acc + ((v[m.key] as number) || 0) * m.weight, 0) / totalWeight);
}
