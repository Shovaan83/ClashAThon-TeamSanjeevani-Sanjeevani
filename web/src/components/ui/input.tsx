import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full border border-stone-200 bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-stone-400 outline-none transition-all focus:ring-2 focus:ring-[#2D5A40]/20 focus:border-[#2D5A40] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
