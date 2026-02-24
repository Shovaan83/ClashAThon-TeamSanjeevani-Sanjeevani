import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import SignupPage from './features/auth/pages/SignupPage';
import LoginPage from './features/auth/pages/LoginPage';
import HomePage from './features/home/pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Home page — generic for both patient and pharmacy */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard/patient" element={<Navigate to="/home" replace />} />
        <Route path="/dashboard/pharmacy" element={<Navigate to="/home" replace />} />
        <Route path="/dashboard" element={<Navigate to="/home" replace />} />

        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
