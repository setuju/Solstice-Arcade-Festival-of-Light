import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem('hasSeenTutorial', 'true');
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="bg-[#1a0b2e] border border-blue-500/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.2)]">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 shrink-0">
          <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-widest">{t('tutorial.title')}</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto subtle-scrollbar text-white/90 text-sm md:text-base leading-relaxed space-y-6">
          <section>
            <h3 className="text-lg font-bold text-blue-300 mb-2 border-l-2 border-blue-400 pl-3">{t('tutorial.howToPlay')}</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('tutorial.clickPlatforms')}</li>
              <li>{t('tutorial.completeModes')}</li>
              <li><span dangerouslySetInnerHTML={{ __html: t('tutorial.hiddenTasks') }} /></li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-blue-300 mb-2 border-l-2 border-blue-400 pl-3">{t('tutorial.controls')}</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span dangerouslySetInnerHTML={{ __html: t('tutorial.mouseTap') }} /></li>
              <li><span dangerouslySetInnerHTML={{ __html: t('tutorial.wasd') }} /></li>
              <li><span dangerouslySetInnerHTML={{ __html: t('tutorial.space') }} /></li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-blue-300 mb-2 border-l-2 border-blue-400 pl-3">{t('tutorial.modes')}</h3>
            <div className="space-y-3 ml-2">
              <div className="flex items-start gap-3">
                <span className="text-rose-500 text-xl shrink-0 mt-0.5">🧩</span>
                <div><span dangerouslySetInnerHTML={{ __html: t('tutorial.spectrumDesc') }} /></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-xl shrink-0 mt-0.5">🥁</span>
                <div><span dangerouslySetInnerHTML={{ __html: t('tutorial.galvestonDesc') }} /></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 text-xl shrink-0 mt-0.5">🤼</span>
                <div><span dangerouslySetInnerHTML={{ __html: t('tutorial.sumoDesc') }} /></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 text-xl shrink-0 mt-0.5">🍣</span>
                <div><span dangerouslySetInnerHTML={{ __html: t('tutorial.shadowchefDesc') }} /></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl shrink-0 mt-0.5">⏳</span>
                <div><span dangerouslySetInnerHTML={{ __html: t('tutorial.longestsecondDesc') }} /></div>
              </div>
            </div>
          </section>
          
          <section className="bg-white/5 p-4 rounded-lg border border-white/10">
            <p className="text-center font-serif italic text-white/70">
              <span dangerouslySetInnerHTML={{ __html: t('tutorial.hiddenTasksBonus') }} />
            </p>
          </section>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all transform active:scale-95 uppercase tracking-wider text-sm"
          >
            {t('tutorial.startButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
