import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Globe } from 'lucide-react';

// Monkey-patch Leaflet DomUtil methods to prevent "_leaflet_pos" errors on detached/unmounted elements
if (typeof window !== 'undefined' && L && L.DomUtil) {
  const origGetPosition = L.DomUtil.getPosition;
  if (origGetPosition) {
    L.DomUtil.getPosition = function (el: HTMLElement) {
      if (!el) {
        return new L.Point(0, 0);
      }
      try {
        return (el as any)._leaflet_pos || origGetPosition.call(this, el) || new L.Point(0, 0);
      } catch {
        return new L.Point(0, 0);
      }
    };
  }

  const origSetPosition = L.DomUtil.setPosition;
  if (origSetPosition) {
    L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
      if (!el) return;
      try {
        origSetPosition.call(this, el, point);
      } catch {
        // ignore
      }
    };
  }
}

interface MapVenue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  address?: string;
  statusState?: 'completed' | 'upcoming' | 'none' | string;
}

interface LeafletMapProps {
  venues: MapVenue[];
  selectedVenueId?: string | null;
  onSelectVenue?: (venueId: string) => void;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  singleVenueHighlight?: boolean;
}

export default function LeafletMap({
  venues,
  selectedVenueId,
  onSelectVenue,
  defaultCenter = [23.6345, -102.5528], // Center of Mexico
  defaultZoom = 5,
  singleVenueHighlight = false
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapStyle, setMapStyle] = useState<'dark' | 'light' | 'standard'>('dark');

  // Tile layers mapping
  const tileLayers = {
    standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  };

  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
    }

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    let initTimeout: number | null = null;

    try {
      // Create leaflet map
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true
      });

      mapInstanceRef.current = map;

      // Add TileLayer
      const tileLayerUrl = tileLayers[mapStyle];
      const tileLayer = L.tileLayer(tileLayerUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      currentTileLayerRef.current = tileLayer;

      // Add LayerGroup for markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      // Standard leaflet CSS bugfix for zoom control border/shadow
      const zoomContainer = map.zoomControl?.getContainer();
      if (zoomContainer) {
        zoomContainer.classList.add('border', 'border-slate-800', 'rounded-xl', 'overflow-hidden', 'shadow-lg');
      }

      // Trigger map resize check to render tiles correctly
      initTimeout = window.setTimeout(() => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.invalidateSize({ animate: false });
          } catch {
            // ignore
          }
        }
      }, 100);
    } catch (err) {
      console.warn('Error initializing Leaflet map:', err);
    }

    return () => {
      if (initTimeout) clearTimeout(initTimeout);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map instance:', e);
        }
        mapInstanceRef.current = null;
        currentTileLayerRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update map tiles style when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      try {
        map.removeLayer(currentTileLayerRef.current);
      } catch {
        // ignore
      }
    }

    try {
      const newTileLayer = L.tileLayer(tileLayers[mapStyle], {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      currentTileLayerRef.current = newTileLayer;
    } catch {
      // ignore
    }
  }, [mapStyle]);

  // Update markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    const activeTimeouts: number[] = [];

    try {
      map.closePopup();
      markersLayer.clearLayers();
    } catch {
      // ignore
    }

    // Map through venues and add markers
    venues.forEach((v) => {
      const lat = Number(v.lat);
      const lng = Number(v.lng);
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const isSelected = selectedVenueId === v.id;
      
      // Select statusState
      let statusState = v.statusState || 'none';
      if (singleVenueHighlight) {
        statusState = 'highlight';
      }

      // Marker Icon
      let colorClass = 'bg-slate-400';
      let ringClass = 'ring-slate-300';
      
      if (statusState === 'completed') {
        colorClass = 'bg-emerald-500';
        ringClass = 'ring-emerald-200';
      } else if (statusState === 'upcoming') {
        colorClass = 'bg-amber-400';
        ringClass = 'ring-amber-200';
      } else if (statusState === 'highlight') {
        colorClass = 'bg-orange-500';
        ringClass = 'ring-orange-200';
      }

      const pulseHtml = isSelected ? `
        <span class="absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75 animate-ping"></span>
      ` : '';

      const scaleClass = isSelected ? 'scale-125 z-[2000]' : 'hover:scale-115 transition-transform duration-200';

      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 ${scaleClass}">
            ${pulseHtml}
            <div class="relative flex items-center justify-center w-5 h-5 rounded-full ${colorClass} border-2 border-white shadow-lg ring-2 ${ringClass} ring-opacity-50">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        className: 'custom-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Create marker
      const marker = L.marker([lat, lng], { icon: customIcon });

      // Create popup
      const popupContent = `
        <div class="p-2 font-sans space-y-1 text-slate-800" style="min-width: 150px;">
          <p class="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1">${v.name}</p>
          ${v.address ? `<p class="text-[10px] text-slate-500 leading-normal">${v.address}</p>` : ''}
          ${v.city || v.state ? `<p class="text-[9px] font-semibold text-slate-400">${v.city || ''}${v.city && v.state ? ', ' : ''}${v.state || ''}</p>` : ''}
          ${v.statusState === 'completed' ? `<span class="inline-block text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 py-0.5 rounded font-bold mt-1">✓ Completado</span>` : ''}
          ${v.statusState === 'upcoming' ? `<span class="inline-block text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1 py-0.5 rounded font-bold mt-1">★ Agendado</span>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-leaflet-popup'
      });

      // Click behavior
      marker.on('click', () => {
        if (onSelectVenue) {
          onSelectVenue(v.id);
        }
      });

      // Add to group
      markersLayer.addLayer(marker);

      // If is selected, open popup and pan to it
      if (isSelected) {
        const tid = window.setTimeout(() => {
          if (mapInstanceRef.current && markersLayerRef.current && markersLayerRef.current.hasLayer(marker)) {
            try {
              marker.openPopup();
              if (!singleVenueHighlight) {
                mapInstanceRef.current.panTo([lat, lng], { animate: false });
              }
            } catch {
              // ignore
            }
          }
        }, 100);
        activeTimeouts.push(tid);
      }
    });

    return () => {
      activeTimeouts.forEach(id => clearTimeout(id));
    };
  }, [venues, selectedVenueId, singleVenueHighlight]);

  // Center on selected venue when selectedVenueId changes (specifically for lists)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVenueId || singleVenueHighlight) return;

    const targetVenue = venues.find(v => v.id === selectedVenueId);
    if (targetVenue) {
      const lat = Number(targetVenue.lat);
      const lng = Number(targetVenue.lng);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        try {
          map.setView([lat, lng], map.getZoom() < 8 ? 8 : map.getZoom(), { animate: false });
        } catch {
          // ignore
        }
      }
    }
  }, [selectedVenueId, venues, singleVenueHighlight]);

  // Handle ResizeObserver to automatically adjust map canvas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize({ animate: false });
        } catch {
          // ignore
        }
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-zinc-950">
      {/* Map style toggle overlay */}
      <div className="absolute top-3 right-3 z-[1000] flex bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-md backdrop-blur-xs">
        <button
          onClick={() => setMapStyle('dark')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
            mapStyle === 'dark'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Mapa Oscuro"
        >
          <span>Oscuro</span>
        </button>
        <button
          onClick={() => setMapStyle('light')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
            mapStyle === 'light'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Mapa Claro"
        >
          <span>Claro</span>
        </button>
        <button
          onClick={() => setMapStyle('standard')}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
            mapStyle === 'standard'
              ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="OpenStreetMap Standard"
        >
          <Globe className="w-3 h-3" />
          <span>Físico</span>
        </button>
      </div>

      {/* Leaflet instance element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 rounded-lg overflow-hidden" />

      {/* Embedded style overrides for Leaflet Popups & Zoom to blend into the app's clean aesthetics */}
      <style>{`
        .leaflet-container {
          background-color: #090d0f !important;
          outline: none;
        }
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          color: #1e293b !important;
          border-radius: 12px !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          padding: 2px !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          margin: 12px !important;
        }
        .leaflet-control-zoom a {
          background-color: #18181b !important;
          color: #d4d4d8 !important;
          border-bottom: 1px solid #27272a !important;
          border-right: none !important;
          border-left: none !important;
          border-top: none !important;
          transition: all 0.15s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #27272a !important;
          color: #fbbf24 !important;
        }
        .leaflet-control-zoom-in {
          border-top-left-radius: 10px !important;
          border-top-right-radius: 10px !important;
        }
        .leaflet-control-zoom-out {
          border-bottom-left-radius: 10px !important;
          border-bottom-right-radius: 10px !important;
          border-bottom: none !important;
        }
        .leaflet-bar {
          box-shadow: none !important;
        }
        .leaflet-attribution-control {
          background: rgba(9, 13, 15, 0.8) !important;
          color: #71717a !important;
          font-size: 8px !important;
          border-top-left-radius: 6px !important;
          padding: 1px 6px !important;
          backdrop-filter: blur(2px);
          border-left: 1px solid #27272a !important;
          border-top: 1px solid #27272a !important;
        }
        .leaflet-attribution-control a {
          color: #fbbf24 !important;
        }
      `}</style>
    </div>
  );
}

