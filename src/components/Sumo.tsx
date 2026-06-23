import React, { useRef, useEffect, useState } from "react";
import { useGame } from "../context/GameContext";
import { useLanguage } from "../context/LanguageContext";
import { verifyHiddenTask } from "../utils/hiddenTasks";
import { Cinematic } from "./Cinematic";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  speed: number;
  pushing: boolean;
  beingPushed?: boolean;
  angle?: number;
  stamina: number;
  maxStamina: number;
  mass: number;
  history: { x: number; y: number; time: number }[];
  armExtend: number;
}

type PowerUpType = "slow" | "onigiri" | "chili";

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  timer: number;
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
  text?: string;
}

interface CrowdMember {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  angle: number;
  size: number;
  jump: number;
  jumpPhase: number;
}

type SfxType = "impact" | "countdown" | "win" | "crowd_gasp";

export function Sumo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    setGameState,
    updateUserProgress,
    gameData,
    markCinematicSeen,
    user,
    auth,
    setCurrentResetAction,
  } = useGame();
  const { t } = useLanguage();

  const [roundsP1, setRoundsP1] = useState(0);
  const [roundsP2, setRoundsP2] = useState(0);
  const [message, setMessage] = useState(
    t("sumo.bestOf3", "SOLSTICE SUMO: Best of 3"),
  );
  const [milestone, setMilestone] = useState<number | null>(null);

  const modeId = "sumo";
  const hasSeenCinematic = gameData?.cinematicSeen?.[modeId];

  // Persistent state
  const [roundsWon, setRoundsWon] = useState(0);
  const [ballsCollected, setBallsCollected] = useState(0);
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [roundMetrics, setRoundMetrics] = useState<{
    winner: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (gameData) {
      setRoundsWon(gameData.sumoRoundsWon || 0);
      setBallsCollected(gameData.sumoBallsCollected || 0);
      setMatchesPlayed(gameData.sumoMatchesPlayed || 0);
    }
  }, [gameData]);

  const keys = useRef<{ [key: string]: boolean }>({});

  const gameRef = useRef({
    message: t("sumo.bestOf3", "SOLSTICE SUMO: Best of 3"),
    roundsP1: 0,
    roundsP2: 0,
    ballsCollected: 0,
  });

  useEffect(() => {
    if (!hasSeenCinematic) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [hasSeenCinematic]);

  useEffect(() => {
    if (!hasSeenCinematic) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let p1: Player = {
      x: 300,
      y: 300,
      vx: 0,
      vy: 0,
      color: "#3b82f6",
      radius: 15,
      speed: 300,
      pushing: false,
      stamina: 100,
      maxStamina: 100,
      mass: 1.0,
      history: [],
      armExtend: 2,
    };
    let p2: Player = {
      x: 500,
      y: 300,
      vx: 0,
      vy: 0,
      color: "#ef4444",
      radius: 15,
      speed: 250,
      pushing: false,
      stamina: 100,
      maxStamina: 100,
      mass: 1.0,
      history: [],
      armExtend: 2,
    };

    let arena = { x: 400, y: 300, radius: 250 };
    let powerUps: PowerUp[] = [];
    let powerUpTimer = 3; // Spawn first powerup soon
    let activeEffects: {
      player: "p1" | "p2";
      type: PowerUpType;
      timer: number;
    }[] = [];
    let matchTimeElapsed = 0;

    let lastTime = performance.now();
    let arenaShrinkTimer = 0;
    let particles: Particle[] = [];

    // Procedural Sand Texture Generation (runs once)
    const sandCanvas = document.createElement("canvas");
    sandCanvas.width = 512;
    sandCanvas.height = 512;
    const sandCtx = sandCanvas.getContext("2d");
    let sandPattern: CanvasPattern | null = null;
    if (sandCtx) {
      // Base color
      sandCtx.fillStyle = "#d4b881";
      sandCtx.fillRect(0, 0, 512, 512);

      // Noise
      const imgData = sandCtx.getImageData(0, 0, 512, 512);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30; // Mild grain
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.9)); // Keep it slightly warm
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.8));
      }
      sandCtx.putImageData(imgData, 0, 0);

      // Stones in sand
      for (let i = 0; i < 150; i++) {
        sandCtx.beginPath();
        sandCtx.arc(
          Math.random() * 512,
          Math.random() * 512,
          Math.random() * 3 + 2,
          0,
          Math.PI * 2,
        );
        sandCtx.fillStyle = Math.random() > 0.5 ? "#b8a07a" : "#c4ab87";
        sandCtx.fill();
      }

      // Some larger pebbles/details
      for (let i = 0; i < 300; i++) {
        sandCtx.beginPath();
        sandCtx.arc(
          Math.random() * 512,
          Math.random() * 512,
          Math.random() * 2 + 1,
          0,
          Math.PI * 2,
        );
        sandCtx.fillStyle =
          Math.random() > 0.5 ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
        sandCtx.fill();
      }

      // Sand fibers
      sandCtx.lineWidth = 1;
      for (let i = 0; i < 400; i++) {
        sandCtx.beginPath();
        const fx = Math.random() * 512;
        const fy = Math.random() * 512;
        const len = Math.random() * 10 + 5;
        const ang = Math.random() * Math.PI * 2;
        sandCtx.moveTo(fx, fy);
        sandCtx.lineTo(fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
        sandCtx.strokeStyle = "rgba(0,0,0,0.1)";
        sandCtx.stroke();
      }

      sandPattern = ctx.createPattern(sandCanvas, "repeat");
    }

    let state = "playing";
    let animId: number;
    let cameraX = 0;
    let cameraY = 0;
    let waitTimer = 0;
    let countdownTimer = 0;
    let screenShake = 0;

    let crowd: CrowdMember[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2;
      const r = 280 + Math.random() * 20;
      crowd.push({
        baseX: 400 + Math.cos(angle) * r,
        baseY: 300 + Math.sin(angle) * r,
        x: 0,
        y: 0,
        angle: angle + Math.PI,
        size: 5 + Math.random() * 3,
        jump: 0,
        jumpPhase: Math.random() * Math.PI * 2,
      });
    }
    let gyoji = { x: 400, y: 100, angle: Math.PI / 2 };

    let localAudioCtx: AudioContext | null = null;
    let crowdGain: GainNode | null = null;
    let crowdFilter: BiquadFilterNode | null = null;
    let noiseSource: AudioBufferSourceNode | null = null;

    let sfxLastPlayed: Record<string, number> = {};
    const playSfx = (type: SfxType) => {
      const now = performance.now();
      if (now - (sfxLastPlayed[type] || 0) < 150) return; // Debounce
      sfxLastPlayed[type] = now;
      // Placeholder for real audio triggers
      // console.log('SFX:', type);
      if (type === "impact") screenShake = Math.max(screenShake, 10);
      if (type === "win") screenShake = Math.max(screenShake, 25);
    };

    const initAudio = () => {
      if (localAudioCtx) return;
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        localAudioCtx = new AudioContextClass();
        const bufferSize = localAudioCtx.sampleRate * 2;
        const buffer = localAudioCtx.createBuffer(
          1,
          bufferSize,
          localAudioCtx.sampleRate,
        );
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noiseSource = localAudioCtx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;
        crowdFilter = localAudioCtx.createBiquadFilter();
        crowdFilter.type = "lowpass";
        crowdFilter.frequency.value = 400; // Muffled crowd
        crowdGain = localAudioCtx.createGain();
        crowdGain.gain.value = 0;
        noiseSource.connect(crowdFilter);
        crowdFilter.connect(crowdGain);
        crowdGain.connect(localAudioCtx.destination);
        noiseSource.start();
      } catch (e) {
        console.warn("Crowd audio init failed", e);
      }
    };

    const handleInitAudio = () => {
      initAudio();
      if (localAudioCtx && localAudioCtx.state === "suspended") {
        localAudioCtx.resume().catch(console.warn);
      }
      window.removeEventListener("keydown", handleInitAudio);
      window.removeEventListener("click", handleInitAudio);
    };
    window.addEventListener("keydown", handleInitAudio);
    window.addEventListener("click", handleInitAudio);

    const resetRound = () => {
      p1.x = 300;
      p1.y = 300;
      p1.vx = 0;
      p1.vy = 0;
      p1.stamina = 100;
      p1.mass = 1.0;
      p1.history = [];
      p1.armExtend = 2;
      p2.x = 500;
      p2.y = 300;
      p2.vx = 0;
      p2.vy = 0;
      p2.stamina = 100;
      p2.mass = 1.0;
      p2.history = [];
      p2.armExtend = 2;
      arena.radius = 250;
      powerUps = [];
      powerUpTimer = 3;
      activeEffects = [];
      matchTimeElapsed = 0;
      state = "countdown";
      countdownTimer = 4.0;
      particles = [];

      gameRef.current.message = "";
      setMessage("");
      setRoundMetrics(null);
    };

    if (gameRef.current.roundsP1 === 0 && gameRef.current.roundsP2 === 0)
      resetRound();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (state === "countdown") {
        countdownTimer -= dt;
        if (countdownTimer <= 0) {
          state = "playing";
        }
      }

      if (state === "playing") {
        matchTimeElapsed += dt;

        // --- 1. Gameplay & Mechanics (Stamina, Momentum, Mass, Power-ups) ---
        const updateStamina = (p: Player) => {
          if (p.pushing) p.stamina -= 15 * dt;
          else p.stamina += 5 * dt;
          p.stamina = Math.max(0, Math.min(p.maxStamina, p.stamina));
        };
        updateStamina(p1);
        updateStamina(p2);

        const getPlayerProps = (p: Player) => {
          let speedMulti = 1.0;
          let pushMulti = 1.0;
          if (p.stamina === 0) {
            speedMulti = 0.5;
            pushMulti = 0.25;
          } else if (p.stamina < 20) {
            speedMulti = 0.7;
            pushMulti = 0.5;
          }

          let dynSpeed = p.speed * speedMulti;
          let dynMass = p.mass;

          activeEffects.forEach((ef) => {
            if (ef.player === (p === p1 ? "p1" : "p2") && ef.timer > 0) {
              if (ef.type === "slow") dynSpeed *= 0.5; // globally actually we just slow the player
              if (ef.type === "chili") {
                dynSpeed *= 1.4;
                dynMass -= 0.2;
              }
              if (ef.type === "onigiri") {
                dynMass += 0.3;
              }
            }
          });
          return { dynSpeed, dynMass, pushMulti };
        };

        const props1 = getPlayerProps(p1);
        const props2 = getPlayerProps(p2);

        p1.vx = p1.vy = 0;
        if (keys.current["KeyW"]) p1.vy -= props1.dynSpeed;
        if (keys.current["KeyS"]) p1.vy += props1.dynSpeed;
        if (keys.current["KeyA"]) p1.vx -= props1.dynSpeed;
        if (keys.current["KeyD"]) p1.vx += props1.dynSpeed;
        p1.pushing = (keys.current["Space"] || false) && p1.stamina > 0;

        // --- 2. AI Improvement ---
        const aiDifficultyModifier = Math.min(roundsWon * 10, 100);
        p2.speed = 200 + aiDifficultyModifier;
        if (!p2.pushing) p2.stamina += (5 + aiDifficultyModifier * 0.05) * dt;
        p2.stamina = Math.max(0, Math.min(p2.maxStamina, p2.stamina));

        p2.vx = p2.vy = 0;

        let targetX = p1.x + p1.vx * 0.5; // Prediction
        let targetY = p1.y + p1.vy * 0.5;

        const distToCenter = Math.hypot(p2.x - arena.x, p2.y - arena.y);

        if (distToCenter > arena.radius * 0.9) {
          targetX = arena.x;
          targetY = arena.y;
          p2.pushing = false;
        } else if (distToCenter > arena.radius * 0.7) {
          targetX = arena.x * 0.6 + targetX * 0.4;
          targetY = arena.y * 0.6 + targetY * 0.4;
          p2.pushing = false;
        } else {
          // Find powerup logic (Greedy state)
          let nearestPowerUp: PowerUp | null = null;
          let minDist = 150;
          powerUps.forEach((pu) => {
            const d = Math.hypot(p2.x - pu.x, p2.y - pu.y);
            if (d < minDist) {
              minDist = d;
              nearestPowerUp = pu;
            }
          });

          if (nearestPowerUp && p2.stamina > 40) {
            targetX = nearestPowerUp.x;
            targetY = nearestPowerUp.y;
            p2.pushing = false;
          } else {
            const distToP1 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            if (p2.stamina < 30) {
              // Defensive state
              targetX = arena.x;
              targetY = arena.y;
              p2.pushing = false;
            } else if (distToP1 < 150) {
              // Aggressive state
              p2.pushing = distToP1 < 50 && p2.stamina > 0;
            }
          }
        }

        const thrustP2 = props2.dynSpeed;
        const angle = Math.atan2(targetY - p2.y, targetX - p2.x);
        p2.vx = Math.cos(angle) * thrustP2;
        p2.vy = Math.sin(angle) * thrustP2;

        p1.x += p1.vx * dt;
        p1.y += p1.vy * dt;
        p2.x += p2.vx * dt;
        p2.y += p2.vy * dt;

        p1.angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        p2.angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);

        p1.beingPushed = false;
        p2.beingPushed = false;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);

        const isColliding = dist < p1.radius + p2.radius && dist > 0;
        if (isColliding) {
          const overlap = p1.radius + p2.radius - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          p1.x -= (nx * overlap) / 2;
          p1.y -= (ny * overlap) / 2;
          p2.x += (nx * overlap) / 2;
          p2.y += (ny * overlap) / 2;

          let pushForce = 0;

          // Calculate dynamic push forces
          const mom1 = props1.dynMass * Math.hypot(p1.vx, p1.vy);
          const mom2 = props2.dynMass * Math.hypot(p2.vx, p2.vy);

          const basePush1 = 400 + mom1 * 0.5;
          const basePush2 = 400 + aiDifficultyModifier * 2 + mom2 * 0.5;

          if (p1.pushing && !p2.pushing) {
            pushForce = basePush1 * props1.pushMulti;
            p2.beingPushed = true;
            p1.stamina = Math.min(p1.maxStamina, p1.stamina + 35 * dt); // Tactical reward
          } else if (p2.pushing && !p1.pushing) {
            pushForce = -(basePush2 * props2.pushMulti);
            p1.beingPushed = true;
            p2.stamina = Math.min(p2.maxStamina, p2.stamina + 35 * dt); // Tactical reward
          } else if (p1.pushing && p2.pushing) {
            screenShake = Math.max(screenShake, 5); // 3. Visual & Feedback (Struggle)
            p1.x -= nx * 100 * dt;
            p1.y -= ny * 100 * dt;
            p2.x += nx * 100 * dt;
            p2.y += ny * 100 * dt;
            // Struggle particles (sweat)
            if (Math.random() < 0.2) {
              particles.push({
                x: p1.x + (Math.random() - 0.5) * 10,
                y: p1.y - 15 - Math.random() * 10,
                vx: 0,
                vy: -10,
                life: 0.3,
                maxLife: 0.3,
                color: "rgba(255,255,255,0.7)",
                size: 2,
              });
            }
          }

          if (pushForce !== 0) {
            p2.x += nx * pushForce * dt;
            p2.y += ny * pushForce * dt;
            p1.x += nx * pushForce * dt;
            p1.y += ny * pushForce * dt;
          }

          if (Math.abs(p1.vx) > 0 || Math.abs(p2.vx) > 0) {
            playSfx("impact");
            const midX = p1.x + nx * p1.radius;
            const midY = p1.y + ny * p1.radius;
            for (let i = 0; i < 3; i++) {
              particles.push({
                x: midX,
                y: midY,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 0.3,
                maxLife: 0.3,
                color: "#fff",
                size: Math.random() * 2 + 1,
              });
            }
          }
        }

        // Skid marks
        const addHistory = (p: Player) => {
          if ((p.pushing || p.beingPushed) && Math.hypot(p.vx, p.vy) > 10) {
            p.history.push({ x: p.x, y: p.y, time: matchTimeElapsed });
          }
          p.history = p.history.filter((h) => matchTimeElapsed - h.time < 2); // keep 2 secs
          if (p.history.length > 100) p.history = p.history.slice(-100);
        };
        addHistory(p1);
        addHistory(p2);

        // Update Arm Extensions
        const updateArm = (p: Player) => {
          let target = 2;
          if (p.pushing) target = p.radius + 8;
          else if (p.beingPushed) target = -4;
          
          if (p.stamina <= 0) target = 2; // too tired to push

          p.armExtend += (target - p.armExtend) * 0.15;
        };
        updateArm(p1);
        updateArm(p2);

        // Pushing dust particles
        if ((p1.vx !== 0 || p1.vy !== 0) && p1.pushing && Math.random() < 0.3) {
          particles.push({
            x: p1.x - Math.cos(p1.angle || 0) * p1.radius,
            y: p1.y - Math.sin(p1.angle || 0) * p1.radius,
            vx: Math.random() * 40 - 20,
            vy: Math.random() * 40 - 20,
            life: 0.5,
            maxLife: 0.5,
            color: "#d6c08e",
            size: Math.random() * 3 + 2,
          });
        }
        if ((p2.vx !== 0 || p2.vy !== 0) && p2.pushing && Math.random() < 0.3) {
          particles.push({
            x: p2.x - Math.cos(p2.angle || 0) * p2.radius,
            y: p2.y - Math.sin(p2.angle || 0) * p2.radius,
            vx: Math.random() * 40 - 20,
            vy: Math.random() * 40 - 20,
            life: 0.5,
            maxLife: 0.5,
            color: "#d6c08e",
            size: Math.random() * 3 + 2,
          });
        }

        arenaShrinkTimer += dt;
        let shrinkRate = dt * (5 / 2);
        shrinkRate *= 1 + matchTimeElapsed / 60;

        if (activeEffects.some((ef) => ef.type === "slow")) shrinkRate /= 2;
        arena.radius = Math.max(50, arena.radius - shrinkRate);

        // Power-ups spawn logic
        powerUpTimer -= dt;
        if (powerUpTimer <= 0) {
          powerUpTimer = Math.random() * 5 + 5; // next in 5-10s
          const r = Math.random() * (arena.radius - 20);
          const a = Math.random() * Math.PI * 2;
          const types: PowerUpType[] = ["slow", "onigiri", "chili"];
          powerUps.push({
            x: arena.x + r * Math.cos(a),
            y: arena.y + r * Math.sin(a),
            type: types[Math.floor(Math.random() * types.length)],
            timer: 10, // lives for 10s
          });
        }

        // Update powerups and effects
        for (let i = powerUps.length - 1; i >= 0; i--) {
          const pu = powerUps[i];
          pu.timer -= dt;
          if (pu.timer <= 0) {
            powerUps.splice(i, 1);
            continue;
          }
          const grab = (p: Player, pName: "p1" | "p2") => {
            if (Math.hypot(p.x - pu.x, p.y - pu.y) < p.radius + 15) {
              activeEffects.push({ player: pName, type: pu.type, timer: 5 });
              powerUps.splice(i, 1);
              if (pName === "p1") {
                gameRef.current.ballsCollected++;
                setBallsCollected((b) => b + 1);
                if (pu.type === "onigiri") p1.stamina += 30; // Boost
              } else {
                if (pu.type === "onigiri") p2.stamina += 30; // AI Boost
              }
              particles.push({
                x: p.x,
                y: p.y - 20,
                vx: 0,
                vy: -20,
                life: 1,
                maxLife: 1,
                color: "#fff",
                size: 15,
                text:
                  pu.type === "onigiri"
                    ? "+STAMINA"
                    : pu.type === "chili"
                      ? "+SPEED"
                      : "+SLOW",
              });
              return true;
            }
            return false;
          };
          if (!grab(p1, "p1")) grab(p2, "p2");
        }

        activeEffects.forEach((ef) => {
          ef.timer -= dt;
        });
        activeEffects = activeEffects.filter((ef) => ef.timer > 0);

        const distP1Bounds = Math.hypot(p1.x - arena.x, p1.y - arena.y);
        const distP2Bounds = Math.hypot(p2.x - arena.x, p2.y - arena.y);

        let winner = null;
        if (distP1Bounds > arena.radius && distP2Bounds > arena.radius)
          winner = "draw";
        else if (distP1Bounds > arena.radius) winner = "p2";
        else if (distP2Bounds > arena.radius) winner = "p1";

        if (winner) {
          state = "round_over";
          playSfx("win");

          // Ring out explosion particles
          const loser = winner === "p1" ? p2 : winner === "p2" ? p1 : null;
          if (loser) {
            for (let i = 0; i < 30; i++) {
              particles.push({
                x: loser.x,
                y: loser.y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1,
                maxLife: 1,
                color: loser.color,
                size: Math.random() * 5 + 3,
              });
            }
          }

          if (winner === "p1") {
            gameRef.current.roundsP1++;
            setRoundsP1(gameRef.current.roundsP1);
            setRoundsWon((r) => r + 1);
            if (db && user?.uid && user.uid !== "demo")
              updateDoc(doc(db, "users", user.uid), {
                sumoRoundsWon: increment(1),
              });

            // Check milestones
            const newWins = roundsWon + 1;
            if (newWins === 5) setMilestone(5);
            else if (newWins === 10) setMilestone(10);
            else if (newWins === 20) setMilestone(20);

            const msg = t("sumo.p1WinsRound", "P1 Wins Round!");
            gameRef.current.message = msg;
            setMessage(msg);
          } else if (winner === "p2") {
            gameRef.current.roundsP2++;
            setRoundsP2(gameRef.current.roundsP2);
            const msg = t("sumo.p2WinsRound", "P2 Wins Round!");
            gameRef.current.message = msg;
            setMessage(msg);
          } else {
            const msg = t("sumo.draw", "Draw!");
            gameRef.current.message = msg;
            setMessage(msg);
          }
        }
      }

      if (state === "round_over") {
        if (gameRef.current.roundsP1 === 3 || gameRef.current.roundsP2 === 3) {
          state = "game_over";
          if (db && user?.uid && user.uid !== "demo")
            updateDoc(doc(db, "users", user.uid), {
              sumoMatchesPlayed: increment(1),
            });
          setMatchesPlayed((m) => m + 1);

          if (gameRef.current.roundsP1 === 3) {
            gameRef.current.message = t(
              "sumo.p1WinsMatch",
              "P1 WINS DETECTED! SECURING...",
            );
            setMessage(gameRef.current.message);
            setRoundMetrics({
              winner: "P1",
              text: t("sumo.p1WinsMatch", "MATCH OVER! P1 WINS"),
            });
            setTimeout(async () => {
              const isHiddenTaskComplete = verifyHiddenTask(modeId, {
                ballsCollected: gameRef.current.ballsCollected,
              });
              const hiddenReward =
                isHiddenTaskComplete &&
                !gameData?.hiddenTasksCompleted?.[modeId]
                  ? 3
                  : 0;
              await updateUserProgress("sumo", 2, hiddenReward);
              setGameState("hub");
            }, 3000);
          } else {
            gameRef.current.message = t(
              "sumo.p2WinsMatch",
              "P2 WINS! MATCH OVER.",
            );
            setMessage(gameRef.current.message);
            setRoundMetrics({
              winner: "P2",
              text: t("sumo.p2WinsMatch", "MATCH OVER! P2 WINS"),
            });
            setTimeout(() => {
              gameRef.current.roundsP1 = 0;
              gameRef.current.roundsP2 = 0;
              setRoundsP1(0);
              setRoundsP2(0);
              resetRound();
            }, 3000);
          }
        } else {
          state = "wait";
          setTimeout(() => {
            if (state !== "game_over") resetRound();
          }, 3000); // give enough time for polished overlay
        }
      }

      if (state === "round_over" || state === "wait" || state === "game_over") {
        waitTimer += dt;
      } else {
        waitTimer = 0;
      }

      const scoreGap = Math.abs(
        gameRef.current.roundsP1 - gameRef.current.roundsP2,
      );
      let crowdExcitement =
        (state === "playing" ? (Math.hypot(p1.vx, p1.vy) > 0 ? 1 : 0.2) : 2) +
        scoreGap;

      // Update crowd
      crowd.forEach((c) => {
        c.jumpPhase += dt * (5 + crowdExcitement * 2);
        c.jump = Math.abs(Math.sin(c.jumpPhase)) * 5 * crowdExcitement;
        c.x = c.baseX + (Math.random() - 0.5) * crowdExcitement;
        c.y = c.baseY + (Math.random() - 0.5) * crowdExcitement - c.jump;
      });

      // Update Gyoji
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      gyoji.angle = Math.atan2(midY - gyoji.y, midX - gyoji.x);
      gyoji.x = 400 + Math.cos(gyoji.angle + Math.PI) * (arena.radius + 30);
      gyoji.y = 300 + Math.sin(gyoji.angle + Math.PI) * (arena.radius + 30);

      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - dt * 50);
      }

      // Camera follow logic
      let targetCamX = (p1.x + p2.x) / 2 - 400;
      let targetCamY = (p1.y + p2.y) / 2 - 300;
      targetCamX = Math.max(-80, Math.min(80, targetCamX));
      targetCamY = Math.max(-80, Math.min(80, targetCamY));

      cameraX += (targetCamX - cameraX) * 0.05;
      cameraY += (targetCamY - cameraY) * 0.05;

      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;

      // Crowd audio
      if (crowdGain) {
        const scoreGap = Math.abs(
          gameRef.current.roundsP1 - gameRef.current.roundsP2,
        );
        let targetVol = 0;
        if (state === "playing" && Math.hypot(p1.vx, p1.vy) > 0) {
          targetVol = Math.min(0.5 + scoreGap * 0.15, 1.0) * 0.3;
        } else if (state !== "playing") {
          targetVol = Math.min(0.5 + scoreGap * 0.15, 1.0) * 0.6;
        }
        crowdGain.gain.value += (targetVol - crowdGain.gain.value) * 0.05;
      }

      // ----------------------------------------------------
      // HIGH-FIDELITY RENDERING PASS
      // ----------------------------------------------------
      const lightOffsetX = 8;
      const lightOffsetY = 12;

      // Background Floor
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 800, 600);

      ctx.save();
      ctx.translate(-cameraX + shakeX, -cameraY + shakeY);

      // --- Shadows Pass (Environment) ---
      // Draw Arena shadow FIRST
      ctx.beginPath();
      ctx.arc(
        arena.x + lightOffsetX * 0.5,
        arena.y + lightOffsetY * 0.5,
        arena.radius + 15,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.filter = "blur(8px)"; // Use optimized filter for the single arena shadow
      ctx.fill();
      ctx.filter = "none"; // Reset filter immediately

      // --- Draw Sand Arena ---
      ctx.beginPath();
      ctx.arc(arena.x, arena.y, arena.radius, 0, Math.PI * 2);
      if (activeEffects.some((ef) => ef.type === "slow")) {
        ctx.fillStyle =
          activeEffects.find((ef) => ef.type === "slow")?.player === "p1"
            ? "#bfdbfe"
            : "#fecaca";
      } else {
        ctx.fillStyle = sandPattern || "#d4b881";
      }
      ctx.fill();

      // Vignette effect on sand
      const vignette = ctx.createRadialGradient(
        arena.x,
        arena.y,
        Math.max(1, arena.radius * 0.6),
        arena.x,
        arena.y,
        Math.max(1, arena.radius),
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = vignette;
      ctx.fill();

      // --- Skid Marks (Dark MultiplyBlend) ---
      ctx.globalCompositeOperation = "multiply";
      [p1, p2].forEach((p) => {
        if (p.history.length > 1) {
          for (let i = 1; i < p.history.length; i++) {
            const h0 = p.history[i - 1];
            const h1 = p.history[i];
            const age = matchTimeElapsed - h0.time;
            if (age >= 2) continue; // safety

            const speed = Math.hypot(h1.x - h0.x, h1.y - h0.y) / dt;
            const thickness = p.radius * (0.5 + Math.min(1, speed / 200));
            const alpha = Math.max(0, 1 - age / 2);

            ctx.beginPath();
            const offset0 = Math.sin((i - 1) * 0.5) * 2;
            const offset1 = Math.sin(i * 0.5) * 2;
            ctx.moveTo(h0.x + offset0, h0.y + offset0);
            ctx.lineTo(h1.x + offset1, h1.y + offset1);

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "rgba(100, 80, 50, 0.35)"; // Dirt color
            ctx.lineWidth = thickness;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();

            // Inner darker track
            ctx.beginPath();
            ctx.moveTo(h0.x + offset0, h0.y + offset0);
            ctx.lineTo(h1.x + offset1, h1.y + offset1);
            ctx.strokeStyle = "rgba(60, 40, 20, 0.4)";
            ctx.lineWidth = thickness * 0.5;
            ctx.stroke();
          }
        }
      });
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";

      // --- Starting lines (Shikiri-sen) ---
      if (arena.radius > 50) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillRect(arena.x - 30, arena.y - 12, 8, 24);
        ctx.fillRect(arena.x + 22, arena.y - 12, 8, 24);
        // Inner dirt on lines
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(arena.x - 28, arena.y - 10, 4, 20);
        ctx.fillRect(arena.x + 24, arena.y - 10, 4, 20);
      }

      // --- Volumetric Tawara (Straw Bales) ---
      ctx.save();
      const numBales = Math.max(
        10,
        Math.floor((arena.radius * Math.PI * 2) / 36),
      );
      const baleLength = (arena.radius * Math.PI * 2) / numBales;
      // Draw Tawara Shadow Pass
      ctx.beginPath();
      for (let i = 0; i < numBales; i++) {
        const baleAngle = (i / numBales) * Math.PI * 2;
        const bx = arena.x + Math.cos(baleAngle) * arena.radius;
        const by = arena.y + Math.sin(baleAngle) * arena.radius;
        ctx.moveTo(bx + lightOffsetX * 0.4, by + lightOffsetY * 0.4);
        ctx.arc(
          bx + lightOffsetX * 0.4,
          by + lightOffsetY * 0.4,
          8,
          0,
          Math.PI * 2,
        );
      }
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();

      // Draw Tawara Bales
      for (let i = 0; i < numBales; i++) {
        const baleAngle = (i / numBales) * Math.PI * 2;
        const tx = arena.x + Math.cos(baleAngle) * arena.radius;
        const ty = arena.y + Math.sin(baleAngle) * arena.radius;

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(baleAngle + Math.PI / 2);

        // Bale body
        ctx.beginPath();
        ctx.roundRect(-baleLength * 0.5 - 2, -6, baleLength + 4, 12, 6);
        ctx.fillStyle = "#c29e61";
        ctx.fill();

        // Highlight (Volume)
        ctx.beginPath();
        ctx.roundRect(-baleLength * 0.5, -4, baleLength, 4, 4);
        ctx.fillStyle = "#e0c18c";
        ctx.fill();

        // Tie bands
        ctx.fillStyle = "#5c4929";
        ctx.fillRect(-baleLength * 0.3, -6.5, 3, 13);
        ctx.fillRect(baleLength * 0.3 - 3, -6.5, 3, 13);

        ctx.restore();
      }
      ctx.restore();

      // --- Draw Gyoji (Referee) with Shadow ---
      ctx.save();
      ctx.translate(gyoji.x, gyoji.y);
      ctx.rotate(gyoji.angle);

      // Gyoji shadow
      ctx.beginPath();
      ctx.arc(lightOffsetX * 0.5, lightOffsetY * 0.5, 12, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();

      // Gunbai (War Fan) - Pointing at players (0 degrees in this local context is right)
      ctx.beginPath();
      ctx.moveTo(10, 0); // Handle
      ctx.lineTo(18, 0);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#4a3311";
      ctx.stroke();

      ctx.beginPath(); // Fan blade
      ctx.ellipse(22, 0, 6, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#8b0000"; // Dark red fan
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#daa520"; // Gold trim
      ctx.stroke();

      // Sleeves
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(-8, -14, 16, 28);
      // Main Robe
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.roundRect(-12, -10, 24, 20, 8);
      ctx.fill();

      // Accents
      ctx.fillStyle = "#4a235a";
      ctx.fillRect(-12, -4, 24, 8); // Belt/Sash

      // Head
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#fcdbb6"; // Skin
      ctx.fill();

      // Eboshi (Hat)
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(8, -10);
      ctx.lineTo(-4, -18);
      ctx.lineTo(-8, -6);
      ctx.fillStyle = "#111";
      ctx.fill();

      ctx.restore();

      // --- Fake Shadow Pass for Crowd ---
      ctx.save();
      ctx.translate(lightOffsetX * 0.4, lightOffsetY * 0.4);
      crowd.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.beginPath();
        ctx.arc(0, 0, c.size + 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // --- Draw Crowd ---
      crowd.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);

        ctx.beginPath();
        ctx.arc(0, 0, c.size, 0, Math.PI * 2);
        ctx.fillStyle = "#333"; // Shoulders
        ctx.fill();
        // Highlight
        ctx.beginPath();
        ctx.arc(2, -1, c.size - 2, 0, Math.PI * 2);
        ctx.fillStyle = "#444";
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(0, -c.size * 0.3, c.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffccaa";
        ctx.fill();
        ctx.restore();
      });

      // --- Draw Power-Ups ---
      powerUps.forEach((pu) => {
        const pulse = 1 + Math.sin(time / 150) * 0.15;
        ctx.save();
        ctx.translate(pu.x, pu.y);

        // Powerup shadow
        ctx.beginPath();
        ctx.arc(lightOffsetX * 0.3, lightOffsetY * 0.3, 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();

        let color = "rgba(234, 179, 8, 1)";
        let glowColor = "rgba(234, 179, 8, 0.4)";
        if (pu.type === "onigiri") {
          color = "rgba(255, 255, 255, 1)";
          glowColor = "rgba(255,255,255,0.4)";
        } else if (pu.type === "chili") {
          color = "rgba(239, 68, 68, 1)";
          glowColor = "rgba(239,68,68,0.4)";
        }

        ctx.globalCompositeOperation = "lighter";

        // Glowing Aura
        ctx.beginPath();
        ctx.arc(0, 0, 16 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        // Particles rotating around powerup
        const numParticles = 5;
        for (let j = 0; j < numParticles; j++) {
          const angle = time / 500 + (j * Math.PI * 2) / numParticles;
          const px = Math.cos(angle) * (15 * pulse);
          const py = Math.sin(angle) * (15 * pulse);
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }

        ctx.globalCompositeOperation = "source-over";

        // Main sphere
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Specular highlight
        ctx.beginPath();
        ctx.arc(-3, -3, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fill();

        // Rotate Icon
        ctx.rotate(Math.sin(time / 300) * 0.2);

        ctx.fillStyle = "#000";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          pu.type === "onigiri" ? "🍙" : pu.type === "chili" ? "🌶️" : "",
          0,
          0,
        );
        ctx.restore();
      });

      // --- Draw Players ---
      const drawPlayer = (p: Player, isP1: boolean) => {
        ctx.save();
        // 1. Fake Shadow
        ctx.save();
        ctx.translate(p.x + lightOffsetX * 0.6, p.y + lightOffsetY * 0.6);
        ctx.rotate(p.angle || 0);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radius + 8, p.radius + 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fill();
        ctx.restore();

        // Translate to player
        ctx.translate(p.x, p.y);

        // Stamina bar (above player)
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(-16, -36, 32, 6);
        let stamColor = "#4ade80";
        if (p.stamina < 20) stamColor = "#ef4444";
        else if (p.stamina < 50) stamColor = "#facc15";
        ctx.fillStyle = stamColor;
        ctx.fillRect(-15, -35, 30 * (p.stamina / p.maxStamina), 4);

        ctx.rotate(p.angle || 0);

        let skinColorBase = "#fcdbb6"; // Normal
        let skinColorDark = "#d4ab7b"; // Shaded
        if (p1.pushing && p2.pushing) {
          // Both pushing - flushed skin
          skinColorBase = "#ffb3a1";
          skinColorDark = "#d68775";
        } else if (p.stamina < 30) {
          // Exhausted skin
          skinColorBase = "#e0cbb8";
          skinColorDark = "#b59b84";
        }

        // Volumetric skin gradient
        const skinVolume = ctx.createRadialGradient(
          -3,
          -3,
          Math.max(1, p.radius * 0.2),
          0,
          0,
          Math.max(1, p.radius * 1.2),
        );
        skinVolume.addColorStop(0, skinColorBase);
        skinVolume.addColorStop(1, skinColorDark);

        const clothColor = isP1 ? "#1e3a8a" : "#7f1d1d"; // Blue vs Red
        const clothHighlight = isP1 ? "#3b82f6" : "#ef4444";

        // Anatomical Body (Top-down)

        // ARMS (Dynamic Posing)
        // Uses interpolated armExtend from Player object
        const armExtend = p.armExtend;
        const shoulderSpread = p.radius + 4;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Left Arm
        ctx.beginPath();
        ctx.moveTo(4, -shoulderSpread); // Shoulder origin
        // Curve to hand
        ctx.bezierCurveTo(
          p.radius + 4,
          -shoulderSpread - 2,
          p.radius + armExtend,
          -p.radius * 0.8,
          p.radius + armExtend,
          -p.radius * 0.4,
        );
        ctx.lineWidth = 10;
        ctx.strokeStyle = skinVolume;
        ctx.stroke();

        // Right Arm
        ctx.beginPath();
        ctx.moveTo(4, shoulderSpread); // Shoulder origin
        ctx.bezierCurveTo(
          p.radius + 4,
          shoulderSpread + 2,
          p.radius + armExtend,
          p.radius * 0.8,
          p.radius + armExtend,
          p.radius * 0.4,
        );
        ctx.lineWidth = 10;
        ctx.strokeStyle = skinVolume;
        ctx.stroke();

        // Hands (Fists)
        ctx.beginPath();
        ctx.arc(p.radius + armExtend, -p.radius * 0.4, 5, 0, Math.PI * 2);
        ctx.arc(p.radius + armExtend, p.radius * 0.4, 5, 0, Math.PI * 2);
        ctx.fillStyle = skinVolume;
        ctx.fill();

        // SHOULDERS/TORSO
        ctx.beginPath();
        ctx.ellipse(-2, 0, p.radius * 0.8, p.radius * 1.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = skinVolume;
        ctx.fill();

        // MAWASHI (Belt)
        ctx.beginPath();
        const mawashiGrad = ctx.createLinearGradient(-p.radius, 0, p.radius, 0);
        mawashiGrad.addColorStop(0, clothColor);
        mawashiGrad.addColorStop(1, clothHighlight);
        ctx.fillStyle = mawashiGrad;

        // Back of belt
        ctx.fillRect(-p.radius * 0.8, -p.radius * 0.6, 6, p.radius * 1.2);
        // Vertical front piece
        ctx.fillRect(-p.radius * 0.3, -4, p.radius + 4, 8);

        // HEAD
        ctx.beginPath();
        ctx.arc(p.radius * 0.2, 0, p.radius * 0.6, 0, Math.PI * 2);

        const headVolume = ctx.createRadialGradient(
          p.radius * 0.1,
          -2,
          Math.max(1, p.radius * 0.2),
          p.radius * 0.2,
          0,
          Math.max(1, p.radius * 0.7),
        );
        headVolume.addColorStop(0, skinColorBase);
        headVolume.addColorStop(1, skinColorDark);
        ctx.fillStyle = headVolume;
        ctx.fill();

        // HAIR (Chonmage)
        ctx.beginPath();
        ctx.arc(-1, 0, p.radius * 0.5, -Math.PI * 0.6, Math.PI * 0.6); // Base hair
        ctx.fillStyle = "#1a1a1a";
        ctx.fill();

        // Topknot
        ctx.beginPath();
        ctx.ellipse(p.radius * 0.1, 0, 4, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#0d0d0d";
        ctx.fill();
        // Hair highlight
        ctx.beginPath();
        ctx.ellipse(p.radius * 0.1 - 1, -2, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fill();

        ctx.restore();
      };

      // Draw P2 first if P1 is lower (y-sorting roughly by y, though top-down)
      if (p1.y > p2.y) {
        drawPlayer(p2, false);
        drawPlayer(p1, true);
      } else {
        drawPlayer(p1, true);
        drawPlayer(p2, false);
      }

      // --- Draw Particles ---
      ctx.globalCompositeOperation = "source-over";
      if (particles.length > 200) particles.splice(0, particles.length - 200);
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
        if (pt.text) {
          ctx.fillStyle = pt.color;
          ctx.font = `900 ${pt.size}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Beautiful text shadow
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(0,0,0,0.8)";
          ctx.strokeText(pt.text, pt.x, pt.y + 2); // shadow offset
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      ctx.restore(); // Restore camera translation

      // Countdown Animation
      if (state === "countdown" && countdownTimer > 0) {
        ctx.save();
        ctx.translate(400, 300);
        const num = Math.ceil(countdownTimer);
        const text = num > 1 ? (num - 1).toString() : "GO!";

        const fraction = countdownTimer % 1;
        const scale = 1 + fraction * 0.5; // Scales down from 1.5 to 1.0

        ctx.scale(scale, scale);

        ctx.font = "900 120px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(text, 6, 6);

        ctx.fillStyle = num > 1 ? "#fff" : "#4ade80";
        ctx.fillText(text, 0, 0);

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#000";
        ctx.strokeText(text, 0, 0);

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleInitAudio);
      window.removeEventListener("click", handleInitAudio);
      if (noiseSource) {
        try {
          noiseSource.stop();
          noiseSource.disconnect();
        } catch (e) {}
      }
      if (localAudioCtx && localAudioCtx.state !== "closed") {
        localAudioCtx.close().catch(() => {});
      }
    };
  }, [hasSeenCinematic, roundsWon, user?.uid]);

  const handleResetProgress = async () => {
    if (confirm(t("common.confirm"))) {
      if (db && user?.uid && user.uid !== "demo") {
        await updateDoc(doc(db, "users", user.uid), {
          sumoRoundsWon: 0,
          sumoBallsCollected: 0,
          sumoMatchesPlayed: 0,
        });
      }
      setRoundsWon(0);
      setBallsCollected(0);
      setMatchesPlayed(0);
      setGameState("hub");
    }
  };

  useEffect(() => {
    setCurrentResetAction(() => handleResetProgress);
    return () => setCurrentResetAction(null);
  }, [user]);

  if (!hasSeenCinematic) {
    return (
      <Cinematic modeId={modeId} onFinish={() => markCinematicSeen(modeId)} />
    );
  }

  return (
    <div className="absolute inset-0 bg-black text-white flex flex-col font-mono z-30">
      {/* Milestones */}
      {milestone && (
        <div
          className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer"
          onClick={() => setMilestone(null)}
        >
          <h2 className="text-6xl font-black text-yellow-400 mb-4 animate-bounce">
            {milestone === 5
              ? t("sumo.milestone5")
              : milestone === 10
                ? t("sumo.milestone10")
                : t("sumo.milestone20")}
          </h2>
          <p className="text-white text-2xl">{t("sumo.clickToContinue")}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 p-8">
        <div className="text-xl px-4 py-2 bg-blue-900 rounded font-bold">
          {t("sumo.p1")}: {roundsP1}
        </div>
        <div className="text-2xl font-black italic uppercase tracking-widest text-[#f97316] text-center w-full">
          {message}
        </div>
        <div className="text-xl px-4 py-2 bg-red-900 rounded font-bold">
          {t("sumo.p2")}: {roundsP2}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative bg-[#111] overflow-hidden rounded-xl border-4 border-white/10 group m-8">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full max-w-[800px] aspect-[800/600]"
        />

        {/* Progress Display */}
        <div className="absolute top-4 left-4 bg-black/70 p-4 rounded text-sm space-y-1 backdrop-blur-sm border border-white/10">
          <div>
            {t("sumo.roundsWon")}: {roundsWon}
          </div>
          <div>
            {t("sumo.ballsCollected")}: {ballsCollected}
          </div>
          <div>
            {t("sumo.matchesPlayed")}: {matchesPlayed}
          </div>
          <div className="w-full mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500"
              style={{ width: `${Math.min((roundsWon % 20) * 5, 100)}%` }}
            />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs opacity-50 bg-black/50 p-2 rounded pointer-events-none">
          {t("sumo.controls")}
        </div>

        {/* Polished Round Results Modal */}
        {roundMetrics && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40 backdrop-blur-[2px] animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-b from-slate-900 to-black border-2 border-yellow-600/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(202,138,4,0.3)] text-center w-full max-w-sm flex flex-col items-center">
              <div className="text-yellow-500 font-bold tracking-widest text-sm mb-2">
                {t("sumo.roundComplete", "ROUND COMPLETE")}
              </div>
              <h2 className="text-4xl font-black italic text-white drop-shadow-lg mb-6">
                {roundMetrics.text}
              </h2>
              <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent mb-6"></div>

              <div className="grid grid-cols-2 gap-4 w-full text-left">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">SCORE P1</div>
                  <div className="text-blue-400 font-bold text-xl">
                    {roundsP1}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="text-slate-400 text-xs mb-1">SCORE P2</div>
                  <div className="text-red-400 font-bold text-xl">
                    {roundsP2}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
