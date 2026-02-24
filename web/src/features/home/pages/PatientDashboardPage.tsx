import { useState, useEffect } from 'react';
import BroadcastPanel from '../components/BroadcastPanel';
import RadarMapPanel from '../components/RadarMapPanel';
import DashboardNavbar from '../components/DashboardNavbar';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fallback centre (India) shown until geolocation resolves
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function PatientDashboardPage() {
  const [radius, setRadius] = useState(3.5);
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedLocation = location ?? DEFAULT_CENTER;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f5f0]">
      <DashboardNavbar />

      <main className="flex flex-1 overflow-hidden">
        <BroadcastPanel
          radius={radius}
          setRadius={setRadius}
          location={resolvedLocation}
          geoLoading={geoLoading}
          geoError={geoError}
        />
        <RadarMapPanel
          location={resolvedLocation}
          radius={radius}
          requestLocation={requestLocation}
          geoLoading={geoLoading}
        />
      </main>
    </div>
  );
}

