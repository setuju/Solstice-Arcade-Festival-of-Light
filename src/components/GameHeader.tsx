import React from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onReset: () => void;
  onBackToLanding: () => void;
}

export function GameHeader({ onReset, onBackToLanding }: Props) {
  const { user, gameState, setGameState } = useGame();
  const { t } = useLanguage();
  
  if (gameState === 'landing') return null;

  return (
    <div className="fixed top-0 left-0 w-full h-[var(--header-height)] bg-black/50 backdrop-blur-[12px] border-b border-white/10 flex items-center justify-between px-4 sm:px-6 z-[100] header-container">
       <div className='flex items-center gap-2 sm:gap-4'>
        <button onClick={() => setGameState('hub')} className="text-xs sm:text-sm uppercase tracking-widest text-white/70 hover:text-white cursor-pointer hover:bg-white/10 px-2 sm:px-3 py-1 rounded transition-colors">{t('hub.title')}</button>
        <span className='text-white/40'>|</span>
        <button onClick={onReset} className="text-xs sm:text-sm uppercase tracking-widest text-red-500 hover:text-red-400 cursor-pointer hover:bg-red-900/20 px-2 sm:px-3 py-1 rounded transition-colors">{t('header.reset')}</button>
       </div>
       
       <h1 className="text-sm md:text-lg font-black uppercase tracking-widest text-white absolute left-1/2 -translate-x-1/2">{gameState}</h1>
       
       <div className="flex items-center gap-2 sm:gap-4">
           {user && <span className='hidden md:block text-sm text-white/70 font-mono'>{user.displayName || user.email}</span>}
           <div className='hidden sm:flex w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-xs font-bold text-blue-300'>
             {user?.email?.charAt(0).toUpperCase() || 'U'}
           </div>
           {/* Landing Page Button relocated from App.tsx */}
           <button 
             onClick={onBackToLanding} 
             className="px-2 py-1 sm:px-3 sm:py-1.5 bg-black/40 hover:bg-black/80 border border-white/20 text-[10px] sm:text-xs text-white hover:text-yellow-300 rounded backdrop-blur transition-all uppercase tracking-widest font-mono shadow-xl hidden sm:block cursor-pointer"
           >
             {t('common.landingPage')}
           </button>
       </div>
    </div>
  );
}
