import { MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapProps {
  address: string;
  nearbyLandmark: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export default function LocationMap({
  address,
  nearbyLandmark,
  coordinates,
}: LocationMapProps) {
  const handleShareLocation = () => {
    const locationUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
    if (navigator.share) {
      navigator
        .share({
          title: "Pharmacy Location",
          text: address,
          url: locationUrl,
        })
        .catch(() => {
          // Fallback to copying to clipboard
          navigator.clipboard.writeText(locationUrl);
        });
    } else {
      navigator.clipboard.writeText(locationUrl);
    }
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded bg-[#2D5A40] p-1.5">
            <MapPin className="size-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Location</h2>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-stone-100">
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${coordinates.lat},${coordinates.lng}&zoom=15`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full"
        />
        {/* Fallback if iframe doesn't work */}
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-green-100 to-blue-100">
          <MapPin className="size-16 text-red-500" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-semibold text-stone-900">{address}</p>
        <p className="text-sm text-stone-600">{nearbyLandmark}</p>
      </div>

      <Button
        onClick={handleShareLocation}
        variant="outline"
        className="mt-4 w-full"
      >
        <Share2 className="size-4" />
        Share Location
      </Button>
    </div>
  );
}
