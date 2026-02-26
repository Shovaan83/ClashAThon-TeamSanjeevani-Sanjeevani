import { useRef } from 'react';
import { AnimatedBeam, Circle, Icons } from '@/components/ui/animated-beam';

export default function AnimatedBeamAcceptance() {
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
        {/* Left: Pharmacies */}
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
            <Icons.check />
          </Circle>
        </div>

        {/* Center: Sanjeevani Logo (Hub) */}
        <div className="flex flex-col justify-center">
          <Circle ref={centerRef} className="h-16 w-16 border-[#2D5A40] border-2">
            <Icons.logo />
          </Circle>
        </div>

        {/* Right: Patient */}
        <div className="flex flex-col justify-center">
          <Circle ref={patientRef} className="h-14 w-14">
            <Icons.patient />
          </Circle>
        </div>
      </div>

      {/* Pharmacy → Center beams (dotted, incoming) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={pharmacy1Ref}
        toRef={centerRef}
        gradientStartColor="#2D5A40"
        gradientStopColor="#FF6B35"
        duration={3}
        dotted
        dotSpacing={6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={pharmacy2Ref}
        toRef={centerRef}
        gradientStartColor="#006ae3"
        gradientStopColor="#1194ff"
        duration={3.5}
        dotted
        dotSpacing={6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={pharmacy3Ref}
        toRef={centerRef}
        gradientStartColor="#00ac47"
        gradientStopColor="#4fcc5d"
        duration={4}
        dotted
        dotSpacing={6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={pharmacy4Ref}
        toRef={centerRef}
        gradientStartColor="#FF6B35"
        gradientStopColor="#2D5A40"
        duration={3.2}
        dotted
        dotSpacing={6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={pharmacy5Ref}
        toRef={centerRef}
        gradientStartColor="#d948ae"
        gradientStopColor="#5b60ff"
        duration={4.5}
        dotted
        dotSpacing={6}
      />

      {/* Center → Patient beam (solid, accepted offer delivered) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={patientRef}
        gradientStartColor="#2D5A40"
        gradientStopColor="#FF6B35"
        duration={3}
      />
    </div>
  );
}
