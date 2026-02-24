import { Cross } from 'lucide-react';

const avatars = [
  'https://i.pravatar.cc/40?img=47',
  'https://i.pravatar.cc/40?img=12',
  'https://i.pravatar.cc/40?img=33',
];

export default function BrandPanel() {
  return (
    <div className="hidden lg:grid lg:w-1/2 grid-rows-[auto_1fr_auto] bg-[#2D5A40] p-12 text-white border-r border-stone-200">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="size-10 bg-[#FF6B35] rounded-none flex items-center justify-center flex-shrink-0">
          <Cross className="text-white" size={22} strokeWidth={2.5} />
        </div>
        <h1 className="logo-font text-3xl tracking-tighter">Sanjeevani</h1>
      </div>

      {/* Hero */}
      <div className="flex flex-col justify-center max-w-md">
        <h2 className="text-5xl font-bold leading-tight mb-6">
          Mechanical precision in healthcare.
        </h2>
        <p className="text-xl text-white/70 font-light leading-relaxed">
          Connecting patients and pharmacies through a seamless, high-performance digital network.
          Experience the future of medical logistics.
        </p>

        {/* Social proof */}
        <div className="mt-12 flex gap-4 items-center">
          <div className="flex -space-x-3">
            {avatars.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Provider"
                className="size-10 rounded-none border-2 border-[#2D5A40] object-cover"
              />
            ))}
          </div>
          <p className="text-sm text-white/60">Joined by 10k+ providers</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-white/40 text-sm">
        © 2024 Sanjeevani Systems. All rights reserved.
      </div>
    </div>
  );
}
