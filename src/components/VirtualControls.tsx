import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

export function VirtualControls() {
  const { gameState } = useGame();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (!isTouchDevice || gameState === 'hub') return null;

  const simulateKey = (key: string, code: string, type: 'keydown' | 'keyup') => {
    window.dispatchEvent(new KeyboardEvent(type, { key, code }));
  };

  return (
    <>
      <div className="absolute inset-0 z-[150] pointer-events-none">
        {gameState === 'sumo' && (
          <>
            {/* Left Side: D-Pad */}
            <div className="absolute bottom-6 left-4 md:left-12 flex flex-col items-center gap-2 pointer-events-auto opacity-70 hover:opacity-100 transition-opacity">
              <button 
                className="w-24 h-24 bg-white/20 active:bg-white/40 border-2 border-white/50 rounded-t-3xl backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-white text-4xl"
                onPointerDown={(e) => { e.preventDefault(); simulateKey('w', 'KeyW', 'keydown'); simulateKey('ArrowUp', 'ArrowUp', 'keydown'); }}
                onPointerUp={(e) => { e.preventDefault(); simulateKey('w', 'KeyW', 'keyup'); simulateKey('ArrowUp', 'ArrowUp', 'keyup'); }}
                onPointerLeave={(e) => { e.preventDefault(); simulateKey('w', 'KeyW', 'keyup'); simulateKey('ArrowUp', 'ArrowUp', 'keyup'); }}
              >
                ▲
              </button>
              <div className="flex gap-2">
                <button 
                  className="w-24 h-24 bg-white/20 active:bg-white/40 border-2 border-white/50 rounded-l-3xl backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-white text-4xl"
                  onPointerDown={(e) => { e.preventDefault(); simulateKey('a', 'KeyA', 'keydown'); simulateKey('ArrowLeft', 'ArrowLeft', 'keydown'); }}
                  onPointerUp={(e) => { e.preventDefault(); simulateKey('a', 'KeyA', 'keyup'); simulateKey('ArrowLeft', 'ArrowLeft', 'keyup'); }}
                  onPointerLeave={(e) => { e.preventDefault(); simulateKey('a', 'KeyA', 'keyup'); simulateKey('ArrowLeft', 'ArrowLeft', 'keyup'); }}
                >
                  ◀
                </button>
                <button 
                  className="w-24 h-24 bg-white/20 active:bg-white/40 border-2 border-white/50 rounded-b-3xl backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-white text-4xl"
                  onPointerDown={(e) => { e.preventDefault(); simulateKey('s', 'KeyS', 'keydown'); simulateKey('ArrowDown', 'ArrowDown', 'keydown'); }}
                  onPointerUp={(e) => { e.preventDefault(); simulateKey('s', 'KeyS', 'keyup'); simulateKey('ArrowDown', 'ArrowDown', 'keyup'); }}
                  onPointerLeave={(e) => { e.preventDefault(); simulateKey('s', 'KeyS', 'keyup'); simulateKey('ArrowDown', 'ArrowDown', 'keyup'); }}
                >
                  ▼
                </button>
                <button 
                  className="w-24 h-24 bg-white/20 active:bg-white/40 border-2 border-white/50 rounded-r-3xl backdrop-blur-md flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all text-white text-4xl"
                  onPointerDown={(e) => { e.preventDefault(); simulateKey('d', 'KeyD', 'keydown'); simulateKey('ArrowRight', 'ArrowRight', 'keydown'); }}
                  onPointerUp={(e) => { e.preventDefault(); simulateKey('d', 'KeyD', 'keyup'); simulateKey('ArrowRight', 'ArrowRight', 'keyup'); }}
                  onPointerLeave={(e) => { e.preventDefault(); simulateKey('d', 'KeyD', 'keyup'); simulateKey('ArrowRight', 'ArrowRight', 'keyup'); }}
                >
                  ▶
                </button>
              </div>
            </div>
            
            {/* Right Side: Push Button */}
            <div className="absolute bottom-10 right-4 md:right-12 pointer-events-auto opacity-80 hover:opacity-100 transition-opacity">
              <button 
                className="w-32 h-32 md:w-36 md:h-36 bg-red-500/70 active:bg-red-500 border-4 border-red-300/80 rounded-full backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.6)] active:scale-90 transition-transform font-bold text-white text-2xl tracking-wider select-none"
                onPointerDown={(e) => { e.preventDefault(); simulateKey(' ', 'Space', 'keydown'); }}
                onPointerUp={(e) => { e.preventDefault(); simulateKey(' ', 'Space', 'keyup'); }}
                onPointerLeave={(e) => { e.preventDefault(); simulateKey(' ', 'Space', 'keyup'); }}
              >
                PUSH
              </button>
            </div>
          </>
        )}
        
        {gameState === 'galveston' && (
          <div className="absolute inset-0 pointer-events-auto flex items-center justify-center px-4">
             <button 
                className="w-full max-w-md aspect-square bg-orange-600/30 active:bg-orange-500/70 border-[8px] border-orange-400/60 rounded-full backdrop-blur-2xl font-black text-6xl shadow-[0_0_80px_rgba(249,115,22,0.5)] text-white flex items-center justify-center transform active:scale-90 transition-all uppercase tracking-[0.2em] select-none"
                onPointerDown={(e) => { e.preventDefault(); simulateKey(' ', 'Space', 'keydown'); }}
                onPointerUp={(e) => { e.preventDefault(); simulateKey(' ', 'Space', 'keyup'); }}
                onPointerLeave={(e) => { e.preventDefault(); simulateKey(' ', 'Space', 'keyup'); }}
              >
                TEPUK
              </button>
          </div>
        )}
      </div>

      {isPortrait && (
        <div className="absolute inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-8 text-center text-white backdrop-blur-sm pointer-events-auto">
          <svg className="w-24 h-24 mb-6 text-white animate-[spin_2s_ease-in-out_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h2 className="text-3xl font-bold mb-4 tracking-wider">PLEASE ROTATE DEVICE</h2>
          <p className="text-gray-400 text-xl font-mono">Portrait mode is not supported for gameplay.</p>
        </div>
      )}
    </>
  );
}
