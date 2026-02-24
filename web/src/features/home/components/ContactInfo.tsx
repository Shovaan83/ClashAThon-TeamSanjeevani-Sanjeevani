import { Phone, Mail } from "lucide-react";

interface ContactInfoProps {
  phone: string;
  email: string;
}

export default function ContactInfo({ phone, email }: ContactInfoProps) {
  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#2D5A40]/10">
          <Phone className="size-5 text-[#2D5A40]" />
        </div>
        <div>
          <div className="text-xs font-medium text-stone-600">PHONE</div>
          <a
            href={`tel:${phone}`}
            className="font-semibold text-stone-900 hover:text-[#2D5A40]"
          >
            {phone}
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#2D5A40]/10">
          <Mail className="size-5 text-[#2D5A40]" />
        </div>
        <div>
          <div className="text-xs font-medium text-stone-600">EMAIL</div>
          <a
            href={`mailto:${email}`}
            className="font-semibold text-stone-900 hover:text-[#2D5A40]"
          >
            {email}
          </a>
        </div>
      </div>
    </div>
  );
}
