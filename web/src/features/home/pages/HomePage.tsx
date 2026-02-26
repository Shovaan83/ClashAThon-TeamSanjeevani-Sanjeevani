import { useAuthStore } from '@/store/useAuthStore';
import Navbar from '@/components/Navbar';
import HeroSection from '../components/HeroSection';
import HowItWorksSection from '../components/HowItWorksSection';
import HomeFooter from '../components/HomeFooter';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#FAFAF9]">
      <Navbar />

      <main className="flex-1">
        <HeroSection role={user?.role ?? null} />
        <HowItWorksSection />
      </main>

      <HomeFooter />
    </div>
  );
}
