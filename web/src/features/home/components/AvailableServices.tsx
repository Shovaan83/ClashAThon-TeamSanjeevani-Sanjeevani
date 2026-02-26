import {
  FileText,
  Syringe,
  Activity,
  Home,
  Laptop,
  MessageSquare,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  icon:
    | "prescription"
    | "vaccination"
    | "bp-checkup"
    | "home-delivery"
    | "device-rentals"
    | "consultation";
}

interface AvailableServicesProps {
  services: Service[];
}

const serviceIcons = {
  prescription: FileText,
  vaccination: Syringe,
  "bp-checkup": Activity,
  "home-delivery": Home,
  "device-rentals": Laptop,
  consultation: MessageSquare,
};

export default function AvailableServices({
  services,
}: AvailableServicesProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded bg-[#2D5A40] p-1.5">
          <FileText className="size-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Available Services</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {services.map((service) => {
          const Icon = serviceIcons[service.icon];
          return (
            <div
              key={service.id}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-4 transition-all hover:border-[#2D5A40] hover:bg-[#2D5A40]/5"
            >
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <Icon className="size-6 text-[#2D5A40]" />
              </div>
              <span className="text-center text-xs font-medium text-stone-700">
                {service.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
