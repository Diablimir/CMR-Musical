import React, { useState } from 'react';
import {
  FileText, Upload, Search, Users, Building2, Trash2, Eye,
  Plus, Check, AlertCircle, FileCheck, HelpCircle, Briefcase, Download
} from 'lucide-react';
import { Contract, Artist, Venue, Tour, Event } from '../types';

interface LegalSuiteProps {
  contracts: Contract[];
  onAddContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
  artists: Artist[];
  venues: Venue[];
  tours: Tour[];
  events: Event[];
}

export default function LegalSuite({
  contracts,
  onAddContract,
  onDeleteContract,
  artists,
  venues,
  tours,
  events,
}: LegalSuiteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedArtistFilter, setSelectedArtistFilter] = useState<string>('all');

  // Form states for uploading a new contract
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Contract['type']>('Performance');
  const [newArtistId, setNewArtistId] = useState('');
  const [newVenueId, setNewVenueId] = useState('');
  const [newEventId, setNewEventId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Contract Viewer State (Mockup preview)
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  // Filtered Contracts List
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = selectedType === 'all' || c.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    const matchesArtist = selectedArtistFilter === 'all' || c.artistId === selectedArtistFilter;

    return matchesSearch && matchesType && matchesStatus && matchesArtist;
  });

  // Handle Simulated Drag-and-Drop Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFile({
        name: file.name,
        size: `${sizeInMB} MB`
      });
      if (!newTitle) {
        // Auto-generate a title from file name
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setNewTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFile({
        name: file.name,
        size: `${sizeInMB} MB`
      });
      if (!newTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setNewTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  // Submit new contract
  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const fileMeta = uploadedFile || {
      name: `CONTRATO_${newType.toUpperCase()}_${Date.now().toString().slice(-4)}.pdf`,
      size: '1.2 MB'
    };

    const newContract: Contract = {
      id: `con-${Date.now()}`,
      title: newTitle,
      type: newType,
      artistId: newArtistId || undefined,
      venueId: newVenueId || undefined,
      eventId: newEventId || undefined,
      fileName: fileMeta.name,
      fileSize: fileMeta.size,
      status: 'Signed', // Default signed for instant demonstration
      uploadedAt: new Date().toISOString(),
      notes: newNotes || undefined,
    };

    onAddContract(newContract);

    // Reset Form
    setNewTitle('');
    setNewType('Performance');
    setNewArtistId('');
    setNewVenueId('');
    setNewEventId('');
    setNewNotes('');
    setUploadedFile(null);
    setShowUploadModal(false);
  };

  // Helper to get Artist Artistic Name
  const getArtistName = (id?: string) => {
    if (!id) return 'General / No asignado';
    const artist = artists.find((a) => a.id === id);
    return artist ? artist.artisticName : 'Artista Desconocido';
  };

  // Helper to get Venue Name
  const getVenueName = (id?: string) => {
    if (!id) return '';
    const v = venues.find((ven) => ven.id === id);
    return v ? v.name : '';
  };

  // Render mock legal clauses based on contract type
  const getContractMockupText = (contract: Contract) => {
    const artistName = getArtistName(contract.artistId).toUpperCase();
    const artistLegal = (artists.find(a => a.id === contract.artistId)?.legalName || 'REPRESENTANTE ARTÍSTICO').toUpperCase();
    const venueName = getVenueName(contract.venueId).toUpperCase();
    const dateStr = new Date(contract.uploadedAt).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    switch (contract.type) {
      case 'Management':
        return `CONTRATO PRESTACIÓN DE SERVICIOS DE REPRENTACIÓN ARTÍSTICA Y MANAGEMENT EXCLUSIVO

Celebrado en la Ciudad de México el día ${dateStr}, entre Flamo Agency S.A. de C.V. (en adelante "EL MANAGER") y ${artistLegal} (en adelante "EL ARTISTA" o "${artistName}").

DECLARACIONES:
I.- EL MANAGER declara ser una sociedad mercantil constituida bajo leyes mexicanas, especialista en el booking, marketing y management estratégico de artistas musicales en México y Latinoamérica.
II.- EL ARTISTA declara ser de nacionalidad mexicana, con plena capacidad jurídica para obligarse y ser el único titular y creador legítimo de su nombre artístico, fonogramas e imagen pública.

CLÁUSULAS:
PRIMERA.- OBJETO. EL ARTISTA contrata en forma de exclusividad y representación mundial a EL MANAGER para la administración, promoción, negociación y desarrollo comercial de su carrera artística integral.
SEGUNDA.- COMISIÓN. Como contraprestación por los servicios de representación, EL MANAGER percibirá el 15.0% (quince por ciento) sobre el total de ingresos brutos generados por EL ARTISTA, incluyendo conciertos en vivo, acuerdos discográficos, patrocinios, mercadotecnia y sincronización de obra.
TERCERA.- VIGENCIA. La vigencia del presente instrumento será de 3 (tres) años forzosos a partir de la firma del mismo, renovable por periodos iguales mediante previo acuerdo escrito.
CUARTA.- CONFIDENCIALIDAD. Ambas partes se comprometen a resguardar bajo estricto secreto comercial la información financiera, logística, de marcas y datos personales surgidos durante la vigencia del contrato.

FIRMAS:
___________________________                 ___________________________
REPRESENTANTE FLAMO AGENCY                 ${artistLegal} (${artistName})`;

      case 'Performance':
      case 'Co-production':
        return `CONTRATO DE PRESTACIÓN DE SERVICIOS ARTÍSTICOS PARA ESPECTÁCULO EN VIVO

Por una parte "FLAMO CONCIERTOS / LA AGENCIA" y por otra parte el administrador del Foro ${venueName || 'DESIGNADO'} (en adelante "EL RECINTO"), para la presentación en vivo del artista ${artistName}.

ACUERDOS COMERCIALES DE PRODUCCIÓN:
1.- FECHA DE PRESENTACIÓN: El evento se llevará a cabo en las instalaciones del recinto el día pactado en el calendario oficial de giras.
2.- PRECIO Y TAQUILLA: Se establece un precio único de boleto. Los ingresos brutos se concentrarán en la cuenta de depósito fiduciario.
3.- RETRIBUCIÓN (SPLIT COMERCIAL): Las partes pactan un esquema de co-producción con recuperación preferencial de gastos operativos comprobables. El remanente de taquilla neta se distribuirá en proporción 70% para el Artista y 30% para el Recinto.
4.- RIDER TÉCNICO: EL RECINTO se obliga a proveer el sistema de audio (PA), iluminación profesional, backline primario y personal de staff técnico conforme al Rider Oficial provisto por el Artista con 30 días de anticipación.
5.- LIQUIDACIÓN DE TAQUILLA: La liquidación monetaria final y el pago de honorarios netos se realizarán en camerinos a la terminación del concierto o a más tardar el siguiente día hábil bancario.

FIRMAS DE CONFORMIDAD:
___________________________                 ___________________________
DIRECCIÓN COMERCIAL FLAMO                  ADMINISTRACIÓN DEL FORO / PROMOTOR`;

      case 'Foro/Arrendamiento':
        return `CONTRATO DE ARRENDAMIENTO TEMPORAL DE INMUEBLE PARA ESPECTÁCULO PÚBLICO

Entre los suscritos a saber: Por una parte el representante legal de ${venueName || 'EL FORO'} y por otra parte FLAMO TOURS, celebran el arrendamiento del inmueble ubicado en la dirección del recinto registrado para la ejecución del show de ${artistName}.

ESTIPULACIONES RELEVANTES:
- PRIMERA.- DESTINO DEL INMUEBLE: El arrendamiento se otorga exclusivamente para la realización de un espectáculo público de música en vivo. El aforo garantizado del inmueble es el estipulado de forma oficial en la base de datos.
- SEGUNDA.- RENTA TOTAL: Se acuerda el pago de la renta del inmueble por día de montaje y ejecución. Se requiere un anticipo del 50% para el bloqueo firme de fecha en la agenda del foro.
- TERCERA.- PERMISOS Y LICENCIAS: El arrendador se responsabiliza de contar con la licencia de funcionamiento vigente. El arrendatario gestionará los permisos municipales específicos del show, el pago de derechos de autor SACM y la contratación de paramédicos.
- CUARTA.- DEPÓSITO DE GARANTÍA: Se constituye un fondo de garantía para responder de eventuales daños físicos o de infraestructura técnica imputables al equipo de producción de la gira.

CONFORMIDAD:
Firmado electrónicamente por ambas corporaciones autorizadas.`;

      default:
        return `CONTRATO CORPORATIVO / DOCUMENTAL LEGAL GENERAL

EXPEDIENTE DIGITAL FLAMO CRM SYSTEM
DOCUMENTO ID: ${contract.id}
TÍTULO: ${contract.title}
ASOCIADO A: ${artistName}
FECHA REGISTRO: ${dateStr}

El presente documento representa el acuerdo formal y digitalizado cargado en el expediente de control del artista. El archivo se encuentra debidamente indexado y resguardado bajo almacenamiento de bases de datos relacionales en la nube, cumpliendo con los estándares de integridad física y firmas transaccionales.

Para aclaraciones legales o enmiendas al presente contrato, contactar de manera inmediata a la oficina de representación comercial o al agente de booking asignado en este CRM.

NOTAS ADICIONALES DEL ARCHIVO:
${contract.notes || 'Ninguna nota ingresada en el registro corporativo.'}`;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Widget */}
      <div className="bg-white border border-silver-haze rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tomato-curry animate-pulse" />
              <h2 className="text-lg font-bold text-cosmic-black uppercase tracking-tight">Módulo Legal & Expedientes de Contratos</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Consola unificada de resguardo legal, contratos de management, NDAs de gira y contratos de arrendamiento firmados para foros de conciertos.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-tomato-curry hover:bg-tomato-curry/90 text-white-chalk font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Nuevo Contrato</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Filters Box */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border border-silver-haze rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Filtros Avanzados</h3>
            
            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Buscar Documento</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ej. Management, Belmont..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze hover:border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tomato-curry/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Filter by Artist */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Filtrar por Artista</label>
              <select
                value={selectedArtistFilter}
                onChange={(e) => setSelectedArtistFilter(e.target.value)}
                className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
              >
                <option value="all">Todos los Artistas</option>
                {artists.filter(a => !a.deleted_at).map((art) => (
                  <option key={art.id} value={art.id}>{art.artisticName}</option>
                ))}
              </select>
            </div>

            {/* Filter by Type */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Tipo de Contrato</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos los Tipos</option>
                <option value="Management">Management</option>
                <option value="Booking">Booking / Representación</option>
                <option value="Performance">Performance (Show en Vivo)</option>
                <option value="Co-production">Co-Producción</option>
                <option value="NDA">NDA (Confidencialidad)</option>
                <option value="Foro/Arrendamiento">Arrendamiento de Foro</option>
                <option value="Other">Otro</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Estatus del Acuerdo</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Todos los Estatus</option>
                <option value="Signed">Firmado (Signed)</option>
                <option value="Active">Activo / En Ejecución</option>
                <option value="Pending">Pendiente de Firma</option>
                <option value="Draft">Borrador (Draft)</option>
                <option value="Rejected">Rechazado</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold">
              <span>Registrados:</span>
              <span className="text-cosmic-black font-semibold">{contracts.length} docs</span>
            </div>
          </div>

          {/* Quick Legal Warnings / Tips */}
          <div className="bg-celestial-canvas/5 border border-celestial-canvas/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-celestial-canvas">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Aviso de Cumplimiento</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Todos los contratos firmados en el sistema Flamo CRM se cifran con sellos transaccionales SHA-256. El almacenamiento cumple con las regulaciones de la Ley Federal de Protección de Datos Personales.
            </p>
          </div>
        </div>

        {/* Center / Right - Contracts List & Action Block */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white border border-silver-haze rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Expediente de Contratos</h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">Filtrados: {filteredContracts.length}</span>
            </div>

            {filteredContracts.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No se encontraron contratos con los filtros activos.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSelectedArtistFilter('all');
                  }}
                  className="mt-3 text-xs text-tomato-curry font-bold underline cursor-pointer"
                >
                  Restaurar Filtros
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      <th className="px-5 py-4">Título del Documento</th>
                      <th className="px-5 py-4">Artista / Foro</th>
                      <th className="px-5 py-4">Tipo</th>
                      <th className="px-5 py-4">Archivo / Tamaño</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContracts.map((c) => {
                      const isLinkedToTourVenue = c.eventId !== undefined;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 text-slate-600 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-tomato-curry shrink-0" />
                              <span>{c.title}</span>
                              {isLinkedToTourVenue && (
                                <span className="bg-prairie-land/20 text-slate-700 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                                  Tour Venue
                                </span>
                              )}
                            </div>
                            {c.notes && (
                              <p className="text-[10px] text-slate-400 mt-1 truncate max-w-sm italic font-medium">
                                "{c.notes}"
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-700">
                            <div className="space-y-1">
                              {c.artistId && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  <span>{getArtistName(c.artistId)}</span>
                                </div>
                              )}
                              {c.venueId && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  <span>{getVenueName(c.venueId)}</span>
                                </div>
                              )}
                              {!c.artistId && !c.venueId && (
                                <span className="text-slate-400 font-normal">Corporativo Flamo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-lg border border-slate-200 font-bold uppercase tracking-wide">
                              {c.type}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-mono text-[10px]">
                              <p className="text-slate-700 truncate max-w-[150px]" title={c.fileName}>{c.fileName}</p>
                              <p className="text-slate-400 mt-0.5">{c.fileSize}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full ${
                              c.status === 'Signed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              c.status === 'Active' ? 'bg-celestial-canvas/10 text-celestial-canvas border border-celestial-canvas/15' :
                              c.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' :
                              'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${c.status === 'Signed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {c.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingContract(c)}
                                className="p-1.5 text-slate-400 hover:text-celestial-canvas hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Ver Contrato Escaneado o Mockup"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el documento "${c.title}" del expediente digital?`)) {
                                    onDeleteContract(c.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-tomato-curry hover:bg-tomato-curry/10 rounded-lg transition-all cursor-pointer"
                                title="Eliminar Registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: PREVIEW / MOCKUP VIEW */}
      {viewingContract && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-silver-haze bg-white-chalk flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-tomato-curry" />
                <div>
                  <h3 className="text-sm font-bold text-cosmic-black uppercase tracking-tight">{viewingContract.title}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {viewingContract.fileName} — {viewingContract.fileSize} | Estado: {viewingContract.status}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingContract(null)}
                className="text-slate-400 hover:text-cosmic-black font-bold text-xs p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                Cerrar Preview
              </button>
            </div>

            {/* Document body simulating a scanned signed PDF contract */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 font-mono text-xs text-slate-800 leading-relaxed border-b border-silver-haze selection:bg-prairie-land/30">
              <div className="bg-white border border-silver-haze p-10 max-w-2xl mx-auto shadow-md whitespace-pre-wrap min-h-[600px] relative">
                
                {/* Simulated Watermark/Stamp */}
                <div className="absolute right-10 top-10 border-2 border-emerald-500/30 text-emerald-500/40 font-bold uppercase font-sans text-center rotate-12 p-2 rounded-xl text-[10px] select-none">
                  FIRMADO DIGITALMENTE<br/>
                  FLAMO SHA256 APPROVED<br/>
                  {new Date(viewingContract.uploadedAt).toLocaleDateString()}
                </div>

                {getContractMockupText(viewingContract)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-semibold">
                Sello Digital: hash_sha256_{viewingContract.id}_ok
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Simulación de descarga completada con éxito. Archivo disponible offline.');
                  }}
                  className="bg-white border border-silver-haze hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Copia PDF</span>
                </a>
                <button
                  onClick={() => setViewingContract(null)}
                  className="bg-celestial-canvas hover:bg-celestial-canvas/90 text-white-chalk font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Entendido / OK
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD FORM */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-cosmic-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-silver-haze rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-silver-haze bg-white-chalk flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-cosmic-black tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-tomato-curry" />
                <span>Expediente: Cargar Contrato Escaneado</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-cosmic-black font-bold text-xs"
              >
                Cancelar
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateContract} className="p-6 space-y-4 text-xs">
              
              {/* Drag and Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-tomato-curry bg-tomato-curry/5 text-tomato-curry'
                    : uploadedFile
                    ? 'border-emerald-300 bg-emerald-50/30 text-emerald-600'
                    : 'border-silver-haze bg-slate-50/50 text-slate-500'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-80 text-slate-400" />
                {uploadedFile ? (
                  <div>
                    <p className="font-semibold text-slate-700">¡Archivo Cargado con Éxito!</p>
                    <p className="font-mono text-[11px] text-slate-400 mt-1">{uploadedFile.name} ({uploadedFile.size})</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">Arrastra y suelta tu archivo de contrato aquí (PDF, JPG, PNG)</p>
                    <p className="text-[10px] text-slate-400 mt-1">O haz clic para explorar en el sistema</p>
                    <input
                      type="file"
                      id="contract-file-upload"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label
                      htmlFor="contract-file-upload"
                      className="mt-3 inline-block bg-white hover:bg-slate-50 border border-silver-haze text-slate-700 font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-sm transition-all text-[11px]"
                    >
                      Explorar Archivo
                    </label>
                  </div>
                )}
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Título / Nombre del Acuerdo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Contrato de Booking Gira Nacional"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tomato-curry/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Tipo de Documento</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-slate-700 focus:outline-none"
                  >
                    <option value="Management">Management</option>
                    <option value="Booking">Booking / Representación</option>
                    <option value="Performance">Performance (Show)</option>
                    <option value="Co-production">Co-Producción</option>
                    <option value="NDA">NDA (Confidencialidad)</option>
                    <option value="Foro/Arrendamiento">Arrendamiento de Foro</option>
                    <option value="Other">Otro</option>
                  </select>
                </div>

                {/* Artist Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Vincular con Artista</label>
                  <select
                    value={newArtistId}
                    onChange={(e) => setNewArtistId(e.target.value)}
                    className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-slate-700 focus:outline-none"
                  >
                    <option value="">Ninguno (Corporativo)</option>
                    {artists.filter(a => !a.deleted_at).map((art) => (
                      <option key={art.id} value={art.id}>{art.artisticName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Venue Selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Vincular con Foro / Sede</label>
                <select
                  value={newVenueId}
                  onChange={(e) => setNewVenueId(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-slate-700 focus:outline-none"
                >
                  <option value="">Ninguno</option>
                  {venues.filter(v => !v.deleted_at).map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Notas / Acuerdos Internos</label>
                <textarea
                  placeholder="Ej. Liquidación del 50% al término del show. Exclusividad territorial de 60km."
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze rounded-xl p-2.5 text-slate-700 placeholder-slate-400 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-white border border-silver-haze text-slate-700 font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-tomato-curry hover:bg-tomato-curry/90 text-white-chalk font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirmar y Guardar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
