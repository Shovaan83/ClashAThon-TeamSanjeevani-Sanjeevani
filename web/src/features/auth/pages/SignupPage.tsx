import { Link } from 'react-router-dom';
import { Cross } from 'lucide-react';
import { useRegistrationFlow } from '../hooks/useRegistrationFlow';
import StepIndicator from '../components/registration/StepIndicator';
import EmailStep from '../components/registration/EmailStep';
import OtpStep from '../components/registration/OtpStep';
import PatientProfileStep from '../components/registration/PatientProfileStep';
import PharmacyProfileStep from '../components/registration/PharmacyProfileStep';

const STEP_HEADINGS = {
  '1': { title: 'Get Started', subtitle: 'Choose your role and enter your email to begin.' },
  '2': { title: 'Verify Email', subtitle: 'Enter the 6-digit code we sent to your inbox.' },
  '3_patient': { title: 'Your Profile', subtitle: 'A few more details to complete your account.' },
  '3_pharmacy': { title: 'Pharmacy Details', subtitle: 'Tell us about your pharmacy.' },
} as const;

export default function SignupPage() {
  const { step, role, email, setRole, submitEmail, backToEmail, confirmOtp } =
    useRegistrationFlow();

  const headingKey =
    step === 3 ? (role === 'pharmacy' ? '3_pharmacy' : '3_patient') : step.toString() as '1' | '2';
  const heading = STEP_HEADINGS[headingKey as keyof typeof STEP_HEADINGS];

  return (
    <div className="flex-1 bg-[#FAFAF9] px-6 py-12 lg:px-20 xl:px-32 overflow-y-auto">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 mb-10">
        <div className="size-8 bg-[#2D5A40] flex items-center justify-center flex-shrink-0">
          <Cross size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <h1 className="logo-font text-2xl text-[#2D5A40] tracking-tighter">Sanjeevani</h1>
      </div>

      <div className="max-w-md w-full mx-auto">
        {/* Heading */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#1C1917]">{heading.title}</h2>
          <p className="text-stone-500 mt-2">{heading.subtitle}</p>
        </div>

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {/* Step content */}
        {step === 1 && (
          <EmailStep
            role={role}
            onRoleChange={setRole}
            onSubmit={submitEmail}
          />
        )}
        {step === 2 && (
          <OtpStep
            email={email}
            onBack={backToEmail}
            onVerified={confirmOtp}
          />
        )}
        {step === 3 && role === 'patient' && (
          <PatientProfileStep email={email} />
        )}
        {step === 3 && role === 'pharmacy' && (
          <PharmacyProfileStep email={email} />
        )}

        {/* Login link */}
        <p className="text-center mt-10 text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-[#FF6B35] font-bold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

