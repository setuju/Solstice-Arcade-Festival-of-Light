import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { verifyHiddenTask } from '../utils/hiddenTasks';
import { Cinematic } from './Cinematic';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface NPC {
  id: number;
  x: number;
  y: number;
}

const CANVAS_SIZE = 400;
const GRID_CELLS = 10;
const CELL_SIZE = CANVAS_SIZE / GRID_CELLS;
const MAX_LOOPS = 10;
const PLAYER_SPEED = 150; // pixels per second
const INTERACT_DISTANCE = 40;

export function LongestSecond() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setGameState, updateUserProgress, gameData, markCinematicSeen, user, updateModeProgress, resetModeProgress, setCurrentResetAction } = useGame();
  const { t } = useLanguage();

  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [anomalyId, setAnomalyId] = useState<number>(-1);
  const [loopCount, setLoopCount] = useState<number>(1);
  const [selectedNpcId, setSelectedNpcId] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ text: string, x: number, y: number, timer: number } | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'win' | 'lose'>('playing');
  const [message, setMessage] = useState<string>(t('longestsecond.findAnomaly'));
  const [milestone, setMilestone] = useState<number | null>(null);

  // Persistent state
  const [loopsPlayed, setLoopsPlayed] = useState(0);
  const [anomalyFound, setAnomalyFound] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const modeId = 'longestsecond';
  const hasSeenCinematic = gameData?.cinematicSeen?.[modeId];

  useEffect(() => {
    if (gameData) {
      setLoopsPlayed(gameData.longestLoopCount || 0);
      setAnomalyFound(gameData.longestAnomalyFound || false);
      setAttempts(gameData.longestAttempts || 0);
    }
  }, [gameData]);

  const playerRef = useRef({ x: CELL_SIZE * 1.5, y: CELL_SIZE * 1.5 });
  const keys = useRef<{ [key: string]: boolean }>({});

  const generateNpcs = useCallback(() => {
    const newNpcs: NPC[] = [];
    const usedPositions = new Set<string>();
    // Reserve top-left for player
    usedPositions.add(`1,1`);
    
    while (newNpcs.length < 10) {
      const gridX = Math.floor(Math.random() * GRID_CELLS);
      const gridY = Math.floor(Math.random() * GRID_CELLS);
      const posKey = `${gridX},${gridY}`;
      
      if (!usedPositions.has(posKey)) {
        usedPositions.add(posKey);
        newNpcs.push({
          id: newNpcs.length,
          x: gridX * CELL_SIZE + CELL_SIZE / 2,
          y: gridY * CELL_SIZE + CELL_SIZE / 2,
        });
      }
    }
    setNpcs(newNpcs);
    setAnomalyId(Math.floor(Math.random() * 10));
  }, []);

  const resetGame = useCallback(() => {
    playerRef.current = { x: CELL_SIZE * 1.5, y: CELL_SIZE * 1.5 };
    setLoopCount(1);
    setSelectedNpcId(null);
    setDialog(null);
    setGameStatus('playing');
    setMessage(t('longestsecond.findAnomaly'));
    generateNpcs();
  }, [generateNpcs, t]);

  useEffect(() => {
    if (hasSeenCinematic) {
      resetGame();
    }
  }, [resetGame, hasSeenCinematic]);

  useEffect(() => {
    if (!hasSeenCinematic) return;
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [hasSeenCinematic]);

  useEffect(() => {
    if (!hasSeenCinematic) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let animId: number;

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (gameStatus === 'playing') {
        const p = playerRef.current;
        let dx = 0;
        let dy = 0;
        if (keys.current['KeyW'] || keys.current['ArrowUp']) dy -= PLAYER_SPEED * dt;
        if (keys.current['KeyS'] || keys.current['ArrowDown']) dy += PLAYER_SPEED * dt;
        if (keys.current['KeyA'] || keys.current['ArrowLeft']) dx -= PLAYER_SPEED * dt;
        if (keys.current['KeyD'] || keys.current['ArrowRight']) dx += PLAYER_SPEED * dt;

        p.x = Math.max(8, Math.min(CANVAS_SIZE - 8, p.x + dx));
        p.y = Math.max(8, Math.min(CANVAS_SIZE - 8, p.y + dy));

        // Interaction with E
        if (keys.current['KeyE']) {
          keys.current['KeyE'] = false; // consume key
          let closestNpc = null;
          let minD = Infinity;
          for (const npc of npcs) {
            const d = Math.hypot(p.x - npc.x, p.y - npc.y);
            if (d < minD && d < INTERACT_DISTANCE) {
              minD = d;
              closestNpc = npc;
            }
          }

          if (closestNpc) {
            setSelectedNpcId(closestNpc.id);
            const isAnomaly = closestNpc.id === anomalyId;
            setDialog({
              text: isAnomaly ? t('longestsecond.anomalyDialog') : t('longestsecond.normalDialog'),
              x: closestNpc.x,
              y: closestNpc.y - 25,
              timer: 2.0
            });
          }
        }
      }

      ctx.fillStyle = '#1e1b4b'; // dark blue background
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      ctx.strokeStyle = '#312e81';
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      npcs.forEach(npc => {
        ctx.fillStyle = npc.id === selectedNpcId ? '#9ca3af' : '#4b5563';
        ctx.fillRect(npc.x - 12, npc.y - 12, 24, 24);
        ctx.strokeStyle = npc.id === selectedNpcId ? '#fbbf24' : '#1f2937';
        ctx.lineWidth = 2;
        ctx.strokeRect(npc.x - 12, npc.y - 12, 24, 24);
      });

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(playerRef.current.x, playerRef.current.y, 8, 0, Math.PI * 2);
      ctx.fill();

      setDialog(prev => {
        if (!prev) return null;
        if (prev.timer <= 0) return null;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '12px sans-serif';
        const metrics = ctx.measureText(prev.text);
        const w = metrics.width + 10;
        const h = 20;
        ctx.fillRect(prev.x - w/2, prev.y - h + 5, w, h);
        
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(prev.text, prev.x, prev.y);
        
        return { ...prev, timer: prev.timer - dt };
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameStatus, npcs, anomalyId, selectedNpcId, hasSeenCinematic]);

  const handleReport = () => {
    if (gameStatus !== 'playing') return;

    if (selectedNpcId === null) {
      setMessage(t('longestsecond.approachFirst'));
      return;
    }

    if (user?.uid) updateModeProgress(modeId, { longestAttempts: increment(1) });
    setAttempts(a => a + 1);

    if (selectedNpcId === anomalyId) {
      setGameStatus('win');
      setMessage(t('longestsecond.winMessage'));
      if (user?.uid) {
          updateModeProgress(modeId, { longestAnomalyFound: true });
          setAnomalyFound(true);
      }
      
      setTimeout(async () => {
        const isHiddenTaskComplete = verifyHiddenTask(modeId, { loopCountAtReport: loopCount });
        const hiddenReward = isHiddenTaskComplete && (!gameData?.hiddenTasksCompleted?.[modeId]) ? 2 : 0;
        await updateUserProgress('longestsecond', 2, hiddenReward);
        setGameState('hub');
      }, 3000);
    } else {
      if (loopCount >= MAX_LOOPS) {
        setGameStatus('lose');
        setMessage(t('longestsecond.timeLoops'));
      } else {
        setLoopCount(c => {
            const nextL = c + 1;
            if (nextL === 5) setMilestone(5);
            else if (nextL === 10) setMilestone(10);
            
            if (user?.uid) updateModeProgress(modeId, { longestLoopCount: increment(1) });
            setLoopsPlayed(l => l + 1);
            return nextL;
        });
        
        setMessage(`${t('longestsecond.wrong')} ${loopCount + 1}. ${t('longestsecond.anomalyMoved')}`);
        setSelectedNpcId(null);
        setDialog(null);
        let newAnomaly = anomalyId;
        while (newAnomaly === anomalyId) {
          newAnomaly = Math.floor(Math.random() * 10);
        }
        setAnomalyId(newAnomaly);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const p = playerRef.current;

    let closestNpc = null;
    let minD = Infinity;
    for (const npc of npcs) {
      if (mx >= npc.x - 12 && mx <= npc.x + 12 && my >= npc.y - 12 && my <= npc.y + 12) {
        const d = Math.hypot(p.x - npc.x, p.y - npc.y);
        if (d < minD && d < INTERACT_DISTANCE) {
          minD = d;
          closestNpc = npc;
        }
      }
    }

    if (closestNpc) {
      setSelectedNpcId(closestNpc.id);
      const isAnomaly = closestNpc.id === anomalyId;
      setDialog({
        text: isAnomaly ? t('longestsecond.anomalyDialog') : t('longestsecond.normalDialog'),
        x: closestNpc.x,
        y: closestNpc.y - 25,
        timer: 2.0
      });
    }
  };

  const handleResetProgress = async () => {
    if (confirm(t('common.confirm'))) {
      await resetModeProgress(modeId, ['longestLoopCount', 'longestAttempts']);
      setLoopsPlayed(0);
      setAttempts(0);
      setAnomalyFound(false);
      setGameState('hub');
    }
  };

  useEffect(() => {
    setCurrentResetAction(() => handleResetProgress);
    return () => setCurrentResetAction(null);
  }, []);

  useEffect(() => {
    if (milestone === 5 || milestone === 10) {
      const timer = setTimeout(() => setMilestone(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  if (!hasSeenCinematic) {
    return <Cinematic modeId={modeId} onFinish={() => markCinematicSeen(modeId)} />;
  }

  return (
    <div className="absolute inset-0 bg-black text-white flex flex-col items-center font-mono z-30 pointer-events-auto">
      {/* Milestone */}
      {milestone && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => setMilestone(null)}>
              <h2 className="text-6xl font-black text-yellow-400 mb-4 animate-bounce">
                  {milestone === 5 ? t('longestsecond.milestone5') : t('longestsecond.milestone10')}
              </h2>
              <p className="text-white text-2xl">{t('longestsecond.clickToContinue')}</p>
          </div>
      )}

      {/* Stats Display */}
      <div className="absolute top-20 left-4 bg-black/70 p-4 rounded text-sm space-y-1 backdrop-blur-md border border-white/10 z-40">
        <div>{t('longestsecond.loopsSurvived')}: {loopsPlayed}</div>
        <div>{t('longestsecond.attempts')}: {attempts}</div>
      </div>

      <div className="flex justify-between items-center mb-6 w-full max-w-[600px] mt-4 px-4">
        <div>
          <h2 className="text-2xl font-bold tracking-widest uppercase text-blue-400">{t('hub.platform.longestsecond')}</h2>
          <div className="text-sm text-gray-400">{t('longestsecond.instruction')}</div>
        </div>
        <div className="text-2xl font-black text-yellow-400">{t('longestsecond.loop')} {loopCount} / {MAX_LOOPS}</div>
      </div>
      
      <div className={`text-center mb-4 h-6 text-lg font-bold ${gameStatus === 'lose' ? 'text-red-500' : gameStatus === 'win' ? 'text-green-500' : 'text-yellow-300'}`}>
        {message}
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_SIZE} 
          height={CANVAS_SIZE} 
          onClick={handleCanvasClick}
          className="border-4 border-blue-900 rounded bg-[#1e1b4b] shadow-2xl shadow-blue-900/50 cursor-crosshair"
        />
        
        <div className="flex flex-col gap-4 w-[200px]">
          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <h3 className="font-bold text-gray-400 mb-2 uppercase text-sm">{t('longestsecond.targetStatus')}</h3>
            {selectedNpcId !== null ? (
              <div className="text-white">{t('longestsecond.npcSelected').replace('{id}', selectedNpcId.toString())}</div>
            ) : (
              <div className="text-red-400 opacity-80">{t('longestsecond.noTarget')}</div>
            )}
          </div>
          
          <button 
            onClick={handleReport}
            disabled={gameStatus !== 'playing'}
            className="px-4 py-3 bg-red-900 hover:bg-red-800 text-white font-bold tracking-widest rounded border border-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('longestsecond.reportAnomaly')}
          </button>

          {gameStatus === 'lose' && (
            <button 
              onClick={resetGame}
              className="mt-4 px-4 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold tracking-widest rounded transition-colors"
            >
              {t('longestsecond.retryTime')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
