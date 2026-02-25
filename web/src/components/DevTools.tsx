import { useAuthStore } from '../store/useAuthStore';
import { useRequestStore } from '../store/useRequestStore';
import { type IncomingRequest } from '../store/useRequestStore';

const MOCK_PATIENT = {
  id: 'dev-patient-1',
  name: 'Dev Patient',
  email: 'patient@dev.com',
  role: 'patient' as const,
  isVerified: true,
};

const MOCK_PHARMACY = {
  id: 'dev-pharmacy-1',
  name: 'Dev Pharmacy',
  email: 'pharmacy@dev.com',
  role: 'pharmacy' as const,
  isVerified: true,
};

const MOCK_INCOMING_REQUEST: IncomingRequest = {
  id: 'mock-req-8821-AS',
  patientName: 'Arjun Sharma',
  patientId: '#8821-AS',
  location: 'New Delhi, IN',
  prescriptionImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC3_EME8tIRHoTHF-77oeFOGcZ8pcCRcO6-F4O0MdtGbFzcNjtUtayHY7-M8ml04qYmkWRk84ej2pZmnqKYzDP0111RLcxwCSJLVbilJEEQl_UuAugYVteFT9LnvMv9EwJYYHDr-Awss2u7nd-0qKn3L9HB_U__PWV9BxCfDcZzceBc-vkVNjXBVwIrE2rnGEh9YQpzNVrf2jjjB5xUNvFm1cmUd4v55xtJl0HKftNqEoPA57YHNXk92zvk2_JtvM9Suq9QkpCvuI',
  medicines: ['Amoxicillin 500mg', 'Paracetamol 650mg'],
  additionalMedicinesCount: 2,
  isUrgent: true,
  doctorNote: 'Please deliver by 6 PM today. Patient has high fever and needs the antibiotics immediately.',
  timestamp: Date.now(),
};

export default function DevTools() {
  if (!import.meta.env.DEV) return null;

  const { login, logout, user, isAuthenticated } = useAuthStore();
  const { showRequest } = useRequestStore();

  const statusLabel = !isAuthenticated
    ? 'Logged Out'
    : user?.role === 'pharmacy'
      ? `Pharmacy${user.isVerified ? ' (Verified)' : ' (Unverified)'}`
      : 'Patient';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {/* Status badge */}
      <div
        style={{
          background: '#1e293b',
          color: '#94a3b8',
          padding: '2px 8px',
          borderRadius: '4px',
          border: '1px solid #334155',
        }}
      >
        DEV &mdash; {statusLabel}
      </div>

      {/* Buttons row */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => login('dev-token-patient', MOCK_PATIENT)}
          style={btnStyle('#16a34a')}
        >
          Login as Patient
        </button>
        <button
          onClick={() => login('dev-token-pharmacy', MOCK_PHARMACY)}
          style={btnStyle('#0ea5e9')}
        >
          Login as Verified Pharmacy
        </button>
        <button onClick={logout} style={btnStyle('#dc2626')}>
          Logout
        </button>
        {user?.role === 'pharmacy' && (
          <button
            onClick={() => showRequest({ ...MOCK_INCOMING_REQUEST, timestamp: Date.now() })}
            style={btnStyle('#a855f7')}
          >
            Simulate Incoming Request
          </button>
        )}
      </div>
    </div>
  );
}

function btnStyle(accent: string): React.CSSProperties {
  return {
    background: '#0f172a',
    color: accent,
    border: `1px solid ${accent}`,
    borderRadius: '4px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  };
}
