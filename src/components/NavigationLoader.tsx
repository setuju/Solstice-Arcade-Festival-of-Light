import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

export function NavigationLoader({ children }: { children: (displayedState: string) => React.ReactNode }) {
  const { gameState } = useGame();
  const [displayedState, setDisplayedState] = useState(gameState);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (gameState !== displayedState) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedState(gameState);
        setIsTransitioning(false);
      }, 700); // 700ms simulated transition loading

      return () => clearTimeout(timer);
    }
  }, [gameState, displayedState]);

  return (
    <>
      {children(displayedState)}
      
      {isTransitioning && (
        <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-[#0a0514]/95 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto">
          <div className="relative flex items-center justify-center">
            {/* Outer Static Ring */}
            <div className="absolute w-20 h-20 border-[3px] border-white/5 rounded-full"></div>
            {/* Fast Inner Ring */}
            <div className="absolute w-20 h-20 border-[3px] border-transparent border-t-blue-500 border-l-blue-500 rounded-full animate-spin"></div>
            {/* Reverse Outer Ring */}
            <div className="absolute w-28 h-28 border-[3px] border-transparent border-b-yellow-400 border-r-yellow-400 rounded-full animate-[spin_1.5s_reverse_linear_infinite]"></div>
            {/* Center Core */}
            <div className="w-4 h-4 bg-white/90 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] animate-pulse"></div>
          </div>
          <div className="mt-12 flex flex-col items-center">
            <div className="text-blue-200 font-bold tracking-[0.3em] uppercase text-xs mb-2 animate-pulse drop-shadow-md">
              Transfer Request
            </div>
            <div className="text-[10px] text-white/50 font-mono bg-black/50 px-3 py-1 rounded border border-white/10 uppercase">
              {gameState === 'hub' ? 'Returning to Hub_World' : `Initializing ${gameState}_Env`}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
