import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile } from './UserProfile';
import { LanguageSelector } from './LanguageSelector';

export function HUD() {
  const { user, gameData } = useGame();
  const { t } = useLanguage();
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-1 drop-shadow-lg">
          <div className="relative w-16 h-16 pointer-events-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
              <defs>
                <linearGradient id="fragmentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="32" cy="32" r="28"
                fill="none"
                stroke="url(#fragmentGradient)"
                strokeWidth="4"
                strokeDasharray="175.93"
                strokeDashoffset={175.93 - (175.93 * (gameData?.totalFragments || 0) / 14)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {gameData?.totalFragments || 0}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-orange-300 font-bold ml-2">{t('common.fragments')}</span>
        </div>
        <div className="flex items-start gap-4 pointer-events-auto">
          <LanguageSelector />
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md px-4 py-2 rounded-full border border-white/20 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 border border-white/40 flex items-center justify-center font-bold text-white shadow-sm">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
            <span className="font-medium text-white">{gameData?.username || user.email?.split('@')[0]}</span>
          </button>
        </div>
      </div>

      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}
