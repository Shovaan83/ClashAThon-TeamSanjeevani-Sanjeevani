import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import SignupPage from './features/auth/pages/SignupPage';
import LoginPage from './features/auth/pages/LoginPage';
import HomePage from './features/home/pages/HomePage';
import PatientDashboardPage from './features/home/pages/PatientDashboardPage';
import PharmacyDashboardPage from './features/home/pages/PharmacyDashboardPage';
import PatientProfilePage from './features/home/pages/PatientProfilePage';
import PharmacyProfile from "./features/home/pages/PharmacyProfile";
import SearchPage from "./features/home/pages/SearchPage";
import DevTools from "./components/DevTools";
import { useAuthStore } from "./store/useAuthStore";
import MedicineRequestHistory from "./features/home/MedicineRequestHistory";
import IncomingRequestModal from "./features/home/components/IncomingRequestModal";
import { useRequestStore } from "./store/useRequestStore";


function DashboardRedirect() {
  const { user } = useAuthStore();
  if (user?.role === "pharmacy")
    return <Navigate to="/dashboard/pharmacy" replace />;
  return <Navigate to="/dashboard/patient" replace />;
}

export default function App() {
  const { isModalOpen } = useRequestStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Landing */}
        <Route path="/home" element={<HomePage />} />

        {/* Pharmacy search */}
        <Route path="/search" element={<SearchPage />} />

        {/* Pharmacy Profile */}
        <Route path="/pharmacy/:id" element={<PharmacyProfile />} />
        <Route path="/pharmacy/requests" element={<MedicineRequestHistory />} />

        {/* Broadcast (patient ping flow) */}
        <Route path="/broadcast" element={<PatientDashboardPage />} />

        {/* Role-specific dashboards */}
        <Route path="/dashboard/patient" element={<PatientDashboardPage />} />
        <Route path="/dashboard/pharmacy" element={<PharmacyDashboardPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Profile */}
        <Route path="/profile" element={<PatientProfilePage />} />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <DevTools />
      {isModalOpen && <IncomingRequestModal />}
    </BrowserRouter>
  );
}
