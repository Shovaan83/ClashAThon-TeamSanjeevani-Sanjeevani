import { useAuthStore } from '@/store/useAuthStore';

import HomeNavbar from '../components/HomeNavbar';
import HeroSection from '../components/HeroSection';
import HomeFooter from '../components/HomeFooter';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FAFAF9]">
      <HomeNavbar />

      <main className="flex-1">
        <HeroSection role={user?.role ?? null} />
      </main>

      <HomeFooter />
    </div>
  );
}
