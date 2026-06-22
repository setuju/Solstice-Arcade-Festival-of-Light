import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Leaderboard } from './Leaderboard';
import { AdminModal } from './AdminModal';
import { VictoryAnimation } from './VictoryAnimation';

export function Hub() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gameState, setGameState, gameData, unlockEasterEgg, markVictorySeen, resetProgress } = useGame();
  
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);
  const [isListeningTuring, setIsListeningTuring] = useState(false);
  const currentTyped = useRef('');
  const [showAdmin, setShowAdmin] = useState(false);
  
  const allModesCompleted = gameData?.completedModes ? Object.values(gameData.completedModes).filter(Boolean).length === 5 : false;
  const showVictory = allModesCompleted && !gameData?.hasSeenVictory;

  useEffect(() => {
    if (!isListeningTuring) return;
    
    const handleKey = (e: KeyboardEvent) => {
      // Build up string
      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        currentTyped.current += e.key.toUpperCase();
        if ("TURING".startsWith(currentTyped.current)) {
          if (currentTyped.current === "TURING") {
            // Unlock easter egg
            unlockEasterEgg();
            setIsListeningTuring(false);
            currentTyped.current = '';
            
            // Text to speech
            if (typeof window !== 'undefined' && window.speechSynthesis) {
              try {
                const utterance = new SpeechSynthesisUtterance("Mereka menghukumku karena menjadi diriku sendiri. Tapi kode yang kutinggalkan tetap hidup. Terima kasih sudah merakit kembali spektrumku.");
                utterance.lang = 'id-ID';
                window.speechSynthesis.speak(utterance);
              } catch (e) {
                console.warn("Speech synthesis failed:", e);
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
    }, 5000); // 5 sec to type "TURING"
    
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timeout);
    };
  }, [isListeningTuring, unlockEasterEgg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, 800, 600);
      const time = Date.now() / 1000;

      // Dynamic Gradient Background
      const grad = ctx.createLinearGradient(0, 0, 0, 600);
      const shift = Math.sin(time * 0.5) * 20;
      grad.addColorStop(0, `hsl(270, 70%, ${15 + shift}%)`); // Deep purple to night blue
      grad.addColorStop(1, `hsl(240, 80%, ${5 + shift}%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      // Stars Array (twinkling)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for(let i=0; i<150; i++) {
        const sx = (Math.sin(i * 1234) * 0.5 + 0.5) * 800;
        const sy = (Math.cos(i * 4321) * 0.5 + 0.5) * 600;
        const radius = Math.abs(Math.sin(time * (1 + i * 0.1) + i)) * 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (gameState === 'hub') {
        // Revolving Beam (Lighthouse light)
        const beamGrad = ctx.createLinearGradient(400, 100, 400 + Math.cos(time * 1.5) * 1000, 100 + Math.sin(time * 1.5) * 1000);
        beamGrad.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(400, 100);
        ctx.lineTo(400 + Math.cos(time * 1.5 - 0.2) * 800, 100 + Math.sin(time * 1.5 - 0.2) * 800);
        ctx.lineTo(400 + Math.cos(time * 1.5 + 0.2) * 800, 100 + Math.sin(time * 1.5 + 0.2) * 800);
        ctx.closePath();
        ctx.fill();
        
        // Render Lighthouse base
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(370, 260);
        ctx.lineTo(430, 260);
        ctx.lineTo(410, 80);
        ctx.lineTo(390, 80);
        ctx.fill();

        // Lighthouse stripes
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(375, 200);
        ctx.lineTo(425, 200);
        ctx.lineTo(420, 140);
        ctx.lineTo(380, 140);
        ctx.fill();

        // Lighthouse Top (Glow)
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ffffaa';
        ctx.fillStyle = '#fffaaa';
        ctx.beginPath();
        ctx.arc(400, 100, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Magic Particles drifting up around lighthouse
        for(let i=0; i<30; i++) {
          const px = 400 + Math.sin(i * 11 + time) * 150;
          const py = 600 - ((time * 50 + i * 20) % 600);
          ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI*2);
          ctx.fill();
        }
        
        // Platforms (Card-like styling on canvas)
        const platforms = [
          { name: 'Spectrum Architect', id: 'spectrum', x: 200, y: 150, color: '#FF4136', angle: 0, icon: '🧩' },
          { name: 'Echoes of Galveston', id: 'galveston', x: 600, y: 150, color: '#FF851B', angle: 72, icon: '🥁' },
          { name: 'Solstice Sumo', id: 'sumo', x: 650, y: 400, color: '#FFDC00', angle: 144, icon: '🤼' },
          { name: 'Shadow Chef', id: 'shadowchef', x: 400, y: 520, color: '#2ECC40', angle: 216, icon: '🍣' },
          { name: 'The Longest Second', id: 'longestsecond', x: 150, y: 400, color: '#0074D9', angle: 288, icon: '⏳' }
        ];

        platforms.forEach(p => {
          const hover = Math.sin(time * 2 + p.angle) * 8;
          const isComplete = gameData?.completedModes?.[p.id];
          const px = p.x;
          const py = p.y + hover;
          
          // Platform Shadow / Glow
          ctx.shadowBlur = isComplete ? 30 : 15;
          ctx.shadowColor = isComplete ? p.color : 'rgba(0,0,0,0.8)';
          
          // Card Box
          ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
          ctx.beginPath();
          ctx.roundRect(px - 70, py - 35, 140, 70, 12);
          ctx.fill();
          
          // Border
          ctx.strokeStyle = isComplete ? p.color : 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          // Icon
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(p.icon, px, py - 5);

          // Name
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px "Orbitron", "Poppins", sans-serif';
          // Truncate or wrap if necessary, simple approach:
          ctx.fillText(p.name, px, py + 20);
          
          // Completed badge
          if (isComplete) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(px + 60, py - 25, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('✓', px + 60, py - 22);
          }
        });
      } else {
        // Mode Overlay Canvas text
        ctx.fillStyle = '#fff';
        ctx.font = 'italic 900 60px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.fillText(`${gameState.toUpperCase()}`, 400, 280);
        ctx.shadowBlur = 0;
        
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillStyle = '#f97316';
        ctx.fillText(`TRANSMISSION COMING SOON`, 400, 340);
        
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`Click anywhere to return back to hub`, 400, 420);
      }

      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, gameData]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'hub') {
      setGameState('hub');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Tower top coordinates
    if (mx >= 380 && mx <= 420 && my >= 80 && my <= 120) {
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
    }

    const platforms = [
      { id: 'spectrum', x: 200, y: 150 },
      { id: 'galveston', x: 600, y: 150 },
      { id: 'sumo', x: 650, y: 400 },
      { id: 'shadowchef', x: 400, y: 520 },
      { id: 'longestsecond', x: 150, y: 400 }
    ];
    
    platforms.forEach(p => {
      const dx = mx - p.x;
      const dy = my - p.y;
      if (Math.sqrt(dx*dx + dy*dy) < 60) {
        setGameState(p.id);
      }
    });
  };

  return (
    <div className="w-full h-full relative">
      <canvas 
        ref={canvasRef} 
        width="800" 
        height="600" 
        className="block cursor-crosshair w-full h-full" 
        onClick={handleClick}
      />
      {gameState === 'hub' && (
        <>
          {showVictory && <VictoryAnimation onFinish={() => markVictorySeen()} onPlayAgain={resetProgress} />}
          <div className="absolute top-4 right-4 z-50">
            {gameData?.isAdmin && (
               <button onClick={() => setShowAdmin(true)} className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white rounded font-mono text-sm border border-red-400 mr-2">
                 Admin
               </button>
            )}
          </div>
          {showAdmin && <AdminModal onClose={() => setShowAdmin(false)} />}
        </>
      )}
    </div>
  );
}
