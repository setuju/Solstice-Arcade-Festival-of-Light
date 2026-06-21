import React, { useState } from 'react';
import { useLanguage, languageNames, LanguageCode } from '../context/LanguageContext';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = Object.entries(languageNames) as [LanguageCode, string][];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white hover:text-yellow-300 transition-all shadow-md backdrop-blur-sm"
        title={t('common.language')}
      >
        <span className="text-xl">🌐</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 mt-2 w-48 rounded-xl bg-[#1a0b2e]/95 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden z-50">
            <div className="py-2">
              {languages.map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    language === code
                      ? 'bg-yellow-500/20 text-yellow-300 font-bold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="inline-block w-6 text-center opacity-50 mr-2 text-xs">
                    {code.toUpperCase()}
                  </span>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
