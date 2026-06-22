import React, { useRef, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { verifyHiddenTask } from '../utils/hiddenTasks';
import { Cinematic } from './Cinematic';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  speed: number;
  pushing: boolean;
}

export function Sumo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setGameState, updateUserProgress, gameData, markCinematicSeen, user, auth, setCurrentResetAction } = useGame();
  const { t } = useLanguage();
  
  const [roundsP1, setRoundsP1] = useState(0);
  const [roundsP2, setRoundsP2] = useState(0);
  const [message, setMessage] = useState(t('sumo.bestOf3', 'SOLSTICE SUMO: Best of 3'));
  const [milestone, setMilestone] = useState<number | null>(null);

  const modeId = 'sumo';
  const hasSeenCinematic = gameData?.cinematicSeen?.[modeId];

  // Persistent state
  const [roundsWon, setRoundsWon] = useState(0);
  const [ballsCollected, setBallsCollected] = useState(0);
  const [matchesPlayed, setMatchesPlayed] = useState(0);

  useEffect(() => {
    if (gameData) {
      setRoundsWon(gameData.sumoRoundsWon || 0);
      setBallsCollected(gameData.sumoBallsCollected || 0);
      setMatchesPlayed(gameData.sumoMatchesPlayed || 0);
    }
  }, [gameData]);

  const keys = useRef<{ [key: string]: boolean }>({});

  const gameRef = useRef({
      message: t('sumo.bestOf3', 'SOLSTICE SUMO: Best of 3'),
      roundsP1: 0,
      roundsP2: 0,
      ballsCollected: 0
  });

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

    let p1: Player = { x: 300, y: 300, vx: 0, vy: 0, color: '#3b82f6', radius:  15, speed: 300, pushing: false };
    let p2: Player = { x: 500, y: 300, vx: 0, vy: 0, color: '#ef4444', radius: 15, speed: 250, pushing: false };
    
    let arena = { x: 400, y: 300, radius: 250 };
    let ball = { x: 0, y: 0, active: false, timer: 0 };
    let slowEffect = { player: '', timer: 0 };
    
    let lastTime = performance.now();
    let arenaShrinkTimer = 0;
    
    let state = 'playing';
    let animId: number;

    const resetRound = () => {
      p1.x = 300; p1.y = 300; p1.vx = 0; p1.vy = 0;
      p2.x = 500; p2.y = 300; p2.vx = 0; p2.vy = 0;
      arena.radius = 250;
      ball.active = false;
      slowEffect.timer = 0;
      state = 'playing';
      
      const fightMsg = t('sumo.fight', 'FIGHT!');
      gameRef.current.message = fightMsg;
      setMessage(fightMsg);
      setTimeout(() => { if (gameRef.current.message === fightMsg) { gameRef.current.message = ''; setMessage(''); }}, 1000);
    };

    if (gameRef.current.roundsP1 === 0 && gameRef.current.roundsP2 === 0) resetRound();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (state === 'playing') {
        p1.vx = p1.vy = 0;
        if (keys.current['KeyW']) p1.vy -= p1.speed;
        if (keys.current['KeyS']) p1.vy += p1.speed;
        if (keys.current['KeyA']) p1.vx -= p1.speed;
        if (keys.current['KeyD']) p1.vx += p1.speed;
        p1.pushing = keys.current['Space'] || false;

        const thrustP2 = p2.speed;
        p2.vx = p2.vy = 0;
        
        let targetX = p1.x;
        let targetY = p1.y;
        
        if (ball.active) {
            const distToBall = Math.hypot(p2.x - ball.x, p2.y - ball.y);
            if (distToBall < 150) {
                targetX = ball.x;
                targetY = ball.y;
            }
        }
        
        const angle = Math.atan2(targetY - p2.y, targetX - p2.x);
        p2.vx = Math.cos(angle) * thrustP2;
        p2.vy = Math.sin(angle) * thrustP2;
        
        const distToP1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        p2.pushing = distToP1 < 50;

        p1.x += p1.vx * dt; p1.y += p1.vy * dt;
        p2.x += p2.vx * dt; p2.y += p2.vy * dt;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < p1.radius + p2.radius && dist > 0) {
          const overlap = p1.radius + p2.radius - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          
          p1.x -= nx * overlap / 2;
          p1.y -= ny * overlap / 2;
          p2.x += nx * overlap / 2;
          p2.y += ny * overlap / 2;
          
          if (p1.pushing && !p2.pushing) {
             p2.x += nx * 600 * dt; p2.y += ny * 600 * dt;
          } else if (p2.pushing && !p1.pushing) {
             p1.x -= nx * 600 * dt; p1.y -= ny * 600 * dt;
          } else if (p1.pushing && p2.pushing) {
             p1.x -= nx * 300 * dt; p1.y -= ny * 300 * dt;
             p2.x += nx * 300 * dt; p2.y += ny * 300 * dt;
          }
        }

        arenaShrinkTimer += dt;
        let shrinkRate = dt * (5 / 2);
        if (slowEffect.timer > 0) {
          slowEffect.timer -= dt;
          shrinkRate /= 2;
        }
        arena.radius = Math.max(50, arena.radius - shrinkRate);

        ball.timer += dt;
        if (ball.timer > 5 && !ball.active) {
            ball.timer = 0;
            ball.active = true;
            const r = Math.random() * (arena.radius - 20);
            const a = Math.random() * Math.PI * 2;
            ball.x = arena.x + r * Math.cos(a);
            ball.y = arena.y + r * Math.sin(a);
        }
        
        if (ball.active) {
            if (Math.hypot(p1.x - ball.x, p1.y - ball.y) < p1.radius + 10) {
                ball.active = false;
                slowEffect = { player: 'p1', timer: 3 };
                gameRef.current.ballsCollected++;
                setBallsCollected(b => b + 1);
                if (db && user?.uid && user.uid !== 'demo') updateDoc(doc(db, 'users', user.uid), { sumoBallsCollected: increment(1) });
            } else if (Math.hypot(p2.x - ball.x, p2.y - ball.y) < p2.radius + 10) {
                ball.active = false;
                slowEffect = { player: 'p2', timer: 3 };
                gameRef.current.ballsCollected++;
                setBallsCollected(b => b + 1);
                if (db && user?.uid && user.uid !== 'demo') updateDoc(doc(db, 'users', user.uid), { sumoBallsCollected: increment(1) });
            }
        }

        const distP1Bounds = Math.hypot(p1.x - arena.x, p1.y - arena.y);
        const distP2Bounds = Math.hypot(p2.x - arena.x, p2.y - arena.y);
        
        let winner = null;
        if (distP1Bounds > arena.radius && distP2Bounds > arena.radius) winner = 'draw';
        else if (distP1Bounds > arena.radius) winner = 'p2';
        else if (distP2Bounds > arena.radius) winner = 'p1';

        if (winner) {
          state = 'round_over';
          if (winner === 'p1') {
            gameRef.current.roundsP1++;
            setRoundsP1(gameRef.current.roundsP1);
            setRoundsWon(r => r + 1);
            if (db && user?.uid && user.uid !== 'demo') updateDoc(doc(db, 'users', user.uid), { sumoRoundsWon: increment(1) });
            
            // Check milestones
            const newWins = roundsWon + 1;
            if (newWins === 5) setMilestone(5);
            else if (newWins === 10) setMilestone(10);
            else if (newWins === 20) setMilestone(20);

            const msg = t('sumo.p1WinsRound', 'P1 Wins Round!');
            gameRef.current.message = msg;
            setMessage(msg);
          } else if (winner === 'p2') {
            gameRef.current.roundsP2++;
            setRoundsP2(gameRef.current.roundsP2);
            const msg = t('sumo.p2WinsRound', 'P2 Wins Round!');
            gameRef.current.message = msg;
            setMessage(msg);
          } else {
            const msg = t('sumo.draw', 'Draw!');
            gameRef.current.message = msg;
            setMessage(msg);
          }
        }
      }

      if (state === 'round_over') {
         if (gameRef.current.roundsP1 === 3 || gameRef.current.roundsP2 === 3) {
             state = 'game_over';
             if (db && user?.uid && user.uid !== 'demo') updateDoc(doc(db, 'users', user.uid), { sumoMatchesPlayed: increment(1) });
             setMatchesPlayed(m => m + 1);
             
             if (gameRef.current.roundsP1 === 3) {
                 gameRef.current.message = t('sumo.p1WinsMatch', 'P1 WINS DETECTED! SECURING...');
                 setMessage(gameRef.current.message);
                 setTimeout(async () => {
                     const isHiddenTaskComplete = verifyHiddenTask(modeId, { ballsCollected: gameRef.current.ballsCollected });
                     const hiddenReward = isHiddenTaskComplete && (!gameData?.hiddenTasksCompleted?.[modeId]) ? 3 : 0;
                     await updateUserProgress('sumo', 2, hiddenReward);
                     setGameState('hub');
                 }, 3000);
             } else {
                 gameRef.current.message = t('sumo.p2WinsMatch', 'P2 WINS! MATCH OVER.');
                 setMessage(gameRef.current.message);
                 setTimeout(() => {
                     gameRef.current.roundsP1 = 0;
                     gameRef.current.roundsP2 = 0;
                     setRoundsP1(0); setRoundsP2(0); resetRound();
                 }, 3000);
             }
         } else {
             state = 'wait';
             setTimeout(() => {
                 if (state !== 'game_over') resetRound();
             }, 2000);
         }
      }

      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 800, 600);

      ctx.beginPath();
      ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      if (slowEffect.timer > 0) ctx.fillStyle = slowEffect.player === 'p1' ? '#bfdbfe' : '#fecaca';
      ctx.fill();

      if (ball.active) {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#eab308';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#eab308';
          ctx.fill();
          ctx.shadowBlur = 0;
      }

      const drawPlayer = (p: Player) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          if (p.pushing) {
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 3;
             ctx.stroke();
          }
      };
      drawPlayer(p1);
      drawPlayer(p2);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [hasSeenCinematic, roundsWon, user?.uid]);

  const handleResetProgress = async () => {
    if (confirm(t('common.confirm'))) {
      if (db && user?.uid && user.uid !== 'demo') {
        await updateDoc(doc(db, 'users', user.uid), {
          sumoRoundsWon: 0,
          sumoBallsCollected: 0,
          sumoMatchesPlayed: 0
        });
      }
      setRoundsWon(0);
      setBallsCollected(0);
      setMatchesPlayed(0);
      setGameState('hub');
    }
  };

  useEffect(() => {
    setCurrentResetAction(() => handleResetProgress);
    return () => setCurrentResetAction(null);
  }, [user]);

  if (!hasSeenCinematic) {
    return <Cinematic modeId={modeId} onFinish={() => markCinematicSeen(modeId)} />;
  }

  return (
    <div className="absolute inset-0 bg-black text-white flex flex-col font-mono z-30">
      {/* Milestones */}
      {milestone && (
          <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => setMilestone(null)}>
              <h2 className="text-6xl font-black text-yellow-400 mb-4 animate-bounce">
                  {milestone === 5 ? t('sumo.milestone5') : milestone === 10 ? t('sumo.milestone10') : t('sumo.milestone20')}
              </h2>
              <p className="text-white text-2xl">{t('sumo.clickToContinue')}</p>
          </div>
      )}

      <div className="flex justify-between items-center mb-4 p-8">
        <div className="text-xl px-4 py-2 bg-blue-900 rounded font-bold">{t('sumo.p1')}: {roundsP1}</div>
        <div className="text-2xl font-black italic uppercase tracking-widest text-[#f97316] text-center w-full">{message}</div>
        <div className="text-xl px-4 py-2 bg-red-900 rounded font-bold">{t('sumo.p2')}: {roundsP2}</div>
      </div>
      
      <div className="flex-1 flex items-center justify-center relative bg-[#111] overflow-hidden rounded-xl border-4 border-white/10 group m-8">
        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full max-w-[800px] aspect-[800/600]" />
        
        {/* Progress Display */}
        <div className="absolute top-4 left-4 bg-black/70 p-4 rounded text-sm space-y-1 backdrop-blur-sm border border-white/10">
            <div>{t('sumo.roundsWon')}: {roundsWon}</div>
            <div>{t('sumo.ballsCollected')}: {ballsCollected}</div>
            <div>{t('sumo.matchesPlayed')}: {matchesPlayed}</div>
            <div className="w-full mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: `${Math.min((roundsWon % 20) * 5, 100)}%` }} />
            </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs opacity-50 bg-black/50 p-2 rounded pointer-events-none">
          {t('sumo.controls')}
        </div>
      </div>
    </div>
  );
}
