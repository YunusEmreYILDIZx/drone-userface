import React from 'react';

export default function AttitudeIndicator({ pitch, roll }) {
  // Pitch maps to Y translation: e.g. 1 degree = 2px vertical translation
  // Restrict pitch to reasonable visualization limits (-40 to 40)
  const pitchOffset = Math.max(-40, Math.min(40, pitch)) * 2;
  
  return (
    <div className="relative w-48 h-48 rounded-full border-[6px] border-neutral-700 overflow-hidden bg-sky-500 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)] z-20">
      {/* Horizon layer (Rotates with Roll) */}
      <div 
        className="absolute w-full h-[200%] origin-center transition-transform duration-100 ease-linear"
        style={{ 
          transform: `translateY(-25%) rotate(${roll}deg) translateY(${pitchOffset}px)`
        }}
      >
        <div className="w-full h-1/2 bg-sky-500" />
        <div className="w-full h-1 border-t-2 border-white bg-white shadow-xl shadow-white" />
        <div className="w-full h-1/2 bg-[#8B5A2B]" />
      </div>

      {/* Static Overlay (Crosshair) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        {/* Horizontal Wings */}
        <div className="absolute w-24 h-1 bg-yellow-400 opacity-90 rounded" />
        <div className="absolute w-3 h-3 bg-yellow-400 rounded-full border border-black shadow-lg" />
        <div className="absolute top-1/2 -mt-2 w-4 h-4 border-t-2 border-l-2 border-yellow-400 -ml-16 rotate-45" />
        <div className="absolute top-1/2 -mt-2 w-4 h-4 border-t-2 border-r-2 border-yellow-400 ml-16 -rotate-45" />
      </div>

      {/* Degree indicators ticks */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-yellow-400" />
    </div>
  );
}
