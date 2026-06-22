import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { verifyHiddenTask } from '../utils/hiddenTasks';
import { Cinematic } from './Cinematic';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const GRID_SIZE = 25;
const FAMILY_COUNT = 4;
const TOTAL_TIME = 180;

interface Cell {
  id: number;
  isFamily: boolean;
  isFound: boolean;
  checked: boolean;
}

export function Galveston() {
  const { setGameState, updateUserProgress, gameData, markCinematicSeen, user, resetModeProgress, updateModeProgress, setCurrentResetAction } = useGame();
  const { t } = useLanguage();
  
  const [cells, setCells] = useState<Cell[]>([]);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pattern, setPattern] = useState<number[]>([]);
  const [recorded, setRecorded] = useState<number[]>([]);
  const [message, setMessage] = useState(t('galveston.title'));
  const [beatHistory, setBeatHistory] = useState<string>('');
  
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);

  // Persistent state
  const [familyFound, setFamilyFound] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [patternsSolved, setPatternsSolved] = useState(0);

  const modeId = 'galveston';
  const hasSeenCinematic = gameData?.cinematicSeen?.[modeId];
  
  useEffect(() => {
    if (gameData) {
      setFamilyFound(gameData.galvestonFamilyFound || 0);
      setBestTime(gameData.galvestonBestTime || 0);
      setPatternsSolved(gameData.galvestonPatternsSolved || 0);
    }
  }, [gameData]);

  const initGame = useCallback(() => {
    let newCells: Cell[] = Array.from({ length: GRID_SIZE }).map((_, i) => ({
      id: i,
      isFamily: false,
      isFound: false,
      checked: false
    }));
    
    let placed = 0;
    while(placed < FAMILY_COUNT) {
      const idx = Math.floor(Math.random() * GRID_SIZE);
      if (!newCells[idx].isFamily) {
        newCells[idx].isFamily = true;
        placed++;
      }
    }
    
    setCells(newCells);
    setTimeLeft(TOTAL_TIME);
    setGameOver(false);
    setVictory(false);
    setMessage(t('galveston.findFamily'));
    setActiveCell(null);
  }, [t]);

  useEffect(() => {
    if (hasSeenCinematic) {
      initGame();
    }
  }, [initGame, hasSeenCinematic]);

  useEffect(() => {
    if (gameOver || victory || activeCell !== null || !hasSeenCinematic) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver, victory, activeCell, hasSeenCinematic]);

  useEffect(() => {
    const found = cells.filter(c => c.isFound).length;
    if (found === FAMILY_COUNT && FAMILY_COUNT > 0) {
      setVictory(true);
      setMessage(t('galveston.freedomFound'));
      
      // Update persistent progress
      if (user?.uid) {
        updateModeProgress(modeId, {
            galvestonFamilyFound: increment(4),
            galvestonBestTime: Math.min(bestTime === 0 ? 9999 : bestTime, TOTAL_TIME - timeLeft)
        });
        setFamilyFound(f => f + 4);
      }

      setTimeout(async () => {
        const isHiddenTaskComplete = verifyHiddenTask(modeId, { beatPattern: beatHistory });
        const hiddenReward = isHiddenTaskComplete && (!gameData?.hiddenTasksCompleted?.[modeId]) ? 2 : 0;
        await updateUserProgress('galveston', 2, hiddenReward);
        setGameState('hub');
      }, 3000);
    }
  }, [cells, setGameState, updateUserProgress, beatHistory, gameData?.hiddenTasksCompleted, modeId]);

  const initAudio = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(err => console.warn("Could not resume audio component:", err));
          }
          setAudioCtx(ctx);
        } catch (e) {
          console.error("Failed to initialize AudioContext in Galveston:", e);
        }
      } else {
        console.warn("AudioContext is not supported on this browser.");
      }
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(err => console.warn("Could not resume active audio component:", err));
    }
  };

  const playBeep = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
    osc.stop(audioCtx.currentTime + 0.1);
  };

  const playPattern = async (intervals: number[]) => {
    setIsPlaying(true);
    playBeep();
    for (let i = 0; i < intervals.length; i++) {
      await new Promise(r => setTimeout(r, intervals[i]));
      playBeep();
    }
    setIsPlaying(false);
    setIsListening(true);
    setRecorded([]);
    setMessage(t('galveston.copyBeat'));
  };

  const handleCellClick = (idx: number) => {
    if (gameOver || victory || activeCell !== null) return;
    initAudio();
    
    const cell = cells[idx];
    if (cell.isFound) return;
    
    if (!cell.isFamily) {
      setMessage(t('galveston.noTrace'));
      setCells(prev => prev.map((c, i) => i === idx ? { ...c, checked: true } : c));
      setTimeout(() => setMessage(t('galveston.findFamily')), 1000);
      return;
    }
    
    setActiveCell(idx);
    setMessage(t('galveston.listen'));
    
    const intervals = [
      Math.floor(Math.random() * 500) + 400,
      Math.floor(Math.random() * 500) + 400,
      Math.floor(Math.random() * 500) + 400
    ];
    setPattern(intervals);
    
    setTimeout(() => {
      playPattern(intervals);
    }, 1000);
  };

  const handleTap = useCallback(() => {
     if (!isListening) return;
     playBeep();
     const now = performance.now();
     setRecorded(prev => {
         const newRecorded = [...prev, now];
         
         if (newRecorded.length === pattern.length + 1) {
           setIsListening(false);
           let success = true;
           for (let i = 0; i < pattern.length; i++) {
             const expectedInterval = pattern[i];
             const actualInterval = newRecorded[i+1] - newRecorded[i];
             if (Math.abs(actualInterval - expectedInterval) > 200) {
               success = false;
               break;
             }
           }
           
           if (success) {
             setMessage(t('galveston.memoryConnected'));
             setCells(allCells => allCells.map((c, i) => i === activeCell ? { ...c, isFound: true, checked: true } : c));
             if (user?.uid) updateModeProgress(modeId, { galvestonPatternsSolved: increment(1) });
             setPatternsSolved(p => p + 1);
             const newFound = familyFound + 1;
             setFamilyFound(newFound);
             if (newFound === 2) setMilestone(2);
             else if (newFound === 4) setMilestone(4);

           } else {
             setMessage(t('galveston.patternMismatch'));
             setTimeLeft(time => Math.max(0, time - 5));
           }
           setTimeout(() => {
             setActiveCell(null);
             setMessage(t('galveston.findFamily'));
           }, 2000);
         }
         return newRecorded;
     });
  }, [isListening, pattern, activeCell, audioCtx]);

  const handleResetProgress = async () => {
    if (confirm(t('common.confirm'))) {
      await resetModeProgress(modeId, ['galvestonFamilyFound', 'galvestonBestTime', 'galvestonPatternsSolved']);
      setFamilyFound(0);
      setBestTime(0);
      setPatternsSolved(0);
      setGameState('hub');
    }
  };

  useEffect(() => {
    setCurrentResetAction(() => handleResetProgress);
    return () => setCurrentResetAction(null);
  }, []);

  useEffect(() => {
    if (milestone === 2 || milestone === 4) {
      const timer = setTimeout(() => setMilestone(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  if (!hasSeenCinematic) {
    return <Cinematic modeId={modeId} onFinish={() => markCinematicSeen(modeId)} />;
  }

  return (
    <div className="absolute inset-0 bg-[#3b2f2f] text-[#ecd8a2] flex flex-col font-mono z-30 pointer-events-auto">

      {/* Milestone */}
      {milestone && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => setMilestone(null)}>
              <h2 className="text-6xl font-black text-yellow-400 mb-4 animate-bounce">
                  {milestone === 2 ? t('galveston.milestone2') : t('galveston.milestone4')}
              </h2>
              <p className="text-white text-2xl">{t('galveston.clickToContinue')}</p>
          </div>
      )}

      <div className="flex justify-between items-center mb-6 max-w-[500px] mx-auto w-full px-4 pt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-widest uppercase">{t('hub.platform.galveston')}</h2>
          <div className="text-sm">{t('galveston.familyFound')}: {familyFound} / {FAMILY_COUNT}</div>
        </div>
        <div className="text-3xl font-black">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
      </div>
      
      <div className="text-center mb-6 h-8 text-xl font-bold text-[#facc15]">{message}</div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="grid grid-cols-5 gap-1 bg-[#1a1414] p-1 rounded border-2 border-[#544343]">
          {cells.map((cell, idx) => (
            <div 
              key={cell.id} 
              onClick={() => handleCellClick(idx)}
              className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-4xl border border-[#2e2424] cursor-pointer transition-colors
                ${activeCell === idx ? 'bg-[#5c4a4a] shadow-[0_0_15px_#facc15] ring-2 ring-[#facc15]' : 'bg-[#2a2121] hover:bg-[#3d3131]'}
                ${cell.checked && !cell.isFound ? 'opacity-30' : ''}
              `}
            >
              {cell.isFound ? '👤' : (cell.checked ? '·' : '')}
            </div>
          ))}
        </div>
        
        {gameOver && !victory && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-red-500 mb-4">{t('galveston.timeUp')}</h2>
            <button onClick={initGame} className="px-6 py-3 bg-[#544343] hover:bg-[#6c5656] font-bold text-white uppercase tracking-widest cursor-pointer">{t('galveston.tryAgain')}</button>
          </div>
        )}
      </div>
      
      {isListening && (
        <div 
            onClick={(e) => { e.preventDefault(); handleTap(); }} 
            className="absolute inset-0 z-50 cursor-pointer flex items-end justify-center pb-20"
        >
            <div className="bg-white/10 px-8 py-4 rounded-full border border-white/30 backdrop-blur-md animate-pulse">
                {t('galveston.tapArea')}
            </div>
        </div>
      )}
    </div>
  );
}
