import {
  CheckCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MedicineRequest {
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

interface MedicineRequestCardProps {
  request: MedicineRequest;
  onViewDetails: (id: string) => void;
  onRepostRequest: (id: string) => void;
}

export default function MedicineRequestCard({
  request,
  onViewDetails,
  onRepostRequest,
}: MedicineRequestCardProps) {
  const isFulfilled = request.status === "fulfilled";

  return (
    <div
      className={`relative rounded-lg border bg-white p-5 transition-all hover:shadow-lg ${
        isFulfilled ? "border-[#2D5A40]/20" : "border-stone-200"
      }`}
      style={{
        borderLeft: isFulfilled ? "4px solid #3d7456" : "4px solid #ff8559",
      }}
    >
      <div className="flex gap-4">
        {/* Medicine Image */}
        <div className="shrink-0">
          <div className="size-20 rounded-lg bg-[#2D5A40]/5 overflow-hidden flex items-center justify-center border border-[#2D5A40]/10">
            {request.medicineImage ? (
              <img
                src={request.medicineImage}
                alt={request.medicineName}
                className="size-full object-cover"
              />
            ) : (
              <div className="text-4xl">💊</div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                {request.medicineName}
              </h3>
              <p className="text-sm text-stone-600 mt-0.5">
                Requested on {request.requestDate} • {request.requestTime}
              </p>
            </div>

            {/* Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                isFulfilled
                  ? "bg-[#3d7456]/15 text-[#2D5A40]"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {isFulfilled ? (
                <>
                  <CheckCircle className="size-3" />
                  Fulfilled
                </>
              ) : (
                <>
                  <Clock className="size-3" />
                  Expired
                </>
              )}
            </div>
          </div>

          {/* Pharmacy Info */}
          <div className="mt-3 flex items-start gap-3">
            <div className="size-10 rounded-full bg-[#2D5A40]/10 overflow-hidden flex items-center justify-center shrink-0">
              <Store className="size-5 text-[#2D5A40]" />
            </div>
            <div>
              <div className="font-semibold text-stone-900">
                {request.pharmacyName}
              </div>
              <div className="text-xs text-stone-600">
                {request.pharmacyLocation}
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          {request.isVerified && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#3d7456] font-medium">
              <ShieldCheck className="size-4" />
              <span className="font-medium">Digital Handshake Verified</span>
              <span className="text-stone-400">• ID: {request.requestId}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            {isFulfilled ? (
              <Button
                onClick={() => onViewDetails(request.id)}
                variant="default"
                size="sm"
                className="gap-1.5"
              >
                View Details →
              </Button>
            ) : (
              <Button
                onClick={() => onRepostRequest(request.id)}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Repost Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
