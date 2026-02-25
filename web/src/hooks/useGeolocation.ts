import { useState, useCallback } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
}

interface GeolocationState {
  location: GeoLocation | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          loading: false,
          error: null,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location access denied. Please allow location access or pin manually.',
          2: 'Unable to determine your location. Please pin manually.',
          3: 'Location request timed out. Please pin manually.',
        };
        setState({
          location: null,
          loading: false,
          error: messages[err.code] ?? 'An unknown error occurred.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { ...state, requestLocation };
}
