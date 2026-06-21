import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  title: string;
  description: string;
  icon: string;
  onClose: () => void;
}

export function AchievementModal({ title, description, icon, onClose }: Props) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-indigo-950 to-purple-950 p-8 rounded-2xl border-2 border-yellow-500 shadow-2xl max-w-sm w-full text-center">
            <div className="text-6xl mb-6">{icon}</div>
            <h2 className="text-2xl font-black text-white mb-2">{t('achievement.unlocked')}</h2>
            <h3 className="text-xl font-bold text-yellow-400 mb-4">{title}</h3>
            <p className="text-gray-300 mb-8">{description}</p>
            <button onClick={onClose} className="w-full py-3 bg-yellow-500 text-black font-bold uppercase tracking-widest rounded shadow-lg hover:bg-yellow-400 transition-colors">{t('achievement.closeButton')}</button>
        </div>
    </div>
  );
}
