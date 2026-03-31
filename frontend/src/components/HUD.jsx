import React from 'react';
import { Battery, Gauge, Mountain } from 'lucide-react';

// null-safe değer gösterici
const val = (v, decimals = 1) => {
  if (v === null || v === undefined) return '—';
  return v.toFixed(decimals);
};

export default function HUD({ telemetry }) {
  const getBatteryColor = (level) => {
    if (level === null || level === undefined) return 'text-gray-500';
    if (level > 50) return 'text-hud-green';
    if (level > 20) return 'text-yellow-400';
    return 'text-hud-alert';
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-4 flex-1 justify-center relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-hud-cyan/10 blur-3xl rounded-full" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-hud-green/10 blur-3xl rounded-full" />

      <h2 className="text-xs text-gray-400 font-bold mb-2 z-10">TELEMETRİ</h2>
      
      {/* Altitude */}
      <div className="relative z-10 flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 shadow-black drop-shadow-md">
        <div className="flex items-center gap-3">
          <Mountain className="text-hud-cyan" size={24} />
          <span className="text-sm text-gray-200 font-bold">İRTİFA</span>
        </div>
        <div className="text-3xl font-mono tracking-widest" style={{ textShadow: '0 0 10px var(--color-hud-cyan)' }}>
          {val(telemetry.altitude)} <span className="text-sm text-gray-400 font-sans tracking-normal">m</span>
        </div>
      </div>

      {/* Speed */}
      <div className="relative z-10 flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 shadow-black drop-shadow-md">
        <div className="flex items-center gap-3">
          <Gauge className="text-hud-cyan" size={24} />
          <span className="text-sm text-gray-200 font-bold">HIZ</span>
        </div>
        <div className="text-3xl font-mono tracking-widest text-white shadow-hud-cyan" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
          {val(telemetry.speed)} <span className="text-sm text-gray-400 font-sans tracking-normal">m/s</span>
        </div>
      </div>

      {/* Battery */}
      <div className="relative z-10 flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 shadow-black drop-shadow-md">
        <div className="flex items-center gap-3">
          <Battery className={getBatteryColor(telemetry.battery)} size={24} />
          <span className="text-sm text-gray-200 font-bold">BATARYA</span>
        </div>
        <div className={`text-3xl font-mono tracking-widest ${getBatteryColor(telemetry.battery)}`} style={{ textShadow: `0 0 10px currentColor` }}>
          {val(telemetry.battery)} <span className="text-sm opacity-60 font-sans tracking-normal">%</span>
        </div>
      </div>
      
      {/* Lat/Lng Text */}
      <div className="mt-4 text-xs font-mono text-gray-400 flex justify-between px-2 z-10 bg-black/30 p-2 rounded">
         <span>ENLEM__{val(telemetry.gps.lat, 6)}</span>
         <span>BOYLAM__{val(telemetry.gps.lng, 6)}</span>
      </div>
    </div>
  );
}
