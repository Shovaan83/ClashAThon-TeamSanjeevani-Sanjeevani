import { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PharmacyNavbar from "./components/PharmacyNavbar";
import MedicineRequestCard from "./components/MedicineRequestCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type FilterTab = "all" | "fulfilled" | "expired";

interface BackendRequest {
  id: number;
  patient: number;
  pharmacy: number | null;
  patient_name: string;
  pharmacy_name: string | null;
  patient_lat: number;
  patient_lng: number;
  radius_km: number;
  quantity: number;
  image: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MappedRequest {
  id: string;
  medicineName: string;
  dosage: string;
  requestDate: string;
  requestTime: string;
  pharmacyName: string;
  pharmacyLocation: string;
  status: "fulfilled" | "expired";
  isVerified: boolean;
  requestId: string;
  medicineImage?: string;
}

function mapStatus(backendStatus: string): "fulfilled" | "expired" {
  return backendStatus === "ACCEPTED" ? "fulfilled" : "expired";
}

function mapBackendRequest(r: BackendRequest): MappedRequest {
  const date = new Date(r.created_at);
  return {
    id: String(r.id),
    medicineName: `Prescription #${r.id}`,
    dosage: `Qty: ${r.quantity}`,
    requestDate: date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    requestTime: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    pharmacyName: r.pharmacy_name ?? "",
    pharmacyLocation: "",
    status: mapStatus(r.status),
    isVerified: r.status === "ACCEPTED",
    requestId: r.status === "ACCEPTED" ? `ID: #${String(r.id).padStart(4, "0")}` : "",
    medicineImage: r.image ?? undefined,
  };
}

export default function MedicineRequestHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<MappedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRequests() {
      try {
        const res = await api.getCustomerRequests();
        const mapped = (res.data?.requests ?? []).map(mapBackendRequest);
        setRequests(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load requests.");
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    if (activeTab === "fulfilled" && request.status !== "fulfilled")
      return false;
    if (activeTab === "expired" && request.status !== "expired") return false;

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
  };

  const handleRepostRequest = (_id: string) => {
    navigate("/broadcast");
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
          {loading ? (
            <div className="flex items-center justify-center py-16 text-stone-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#FF6B35]">{error}</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <MedicineRequestCard
                key={request.id}
                request={request}
                onViewDetails={handleViewDetails}
                onRepostRequest={handleRepostRequest}
              />
            ))
          ) : (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-[#2D5A40]/10">
                <Search className="size-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                No requests found
              </h3>
              <p className="mt-1 text-sm text-stone-600">
                {requests.length === 0
                  ? "You haven't made any medicine requests yet."
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
