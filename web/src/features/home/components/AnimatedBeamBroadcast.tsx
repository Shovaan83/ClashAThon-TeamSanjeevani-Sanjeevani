import { useRef } from 'react';
import { AnimatedBeam, Circle, Icons } from '@/components/ui/animated-beam';

export default function AnimatedBeamBroadcast() {
  const containerRef = useRef<HTMLDivElement>(null);
  const patientRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const pharmacy1Ref = useRef<HTMLDivElement>(null);
  const pharmacy2Ref = useRef<HTMLDivElement>(null);
  const pharmacy3Ref = useRef<HTMLDivElement>(null);
  const pharmacy4Ref = useRef<HTMLDivElement>(null);
  const pharmacy5Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm border border-stone-200 bg-[#FAFAF9] p-4 md:shadow-sm"
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-row items-stretch justify-between gap-8">
        {/* Left: Patient */}
        <div className="flex flex-col justify-center">
          <Circle ref={patientRef} className="h-14 w-14">
            <Icons.patient />
          </Circle>
        </div>

        {/* Center: Sanjeevani Logo (Hub) */}
        <div className="flex flex-col justify-center">
          <Circle ref={centerRef} className="h-16 w-16 border-[#2D5A40] border-2">
            <Icons.logo />
          </Circle>
        </div>

        {/* Right: Pharmacies */}
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={pharmacy1Ref} className="p-2">
            <Icons.pharmacy />
          </Circle>
          <Circle ref={pharmacy2Ref} className="p-2">
            <Icons.pill />
          </Circle>
          <Circle ref={pharmacy3Ref} className="p-2">
            <Icons.store />
          </Circle>
          <Circle ref={pharmacy4Ref} className="p-2">
            <Icons.prescription />
          </Circle>
          <Circle ref={pharmacy5Ref} className="p-2">
            <Icons.location />
          </Circle>
        </div>
      </div>

      {/* Patient → Center beam */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={patientRef}
        toRef={centerRef}
        gradientStartColor="#2D5A40"
        gradientStopColor="#FF6B35"
        duration={3}
      />

      {/* Center → Pharmacy beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={pharmacy1Ref}
        gradientStartColor="#2D5A40"
        gradientStopColor="#FF6B35"
        duration={3}
        dotted
        dotSpacing={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={pharmacy2Ref}
        gradientStartColor="#2D5A40"
        gradientStopColor="#FF6B35"
        duration={3.5}
        dotted
        dotSpacing={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={pharmacy3Ref}
        gradientStartColor="#FF6B35"
        gradientStopColor="#2D5A40"
        duration={4}
        dotted
        dotSpacing={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={pharmacy4Ref}
        gradientStartColor="#2D5A40"
        gradientStopColor="#FF6B35"
        duration={3.2}
        dotted
        dotSpacing={5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={pharmacy5Ref}
        gradientStartColor="#FF6B35"
        gradientStopColor="#2D5A40"
        duration={4.5}
        dotted
        dotSpacing={5}
      />
    </div>
  );
}
