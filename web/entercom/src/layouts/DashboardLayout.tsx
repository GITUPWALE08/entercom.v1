import { Outlet } from 'react-router-dom';
import HeroSection from '../components/hero';

export function DashboardLayout() {
  return (
    <div className="dashboard-container max-w-7xl mx-auto">
      <Outlet />

      {/* Desktop Hero */}
      <div className="hidden lg:flex lg:flex-1 lg:min-w-[35vw] lg:max-w-[55vw]">
        <HeroSection />
      </div>
    </div>
  );
}
