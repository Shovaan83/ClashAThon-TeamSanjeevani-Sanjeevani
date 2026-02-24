import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PharmacyHeader from "./components/PharmacyHeader";
import PharmacyInfo from "./components/PharmacyInfo";
import AvailableServices from "./components/AvailableServices";
import OpeningHours from "./components/OpeningHours";
import LocationMap from "./components/LocationMap";
import RecentReviews from "./components/RecentReviews";
import ContactInfo from "./components/ContactInfo";
import { Button } from "@/components/ui/button";

// Mock data - replace with API call
const mockPharmacyData = {
  id: "1",
  name: "Himalayan Pharmacy",
  location: "Puchoowk Road, Lalitpur",
  image: "/src/assets/images/pharmacies/himalayan-pharmacy.jpg",
  isVerified: true,
  isOpen: true,
  rating: 4.8,
  reviewCount: 120,
  handshakes: 1400,
  responseTime: "Responds in < 2 mins",
  phone: "+977 1-5523456",
  email: "info@himalayanpharma.com",
  coordinates: {
    lat: 27.6683,
    lng: 85.3206,
  },
  address: "Puchoowk Road, Lalitpur",
  nearbyLandmark: "Near Himalayan Hotel, Opp. Sis Mart",
  services: [
    { id: "1", name: "Prescription Refill", icon: "prescription" as const },
    { id: "2", name: "Vaccinations", icon: "vaccination" as const },
    { id: "3", name: "BP Checkup", icon: "bp-checkup" as const },
    { id: "4", name: "Home Delivery", icon: "home-delivery" as const },
    { id: "5", name: "Device Rentals", icon: "device-rentals" as const },
    { id: "6", name: "Consultation", icon: "consultation" as const },
  ],
  schedule: [
    { day: "Today (Tue)", hours: "08:00 - 20:00", isToday: true },
    { day: "Wednesday", hours: "08:00 - 20:00" },
    { day: "Thursday", hours: "08:00 - 20:00" },
    { day: "Friday", hours: "08:00 - 20:00" },
    { day: "Saturday", hours: "10:00 - 18:00" },
    { day: "Sunday", hours: "Closed", isClosed: true },
    { day: "Monday", hours: "08:00 - 20:00" },
  ],
  reviews: [
    {
      id: "1",
      authorName: "Ramesh K.",
      authorInitials: "RK",
      rating: 5,
      comment:
        "Excellent service! They had the specific medicine I was looking for which was out of stock everywhere else. Very quick response.",
      timeAgo: "2 days ago",
    },
    {
      id: "2",
      authorName: "Anita S.",
      authorInitials: "AS",
      rating: 5,
      comment:
        "Good pharmacy, clean and organized. Parking is a bit difficult in this area though.",
      timeAgo: "1 week ago",
    },
  ],
};

export default function PharmacyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pharmacyData, setPharmacyData] = useState(mockPharmacyData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch pharmacy data from API using the id
    // For now, using mock data
    const timer = setTimeout(() => {
      setPharmacyData(mockPharmacyData);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <div className="text-stone-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            <PharmacyHeader
              name={pharmacyData.name}
              image={pharmacyData.image}
              isVerified={pharmacyData.isVerified}
              isOpen={pharmacyData.isOpen}
            />

            <PharmacyInfo
              name={pharmacyData.name}
              location={pharmacyData.location}
              rating={pharmacyData.rating}
              reviewCount={pharmacyData.reviewCount}
              handshakes={pharmacyData.handshakes}
              responseTime={pharmacyData.responseTime}
              phone={pharmacyData.phone}
            />

            <AvailableServices services={pharmacyData.services} />

            <RecentReviews reviews={pharmacyData.reviews} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <OpeningHours schedule={pharmacyData.schedule} />

            <LocationMap
              address={pharmacyData.address}
              nearbyLandmark={pharmacyData.nearbyLandmark}
              coordinates={pharmacyData.coordinates}
            />

            <ContactInfo
              phone={pharmacyData.phone}
              email={pharmacyData.email}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
