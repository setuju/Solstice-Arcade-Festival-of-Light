import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { AdminModal } from './AdminModal';
import { VictoryAnimation } from './VictoryAnimation';

export function ResponsiveHub() {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, setGameState, gameData, unlockEasterEgg, markVictorySeen, resetProgress } = useGame();
  const { t, language } = useLanguage();
  
  const mousePos = useRef({ x: 400, y: 100 });
  const lastMouseMoveTime = useRef(Date.now());
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);
  const [isListeningTuring, setIsListeningTuring] = useState(false);
  const currentTyped = useRef('');
  const [showAdmin, setShowAdmin] = useState(false);
  
  const allModesCompleted = gameData?.completedModes ? Object.values(gameData.completedModes).filter(Boolean).length === 5 : false;
  const showVictory = allModesCompleted && !gameData?.hasSeenVictory;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = bgCanvasRef.current?.getBoundingClientRect();
      if (rect) {
        mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        lastMouseMoveTime.current = Date.now();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Background Canvas Animation (Stars & Lighthouse Beam)
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawNebula = (ctx: CanvasRenderingContext2D, time: number) => {
      const gradient = ctx.createRadialGradient(
        400 + Math.sin(time * 0.5) * 200, 300 + Math.cos(time * 0.7) * 150, 50,
        400, 300, 600
      );
      gradient.addColorStop(0, `rgba(100, 50, 150, ${0.3 + 0.1 * Math.sin(time)})`);
      gradient.addColorStop(0.5, `rgba(30, 10, 80, 0.2)`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
    };

    const render = () => {
      ctx.clearRect(0, 0, 800, 600);
      const time = Date.now() / 1000;

      // Dynamic Gradient Background
      const grad = ctx.createLinearGradient(0, 0, 0, 600);
      const shift = Math.sin(time * 0.5) * 20;
      grad.addColorStop(0, `hsl(270, 70%, ${15 + shift}%)`); 
      grad.addColorStop(1, `hsl(240, 80%, ${5 + shift}%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);
      
      drawNebula(ctx, time);

      // Nebula additional layers
      const nebula2 = ctx.createRadialGradient(
        200 + Math.sin(time * 0.3) * 150, 
        500 + Math.cos(time * 0.4) * 100, 
        20,
        400, 300, 500
      );
      nebula2.addColorStop(0, `rgba(200, 50, 150, 0.15)`);
      nebula2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, 800, 600);

      // Stars
      for(let i=0; i<300; i++) {
        const sx = (Math.sin(i * 1234.567) * 0.5 + 0.5) * 800;
        const sy = (Math.cos(i * 4321.098) * 0.5 + 0.5) * 600;
        const radius = 0.5 + Math.random() * 1.5;
        const alpha = 0.5 + Math.sin(time * (0.5 + i * 0.01) + i) * 0.5;
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = i % 3 === 0 ? '#ffddff' : (i % 5 === 0 ? '#aaccff' : '#ffffff');
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      if (gameState === 'hub') {
        // Revolving Beam
        let angle = time * 1.5;
        if (Date.now() - lastMouseMoveTime.current < 5000) {
            angle = Math.atan2(mousePos.current.y - 100, mousePos.current.x - 400);
        }

        ctx.globalCompositeOperation = 'lighter';
        const beamGrad = ctx.createLinearGradient(400, 100, 400 + Math.cos(angle) * 1000, 100 + Math.sin(angle) * 1000);
        beamGrad.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(400, 100);
        ctx.lineTo(400 + Math.cos(angle - 0.2) * 800, 100 + Math.sin(angle - 0.2) * 800);
        ctx.lineTo(400 + Math.cos(angle + 0.2) * 800, 100 + Math.sin(angle + 0.2) * 800);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, gameData]);

  // Easter Egg Keyword Listener
  useEffect(() => {
    if (!isListeningTuring) return;
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        currentTyped.current += e.key.toUpperCase();
        if ("TURING".startsWith(currentTyped.current)) {
          if (currentTyped.current === "TURING") {
            unlockEasterEgg();
            setIsListeningTuring(false);
            currentTyped.current = '';
            
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              try {
                const utterance = new SpeechSynthesisUtterance(t('easteregg.turing.monologue'));
                utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
                window.speechSynthesis.speak(utterance);
              } catch (e) {
                console.warn("Speech synthesis failed in ResponsiveHub:", e);
              }
            } else {
              console.warn("Speech synthesis is not supported on this device/browser.");
            }
          }
        } else {
          currentTyped.current = '';
        }
      }
    };
    
    window.addEventListener('keydown', handleKey);
    const timeout = setTimeout(() => {
      setIsListeningTuring(false);
      currentTyped.current = '';
    }, 5000); 
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timeout);
    };
  }, [isListeningTuring, unlockEasterEgg]);

  // Tower DOM Click Handler
  const handleTowerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickTime.current > 3000) {
      clickCount.current = 1;
    } else {
      clickCount.current++;
    }
    lastClickTime.current = now;
    
    if (clickCount.current >= 7 && !gameData?.easterEggUnlocked) {
      setIsListeningTuring(true);
      clickCount.current = 0;
    }
  };

  const platforms = [
    { name: 'Spectrum Architect', id: 'spectrum', x: 200, y: 150, colorHex: '#FF4136', icon: '🧩' },
    { name: 'Echoes of Galveston', id: 'galveston', x: 600, y: 150, colorHex: '#FF851B', icon: '🥁' },
    { name: 'Solstice Sumo', id: 'sumo', x: 650, y: 400, colorHex: '#FFDC00', icon: '🤼' },
    { name: 'Shadow Chef', id: 'shadowchef', x: 400, y: 520, colorHex: '#2ECC40', icon: '🍣' },
    { name: 'The Longest Second', id: 'longestsecond', x: 150, y: 400, colorHex: '#0074D9', icon: '⏳' }
  ];

  return (
    <div className="w-full h-full relative" onClick={() => {}}>
      <canvas 
        ref={bgCanvasRef} 
        width="800" 
        height="600" 
        className="absolute inset-0 w-full h-full pointer-events-none" 
      />
      
      {gameState === 'hub' && (
        <>
          {showVictory && <VictoryAnimation onFinish={() => markVictorySeen()} onPlayAgain={resetProgress} />}
          
          {/* Lighthouse DOM Element (Easter Egg Target) */}
          <div className="absolute top-[80px] left-[360px] w-[120px] h-[280px] flex flex-col items-center justify-end z-10">
            {/* Puncak menara (Easter egg target) */}
            <div 
              className="w-[80px] h-[80px] bg-yellow-300 rounded-full shadow-[0_0_80px_#fde047] cursor-pointer animate-pulse-glow"
              onClick={handleTowerClick}
              title={t('hub.tower.tooltip')}
            />
            {/* Badan menara (kristal) */}
            <div className="w-[80px] h-[200px] bg-gradient-to-r from-gray-600 via-gray-800 to-gray-600 rounded-t-lg [clip-path:polygon(10%_0%,90%_0%,100%_100%,0%_100%)] relative flex flex-col items-center mt-[-10px] shadow-[inset_0_-20px_30px_rgba(100,50,200,0.3)]">
              {/* Garis-garis kristal */}
              <div className="w-full h-[15px] bg-black/40 mt-12" />
              <div className="w-full h-[15px] bg-black/40 mt-16" />
            </div>
          </div>
          
          {/* Platform Elements (DOM) */}
          {platforms.map(p => {
             const isComplete = gameData?.completedModes?.[p.id];
             
             return (
               <div
                 key={p.id}
                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 transition-all duration-500 cursor-pointer group z-20 
                   hover:scale-110 active:scale-95`}
                 style={{
                   left: `${(p.x / 800) * 100}%`,
                   top: `${(p.y / 600) * 100}%`,
                   borderColor: isComplete ? p.colorHex : 'rgba(255, 255, 255, 0.2)',
                   boxShadow: isComplete ? `0 0 40px ${p.colorHex}` : 'none',
                   background: `radial-gradient(circle, ${p.colorHex}33, transparent 70%)`
                 }}
                 onClick={(e) => {
                   e.stopPropagation();
                   setGameState(p.id as any);
                 }}
               >
                 <div className="flex flex-col items-center justify-center w-full h-full">
                   <span className="text-4xl group-hover:scale-110 transition-transform">
                     {p.icon}
                   </span>
                   <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors text-center px-1 font-['Orbitron',sans-serif]">
                     {t(`hub.platform.${p.id}`)}
                   </span>
                 </div>
                 {isComplete && (
                   <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-yellow-400 shadow-[0_0_20px_yellow] flex items-center justify-center text-black text-xs font-bold animate-pulse">
                     ✦
                   </div>
                 )}
                 {isComplete && (
                   <div className="absolute inset-0 pointer-events-none">
                     <div className="absolute w-1 h-1 bg-white rounded-full animate-[orbit_3s_linear_infinite]" style={{ top: '-10px', left: '50%' }} />
                     <div className="absolute w-1 h-1 bg-white rounded-full animate-[orbit_3s_linear_infinite_0.5s]" style={{ bottom: '-10px', right: '50%' }} />
                   </div>
                 )}
               </div>
             );
          })}
          
          <div className="absolute top-4 right-4 z-50">
            {gameData?.isAdmin && (
               <button onClick={() => setShowAdmin(true)} className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded font-mono text-sm border border-red-400 mr-2 shadow-lg">
                 Admin
               </button>
            )}
          </div>
          {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
        </>
      )}

      {/* Easter Egg Overlay state visualizer */}
      {isListeningTuring && (
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <span className="text-red-500/80 font-mono text-4xl animate-pulse tracking-[1em] z-50 shadow-[0_0_20px_#000]">
               {t('easteregg.turing.listening')}
            </span>
         </div>
      )}
    </div>
  );
}
