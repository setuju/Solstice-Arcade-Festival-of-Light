import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useGame } from './GameContext';
import { translations } from '../i18n/translations';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export type LanguageCode = 'en' | 'id' | 'es' | 'fr' | 'de' | 'zh-CN' | 'ja' | 'hi' | 'pt-BR' | 'ru';

export const languageNames: Record<LanguageCode, string> = {
  'en': 'English',
  'id': 'Bahasa Indonesia',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'zh-CN': '中文 (简体)',
  'ja': '日本語',
  'hi': 'हिन्दी',
  'pt-BR': 'Português',
  'ru': 'Русский',
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useGame();
  
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // initial sync from localStorage is preferred before auth is loaded
    const local = localStorage.getItem('language') as LanguageCode;
    return local && translations[local] ? local : 'en';
  });

  // Effect to load language from firebase if available
  useEffect(() => {
    const fetchUserLang = async () => {
      if (user && user.uid !== 'demo' && db) {
        // Technically this could be loaded via GameData, but since we are doing it here, 
        // We'll read it from GameContext locally if we add it, or directly access it.
        // Actually, since we don't have it in GameContext yet, we just manage it locally via auth.
        // But the best place is actually gameData. For now we will rely on GameContext or local store.
      }
    };
    fetchUserLang();
  }, [user]);

  const setLanguage = useCallback(async (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    
    if (user && user.uid !== 'demo' && db) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, { language: lang });
      } catch (e) {
        console.warn('Could not save language to Firebase', e);
      }
    }
  }, [user]);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    let text = translations[language]?.[key];
    
    // Fallback to English if key doesn't exist
    if (!text && language !== 'en') {
      text = translations['en']?.[key];
    }
    
    if (!text) return key; // Fallback to key itself if not completely found

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.split(`{${paramKey}}`).join(String(value));
      });
    }
    
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
