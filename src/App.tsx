import React, { useEffect, useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthModal } from './components/AuthModal';
import { ResponsiveHub } from './components/ResponsiveHub';
import { HUD } from './components/HUD';
import { Spectrum } from './components/Spectrum';
import { Sumo } from './components/Sumo';
import { Galveston } from './components/Galveston';
import { ShadowChef } from './components/ShadowChef';
import { LongestSecond } from './components/LongestSecond';
import { ResponsiveLeaderboard } from './components/ResponsiveLeaderboard';
import { Tutorial } from './components/Tutorial';
import { VirtualControls } from './components/VirtualControls';
import { NavigationLoader } from './components/NavigationLoader';
import { LandingPage } from './components/LandingPage';
import { GameHeader } from './components/GameHeader';
import { ParticleLayer } from './components/ParticleLayer';
import { AchievementModal } from './components/AchievementModal';
import { checkAchievements } from './utils/achievements';
import { initAntiDebug } from './utils/antiDebug';
import { initAntiTamper } from './utils/antiTamper';

function GameWorld() {
  const { user, gameState, gameData, setGameState, currentResetAction, achievementToShow, setAchievementToShow, unlockAchievement } = useGame();
  const { t } = useLanguage();
  const [showTutorial, setShowTutorial] = useState(false);
  const [view, setView] = useState<'landing' | 'game'>('landing');
  const [orientationWarning, setOrientationWarning] = useState(false);

  useEffect(() => {
    if (gameData) {
        const achievement = checkAchievements(gameData, gameData.unlockedAchievements || []);
        if (achievement) {
            unlockAchievement(achievement.id);
            setAchievementToShow(achievement);
        }
    }
  }, [gameData]);

  // First-time tutorial hook logic
  useEffect(() => {
    if (!user || view !== 'game') return;
    
    // Check localStorage fallback
    const localFlag = localStorage.getItem('hasSeenTutorial');
    
    if (!localFlag) {
       setShowTutorial(true);
    }
  }, [user, view]);

  // Orientation Check
  useEffect(() => {
    const checkOrientation = () => {
      // Check if it's a mobile device and in portrait mode
      const isMobile = window.innerWidth <= 768; // Or use user agent
      if (isMobile && window.innerHeight > window.innerWidth) {
        setOrientationWarning(true);
      } else {
        setOrientationWarning(false);
      }
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const hasCompletedAny = gameData?.completedModes ? Object.values(gameData.completedModes).some(Boolean) : false;

  const handlePlay = (mode?: string) => {
    if (mode) {
      setGameState(mode as any);
    } else {
      setGameState('hub');
    }
    setView('game');
  };

  if (view === 'landing') {
    return (
      <>
        <LandingPage onPlay={handlePlay} />
        {!user && <AuthModal />}
      </>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#30104a] to-[#5d251d] text-white relative">
      <ParticleLayer />
      {achievementToShow && <AchievementModal {...achievementToShow} onClose={() => setAchievementToShow(null)} />}
      <GameHeader onReset={() => currentResetAction && currentResetAction()} onBackToLanding={() => setView('landing')} />
      {/* Orientation Warning */}
      {orientationWarning && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-md">
          <div className="text-6xl mb-6 animate-pulse">📱🔄</div>
          <h2 className="text-3xl font-bold mb-4 tracking-tight">{t('common.rotateDevice')}</h2>
          <p className="text-white/70 max-w-sm mb-8 text-lg">
            {t('common.rotateDeviceDesc')}
          </p>
          <button 
            onClick={() => setOrientationWarning(false)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors"
          >
            {t('common.rotateDeviceContinue')}
          </button>
        </div>
      )}
      {/* Main Game Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 overflow-y-auto overflow-x-hidden subtle-scrollbar">
        
        {/* Core Canvas / Viewport Wrapper */}
        <div className="w-full max-w-[800px] relative flex flex-col items-center mx-auto transition-all duration-300 transform sm:scale-100">
          <div className="relative w-full aspect-[4/3] bg-black/60 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] border-[3px] border-white/10 shrink-0">
            <NavigationLoader>
              {(displayedState) => (
                <>
                  {displayedState === 'hub' ? <ResponsiveHub /> : null}
                  {displayedState === 'spectrum' && <Spectrum />}
                  {displayedState === 'sumo' && <Sumo />}
                  {displayedState === 'galveston' && <Galveston />}
                  {displayedState === 'shadowchef' && <ShadowChef />}
                  {displayedState === 'longestsecond' && <LongestSecond />}
                </>
              )}
            </NavigationLoader>
            
            <HUD />
            {!user && <AuthModal />}
          </div>

          <VirtualControls />

          {/* Action Row Under Canvas */}
          {gameState === 'hub' && (
            <div className="w-full mt-4 flex justify-between items-center px-2 sm:px-4 z-50 pointer-events-auto">
              <button 
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600/80 hover:bg-blue-500 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-transform active:scale-95 border border-blue-400 font-bold text-sm sm:text-base pointer-events-auto"
              >
                <div className="bg-white/20 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm">?</div>
                {t('common.help')}
              </button>
              
              {!hasCompletedAny && !showTutorial && (
                 <div className="animate-pulse flex items-center gap-2 text-yellow-300 text-xs sm:text-sm font-semibold select-none bg-black/40 px-3 py-1.5 rounded-full border border-yellow-500/30">
                   ← {t('common.tutorialHint')}
                 </div>
              )}

              {/* Mobile Back Button (Render inside action row if mobile) */}
              <button 
                onClick={() => setView('landing')} 
                className="sm:hidden px-4 py-2 bg-black/60 border border-white/20 text-xs text-white hover:text-yellow-300 shrink-0 rounded backdrop-blur transition-all uppercase tracking-widest font-mono shadow-md"
              >
                {t('common.back')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    initAntiDebug();
    initAntiTamper();
  }, []);

  return (
    <GameProvider>
      <LanguageProvider>
        <GameWorld />
      </LanguageProvider>
    </GameProvider>
  );
}
