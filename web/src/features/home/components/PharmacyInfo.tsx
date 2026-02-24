import { MapPin, Star, Handshake, Zap, Phone, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PharmacyInfoProps {
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  handshakes: number;
  responseTime: string;
  phone: string;
}

export default function PharmacyInfo({
  name,
  location,
  rating,
  reviewCount,
  handshakes,
  responseTime,
  phone,
}: PharmacyInfoProps) {
  const handleCall = () => {
    window.location.href = `tel:${phone}`;
  };

  const handleDirections = () => {
    // Open Google Maps with the location
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
        <div className="mt-1 flex items-center gap-1.5 text-stone-600">
          <MapPin className="size-4" />
          <span className="text-sm">{location}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Star className="size-5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-stone-900">{rating}</span>
          <span className="text-sm text-stone-600">
            ({reviewCount} reviews)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Handshake className="size-5 text-[#2D5A40]" />
          <span className="text-sm font-medium text-stone-900">
            {handshakes}+ Successful Handshakes
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-3">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-blue-600" />
          <div>
            <div className="text-xs font-medium text-stone-600">
              TYPICAL RESPONSE TIME
            </div>
            <div className="text-sm font-semibold text-stone-900">
              {responseTime}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleCall} className="flex-1" variant="default">
          <Phone className="size-4" />
          Call Now
        </Button>
        <Button onClick={handleDirections} variant="outline" className="flex-1">
          <Navigation className="size-4" />
          Get Directions
        </Button>
      </div>
    </div>
  );
}
