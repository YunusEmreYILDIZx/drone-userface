import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Plane, Battery, Gauge, Mountain, Wifi, Compass } from 'lucide-react';
import AttitudeIndicator from './components/AttitudeIndicator';
import MapComponent from './components/MapComponent';
import HUD from './components/HUD';

const SOCKET_URL = `http://${window.location.hostname}:3001`;

function App() {
  const [telemetry, setTelemetry] = useState({
    pitch: 0, roll: 0, yaw: 0, altitude: 0, speed: 0, battery: 0,
    gps: { lat: 0, lng: 0 }, flightMode: 'UNKNOWN', armed: false
  });
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('telemetry', (data) => {
      setTelemetry(data);
    });

    return () => newSocket.close();
  }, []);

  const sendCommand = (action, mode) => {
    if (socket) {
      socket.emit('command', { action, mode });
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-900 text-white flex">
      {/* Background Map layer */}
      <div className="absolute inset-0 z-0">
         <MapComponent gps={telemetry.gps} />
      </div>

      {/* Foreground Overlay Layers (Glassmorphism) */}
      <div className="relative z-10 w-full h-full flex flex-col p-4 pointer-events-none">
        
        {/* Top Header */}
        <header className="glass-panel p-4 flex justify-between items-center mb-4 pointer-events-auto">
          <div className="flex items-center gap-3">
            <img src="https://upload.wikimedia.org/wikipedia/tr/a/ab/TrabzonsporAmblemi.png" alt="Trabzonspor Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
            <h1 className="text-2xl font-bold tracking-widest text-[#00AEEF] drop-shadow-[0_0_8px_rgba(0,174,239,0.8)]">TRABZONSPOR</h1>
          </div>
          <div className="flex gap-6 items-center">
             <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400">DURUM</span>
                <span className={`font-bold ${telemetry.armed ? 'text-hud-alert' : 'text-hud-green'}`}>
                  {telemetry.armed ? 'AKTİF' : 'BEKLEMEDE'}
                </span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-xs text-gray-400">UÇUŞ MODU</span>
                <span className="font-bold text-hud-cyan">{telemetry.flightMode}</span>
             </div>
             <div className="flex items-center gap-2">
                <Wifi className={connected ? 'text-hud-green' : 'text-red-500'} />
                <span>{connected ? 'BAĞLANTI OK' : 'BAĞLANTI YOK'}</span>
             </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex gap-4 pointer-events-none">
           {/* Left Sidebar - Attitude/Horizon */}
           <div className="w-80 flex flex-col gap-4 pointer-events-auto">
             <div className="glass-panel p-4 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                <h2 className="absolute top-4 left-4 text-xs text-gray-400 font-bold z-20 shadow-black drop-shadow-md">YÖNELİM</h2>
                <AttitudeIndicator pitch={telemetry.pitch} roll={telemetry.roll} />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs font-mono drop-shadow-md shadow-black">
                  <span>R: {telemetry.roll.toFixed(1)}°</span>
                  <span>P: {telemetry.pitch.toFixed(1)}°</span>
                </div>
             </div>
             
             <div className="glass-panel p-4 h-48 flex flex-col justify-center">
                <h2 className="text-xs text-gray-400 font-bold mb-2">PUSULA</h2>
                <div className="flex items-center justify-center flex-1">
                  <div className="relative w-24 h-24 rounded-full border-2 border-hud-cyan flex items-center justify-center">
                    <Compass className="absolute text-glass-border" size={80} />
                    <div className="w-full h-full absolute transition-transform duration-100 ease-linear" style={{ transform: `rotate(${telemetry.yaw}deg)` }}>
                       <div className="w-2 h-4 bg-hud-alert mx-auto mt-1 rounded"></div>
                    </div>
                  </div>
                  <div className="ml-6 text-3xl font-mono">{telemetry.yaw.toFixed(0)}°</div>
                </div>
             </div>
           </div>

           {/* Right Sidebar - HUD & Controls */}
           <div className="w-80 ml-auto flex flex-col gap-4 pointer-events-auto">
             <HUD telemetry={telemetry} />
             
             <div className="glass-panel p-4 mt-auto">
                <h2 className="text-xs text-gray-400 font-bold mb-4">KOMUTLAR</h2>
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     className="bg-hud-cyan/10 hover:bg-hud-cyan/30 border border-hud-cyan text-hud-cyan py-3 rounded transition-colors font-bold tracking-wider"
                     onClick={() => sendCommand('SET_MODE', 'AUTO')}
                   >
                     OTOMATİK
                   </button>
                   <button 
                     className="bg-hud-green/10 hover:bg-hud-green/30 border border-hud-green text-hud-green py-3 rounded transition-colors font-bold tracking-wider"
                     onClick={() => sendCommand('SET_MODE', 'STABILIZE')}
                   >
                     STABİL (DENGE)
                   </button>
                   <button 
                     className="bg-hud-alert/10 hover:bg-hud-alert/30 border border-hud-alert text-hud-alert py-3 rounded transition-colors font-bold tracking-wider col-span-2 mt-2"
                     onClick={() => sendCommand(telemetry.armed ? 'DISARM' : 'ARM')}
                   >
                     {telemetry.armed ? 'MOTORLARI DURDUR' : 'MOTORLARI ÇALIŞTIR'}
                   </button>
                </div>
             </div>
           </div>
        </main>
      </div>
    </div>
  );
}

export default App;
