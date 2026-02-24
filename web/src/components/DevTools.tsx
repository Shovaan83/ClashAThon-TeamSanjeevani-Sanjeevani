import { useAuthStore } from '../store/useAuthStore';

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

export default function DevTools() {
  if (!import.meta.env.DEV) return null;

  const { login, logout, user, isAuthenticated } = useAuthStore();

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
