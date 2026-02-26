import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';

const sitemap = [
  { label: 'Home', href: '/home' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'For Pharmacies', href: '/signup' },
  { label: 'Login', href: '/login' },
  { label: 'Sign Up', href: '/signup' },
];

const connect = [
  { label: 'GitHub', href: 'https://github.com', external: true },
  { label: 'Devfolio', href: 'https://devfolio.co', external: true },
  { label: 'Contact Team', href: 'mailto:team@sanjeevani.app', external: true },
];

const springVariants = {
  hidden: { translateY: 140, opacity: 0 },
  visible: (i: number) => ({
    translateY: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 14,
      delay: i * 0.04,
    },
  }),
};

export default function HomeFooter() {
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(svgRef, { once: true, margin: '-60px' });

  return (
    <footer className="bg-[#FAFAF9] border-t border-stone-200">

      {/* Top section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-14 pb-10">
        <div className="md:flex justify-between gap-12 w-full">

          {/* Left: Brand + tagline */}
          <div className="mb-10 md:mb-0 max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="Sanjeevani"
                className="h-9 w-9 rounded-full border border-stone-200 object-contain"
              />
              <span className="font-black text-lg text-[#2D5A40] logo-font tracking-tight">
                SANJEEVANI
              </span>
            </div>
            <h3 className="text-[#1C1917] text-2xl font-black leading-tight mb-3">
              Healthy Nepal,{' '}
              <span className="text-[#2D5A40]">One Ping</span> at a Time.
            </h3>
            <p className="text-stone-500 text-sm leading-relaxed">
              Built for Clash-A-Thon 2026. Solving the medicine hunt that every
              Nepali family knows too well.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-stone-400 font-medium">
              <Radio size={12} className="text-[#FF6B35]" />
              <span>Radar is live — try it now</span>
            </div>
          </div>

          {/* Right: Link columns */}
          <div className="flex gap-14 shrink-0">
            <ul>
              <li className="text-sm font-black text-[#1C1917] uppercase tracking-widest pb-3">
                Sitemap
              </li>
              {sitemap.map((item) => (
                <li key={item.label} className="py-0.5">
                  <Link
                    to={item.href}
                    className="text-stone-500 text-sm font-medium hover:text-[#2D5A40] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul>
              <li className="text-sm font-black text-[#1C1917] uppercase tracking-widest pb-3">
                Connect
              </li>
              {connect.map((item) => (
                <li key={item.label} className="py-0.5">
                  <a
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="text-stone-500 text-sm font-medium hover:text-[#2D5A40] transition-colors underline-offset-2 hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Animated SANJEEVANI SVG brand mark */}
      <div className="border-y border-stone-200 overflow-hidden">
        <motion.svg
          ref={svgRef}
          viewBox="0 0 490 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-20 sm:h-28 md:h-36 px-6 md:px-12"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* S */}
          <motion.path
            custom={0}
            variants={springVariants}
            d="M8 45 C8 35 18 28 30 28 L55 28 C67 28 75 35 75 45 C75 55 67 62 55 62 L30 62 C18 62 8 69 8 79 C8 89 18 96 30 96 L58 96 C70 96 80 89 80 79"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* A */}
          <motion.path
            custom={1}
            variants={springVariants}
            d="M95 96 L115 28 L135 96 M101 70 L129 70"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* N */}
          <motion.path
            custom={2}
            variants={springVariants}
            d="M148 96 L148 28 L183 96 L183 28"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* J */}
          <motion.path
            custom={3}
            variants={springVariants}
            d="M210 28 L210 80 C210 90 205 96 195 96 C185 96 178 90 178 80"
            stroke="#FF6B35"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* E */}
          <motion.path
            custom={4}
            variants={springVariants}
            d="M225 28 L225 96 M225 28 L265 28 M225 62 L260 62 M225 96 L265 96"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* E */}
          <motion.path
            custom={5}
            variants={springVariants}
            d="M278 28 L278 96 M278 28 L318 28 M278 62 L313 62 M278 96 L318 96"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* V */}
          <motion.path
            custom={6}
            variants={springVariants}
            d="M330 28 L350 96 L370 28"
            stroke="#FF6B35"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* A */}
          <motion.path
            custom={7}
            variants={springVariants}
            d="M383 96 L403 28 L423 96 M389 70 L417 70"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* N */}
          <motion.path
            custom={8}
            variants={springVariants}
            d="M436 96 L436 28 L471 96 L471 28"
            stroke="#2D5A40"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* I */}
          <motion.path
            custom={9}
            variants={springVariants}
            d="M488 28 L488 96"
            stroke="#FF6B35"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </motion.svg>
      </div>

      {/* Bottom row */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20 py-4">
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-3">
          <span className="text-xs text-stone-400 font-medium">
            &copy; 2026 Team Sankalpa. Built for Clash-A-Thon.
          </span>
          <a
            href="#"
            className="text-xs text-stone-500 font-semibold hover:text-[#2D5A40] transition-colors"
          >
            Privacy &amp; Data Policy
          </a>
        </div>
      </div>

    </footer>
  );
}
