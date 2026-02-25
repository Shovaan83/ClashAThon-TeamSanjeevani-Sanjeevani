import { useState, useEffect, useCallback } from 'react';
import BroadcastPanel from '../components/BroadcastPanel';
import RadarMapPanel, { type PharmacyMarker } from '../components/RadarMapPanel';
import DashboardNavbar from '../components/DashboardNavbar';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCustomerWebSocket, type PharmacyResponseEvent } from '@/hooks/useWebSocket';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };

export default function PatientDashboardPage() {
  const [radius, setRadius] = useState(3.5);
  const [pharmacyMarkers, setPharmacyMarkers] = useState<PharmacyMarker[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePharmacyResponse = useCallback((event: PharmacyResponseEvent) => {
    setResponseCount((c) => c + 1);
    if (event.response_type === 'ACCEPTED' && event.pharmacy_location) {
      setPharmacyMarkers((prev) => {
        if (prev.some((m) => m.id === event.pharmacy_id)) return prev;
        return [...prev, {
          id: event.pharmacy_id,
          name: event.pharmacy_name,
          lat: event.pharmacy_location.lat,
          lng: event.pharmacy_location.lng,
        }];
      });
    }
  }, []);

  useCustomerWebSocket(handlePharmacyResponse);

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
          pharmacyMarkers={pharmacyMarkers}
          responseCount={responseCount}
        />
      </main>
    </div>
  );
}

