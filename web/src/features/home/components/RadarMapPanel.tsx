import { useEffect } from 'react';
import { Crosshair, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import type { GeoLocation } from '@/hooks/useGeolocation';

// Fix Leaflet's default marker icon for bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Flies the map to a new centre whenever `location` changes
function RecenterMap({ location }: { location: GeoLocation }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([location.lat, location.lng], 14, { duration: 1.2 });
  }, [location, map]);
  return null;
}

export interface PharmacyMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface RadarMapPanelProps {
  location: GeoLocation;
  radius: number;          // km
  requestLocation: () => void;
  geoLoading: boolean;
  pharmacyMarkers?: PharmacyMarker[];
  responseCount?: number;
}

export default function RadarMapPanel({ location, radius, requestLocation, geoLoading, pharmacyMarkers = [], responseCount }: RadarMapPanelProps) {
  return (
    <div className="grow relative overflow-hidden">
      {/* ── Leaflet map ────────────────────────────────────────── */}
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Patient location marker */}
        <Marker position={[location.lat, location.lng]} />

        {/* Pharmacy response markers */}
        {pharmacyMarkers.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="background:#2D5A40;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">℞</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })}
          />
        ))}

        {/* Broadcast radius circle */}
        <Circle
          center={[location.lat, location.lng]}
          radius={radius * 1000}   // metres
          pathOptions={{
            color: '#FF6B35',
            fillColor: '#FF6B35',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '6 6',
          }}
        />

        <RecenterMap location={location} />
      </MapContainer>

      {/* ── Top-right badge + locate btn ────────────────────────── */}
      <div className="absolute top-5 right-5 z-400 flex flex-col gap-3 items-end">
        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green-500" />
            <span className="text-sm font-bold text-slate-700">{pharmacyMarkers.length} Pharmacies</span>
          </div>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-xs text-slate-500 font-medium">Online Now</span>
        </div>
        <button
          onClick={requestLocation}
          disabled={geoLoading}
          title="Re-detect my location"
          className="size-10 bg-white rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#FF6B35] hover:border-[#FF6B35] transition-colors disabled:opacity-50"
        >
          {geoLoading
            ? <Loader2 size={18} className="animate-spin" />
            : <Crosshair size={18} />}
        </button>
      </div>

      {/* ── Bottom stats bar ──────────────────────────────────────── */}
      <div className="absolute bottom-5 right-5 z-400">
        <div className="bg-white/85 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg px-6 py-4 flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wait Time</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">~5 min</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Responses</p>
            <p className="text-xl font-bold text-[#FF6B35] mt-0.5">{responseCount ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
