import { Clock } from "lucide-react";

interface DaySchedule {
  day: string;
  hours: string;
  isClosed?: boolean;
  isToday?: boolean;
}

interface OpeningHoursProps {
  schedule: DaySchedule[];
}

export default function OpeningHours({ schedule }: OpeningHoursProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded bg-[#2D5A40] p-1.5">
          <Clock className="size-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Opening Hours</h2>
      </div>

      <div className="space-y-3">
        {schedule.map((item) => (
          <div
            key={item.day}
            className={`flex items-center justify-between rounded-lg p-2 ${
              item.isToday ? "bg-[#2D5A40]/10" : ""
            }`}
          >
            <span
              className={`text-sm font-medium ${
                item.isToday ? "text-[#2D5A40]" : "text-stone-700"
              }`}
            >
              {item.day}
            </span>
            <span
              className={`text-sm ${
                item.isClosed
                  ? "font-semibold text-red-600"
                  : item.isToday
                    ? "font-semibold text-[#2D5A40]"
                    : "text-stone-600"
              }`}
            >
              {item.isClosed ? "Closed" : item.hours}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
