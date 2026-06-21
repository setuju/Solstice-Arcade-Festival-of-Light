import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface GameData {
  username: string;
  totalFragments: number;
  completedModes: Record<string, boolean>;
  hiddenTasksCompleted?: Record<string, boolean>;
  cinematicSeen?: Record<string, boolean>;
  easterEggUnlocked?: boolean;
  isAdmin?: boolean;
  hasSeenVictory?: boolean;
  spectrumProgress?: number;
  spectrumSolvedCiphers?: number[];
  spectrumQuestionOrder?: number[];
  spectrumData?: { progress: number; unlockedTier: number };
  spectrumMilestones?: { m10?: boolean; m20?: boolean; m30?: boolean };
  spectrumVisitCount?: number;
  sumoRoundsWon?: number;
  sumoBallsCollected?: number;
  galvestonFamilyFound?: number;
  galvestonBestTime?: number;
  galvestonPatternsSolved?: number;
  shadowChefLevelCompleted?: number;
  shadowChefMistakes?: number;
  shadowChefPerfectClear?: boolean;
  longestLoopCount?: number;
  longestAnomalyFound?: boolean;
  longestAttempts?: number;
  unlockedAchievements?: string[];
}

interface GameContextType {
  user: User | null;
  gameData: GameData | null;
  gameState: string;
  setGameState: (state: string) => void;
  setPreviewUser: () => void;
  updateUserProgress: (modeId: string, fragments: number, hiddenTaskReward?: number) => Promise<void>;
  updateHiddenTask: (modeId: string, fragments: number) => Promise<void>;
  markCinematicSeen: (modeId: string) => Promise<void>;
  unlockEasterEgg: () => Promise<void>;
  markVictorySeen: () => Promise<void>;
  resetProgress: () => Promise<void>;
  skin: string;
  logout: () => Promise<void>;
  incrementSpectrumVisit: () => Promise<number>;
  saveSpectrumProgress: (progress: number, solvedCiphers: number[], order: number[]) => Promise<void>;
  resetSpectrumProgress: () => Promise<void>;
  updateModeProgress: (modeId: string, updates: Record<string, any>) => Promise<void>;
  resetModeProgress: (modeId: string, fields: string[]) => Promise<void>;
  currentResetAction: (() => void) | null;
  setCurrentResetAction: (action: (() => void) | null) => void;
  unlockAchievement: (achievementId: string) => Promise<void>;
  achievementToShow: any | null;
  setAchievementToShow: (achievement: any | null) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameState, setGameState] = useState('hub');
  const [skin, setSkin] = useState<string>('default');
  const [currentResetAction, setCurrentResetAction] = useState<(() => void) | null>(null);
  const [achievementToShow, setAchievementToShow] = useState<any | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) {
        setGameData(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || user.uid === 'demo' || !db) return;
    
    const docRef = doc(db, 'users', user.uid);
    const unsubSnap = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
         const data = docSnap.data() as GameData;
         setGameData(data);
         if (data.easterEggUnlocked) {
           setSkin('enigma');
           document.body.classList.add('enigma-skin');
         }
       } else {
         const newData = { 
           username: user.email?.split('@')[0] || 'User', 
           totalFragments: 0, 
           completedModes: { spectrum: false, galveston: false, sumo: false, shadowchef: false, longestsecond: false }, 
           spectrumProgress: 0,
           spectrumSolvedCiphers: [],
           spectrumQuestionOrder: [],
           sumoRoundsWon: 0,
           sumoBallsCollected: 0,
           galvestonFamilyFound: 0,
           galvestonBestTime: 0,
           galvestonPatternsSolved: 0,
           shadowChefLevelCompleted: 0,
           shadowChefMistakes: 0,
           shadowChefPerfectClear: false,
           longestLoopCount: 0,
           longestAttempts: 0,
           createdAt: new Date() 
         };
         await setDoc(docRef, newData);
         setGameData(newData as any);
       }
    }, (err) => {
      console.warn("Snapshot listener error:", err);
    });
    
    return () => unsubSnap();
  }, [user]);

  const setPreviewUser = () => {
    setUser({ email: 'demo@example.com', uid: 'demo' });
    setGameData({
      username: 'Demo User',
      totalFragments: 124,
      completedModes: { spectrum: false, galveston: false, sumo: false, shadowchef: false, longestsecond: false },
      cinematicSeen: JSON.parse(localStorage.getItem('cinematicSeen') || '{}'),
      hiddenTasksCompleted: {}
    });
  };

  const updateUserProgress = async (modeId: string, fragmentReward: number, hiddenTaskReward: number = 0) => {
    if (user?.uid === 'demo') {
      setGameData(prev => prev ? {
        ...prev,
        totalFragments: prev.totalFragments + fragmentReward + hiddenTaskReward,
        completedModes: { ...prev.completedModes, [modeId]: true }
      } : null);
      if (hiddenTaskReward > 0) {
        alert(`HIDDEN TASK COMPLETED! +${hiddenTaskReward}`);
      }
      return;
    }
    if (!auth?.currentUser || !db) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const updates: any = {
        [`completedModes.${modeId}`]: true,
        totalFragments: increment(fragmentReward + hiddenTaskReward)
      };
      if (hiddenTaskReward > 0) {
        updates[`hiddenTasksCompleted.${modeId}`] = true;
      }
      await updateDoc(docRef, updates);
      if (hiddenTaskReward > 0) {
        alert(`HIDDEN TASK COMPLETED! +${hiddenTaskReward} bonus fragments!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateHiddenTask = async (modeId: string, fragmentReward: number) => {
    if (user?.uid === 'demo') {
      setGameData(prev => prev ? {
        ...prev,
        totalFragments: prev.totalFragments + fragmentReward,
      } : null);
      alert(`HIDDEN TASK COMPLETION! +${fragmentReward} FRAGMENTS!`);
      return;
    }
    if (!auth?.currentUser || !db) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(docRef, {
        [`hiddenTasksCompleted.${modeId}`]: true,
        totalFragments: increment(fragmentReward)
      });
      alert(`HIDDEN TASK COMPLETION! +${fragmentReward} FRAGMENTS GENERATED!`);
    } catch (e) {
      console.error(e);
    }
  };

  const markCinematicSeen = async (modeId: string) => {
    if (user?.uid === 'demo') {
      const current = JSON.parse(localStorage.getItem('cinematicSeen') || '{}');
      current[modeId] = true;
      localStorage.setItem('cinematicSeen', JSON.stringify(current));
      setGameData(prev => prev ? { ...prev, cinematicSeen: current } : null);
      return;
    }

    const currentLocal = JSON.parse(localStorage.getItem('cinematicSeen') || '{}');
    currentLocal[modeId] = true;
    localStorage.setItem('cinematicSeen', JSON.stringify(currentLocal));
    setGameData(prev => prev ? { ...prev, cinematicSeen: { ...prev.cinematicSeen, [modeId]: true } } : null);

    if (!auth?.currentUser || !db) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(docRef, {
        [`cinematicSeen.${modeId}`]: true
      });
    } catch (e) {
      console.warn("Could not save cinematic state online, saved locally.", e);
    }
  };

  const unlockEasterEgg = async () => {
    setSkin('enigma');
    document.body.classList.add('enigma-skin');
    setGameData(prev => prev ? { ...prev, easterEggUnlocked: true } : null);
    localStorage.setItem('easterEggUnlocked', 'true');

    if (!auth?.currentUser || !db) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    
    try {
      await updateDoc(docRef, {
        easterEggUnlocked: true,
        'achievements.imitationGame': true
      });
    } catch (e) {
      console.warn("Could not save easter egg online, saved locally.", e);
    }
  };

  const markVictorySeen = async () => {
    setGameData(prev => prev ? { ...prev, hasSeenVictory: true } : null);
    localStorage.setItem('hasSeenVictory', 'true');

    if (!auth?.currentUser || !db) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(docRef, { hasSeenVictory: true });
    } catch (e) {
      console.warn("Could not save victory state online, saved locally.", e);
    }
  };

  const saveSpectrumProgress = async (progress: number, solvedCiphers: number[], order: number[]) => {
    // localStorage fallback
    localStorage.setItem('spectrumProgress', progress.toString());
    localStorage.setItem('spectrumSolvedCiphers', JSON.stringify(solvedCiphers));
    localStorage.setItem('spectrumQuestionOrder', JSON.stringify(order));

    if (user?.uid === 'demo') {
      setGameData(prev => prev ? { ...prev, spectrumProgress: progress, spectrumSolvedCiphers: solvedCiphers, spectrumQuestionOrder: order } : null);
      return;
    }

    setGameData(prev => prev ? { ...prev, spectrumProgress: progress, spectrumSolvedCiphers: solvedCiphers, spectrumQuestionOrder: order } : null);

    if (!auth?.currentUser || !db) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        spectrumProgress: progress,
        spectrumSolvedCiphers: solvedCiphers,
        spectrumQuestionOrder: order
      });
    } catch (e) {
      console.warn("Could not save spectrum progress online", e);
    }
  };

  const resetSpectrumProgress = async () => {
    localStorage.removeItem('spectrumProgress');
    localStorage.removeItem('spectrumSolvedCiphers');
    localStorage.removeItem('spectrumQuestionOrder');

    setGameData(prev => prev ? { ...prev, spectrumProgress: 0, spectrumSolvedCiphers: [], spectrumQuestionOrder: [] } : null);

    if (!auth?.currentUser || !db) return;
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        spectrumProgress: 0,
        spectrumSolvedCiphers: [],
        spectrumQuestionOrder: []
      });
    } catch (e) {
      console.warn("Could not reset spectrum progress online", e);
    }
  };

  const incrementSpectrumVisit = async () => {
    let newCount = (gameData?.spectrumVisitCount || 0) + 1;
    if (user?.uid === 'demo') {
      setGameData(prev => prev ? { ...prev, spectrumVisitCount: newCount } : null);
      return newCount;
    }
    if (!auth?.currentUser || !db) return newCount;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        spectrumVisitCount: increment(1)
      });
      return newCount;
    } catch (e) {
      console.error(e);
      return newCount;
    }
  };

  const updateModeProgress = async (modeId: string, updates: Record<string, any>) => {
    if (user?.uid === 'demo') {
      setGameData(prev => prev ? { ...prev, ...updates } : null);
      return;
    }
    if (!auth?.currentUser || !db) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
    } catch (e) {
      console.warn(`Could not save progress for ${modeId}`, e);
    }
  };

  const resetModeProgress = async (modeId: string, fields: string[]) => {
    const resetData: Record<string, any> = {};
    fields.forEach(f => resetData[f] = 0);
    
    setGameData(prev => prev ? { ...prev, ...resetData } : null);

    if (user?.uid === 'demo') return;
    if (!auth?.currentUser || !db) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), resetData);
    } catch (e) {
      console.warn(`Could not reset progress for ${modeId}`, e);
    }
  };

  const resetProgress = async () => {
    // Keep easteregg and cinematic, only reset fragments and completed modes
    setGameData(prev => prev ? { 
      ...prev, 
      totalFragments: 0, 
      completedModes: { spectrum: false, galveston: false, sumo: false, shadowchef: false, longestsecond: false },
      hiddenTasksCompleted: {},
      hasSeenVictory: false
    } : null);
    localStorage.removeItem('hasSeenVictory');

    if (!auth?.currentUser || !db) return;
    const docRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(docRef, { 
        totalFragments: 0,
        completedModes: { spectrum: false, galveston: false, sumo: false, shadowchef: false, longestsecond: false },
        hiddenTasksCompleted: {},
        hasSeenVictory: false
      });
    } catch (e) {
      console.warn("Could not reset progress online", e);
    }
  };

  const logout = async () => {
    if (user?.uid === 'demo') {
      setUser(null);
      setGameData(null);
      setGameState('landing');
      return;
    }
    if (auth) {
      await auth.signOut();
      setGameState('landing');
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    if (user?.uid === 'demo') {
        setGameData(prev => prev ? { ...prev, unlockedAchievements: [...(prev.unlockedAchievements || []), achievementId] } : null);
        return;
    }
    if (!auth?.currentUser || !db) return;
    try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            unlockedAchievements: [...(gameData?.unlockedAchievements || []), achievementId]
        });
    } catch(e) { console.error(e); }
  };

  return (
    <GameContext.Provider value={{ user, gameData, gameState, setGameState, setPreviewUser, updateUserProgress, updateHiddenTask, markCinematicSeen, unlockEasterEgg, markVictorySeen, resetProgress, skin, logout, incrementSpectrumVisit, saveSpectrumProgress, resetSpectrumProgress, updateModeProgress, resetModeProgress, currentResetAction, setCurrentResetAction, unlockAchievement, achievementToShow, setAchievementToShow }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
