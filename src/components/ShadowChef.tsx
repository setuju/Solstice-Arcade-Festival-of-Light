import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { verifyHiddenTask } from '../utils/hiddenTasks';
import { Cinematic } from './Cinematic';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

type Ingredient = 'rice' | 'fish' | 'seaweed';

export function ShadowChef() {
  const { setGameState, updateUserProgress, gameData, markCinematicSeen, user, resetModeProgress, updateModeProgress, setCurrentResetAction } = useGame();
  const { t } = useLanguage();
  
  const [level, setLevel] = useState(1);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [isBlind, setIsBlind] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  
  const [sequence, setSequence] = useState<Ingredient[]>([]);
  const [userSequence, setUserSequence] = useState<Ingredient[]>([]);
  
  const [status, setStatus] = useState<'idle' | 'showing_level' | 'playing' | 'waiting' | 'success' | 'fail' | 'completed'>('idle');
  const [message, setMessage] = useState(t('shadowchef.title'));
  const [milestone, setMilestone] = useState<number | null>(null);

  // Persistent state
  const [levelCompleted, setLevelCompleted] = useState(0);
  const [perfectClear, setPerfectClear] = useState(false);

  const modeId = 'shadowchef';
  const hasSeenCinematic = gameData?.cinematicSeen?.[modeId];

  useEffect(() => {
    if (gameData) {
      setLevelCompleted(gameData.shadowChefLevelCompleted || 0);
      setMistakes(gameData.shadowChefMistakes || 0);
      setPerfectClear(gameData.shadowChefPerfectClear || false);
    }
  }, [gameData]);

  const initAudio = () => {
    if (!audioCtx) {
      setAudioCtx(new (window.AudioContext || (window as any).webkitAudioContext)());
    }
  };

  const playSound = (type: Ingredient, ctx = audioCtx) => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'rice') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'fish') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'seaweed') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  };

  const startLevel = (lvl: number) => {
    initAudio();
    setLevel(lvl);
    setUserSequence([]);
    setStatus('showing_level');
    setMessage(`${t('shadowchef.level')} ${lvl}`);
    
    let count = 3;
    if (lvl === 2) count = 4;
    else if (lvl === 3 || lvl === 4) count = 5;
    else if (lvl === 5) count = 6;
    
    const ingredients: Ingredient[] = ['rice', 'fish', 'seaweed'];
    const newSeq: Ingredient[] = [];
    for (let i = 0; i < count; i++) {
        newSeq.push(ingredients[Math.floor(Math.random() * ingredients.length)]);
    }
    setSequence(newSeq);
  };

  useEffect(() => {
    if (status === 'showing_level') {
      const t = setTimeout(() => {
        setStatus('playing');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    let active = true;
    if (status === 'playing') {
      const playAll = async () => {
        setMessage(t('shadowchef.memorize'));
        for (let i = 0; i < sequence.length; i++) {
          if (!active) return;
          playSound(sequence[i]);
          await new Promise(r => setTimeout(r, 800));
        }
        if (active) {
            setStatus('waiting');
            setMessage(t('shadowchef.yourTurn'));
        }
      };
      playAll();
    }
    return () => { active = false; };
  }, [status, sequence, audioCtx]);

  const handleInput = (ing: Ingredient) => {
    if (status !== 'waiting') return;
    playSound(ing);
    
    const newSeq = [...userSequence, ing];
    setUserSequence(newSeq);
    
    const currentIndex = newSeq.length - 1;
    if (newSeq[currentIndex] !== sequence[currentIndex]) {
      setStatus('fail');
      if (user?.uid) updateModeProgress(modeId, { shadowChefMistakes: increment(1) });
      setMistakes(m => m + 1);
      setMessage(t('shadowchef.incorrect'));
      setTimeout(() => {
        startLevel(level);
      }, 2000);
      return;
    }
    
    if (newSeq.length === sequence.length) {
      if (level === 5) {
        setStatus('completed');
        setMessage(t('shadowchef.masterChef'));
        
        if (user?.uid) {
            updateModeProgress(modeId, {
                shadowChefLevelCompleted: increment(1),
                shadowChefPerfectClear: mistakes === 0 ? true : perfectClear
            });
            setLevelCompleted(l => l + 1);
            setPerfectClear(p => mistakes === 0 ? true : p);
        }

        setTimeout(async () => {
          const isHiddenTaskComplete = verifyHiddenTask(modeId, { perfectClear: mistakes === 0, blindMode: isBlind });
          const hiddenReward = isHiddenTaskComplete && (!gameData?.hiddenTasksCompleted?.[modeId]) ? 4 : 0;
          await updateUserProgress('shadowchef', 2, hiddenReward);
          setGameState('hub');
        }, 3000);
      } else {
        setStatus('success');
        setMessage(t('shadowchef.correct'));
        if (user?.uid) updateModeProgress(modeId, { shadowChefLevelCompleted: increment(1) });
        setLevelCompleted(l => l + 1);
        
        if (level === 3) setMilestone(3);

        setTimeout(() => {
          startLevel(level + 1);
        }, 1500);
      }
    }
  };

  const handleResetProgress = async () => {
    if (confirm(t('common.confirm'))) {
      await resetModeProgress(modeId, ['shadowChefLevelCompleted', 'shadowChefMistakes']);
      setLevelCompleted(0);
      setMistakes(0);
      setPerfectClear(false);
      setGameState('hub');
    }
  };

  useEffect(() => {
    setCurrentResetAction(() => handleResetProgress);
    return () => setCurrentResetAction(null);
  }, []);

  useEffect(() => {
    if (milestone === 3 || milestone === 5) {
      const timer = setTimeout(() => setMilestone(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  if (!hasSeenCinematic) {
    return <Cinematic modeId={modeId} onFinish={() => markCinematicSeen(modeId)} />;
  }

  return (
    <div className={`absolute inset-0 text-white flex flex-col font-sans z-30 pointer-events-auto transition-colors duration-1000 ${isBlind ? 'bg-black' : 'bg-[#111]'}`}>
      {/* Milestone */}
      {milestone && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => setMilestone(null)}>
              <h2 className="text-6xl font-black text-yellow-400 mb-4 animate-bounce">
                  {milestone === 3 ? t('shadowchef.milestone3') : t('shadowchef.milestone5')}
              </h2>
              <p className="text-white text-2xl">{t('shadowchef.clickToContinue')}</p>
          </div>
      )}

      {/* Stats Display */}
      <div className="absolute top-20 left-4 bg-black/70 p-4 rounded text-sm space-y-1 backdrop-blur-md border border-white/10 z-40">
            <div>{t('shadowchef.levelsCompleted')}: {levelCompleted}</div>
            <div>{t('shadowchef.mistakes')}: {mistakes}</div>
      </div>
      
      <div className={`flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto transition-opacity duration-1000 ${isBlind && status === 'playing' ? 'opacity-0' : 'opacity-100'}`}>
        <h2 className={`text-3xl font-black italic uppercase tracking-widest mb-8 ${isBlind ? 'text-white/10' : 'text-[#2ECC40]'}`}>{t('hub.platform.shadowchef')}</h2>
        
        <div className={`text-2xl font-bold mb-12 uppercase tracking-widest 
            ${status === 'fail' ? 'text-red-500' : 
              status === 'success' || status === 'completed' ? 'text-green-400' : (isBlind ? 'text-white/20' : 'text-white')}`}>
          {message}
        </div>

        {status === 'idle' ? (
          <button onClick={() => startLevel(1)} className="px-8 py-4 bg-[#2ECC40] hover:bg-green-600 text-black font-bold text-xl uppercase tracking-widest cursor-pointer">
            {t('shadowchef.start')}
          </button>
        ) : (
          <div className="w-full">
            <div className="flex justify-center gap-2 mb-12 h-4">
              {sequence.map((_, i) => (
                <div key={i} className={`w-12 h-4 rounded-full border border-white/20 transition-colors 
                  ${i < userSequence.length ? (status === 'fail' && i === userSequence.length - 1 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-[#2ECC40] shadow-[0_0_10px_#2ECC40]') : 'bg-transparent'}`}
                />
              ))}
            </div>

            <div className="flex justify-center gap-6 w-full">
              <button 
                onClick={() => handleInput('rice')}
                disabled={status !== 'waiting'}
                className={`flex-1 max-w-[150px] aspect-square flex flex-col items-center justify-center border-2 rounded-xl active:scale-95 transition-all outline-none disabled:cursor-not-allowed cursor-pointer ${isBlind ? 'border-white/10 hover:bg-white/5 text-transparent' : 'border-white/50 hover:bg-white/10'}`}
              >
                <div className={`text-4xl mb-4 ${isBlind ? 'opacity-20' : ''}`}>🍚</div>
                <div className={`font-bold tracking-widest ${isBlind ? 'opacity-20' : ''}`}>{t('shadowchef.ingRice')}</div>
              </button>
              
              <button 
                onClick={() => handleInput('fish')}
                disabled={status !== 'waiting'}
                className={`flex-1 max-w-[150px] aspect-square flex flex-col items-center justify-center border-2 rounded-xl active:scale-95 transition-all outline-none disabled:cursor-not-allowed cursor-pointer ${isBlind ? 'border-white/10 hover:bg-white/5 text-transparent' : 'border-white/50 hover:bg-white/10'}`}
              >
                <div className={`text-4xl mb-4 ${isBlind ? 'opacity-20' : ''}`}>🐟</div>
                <div className={`font-bold tracking-widest ${isBlind ? 'opacity-20' : ''}`}>{t('shadowchef.ingFish')}</div>
              </button>
              
              <button 
                onClick={() => handleInput('seaweed')}
                disabled={status !== 'waiting'}
                className={`flex-1 max-w-[150px] aspect-square flex flex-col items-center justify-center border-2 rounded-xl active:scale-95 transition-all outline-none disabled:cursor-not-allowed cursor-pointer ${isBlind ? 'border-white/10 hover:bg-white/5 text-transparent' : 'border-white/50 hover:bg-white/10'}`}
              >
                <div className={`text-4xl mb-4 ${isBlind ? 'opacity-20' : ''}`}>🌿</div>
                <div className={`font-bold tracking-widest flex-wrap text-center px-2 ${isBlind ? 'opacity-20' : ''}`}>{t('shadowchef.ingSeaweed')}</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end mt-auto max-w-2xl mx-auto w-full pb-8">
        <button onClick={() => setIsBlind(b => !b)} className={`px-4 py-2 border mr-4 transition-colors text-xs uppercase cursor-pointer ${isBlind ? 'border-red-500/50 text-red-500 bg-red-900/20' : 'border-white/30 text-white/50'}`}>
          {isBlind ? t('shadowchef.blindModeOn') : t('shadowchef.blindModeOff')}
        </button>
        <button onClick={initAudio} className="px-4 py-2 border border-[#2ECC40]/50 text-[#2ECC40] hover:bg-[#2ECC40]/10 transition-colors text-xs uppercase cursor-pointer">
          {audioCtx ? t('shadowchef.audioOn') : t('shadowchef.audioOff')}
        </button>
      </div>
    </div>
  );
}
