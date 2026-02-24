import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PharmacyNavbar from "./components/PharmacyNavbar";
import MedicineRequestCard from "./components/MedicineRequestCard";
import { Button } from "@/components/ui/button";

type FilterTab = "all" | "fulfilled" | "expired";

// Mock data
const mockRequests = [
  {
    id: "1",
    medicineName: "Amoxicillin 500mg & Paracetamol",
    dosage: "500mg & Paracetamol",
    requestDate: "Oct 24, 2023",
    requestTime: "10:42 AM",
    pharmacyName: "Kathmandu Pharma",
    pharmacyLocation: "Bagbazar, Kathmandu",
    status: "fulfilled" as const,
    isVerified: true,
    requestId: "ID: #829A-3321",
  },
  {
    id: "2",
    medicineName: "Ciprofloxacin 250mg",
    dosage: "250mg",
    requestDate: "Sep 12, 2023",
    requestTime: "02:15 PM",
    pharmacyName: "",
    pharmacyLocation: "",
    status: "expired" as const,
    isVerified: false,
    requestId: "",
  },
  {
    id: "3",
    medicineName: "Metformin 500mg",
    dosage: "500mg",
    requestDate: "Aug 05, 2023",
    requestTime: "09:10 AM",
    pharmacyName: "Patan Meds",
    pharmacyLocation: "Patan Dhoka, Lalitpur",
    status: "fulfilled" as const,
    isVerified: true,
    requestId: "ID: #7728-9910",
  },
];

export default function MedicineRequestHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = mockRequests.filter((request) => {
    // Filter by tab
    if (activeTab === "fulfilled" && request.status !== "fulfilled")
      return false;
    if (activeTab === "expired" && request.status !== "expired") return false;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        request.medicineName.toLowerCase().includes(query) ||
        request.pharmacyName.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const handleViewDetails = (id: string) => {
    console.log("View details for request:", id);
    // Navigate to request details page
  };

  const handleRepostRequest = (id: string) => {
    console.log("Repost request:", id);
    // Handle repost logic
  };

  const handleNewRequest = () => {
    navigate("/broadcast");
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <PharmacyNavbar />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-20">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1C1917]">
              Medicine Request History
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Track your past medicine requests and pharmacy interactions.
            </p>
          </div>
          <Button onClick={handleNewRequest} variant="accent" className="gap-2">
            <Plus className="size-4" />
            New Request
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative shadow-sm">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by medicine or pharmacy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white py-3 pl-12 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#3d7456] focus:border-[#3d7456] transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-2 border-b border-stone-200">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "all"
                ? "border-b-2 border-[#3d7456] text-[#2D5A40]"
                : "text-stone-600 hover:text-[#2D5A40]"
            }`}
          >
            All Requests
          </button>
          <button
            onClick={() => setActiveTab("fulfilled")}
            className={`px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "fulfilled"
                ? "border-b-2 border-[#3d7456] text-[#2D5A40]"
                : "text-stone-600 hover:text-[#2D5A40]"
            }`}
          >
            Fulfilled
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "expired"
                ? "border-b-2 border-[#3d7456] text-[#2D5A40]"
                : "text-stone-600 hover:text-[#2D5A40]"
            }`}
          >
            Expired
          </button>
        </div>

        {/* Request List */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            <>
              {filteredRequests.map((request) => (
                <MedicineRequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={handleViewDetails}
                  onRepostRequest={handleRepostRequest}
                />
              ))}

              {/* Load More */}
              <div className="py-8 text-center">
                <Button variant="outline">Load More Requests</Button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#2D5A40]/10">
                <Search className="size-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                No requests found
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
