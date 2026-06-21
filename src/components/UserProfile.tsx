import React from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODES_DATA = [
  {
    id: 'spectrum',
    icon: '🌈',
    fragments: 2,
    hintKey: 'hub.platform.spectrum.hint'
  },
  {
    id: 'galveston',
    icon: '🌊',
    fragments: 2,
    hintKey: 'hub.platform.galveston.hint'
  },
  {
    id: 'sumo',
    icon: '🤼',
    fragments: 3,
    hintKey: 'hub.platform.sumo.hint'
  },
  {
    id: 'shadowchef',
    icon: '🍳',
    fragments: 4,
    hintKey: 'hub.platform.shadowchef.hint'
  },
  {
    id: 'longestsecond',
    icon: '⏳',
    fragments: 2,
    hintKey: 'hub.platform.longestsecond.hint'
  }
];

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, gameData, logout } = useGame();
  const { t } = useLanguage();

  if (!isOpen || !user) return null;

  if (!gameData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="text-white text-xl animate-pulse">{t('profile.loading')}</div>
      </div>
    );
  }

  const handleLogout = async () => {
    if (window.confirm(t('common.confirm'))) {
      await logout();
      onClose();
    }
  };

  const username = gameData.username || user.email?.split('@')[0] || t('common.unknown');
  const totalFragments = gameData.totalFragments || 0;
  const maxFragments = 14;
  const progressPercent = Math.min(100, Math.round((totalFragments / maxFragments) * 100));
  
  const htc = gameData.hiddenTasksCompleted || {};
  const cm = gameData.completedModes || {};
  const allClear = Object.values(cm).filter(Boolean).length === 5;
  const mirrorModeUnlocked = totalFragments >= 14 || allClear;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-2xl bg-slate-900/90 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center text-2xl font-black text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{username}</h2>
              <p className="text-sm text-indigo-300 font-mono">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Stats Bar */}
          <div className="bg-black/40 rounded-xl p-5 border border-white/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-slate-300 uppercase tracking-widest">{t('profile.fragments')}</span>
              <span className="text-xl font-bold text-yellow-400">{totalFragments} / {maxFragments}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${gameData.easterEggUnlocked ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-slate-700'}`}></div>
                <span className={`text-sm ${gameData.easterEggUnlocked ? 'text-green-300' : 'text-slate-500'}`}>{t('profile.easterEgg')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${mirrorModeUnlocked ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-slate-700'}`}></div>
                <span className={`text-sm ${mirrorModeUnlocked ? 'text-purple-300' : 'text-slate-500'}`}>{t('profile.mirrorMode')}</span>
              </div>
            </div>
          </div>

          {/* Hidden Tasks / Fragments */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📖</span> {t('profile.codex')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MODES_DATA.map(mode => {
                const isCompleted = htc[mode.id];
                return (
                  <div key={mode.id} className={`p-4 rounded-xl border ${isCompleted ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-200 flex items-center gap-2">
                        <span>{mode.icon}</span> {t(`hub.platform.${mode.id}`)}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${isCompleted ? 'text-yellow-400' : 'text-slate-500'}`}>
                          {isCompleted ? t('profile.taskCompleted') : t('profile.taskIncomplete')}
                        </span>
                        <span className="text-xs text-yellow-500/70 font-mono">+{mode.fragments}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(mode.hintKey)}
                    </p>
                  </div>
                );
              })}
              
              {/* Bonus All-Clear Row */}
              <div className={`p-4 rounded-xl border col-span-1 md:col-span-2 ${allClear ? 'bg-yellow-900/30 border-yellow-500/50' : 'bg-slate-800/30 border-dashed border-white/10'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-amber-200 flex items-center gap-2">
                    <span>🌟</span> {t('profile.allClearBonus')}
                  </h4>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold ${allClear ? 'text-yellow-400' : 'text-slate-500'}`}>
                      {allClear ? t('profile.taskCompleted') : t('profile.taskIncomplete')}
                    </span>
                    <span className="text-xs text-yellow-500/70 font-mono">+1</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('profile.allClearDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-500/50"
          >
            {t('profile.logoutButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
