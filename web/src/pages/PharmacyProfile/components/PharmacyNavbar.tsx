import { Radio, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export default function PharmacyNavbar() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3.5 lg:px-20 shadow-sm">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-10">
        {/* Logo */}
        <button
          onClick={() => navigate("/dashboard/pharmacy")}
          className="flex items-center gap-2 text-[#2D5A40]"
        >
          <Radio size={26} strokeWidth={2} />
          <h2
            className="font-black text-xl text-[#2D5A40] uppercase tracking-tight"
            style={{ letterSpacing: "-0.05em" }}
          >
            Sanjeevani
          </h2>
        </button>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate("/dashboard/pharmacy")}
            className="text-stone-500 font-medium text-sm hover:text-[#3d7456] transition-all"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/pharmacy/requests")}
            className="text-[#2D5A40] font-bold text-sm hover:text-[#3d7456] transition-all"
          >
            Request History
          </button>
          <button
            onClick={() => navigate("/pharmacy/inventory")}
            className="text-stone-500 font-medium text-sm hover:text-[#3d7456] transition-all"
          >
            Inventory
          </button>
          <button
            onClick={() => navigate("/pharmacy/analytics")}
            className="text-stone-500 font-medium text-sm hover:text-[#3d7456] transition-all"
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Right: Actions + Avatar */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative flex items-center justify-center size-10 hover:bg-[#2D5A40]/5 rounded-full transition-all">
          <Bell size={20} className="text-stone-600" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-[#FF6B35] rounded-full shadow-sm"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="size-10 rounded-full bg-[#3d7456] flex items-center justify-center text-white font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || "P"}
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold text-stone-900">
              {user?.name || "Pharmacy"}
            </div>
            <div className="text-xs text-stone-500">Pharmacy Account</div>
          </div>
        </div>
      </div>
    </header>
  );
}
