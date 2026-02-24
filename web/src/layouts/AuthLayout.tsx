import { Outlet } from 'react-router-dom';
import BrandPanel from '../features/auth/components/BrandPanel';

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <BrandPanel />
      <Outlet />
    </div>
  );
}
