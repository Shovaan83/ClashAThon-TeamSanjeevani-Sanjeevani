import { Radio } from 'lucide-react';

export default function HomeFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 py-10 px-6 lg:px-20 bg-white">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2 opacity-50">
          <Radio size={18} className="text-[#2D5A40]" />
          <h2
            className="font-black text-lg text-[#2D5A40] uppercase"
            style={{ letterSpacing: '-0.04em' }}
          >
            Sanjeevani
          </h2>
        </div>

        {/* Links */}
        <div className="flex gap-8 text-sm text-stone-500 font-medium">
          <a className="hover:text-[#2D5A40] transition-colors" href="#">
            How it Works
          </a>
          <a className="hover:text-[#2D5A40] transition-colors" href="#">
            Pharmacy Sign Up
          </a>
          <a className="hover:text-[#2D5A40] transition-colors" href="#">
            Privacy &amp; Data
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-stone-400">
          © 2026 Team Sankalpa. Built for Clash-A-Thon.
        </p>
      </div>
    </footer>
  );
}
