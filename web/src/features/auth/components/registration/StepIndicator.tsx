import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RegistrationStep } from '@/features/auth/hooks/useRegistrationFlow';

interface StepIndicatorProps {
  currentStep: RegistrationStep;
}

const STEPS = [
  { number: 1 as RegistrationStep, label: 'Email' },
  { number: 2 as RegistrationStep, label: 'Verify' },
  { number: 3 as RegistrationStep, label: 'Details' },
];

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const isDone = step.number < currentStep;
        const isActive = step.number === currentStep;
        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'size-8 border flex items-center justify-center text-xs font-bold transition-colors',
                  isDone && 'bg-[#2D5A40] border-[#2D5A40] text-white',
                  isActive && 'bg-white border-[#2D5A40] text-[#2D5A40]',
                  !isDone && !isActive && 'bg-white border-stone-200 text-stone-400'
                )}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-semibold whitespace-nowrap',
                  isActive ? 'text-[#2D5A40]' : isDone ? 'text-[#2D5A40]' : 'text-stone-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line (not after last) */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mt-[-14px] mx-2 transition-colors',
                  isDone ? 'bg-[#2D5A40]' : 'bg-stone-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
