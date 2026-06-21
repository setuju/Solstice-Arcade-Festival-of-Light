import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface VictoryAnimationProps {
  onFinish: () => void;
  onPlayAgain: () => Promise<void>;
}

export function VictoryAnimation({ onFinish, onPlayAgain }: VictoryAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const { t } = useLanguage();

  const EPILOGUE_TEXTS = [
    t('victory.epilogue1'),
    t('victory.epilogue2')
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const draw = () => {
      time += 0.02;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (phase === 0) {
        // Rays merging
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 200 + Math.sin(time) * 20;

        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i + time * 0.5;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          const gradient = ctx.createLinearGradient(x, y, centerX, centerY);
          const hue = (i * 72 + time * 50) % 360;
          gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
          gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.8)`);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 15;
          ctx.stroke();
        }

        // Rainbow glow
        const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
        glow.addColorStop(0, `hsla(${(time * 50) % 360}, 100%, 50%, 0.5)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
        ctx.fill();

        if (time > 6) {
          setPhase(1);
        }
      } else if (phase >= 1) {
        // Starry night with silhouette
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simple stars
        for (let i = 0; i < 50; i++) {
          const sx = (Math.sin(i * 123) * 0.5 + 0.5) * canvas.width;
          const sy = (Math.cos(i * 321) * 0.5 + 0.5) * canvas.height;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time * 2 + i) * 0.5 + 0.5})`;
          ctx.fillRect(sx, sy, 2, 2);
        }

        // Walking silhouettes (Turing, Tubman, Sumo, Chef, Child)
        const walkCycle = Math.abs(Math.sin(time * 5)) * 10;
        const groupX = (time - 6) * 30 - 100; // Moving from left to right

        const figures = ["🧍‍♂️ Alan Turing", "🧍🏿‍♀️ Tubman", "🤼 Sumo", "👨‍🍳 Chef", "👧 Child"];
        ctx.font = '16px monospace';
        ctx.fillStyle = 'rgba(236, 216, 162, 0.6)'; // Dusty gold
        
        figures.forEach((text, i) => {
          const figX = groupX + i * 80;
          const figY = canvas.height - 100 - (i % 2 === 0 ? walkCycle : -walkCycle);
          ctx.fillText(text, figX, figY);
        });

        if (time > 12 && phase === 1) {
          setPhase(2);
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animId);
  }, [phase]);

  // Typewriter effect
  useEffect(() => {
    if (phase < 2) return;

    if (textIndex < EPILOGUE_TEXTS.length) {
      const fullText = EPILOGUE_TEXTS[textIndex];
      let charIndex = 0;
      
      const interval = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayText(fullText.substring(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setTextIndex(i => i + 1);
          }, 3000);
        }
      }, 50);

      return () => clearInterval(interval);
    } else {
      setPhase(3); // Credits
    }
  }, [phase, textIndex]);

  const handleSkip = () => {
    if (confirm(t('common.confirm'))) {
      onFinish();
    }
  };

  return (
    <div className="absolute inset-0 z-[200] overflow-hidden bg-black text-white font-sans flex flex-col items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width="800" 
        height="600" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      
      {/* Typewriter Text */}
      {phase === 2 && (
        <div className="relative z-10 text-center max-w-2xl px-8">
          <p className="text-2xl md:text-4xl font-serif text-[#ecd8a2] leading-relaxed drop-shadow-[0_0_10px_rgba(236,216,162,0.8)]">
            "{displayText}"
          </p>
        </div>
      )}

      {/* Credits Phase */}
      {phase === 3 && (
        <div className="relative z-10 flex flex-col items-center animate-[fadeIn_2s_ease-out]">
          <h1 className="text-5xl font-bold mb-4 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-[#ecd8a2] to-cyan-400">
            SOLSTICE ARCADE
          </h1>
          <h2 className="text-xl mb-8 tracking-[0.2em] text-white/80">FESTIVAL OF LIGHT</h2>
          
          <div className="space-y-4 text-center mt-8 font-mono text-sm text-white/60">
            <p>{t('victory.credits1')}</p>
            <p>{t('victory.credits2')}</p>
          </div>

          <div className="flex gap-4 mt-16 pointer-events-auto">
            <button 
              onClick={async () => {
                await onPlayAgain();
                onFinish();
              }}
              className="px-6 py-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg backdrop-blur text-white transition-all uppercase tracking-widest text-xs font-bold cursor-pointer"
            >
              {t('victory.playAgain')}
            </button>
            <button 
              onClick={onFinish}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg backdrop-blur text-white transition-all uppercase tracking-widest text-xs cursor-pointer"
            >
              {t('victory.backToHub')}
            </button>
          </div>
        </div>
      )}

      {/* Skip button overlay */}
      {phase < 3 && (
        <button 
          onClick={handleSkip}
          className="absolute bottom-8 right-8 text-xs font-mono text-white/30 hover:text-white transition-colors cursor-pointer"
        >
          {t('cinematic.clickSkip')}
        </button>
      )}
    </div>
  );
}
