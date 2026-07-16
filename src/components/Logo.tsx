import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dark?: boolean;
  inline?: boolean;
}

export default function Logo({ className = '', size = 'md', dark = false, inline = false }: LogoProps) {
  // Size-based styling mapping
  const waveSizes = {
    sm: 'h-6 w-8',
    md: 'h-8 w-10',
    lg: 'h-14 w-16',
    xl: 'h-20 w-24',
  };

  const textSizes = {
    sm: 'text-sm font-bold',
    md: 'text-lg font-extrabold',
    lg: 'text-3xl font-black',
    xl: 'text-5xl font-black',
  };

  const subtitleSizes = {
    sm: 'text-[6px] tracking-[0.1em]',
    md: 'text-[8px] tracking-[0.18em]',
    lg: 'text-[11px] tracking-[0.25em]',
    xl: 'text-[15px] tracking-[0.3em]',
  };

  const textColor = dark ? 'text-white' : 'text-slate-900';
  const subtitleColor = dark ? 'text-slate-400' : 'text-slate-500';

  const logoIcon = (
    <svg 
      viewBox="0 0 100 70" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${waveSizes[size]} shrink-0`}
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="45%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* 3 curved wind/air conditioning waves styling matching the uploaded reference logo */}
      <path 
        d="M 10 18 Q 32 6, 54 18 T 90 18 Q 72 32, 50 22 T 10 18 Z" 
        fill="url(#waveGrad)" 
      />
      <path 
        d="M 10 34 Q 32 22, 54 34 T 90 34 Q 72 48, 50 38 T 10 34 Z" 
        fill="url(#waveGrad)" 
      />
      <path 
        d="M 10 50 Q 32 38, 54 50 T 90 50 Q 72 64, 50 54 T 10 50 Z" 
        fill="url(#waveGrad)" 
      />
    </svg>
  );

  if (inline) {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        {logoIcon}
        <div className="flex flex-col text-left">
          <h1 className={`font-sans ${textSizes[size]} ${textColor} leading-none tracking-tight`}>
            Alure
          </h1>
          <p className={`font-sans font-bold uppercase ${subtitleSizes[size]} ${subtitleColor} mt-0.5`}>
            Ar Condicionado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {logoIcon}
      <h1 className={`font-sans ${textSizes[size]} ${textColor} leading-none tracking-tight mt-1.5`}>
        Alure
      </h1>
      <p className={`font-sans font-bold uppercase ${subtitleSizes[size]} ${subtitleColor} mt-1`}>
        Ar Condicionado
      </p>
    </div>
  );
}
