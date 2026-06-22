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
  angle?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
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
    let particles: Particle[] = [];
    
    let state = 'playing';
    let animId: number;

    const resetRound = () => {
      p1.x = 300; p1.y = 300; p1.vx = 0; p1.vy = 0;
      p2.x = 500; p2.y = 300; p2.vx = 0; p2.vy = 0;
      arena.radius = 250;
      ball.active = false;
      slowEffect.timer = 0;
      state = 'playing';
      particles = [];
      
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
        
        p1.angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        p2.angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);

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

        // Pushing dust particles
        if ((p1.vx !== 0 || p1.vy !== 0) && p1.pushing && Math.random() < 0.3) {
             particles.push({ x: p1.x - Math.cos(p1.angle || 0) * p1.radius, y: p1.y - Math.sin(p1.angle || 0) * p1.radius, vx: Math.random() * 40 - 20, vy: Math.random() * 40 - 20, life: 0.5, maxLife: 0.5, color: '#d6c08e', size: Math.random() * 3 + 2 });
        }
        if ((p2.vx !== 0 || p2.vy !== 0) && p2.pushing && Math.random() < 0.3) {
             particles.push({ x: p2.x - Math.cos(p2.angle || 0) * p2.radius, y: p2.y - Math.sin(p2.angle || 0) * p2.radius, vx: Math.random() * 40 - 20, vy: Math.random() * 40 - 20, life: 0.5, maxLife: 0.5, color: '#d6c08e', size: Math.random() * 3 + 2 });
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
          
          // Ring out explosion particles
          const loser = winner === 'p1' ? p2 : winner === 'p2' ? p1 : null;
          if (loser) {
             for (let i = 0; i < 30; i++) {
                particles.push({ x: loser.x, y: loser.y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, life: 1, maxLife: 1, color: loser.color, size: Math.random() * 5 + 3 });
             }
          }

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

      // Arena shadow
      ctx.beginPath();
      ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Arena sand
      ctx.beginPath();
      ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
      const dohyoGrad = ctx.createRadialGradient(arena.x, arena.y, 0, arena.x, arena.y, Math.max(1, arena.radius));
      dohyoGrad.addColorStop(0, '#e6d3a8');
      dohyoGrad.addColorStop(0.95, '#d6c08e');
      dohyoGrad.addColorStop(1, '#c2a563');

      if (slowEffect.timer > 0) ctx.fillStyle = slowEffect.player === 'p1' ? '#bfdbfe' : '#fecaca';
      else ctx.fillStyle = dohyoGrad;
      ctx.fill();

      // Straw ring (Tawara)
      ctx.beginPath();
      ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#b89456';
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#8a6e3c';
      ctx.stroke();

      // Starting lines (Shikiri-sen)
      if (arena.radius > 50) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(arena.x - 30, arena.y - 12, 8, 24);
          ctx.fillRect(arena.x + 22, arena.y - 12, 8, 24);
      }

      if (ball.active) {
          const pulse = 1 + Math.sin(time / 150) * 0.2;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 8 * pulse, 0, Math.PI * 2);
          
          const ballGrad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, Math.max(1, 15 * pulse));
          ballGrad.addColorStop(0, 'rgba(254, 240, 138, 1)'); 
          ballGrad.addColorStop(0.5, 'rgba(234, 179, 8, 1)');
          ballGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          
          ctx.fillStyle = ballGrad;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#eab308';
          ctx.fill();
          ctx.shadowBlur = 0;
          
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 4 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
      }

      const drawPlayer = (p: Player, isP1: boolean) => {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle || 0);

          if (p.pushing) {
              ctx.beginPath();
              ctx.moveTo(-p.radius - 5, -10);
              ctx.lineTo(-p.radius - 20, -12);
              ctx.moveTo(-p.radius - 5, 10);
              ctx.lineTo(-p.radius - 20, 12);
              ctx.strokeStyle = isP1 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)';
              ctx.lineWidth = 3;
              ctx.stroke();
          }

          // Shadow
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.fillStyle = '#000';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Body Outline (Team Color)
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          
          // Skin
          ctx.beginPath();
          ctx.arc(0, 0, p.radius - 2, 0, Math.PI * 2);
          ctx.fillStyle = '#fcdbb6';
          ctx.fill();

          // Mawashi (Belt)
          const beltColor = isP1 ? '#1e3a8a' : '#7f1d1d';
          ctx.fillStyle = beltColor;
          ctx.fillRect(-2, -p.radius, 6, p.radius * 2); 
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, -Math.PI / 3, Math.PI / 3);
          ctx.lineWidth = 4;
          ctx.strokeStyle = beltColor;
          ctx.stroke();

          // Head
          ctx.beginPath();
          ctx.arc(p.radius * 0.4, 0, p.radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = '#fcdbb6';
          ctx.fill();
          
          // Topknot (Chonmage)
          ctx.beginPath();
          ctx.arc(p.radius * 0.3, 0, p.radius * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = '#111';
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(p.radius * 0.1, 0, p.radius * 0.25, p.radius * 0.15, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#000';
          ctx.fill();

          ctx.restore();
      };
      drawPlayer(p1, true);
      drawPlayer(p2, false);

      // Draw particles
      ctx.globalCompositeOperation = 'source-over';
      for (let i = particles.length - 1; i >= 0; i--) {
          let pt = particles[i];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.life -= dt;
          if (pt.life <= 0) {
             particles.splice(i, 1);
             continue;
          }
          ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
      }
      ctx.globalAlpha = 1.0;

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
