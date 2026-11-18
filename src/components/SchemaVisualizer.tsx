import React, { useState } from 'react';
import { Database, Shield, Code, Table, Key, Info, TrendingUp, Sparkles, AlertTriangle, CheckCircle, Music, Award, HelpCircle, ArrowRight, UserCheck } from 'lucide-react';
import { Event, Venue, Artist, Provider, Tour, Contract } from '../types';
import { SCHEMA_TABLES, SCHEMA_SQL } from '../data/schemaSql';

interface SchemaVisualizerProps {
  events?: Event[];
  venues?: Venue[];
  artists?: Artist[];
  providers?: Provider[];
  tours?: Tour[];
  contracts?: Contract[];
}

interface SchemaTable {
  name: string;
  description: string;
  columns: { name: string; type: string; key?: 'PK' | 'FK' | 'IDX'; notes: string }[];
  indexes: string[];
}

export default function SchemaVisualizer({
  events = [],
  venues = [],
  artists = [],
  providers = [],
  tours = [],
  contracts = []
}: SchemaVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sql' | 'normalization' | 'decisions'>('overview');
  const [selectedArtistId, setSelectedArtistId] = useState<string>(artists[0]?.id || '');

  // Estructura real de la base (generada desde public/api/schema.php)
  const tables: SchemaTable[] = SCHEMA_TABLES;
  const rawSQL = SCHEMA_SQL;

  return (
    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-zinc-100 font-sans tracking-tight">Arquitectura de Base de Datos</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Análisis de normalización y optimización relacional del CRM empresarial.
          </p>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'overview' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tablas & Relaciones
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'sql' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Código SQL DDL
          </button>
          <button
            onClick={() => setActiveTab('normalization')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'normalization' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Decisiones de Diseño
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'decisions' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Asistente de Decisiones
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tables.map((table) => (
            <div key={table.name} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-500/70" />
                    <span className="font-mono text-sm font-semibold text-zinc-100">{table.name}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">
                    MySQL / InnoDB
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-4">{table.description}</p>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {table.columns.map((col) => (
                    <div key={col.name} className="flex items-start justify-between py-1 border-b border-zinc-800/50 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {col.key === 'PK' && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                        {col.key === 'FK' && <Key className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span className={`font-mono font-medium ${col.key ? 'text-zinc-200' : 'text-zinc-300'}`}>
                          {col.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="font-mono text-zinc-500">{col.type}</span>
                        <span className="text-[10px] text-zinc-400 max-w-[180px] truncate" title={col.notes}>
                          {col.notes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <span className="text-[10px] font-mono text-zinc-500 block mb-1">ÍNDICES DEFINIDOS:</span>
                <div className="space-y-1">
                  {table.indexes.map((idx, index) => (
                    <code key={index} className="block font-mono text-[9px] text-zinc-400 bg-zinc-950 p-1.5 rounded border border-zinc-800/40 truncate">
                      {idx}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="relative">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
            <Code className="w-3 h-3" />
            <span>SQL ANSI Compliance</span>
          </div>
          <pre className="bg-zinc-950 text-zinc-300 font-mono text-[11px] p-4 rounded-lg border border-zinc-800 overflow-x-auto max-h-[480px] leading-relaxed">
            {rawSQL}
          </pre>
        </div>
      )}

      {activeTab === 'normalization' && (
        <div className="space-y-4 text-zinc-300 text-xs leading-relaxed max-h-[480px] overflow-y-auto pr-2">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/60">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-zinc-100 font-sans">1. Identificadores de texto generados por la aplicación</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Cada registro usa un identificador de texto (<code className="text-amber-400 font-mono">VARCHAR(40)</code>, por ejemplo <code className="text-amber-400 font-mono">ven-1731…</code>) que genera la propia interfaz. Es la llave primaria y la base de todas las llaves foráneas. Se eligió sobre <code className="text-amber-400 font-mono">BINARY(16)</code> porque no obliga a convertir ids en cada lectura y escritura, y a la escala de un CRM de management el rendimiento es equivalente.
            </p>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/60">
            <div className="flex items-center gap-2 mb-2">
              <Table className="w-4 h-4 text-amber-500/80" />
              <h3 className="font-semibold text-zinc-100 font-sans">2. Eliminación de ENUMs por Catálogos Relacionales</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Evitamos el uso de tipos <code className="text-amber-400 font-mono">ENUM</code> a nivel de motor de datos. Modificar un enum en producción (por ejemplo, añadir un nuevo estatus o género musical) requiere un bloqueo de esquema (<code className="text-amber-400 font-mono">ALTER TABLE</code>) que puede degradar la disponibilidad del servicio. En su lugar, implementamos tablas catálogo externas <code className="text-amber-400 font-mono">cat_etapas_desarrollo</code> con integridad referencial, permitiendo altas en caliente mediante inserciones convencionales.
            </p>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/60">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-zinc-100 font-sans">3. Resolución del Contacto Principal de un Venue</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              Para resolver la asignación del contacto comercial principal sin sobrecargar la base de datos con triggers cíclicos o búsquedas complejas con cláusulas <code className="text-amber-400 font-mono">WHERE es_principal = 1</code>, se añadió el campo <code className="text-amber-400 font-mono">contacto_principal_id</code> directamente en la definición de la tabla <code className="text-amber-400 font-mono">venues</code>. Esto proporciona un camino directo (O(1)) para consultar el contacto principal en JOINs de alta demanda.
            </p>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/60">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-zinc-100 font-sans">4. Soft Deletes e Integridad Histórica</h3>
            </div>
            <p className="text-zinc-400 text-[11px]">
              La pérdida de registros financieros o históricos es un riesgo crítico en un CRM musical. Las tablas <code className="text-amber-400 font-mono">artistas</code>, <code className="text-amber-400 font-mono">venues</code>, <code className="text-amber-400 font-mono">tours</code> y <code className="text-amber-400 font-mono">eventos</code> incluyen <code className="text-amber-400 font-mono">deleted_at</code>: un artista eliminado se oculta del portafolio pero conserva su historial. Además, las llaves foráneas impiden borrar un venue o un artista que todavía tiene eventos o giras, y el servidor avisa con un mensaje claro en lugar de dejar datos huérfanos.</p>
          </div>
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="space-y-6 animate-fade-in text-zinc-300">
          
          {/* Header Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="text-xs font-bold uppercase text-zinc-100 tracking-wider">Cerebro de Decisiones Comerciales (CRM Analytics)</h3>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                Esta interfaz utiliza la base de datos relacional para cruzar métricas históricas de taquilla, ratings de recintos, valoraciones del ritmo de setlist y costos de proveedores. Ofrece predicciones y recomendaciones automáticas para maximizar la rentabilidad y reducir los riesgos en tus próximas giras.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Select Artist & Venue Recommender (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Select Artist Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Seleccionar Artista para Análisis</label>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase font-mono">
                    Predicciones Activas
                  </span>
                </div>
                
                <select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                >
                  <option value="">-- Elige un Artista --</option>
                  {artists.filter(a => !a.deleted_at).map(art => (
                    <option key={art.id} value={art.id}>{art.artisticName} ({art.stage})</option>
                  ))}
                </select>

                {selectedArtistId && (() => {
                  const art = artists.find(a => a.id === selectedArtistId);
                  if (!art) return null;

                  // Evaluate recommended venues
                  // Rule: emergencies get small venues (< 1000 capacity), consolidated get larger venues
                  const artistStage = art.stage;
                  const isLargeScale = artistStage === 'Consolidado' || artistStage === 'Consagrado' || artistStage === 'Internacional';

                  const suggestedVenues = venues
                    .filter(v => !v.deleted_at)
                    .map(v => {
                      // Calculate score
                      let score = v.rating * 10; // base rating score (up to 50)
                      score += v.scoreRentabilidad * 0.3;
                      score += v.scorePuntualidadPago * 0.2;

                      // Affinity multiplier
                      let affinityReason = "Afinidad de género y buena reputación del foro.";
                      if (isLargeScale && v.establishmentType.includes('Teatro') || v.name.includes('Teatro') || v.name.includes('Auditorio')) {
                        score += 20;
                        affinityReason = "Capacidad e infraestructura premium adecuada para audiencias masivas.";
                      } else if (!isLargeScale && (v.name.includes('Foro') || v.name.includes('Café') || v.name.includes('Stage'))) {
                        score += 20;
                        affinityReason = "Aforo íntimo óptimo para generar 'Sold Outs' rápidos y alta cercanía.";
                      }

                      return { venue: v, computedScore: Math.round(score), affinityReason };
                    })
                    .sort((a, b) => b.computedScore - a.computedScore)
                    .slice(0, 3);

                  return (
                    <div className="pt-2.5 border-t border-zinc-800 space-y-3.5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-zinc-200">Recomendador Inteligente de Foros para: <span className="text-amber-400 font-black">{art.artisticName}</span></span>
                      </div>

                      <div className="space-y-2.5">
                        {suggestedVenues.map(({ venue, computedScore, affinityReason }, index) => {
                          // Project average profit based on ticket price and capacity
                          const projPrice = isLargeScale ? 750 : 450;
                          const projAttendance = Math.round(venue.userRatingsCount > 5000 ? venue.rating * 500 : venue.rating * 120);
                          const projIncome = projAttendance * projPrice;
                          const projExpenses = Math.round(projIncome * 0.35);
                          const projProfit = projIncome - projExpenses;

                          return (
                            <div key={venue.id} className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                      {index + 1}° Opción
                                    </span>
                                    <h4 className="text-xs font-black text-zinc-100">{venue.name}</h4>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 mt-1 font-semibold">{venue.city} · {venue.establishmentType}</p>
                                  <p className="text-[10px] text-zinc-500 italic mt-1 font-medium">💡 Razonamiento: {affinityReason}</p>
                                </div>

                                <div className="text-right">
                                  <span className="text-[10px] text-zinc-500 font-bold block">FLAMO MATCH</span>
                                  <span className="text-xs font-black text-emerald-400 font-mono">{computedScore}%</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-900 text-center text-[10px]">
                                <div>
                                  <span className="text-zinc-500 font-medium block">Puntualidad Pago</span>
                                  <span className="text-zinc-300 font-bold block font-mono mt-0.5">{venue.scorePuntualidadPago}%</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 font-medium block">Aforo Proyectado</span>
                                  <span className="text-zinc-300 font-bold block font-mono mt-0.5">{projAttendance.toLocaleString()} pax</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 font-medium block font-bold text-emerald-500/80">Utilidad Est.</span>
                                  <span className="text-emerald-400 font-bold block font-mono mt-0.5">+${projProfit.toLocaleString()} MXN</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {!selectedArtistId && (
                  <div className="text-center py-8 text-zinc-500 font-medium">
                    Por favor selecciona un artista para obtener recomendaciones automáticas de contratación de foros.
                  </div>
                )}
              </div>

              {/* Setlist pacing warning card */}
              {selectedArtistId && (() => {
                const art = artists.find(a => a.id === selectedArtistId);
                if (!art) return null;

                // Find all past events of this artist
                const artistPastEvents = events.filter(e => e.artistId === art.id && e.status === 'Completed');
                const eventWithFeedback = artistPastEvents.find(e => e.feedback && e.feedback.pacingRating);

                return (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-xs font-bold text-zinc-200">Análisis del Ritmo de Canciones (Setlist Auditor)</span>
                    </div>

                    {eventWithFeedback && eventWithFeedback.feedback ? (
                      <div className="space-y-2.5">
                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-[11px] leading-relaxed">
                          <p className="font-bold text-zinc-100 flex items-center justify-between">
                            <span>Último Show Auditado: <span className="text-amber-400 font-mono">{eventWithFeedback.name}</span></span>
                            <span className="text-amber-400">★ {eventWithFeedback.feedback.pacingRating}.0 / 5.0 Ritmo</span>
                          </p>
                          <p className="text-zinc-400 mt-2 italic">
                            " {eventWithFeedback.feedback.artistThoughts} "
                          </p>
                          <p className="text-zinc-400 mt-1 italic font-semibold text-indigo-400">
                            Reacción de la gente: "{eventWithFeedback.feedback.crowdReaction}"
                          </p>
                        </div>

                        <div className="bg-indigo-950/40 border border-indigo-900/40 p-3 rounded-lg text-[10px] space-y-1">
                          <span className="font-bold text-indigo-400 uppercase tracking-wider block">Decisión Sugerida por Datos:</span>
                          <p className="text-zinc-300 font-medium">
                            {eventWithFeedback.feedback.optimizationNotes}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-400 space-y-2 leading-relaxed">
                        <p className="font-semibold text-zinc-300">No hay feedback de ritmo guardado aún para los shows de este artista.</p>
                        <p className="font-mono text-[10px] text-zinc-500 bg-zinc-950 p-2.5 rounded border border-zinc-800">
                          CONSEJO DE DISEÑO DE SHOW: Mantén un balance de al menos 40% canciones rápidas para foros tipo "Stage" (Café Iguana, C3 Stage), y guarda las canciones lentas / baladas únicamente para la sección media del setlist o el encore acústico.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Right Side: Suppliers and Legal Risks (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Cost-Efficiency of Providers */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Eficiencia de Proveedores (Mejores Ratios)</span>
                
                <div className="space-y-2.5">
                  {providers.length > 0 ? (
                    [...providers]
                      .map(p => {
                        // Rating ratio (Stars per $1000 MXN)
                        const ratio = p.costPerShow > 0 ? (p.rating / p.costPerShow) * 1000 : 0;
                        return { provider: p, ratio };
                      })
                      .sort((a, b) => b.ratio - a.ratio)
                      .slice(0, 3)
                      .map(({ provider, ratio }) => (
                        <div key={provider.id} className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-200">{provider.name}</span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                              ★ {provider.rating}.0
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-400">
                            <span>Categoría: <span className="text-zinc-300 font-bold">{provider.category}</span></span>
                            <span>Costo Base: <span className="text-amber-400 font-mono font-bold">${provider.costPerShow.toLocaleString()} MXN</span></span>
                          </div>

                          <div className="text-[9px] text-zinc-500 mt-1 italic font-medium">
                            Recomendación: Proveedor altamente calificado. Costo-beneficio óptimo de {ratio.toFixed(2)} pts de satisfacción por cada $1K invertido.
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-[10px] text-zinc-500 italic">No hay proveedores dados de alta en el sistema para calcular eficiencia.</p>
                  )}
                </div>
              </div>

              {/* Legal Risks & Missing Agreements */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Expediente Legal & Alertas de Riesgo</span>
                
                <div className="space-y-2">
                  {(() => {
                    // Find upcoming events that are missing a contract in our contracts DB
                    const upcomingShows = events.filter(e => e.status === 'Confirmed' || e.status === 'Draft');
                    const missingContracts = upcomingShows.filter(evt => !contracts.some(c => c.eventId === evt.id));

                    if (missingContracts.length === 0) {
                      return (
                        <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg flex items-start gap-2 text-[11px]">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-emerald-300 font-semibold">¡Felicidades! Todos los conciertos próximos tienen su contrato legal adjunto y firmado en la base de datos.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <div className="bg-rose-950/25 border border-rose-900/40 p-3 rounded-lg flex items-start gap-2 text-[11px]">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                          <div>
                            <p className="text-rose-300 font-bold">Riesgos Legales Detectados ({missingContracts.length})</p>
                            <p className="text-zinc-400 text-[10px] mt-0.5">Se encontraron fechas confirmadas en el calendario que carecen de contratos cargados o firmados:</p>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                          {missingContracts.map(evt => {
                            const art = artists.find(a => a.id === evt.artistId);
                            const ven = venues.find(v => v.id === evt.venueId);
                            return (
                              <div key={evt.id} className="bg-zinc-950 border border-zinc-850 p-2 rounded text-[10px] flex items-center justify-between gap-1.5">
                                <div className="truncate">
                                  <span className="font-bold text-zinc-300 block truncate">{evt.name}</span>
                                  <span className="text-zinc-500 font-mono text-[9px]">{evt.date} · Foro: {ven?.name || 'Indeterminado'}</span>
                                </div>
                                <span className="bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded font-bold text-[8px] font-mono shrink-0 uppercase">
                                  CONTRATO FALTANTE
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
