import { Shield } from "lucide-react";

interface PharmacyHeaderProps {
  name: string;
  image: string;
  isVerified: boolean;
  isOpen: boolean;
}

export default function PharmacyHeader({
  name,
  image,
  isVerified,
  isOpen,
}: PharmacyHeaderProps) {
  return (
    <div className="relative">
      <div className="relative h-56 w-full overflow-hidden rounded-lg bg-stone-200">
        <img src={image} alt={name} className="h-full w-full object-cover" />
        {isVerified && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-[#2D5A40] px-3 py-1.5 text-white">
            <Shield className="size-4" />
            <span className="text-xs font-semibold">VERIFIED</span>
          </div>
        )}
      </div>
      {isOpen && (
        <div className="absolute right-4 top-4 rounded-lg bg-green-500 px-3 py-1.5 text-white">
          <span className="text-xs font-semibold">OPEN NOW</span>
        </div>
      )}
    </div>
  );
}
