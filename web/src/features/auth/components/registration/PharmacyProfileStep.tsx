import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2,
  MapPin, Navigation,
} from 'lucide-react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import { pharmacyProfileSchema, type PharmacyProfileData } from '@/features/auth/schemas/registerSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

// Fix Leaflet's default marker icon for bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LatLng { lat: number; lng: number }

// Sub-component: listens to map clicks and calls onMove
function MapClickHandler({ onMove }: { onMove: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Sub-component: flies the map to a new center when `center` changes
function RecenterMap({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 15, { duration: 1 });
  }, [center, map]);
  return null;
}

const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 }; // India

interface PharmacyProfileStepProps {
  email: string;
}

export default function PharmacyProfileStep({ email }: PharmacyProfileStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [markerPos, setMarkerPos] = useState<LatLng>(DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const login = useAuthStore((s) => s.login);
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PharmacyProfileData>({
    resolver: zodResolver(pharmacyProfileSchema),
    defaultValues: {
      location: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
    },
  });

  const locationValue = watch('location');

  // Sync geolocation result into form + map
  useEffect(() => {
    if (location) {
      const pos = { lat: location.lat, lng: location.lng };
      setMarkerPos(pos);
      setMapCenter(pos);
      setValue('location', pos, { shouldValidate: true });
    }
  }, [location, setValue]);

  function handleMapMove(pos: LatLng) {
    setMarkerPos(pos);
    setValue('location', pos, { shouldValidate: true });
  }

  async function submit(data: PharmacyProfileData) {
    setApiError('');
    try {
      const res = await api.register({ ...data, email, role: 'pharmacy' });
      login(res.token, res.user);
    } catch {
      setApiError('Registration failed. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      {/* Password */}
      <div>
        <Label htmlFor="ph-password" className="mb-1.5">Password</Label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="ph-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            autoComplete="new-password"
            className="pl-10 pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="ph-confirmPassword" className="mb-1.5">Confirm Password</Label>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="ph-confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className="pl-10 pr-10"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Pharmacy Name */}
      <div>
        <Label htmlFor="pharmacyName" className="mb-1.5">Pharmacy Name</Label>
        <div className="relative">
          <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="pharmacyName"
            type="text"
            placeholder="e.g. City Health Pharmacy"
            autoComplete="organization"
            className="pl-10"
            {...register('pharmacyName')}
          />
        </div>
        {errors.pharmacyName && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.pharmacyName.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="ph-phone" className="mb-1.5">Phone Number</Label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <Input
            id="ph-phone"
            type="tel"
            placeholder="+1 234 567 8900"
            autoComplete="tel"
            className="pl-10"
            {...register('phone')}
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-xs text-[#FF6B35]">{errors.phone.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="flex items-center gap-1.5">
            <MapPin size={14} />
            Pharmacy Location
          </Label>
          <button
            type="button"
            onClick={requestLocation}
            disabled={geoLoading}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#2D5A40] hover:underline disabled:opacity-50"
          >
            {geoLoading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Navigation size={12} />
            )}
            Detect my location
          </button>
        </div>

        {geoError && (
          <p className="mb-2 text-xs text-[#FF6B35]">{geoError}</p>
        )}

        {/* Map */}
        <div className={cn('border border-stone-200 overflow-hidden', errors.location && 'border-[#FF6B35]')}>
          <MapContainer
            center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
            zoom={5}
            style={{ height: '220px', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMove={handleMapMove} />
            <RecenterMap center={mapCenter} />
            <Marker
              position={[markerPos.lat, markerPos.lng]}
              draggable
              eventHandlers={{
                dragend(e) {
                  const pos = (e.target as L.Marker).getLatLng();
                  handleMapMove({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
          </MapContainer>
        </div>

        {/* Coords display */}
        {locationValue && (
          <p className="mt-1.5 text-xs text-stone-500 font-mono">
            {locationValue.lat.toFixed(5)}, {locationValue.lng.toFixed(5)}
          </p>
        )}
        {errors.location && (
          <p className="mt-1 text-xs text-[#FF6B35]">
            {errors.location.message ?? 'Please select a location on the map'}
          </p>
        )}
        <p className="mt-1 text-xs text-stone-400">
          Click the map or drag the marker to pin your pharmacy's exact location.
        </p>
      </div>

      {apiError && (
        <p className="text-sm text-[#FF6B35] border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-3">
          {apiError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            Complete Registration
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );
}
