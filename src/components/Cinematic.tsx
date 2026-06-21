import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface CinematicProps {
  modeId: string;
  onFinish: () => void;
}

export function Cinematic({ modeId, onFinish }: CinematicProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const { t } = useLanguage();
  
  const fullText = t(`cinematic.${modeId}`);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(prev => prev + fullText[index]);
        index++;
      } else {
        setIsDone(true);
        clearInterval(interval);
      }
    }, 50); // Typing speed

    return () => clearInterval(interval);
  }, [fullText]);

  // Particle effect wrapper logic
  const handleSkip = () => {
    onFinish();
  };

  return (
    <div 
      onClick={handleSkip}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-8 cursor-pointer overflow-hidden backdrop-blur-sm"
      style={{
        background: 'linear-gradient(180deg, #020005 0%, #17100b 100%)'
      }}
    >
      {/* Simple Star Particles using CSS */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffd700 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '65px 65px', backgroundPosition: '20px 20px' }} />

      <div className="max-w-2xl text-center relative z-10">
        <p className="text-2xl md:text-3xl font-serif leading-relaxed text-[#ecd8a2] tracking-wide mb-12 drop-shadow-[0_0_8px_rgba(236,216,162,0.5)]">
          "{displayedText}"
        </p>
        
        {isDone ? (
          <div className="animate-pulse text-sm tracking-widest text-[#ecd8a2]/60 uppercase">
            {t('cinematic.clickContinue')}
          </div>
        ) : (
          <div className="text-xs tracking-widest text-white/30 uppercase">
            {t('cinematic.clickSkip')}
          </div>
        )}
      </div>
    </div>
  );
}
