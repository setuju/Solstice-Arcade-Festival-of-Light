import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export function AdminModal({ onClose }: { onClose: () => void }) {
  const [triggering, setTriggering] = useState(false);
  const [status, setStatus] = useState('');
  const { t } = useLanguage();

  const handleForceUpdate = async () => {
    setTriggering(true);
    setStatus(t('admin.triggering'));
    
    try {
      // Setup your PAT in environment or just mock this for now
      // This is a placeholder for GitHub API call to workflow_dispatch
      /*
      const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_PAT;
      await fetch('https://api.github.com/repos/setuju/Solstice-Arcade---Festival-of-Light/actions/workflows/update-leaderboard.yml/dispatches', {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({ ref: 'main' })
      });
      */
      
      // Since it's a simulated endpoint for now:
      await new Promise(r => setTimeout(r, 1000));
      setStatus(t('admin.success'));
    } catch (e) {
      console.error(e);
      setStatus(t('admin.failed'));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a0b2e] border border-red-500/50 p-6 rounded-lg shadow-2xl w-full max-w-sm font-mono text-white relative">
        <button onClick={onClose} className="absolute top-2 right-4 text-white/50 hover:text-white cursor-pointer">✕</button>
        
        <h2 className="text-xl text-red-400 font-bold mb-4 uppercase">{t('admin.title')}</h2>
        
        <p className="text-sm text-white/70 mb-6">
          {t('admin.description')}
        </p>

        <button 
          onClick={handleForceUpdate} 
          disabled={triggering}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors cursor-pointer"
        >
          {triggering ? t('admin.triggering') : t('admin.forceUpdate')}
        </button>

        {status && (
          <p className="mt-4 text-xs text-center text-red-300">{status}</p>
        )}
      </div>
    </div>
  );
}
