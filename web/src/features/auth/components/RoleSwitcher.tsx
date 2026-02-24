import { useState } from 'react';
import { User, Pill } from 'lucide-react';

export type Role = 'patient' | 'pharmacy';

interface RoleSwitcherProps {
  onRoleChange: (role: Role) => void;
}

export default function RoleSwitcher({ onRoleChange }: RoleSwitcherProps) {
  const [activeRole, setActiveRole] = useState<Role>('patient');

  function handleSelect(role: Role) {
    setActiveRole(role);
    onRoleChange(role);
  }

  return (
    <div className="grid grid-cols-2 mb-8 border border-stone-200">
      <button
        type="button"
        onClick={() => handleSelect('patient')}
        className={`flex items-center justify-center gap-2 py-3 font-semibold text-sm transition-all border-r border-stone-200 ${
          activeRole === 'patient'
            ? 'bg-[#2D5A40] text-white'
            : 'bg-white text-[#1C1917] hover:bg-stone-50'
        }`}
      >
        <User size={16} />
        Patient
      </button>
      <button
        type="button"
        onClick={() => handleSelect('pharmacy')}
        className={`flex items-center justify-center gap-2 py-3 font-semibold text-sm transition-all ${
          activeRole === 'pharmacy'
            ? 'bg-[#2D5A40] text-white'
            : 'bg-white text-[#1C1917] hover:bg-stone-50'
        }`}
      >
        <Pill size={16} />
        Pharmacy
      </button>
    </div>
  );
}
