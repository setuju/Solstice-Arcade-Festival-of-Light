import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { verifyHiddenTask } from '../utils/hiddenTasks';
import { Cinematic } from './Cinematic';
import { EnigmaRotor } from './EnigmaRotor';
import { increment } from 'firebase/firestore';

// Exact 30 colors with exactly 3-sentence English riddles
const COLORS_RAW = [
  { a: "TURQUOISE", h: "I am a bright gemstone shade blending green and blue. Ancient cultures valued me as a protective shield. Think of a shallow tropical sea." },
  { a: "MAUVE", h: "I am a delicate pale purple with a gray undertone. Mine was the first synthetic dye made by accident in nineteenth century. I bring a subtle vintage elegance." },
  { a: "SCARLET", h: "I am a high-action orange-red with intense fire. Historically I was worn by cardinals and high royalty. I burn with deep passion and alarming danger." },
  { a: "INDIGO", h: "I sit silently on the rainbow between blue and violet. Denim jeans owe their signature shade to me. I am the deep, starry midnight sky." },
  { a: "AMBER", h: "I am a glowing gold-yellow hardened fossil resin. Ancient trees cried me millions of years ago. I warn drivers in traffic lights around the world." },
  { a: "CRIMSON", h: "I am a deep cardinal red with a splash of purple. You can spot me in the boldest autumn maple leaves. I am the rich color of fresh biological blood." },
  { a: "LILAC", h: "I am a very light purple with a soft pinkish tone. A fragrant spring shrub shares my sweet name. My gentle hue brings a sense of peaceful serenity." },
  { a: "FUCHSIA", h: "I am an electric pinkish-purple with absolute vibrancy. My intense name is shared by a blooming exotic flower. I scream for attention in every design." },
  { a: "RUST", h: "I am a warm reddish-brown born from oxidized iron. I cover vintage machinery forgotten in overgrown fields. Autumn leaves match my earthy and metallic flavor." },
  { a: "OLIVE", h: "I am a dark earthy yellow-green found in nature. I share my name with a bitter Mediterranean fruit. Peace is represented by my symbolic branch." },
  { a: "TEAL", h: "I am a medium blue-green with a calm demeanor. A small wild freshwater duck shares my title. I represent elegant balance and cool clarity." },
  { a: "LAVENDER", h: "I am a pastel purple with a soothing scent. Beautiful fragrant fields in France wear my shade. Sleep comes easily when I am around." },
  { a: "CORAL", h: "I am a lively mix of orange and warm pink. Tiny marine organisms build structures wearing my name. I bring the bright tropical ocean to life." },
  { a: "MAROON", h: "I am a dark brownish-red that is deep and comforting. Leather-bound vintage books often display my signature shade. I am a classic autumnal color." },
  { a: "NAVY", h: "I am an extremely deep dark blue shade. Brave sailors wear uniforms dipped in my color. At midnight the sky mimics my quiet presence." },
  { a: "PLUM", h: "I am a deep dark purple with rich heavy tones. A sweet juicy summer fruit shares my name. I represent luxury and high royalty." },
  { a: "GOLD", h: "I am the precious gleaming yellow metal of legends. Champions receive medals crafted in my warm image. I never tarnish or lose my premium sparkle." },
  { a: "SILVER", h: "I am a cool metallic shade that shines with light. Second place achievers are honored with my token. I gleam softly beneath the pale moon." },
  { a: "BRONZE", h: "I am a warm metallic brown alloy of copper and tin. I honor those who claim third place in competition. I represent the ancient dawn of human metalwork." },
  { a: "PEACH", h: "I am a soft yellowish-pink pastel shade. A fuzzy round organic fruit shares my exact name. I am sweet and gentle to the eyes." },
  { a: "MINT", h: "I am a pale cool green and extremely refreshing. Breath candies and herb garden leaves wear my title. I feel crisp and clean like mountain air." },
  { a: "IVORY", h: "I am a soft creamy white with warm yellow undertones. Majestic elephant tusks were unfortunately traded for me. I cover the keys of classic acoustic pianos." },
  { a: "CHARCOAL", h: "I am a dark gray that resembles soot and ash. Artists draw smoky masterpieces using my dry sticks. I remain after wood has burned to completion." },
  { a: "SKY", h: "I am a bright pale blue with limitless reach. I am the background of white fluffy clouds during daytime. On a clear afternoon I stretch forever." },
  { a: "LEMON", h: "I am a bright sunny yellow that feels energetic. A sour citrus fruit shares my fresh label. I make your tongue curl with my sharp acidity." },
  { a: "RASPBERRY", h: "I am a deep pinkish-red with berry sweet energy. I share my name with a bumpy and delicious fruit. I add a tart and fruity burst to designs." },
  { a: "EMERALD", h: "I am a rich and brilliant green gemstone shade. Ireland is called my island due to its lush hills. I represent deep wealth and mystical powers." },
  { a: "SAPPHIRE", h: "I am a brilliant royal blue gemstone of pure crystal. Cornflower fields mimic my deep premium value. I bring deep wisdom and cosmic protection." },
  { a: "RUBY", h: "I am a passionate glowing deep red gemstone. Oz has slippers of my shade that click together. I am second in hardness only to diamond." },
  { a: "JADE", h: "I am a deep milky green stone from the East. Emperors carved ancient relics out of my tough body. I bring good luck and harmony to homes." }
];

const getShiftedWordStatic = (word: string, shift: number) => {
  return word.split('').map(c => {
    if (c === ' ') return ' ';
    const code = c.charCodeAt(0) - 65;
    const shifted = ((code + shift) % 26 + 26) % 26;
    return String.fromCharCode(shifted + 65);
  }).join('');
};

const COLOR_QUESTIONS = COLORS_RAW.map((c, i) => {
  const baseShift = (i * 7 + 3) % 26;
  return {
    cipher: getShiftedWordStatic(c.a, baseShift),
    hint: c.h,
    answer: c.a,
    baseShift
  };
});

const TURING_QUOTES = [
  "Enigma has been activated.",
  "Colors await decryption.",
  "Alan Turing is compiling the code.",
  "Rotors spinning, secrets revealed.",
  "Can a machine trick a human?",
  "Codebreakers never sleep.",
  "Colors are the key to everything.",
  "Pushing the boundaries of artificial intelligence.",
  "Every turn brings new meaning.",
  "Proceed, decode this hue."
];

// Canvas-based particles for celebration milestones
function CelebrationCanvas({ type }: { type: 10 | 20 }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      decay: number;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = height + 10;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 8 - 4;
        const colors = type === 10 
          ? ['#06b6d4', '#22d3ee', '#67e8f9', '#10b981', '#a855f7'] 
          : ['#eab308', '#facc15', '#fef08a', '#ec4899', '#f43f5e', '#a855f7'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = Math.random() * 8 + 4;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.005;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.rotation += this.rotationSpeed;
        this.alpha -= this.decay;
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.globalAlpha = Math.max(0, this.alpha);
        c.fillStyle = this.color;
        if (type === 10) {
          // Draw star-like shapes
          c.beginPath();
          for (let i = 0; i < 5; i++) {
            c.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.size, -Math.sin((18 + i * 72) * Math.PI / 180) * this.size);
            c.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (this.size / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (this.size / 2));
          }
          c.closePath();
          c.fill();
        } else {
          // Draw neat confetti squares
          c.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        c.restore();
      }
    }

    const particles: Particle[] = [];
    const maxParticles = 60;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (particles.length < maxParticles && Math.random() < 0.3) {
        particles.push(new Particle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0 || p.y > height + 20) {
          particles.splice(i, 1);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [type]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

export function Spectrum() {
  const { user, setGameState, updateUserProgress, gameData, markCinematicSeen, saveSpectrumProgress, resetSpectrumProgress, incrementSpectrumVisit, setCurrentResetAction, updateModeProgress } = useGame();
  const { t } = useLanguage();
  
  const modeId = 'spectrum';
  const hasSeenCinematic = gameData?.cinematicSeen?.[modeId];

  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<(typeof COLOR_QUESTIONS[0] & { originalIndex: number })[]>([]);
  const [progressIndex, setProgressIndex] = useState(0); 

  const [introText, setIntroText] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);

  const [rotors, setRotors] = useState([0, 0, 0]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rotorMoves, setRotorMoves] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set intro quote
  useEffect(() => {
    const quoteIndex = parseInt(sessionStorage.getItem('spectrumQuoteIndex') || '0', 10);
    setIntroText(TURING_QUOTES[quoteIndex % TURING_QUOTES.length]);
    sessionStorage.setItem('spectrumQuoteIndex', (quoteIndex + 1).toString());
  }, []);

  // Easter Egg check (23 entries)
  useEffect(() => {
    const runIncrement = async () => {
      const dbCount = await incrementSpectrumVisit();
      const claimed = localStorage.getItem('spectrumEasterEggClaimed') === 'true' || gameData?.hiddenTasksCompleted?.['spectrum_easter'];
      if (!claimed && dbCount === 23) {
        localStorage.setItem('spectrumEasterEggClaimed', 'true');
        setShowEasterEgg(true);
        if (user?.uid === 'demo') {
          updateModeProgress('spectrum', { totalFragments: (gameData?.totalFragments || 0) + 1 });
        } else {
          updateModeProgress('spectrum', { totalFragments: increment(1) });
        }
      }
    };
    runIncrement();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persistent Progress Loading
  useEffect(() => {
    if (!gameData) return;

    if (!isInitialized) {
      const initProgress = gameData.spectrumProgress ?? parseInt(localStorage.getItem('spectrumProgress') || '0', 10) ?? 0;
      const initSolved = gameData.spectrumSolvedCiphers ?? JSON.parse(localStorage.getItem('spectrumSolvedCiphers') || '[]') ?? [];
      let initOrder = gameData.spectrumQuestionOrder ?? JSON.parse(localStorage.getItem('spectrumQuestionOrder') || '[]') ?? [];

      if (!initOrder || initOrder.length === 0) {
        initOrder = Array.from({ length: 30 }, (_, i) => i).sort(() => Math.random() - 0.5);
        saveSpectrumProgress(initProgress, initSolved, initOrder);
      }

      setQuestionOrder(initOrder);
      setProgressIndex(initProgress);

      if (initProgress >= 30) {
        setMilestone(30);
      } else {
        const remainingIndices = initOrder.filter((idx: number) => !initSolved.includes(idx));
        const remainingQuestions = remainingIndices.map((idx: number) => ({
          ...COLOR_QUESTIONS[idx],
          originalIndex: idx
        }));
        setSessionQuestions(remainingQuestions);
      }
      setIsInitialized(true);
    }
  }, [gameData, isInitialized, saveSpectrumProgress]);

  // Intro view delay handler
  useEffect(() => {
    if (hasSeenCinematic) {
      const timer = setTimeout(() => setShowIntro(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowIntro(false);
    }
  }, [hasSeenCinematic]);

  // Autofade out milestone overlays
  useEffect(() => {
    if (milestone === 10 || milestone === 20) {
      const timer = setTimeout(() => {
        setMilestone(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  const handleResetProgress = async () => {
    if (confirm("Are you sure? This will erase all your progress in Spectrum Architect and you'll start from scratch.")) {
      await resetSpectrumProgress();
      setGameState('hub');
    }
  };

  useEffect(() => {
    setCurrentResetAction(() => handleResetProgress);
    return () => setCurrentResetAction(null);
  }, []);

  const currentLevel = sessionQuestions[0];
  const totalShift = rotors.reduce((a, b) => a + b, 0);

  const getShiftedWord = (word: string, shift: number) => {
    if (!word) return '';
    return word.split('').map(c => {
      if (c === ' ') return ' ';
      const code = c.charCodeAt(0) - 65;
      const shifted = ((code + shift) % 26 + 26) % 26;
      return String.fromCharCode(shifted + 65);
    }).join('');
  };

  const displayedCipher = currentLevel ? getShiftedWord(currentLevel.answer, currentLevel.baseShift - totalShift) : '';

  const handleRotorChange = (index: number, delta: number) => {
    setRotorMoves(m => m + 1);
    setRotors(prev => {
      const newRotors = [...prev];
      let val = newRotors[index] + delta;
      if (val > 25) val = 0;
      if (val < 0) val = 25;
      newRotors[index] = val;
      return newRotors;
    });
  };

  const completeSpectrum = async () => {
    if (!gameData?.completedModes?.['spectrum']) {
      const isHiddenTaskComplete = verifyHiddenTask(modeId, { rotorMoves });
      const hiddenReward = isHiddenTaskComplete && (!gameData?.hiddenTasksCompleted?.[modeId]) ? 2 : 0;
      await updateUserProgress('spectrum', 2, hiddenReward);
    }
    setGameState('hub');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLevel || milestone !== null) return;
    
    if (answer.trim().toUpperCase() === currentLevel.answer) {
      setFeedback('CORRECT! Decrypting next sequence...');
      
      const newProgress = progressIndex + 1;
      const solved = gameData?.spectrumSolvedCiphers ?? JSON.parse(localStorage.getItem('spectrumSolvedCiphers') || '[]') ?? [];
      const newSolved = [...solved, currentLevel.originalIndex];

      await saveSpectrumProgress(newProgress, newSolved, questionOrder);
      
      setTimeout(() => {
        setFeedback('');
        setAnswer('');
        setRotors([0, 0, 0]);
        setProgressIndex(newProgress);
        
        if (newProgress === 10) setMilestone(10);
        else if (newProgress === 20) setMilestone(20);
        else if (newProgress === 30) setMilestone(30);

        setSessionQuestions(prev => prev.slice(1));
      }, 1500);
    } else {
      setFeedback('INCORRECT. RECALIBRATE. TRY AGAIN.');
      setTimeout(() => setFeedback(''), 1500);
    }
  };

  // --- 1. Async Loading State ---
  if (!gameData) {
    return (
      <div className="absolute inset-0 bg-[#0a1128] flex flex-col items-center justify-center p-8 text-cyan-400 font-mono z-50">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-xl tracking-widest animate-pulse">ESTABLISHING ENIGMA LINK...</p>
      </div>
    );
  }

  // --- 2. Story Cinematic ---
  if (!hasSeenCinematic) {
    return <Cinematic modeId={modeId} onFinish={() => markCinematicSeen(modeId)} />;
  }

  // --- 3. Brief Intro Animation ---
  if (showIntro) {
    return (
      <div className="absolute inset-0 z-50 bg-[#0a1128] flex items-center justify-center p-8">
         <div className="max-w-3xl text-cyan-400 text-xl md:text-3xl tracking-[0.1em] text-center font-mono animate-pulse border-y border-cyan-800 py-8 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-cyan-900/10 pointer-events-none" />
           <p className="overflow-hidden block mx-auto text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
             "{introText}"
           </p>
         </div>
      </div>
    );
  }

  // --- 4. Celebration: Level 1 Milestone ---
  if (milestone === 10) {
    return (
      <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-md cursor-pointer font-mono overflow-hidden" onClick={() => setMilestone(null)}>
        <CelebrationCanvas type={10} />
        <div className="text-6xl mb-6 animate-bounce select-none">✨</div>
        <h2 className="text-4xl md:text-6xl font-black text-cyan-400 mb-6 tracking-widest text-center drop-shadow-[0_0_20px_rgba(34,211,238,0.7)] transition-transform hover:scale-105 duration-500 z-10">10 COLORS DECODED!</h2>
        <p className="text-white text-xl md:text-2xl mb-8 z-10 font-bold animate-pulse">ENTERING LEVEL 2...</p>
        <p className="text-gray-500 animate-pulse z-10 text-sm">(Click or wait to continue)</p>
      </div>
    );
  }

  // --- 5. Celebration: Level 2 Milestone ---
  if (milestone === 20) {
    return (
      <div className="absolute inset-0 z-50 bg-[#0f0e26] flex flex-col items-center justify-center p-8 cursor-pointer font-mono overflow-hidden" onClick={() => setMilestone(null)}>
        <CelebrationCanvas type={20} />
        <div className="text-6xl mb-6 animate-bounce select-none">👑</div>
        <div className="animate-[shake_0.5s_ease-in-out_infinite] z-10">
          <h2 className="text-5xl md:text-7xl font-black text-yellow-400 mb-6 tracking-widest drop-shadow-[0_0_25px_rgba(250,204,21,1)] text-center scale-up-center">20 SPECTRUMS REVEALED!</h2>
        </div>
        <p className="text-white text-2xl md:text-3xl mb-8 z-10 font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] text-center animate-pulse">ENTERING LEVEL 3...</p>
        <p className="text-yellow-200/60 animate-pulse z-10 text-sm tracking-widest">(Click or wait to continue)</p>
        <style>{`
          .scale-up-center { animation: scale-up 0.5s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; }
          @keyframes scale-up { 0% { transform: scale(0.5); } 100% { transform: scale(1); } }
          @keyframes shake {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(2px, 2px) rotate(0.5deg); }
            50% { transform: translate(-2px, -2px) rotate(-0.5deg); }
            75% { transform: translate(2px, -2px) rotate(0.5deg); }
          }
        `}</style>
      </div>
    );
  }

  // --- 6. Finale: Alan Turing Tribute ---
  if (milestone === 30) {
    return (
      <div className="absolute inset-0 z-[60] bg-black text-white p-4 md:p-8 flex flex-col items-center justify-center font-mono overflow-y-auto w-full">
        <div className="text-[5px] md:text-[8px] leading-none whitespace-pre text-cyan-400 mb-8 animate-pulse text-center select-none overflow-hidden max-w-full">
{`          .                                                      .
        .n                   .                 .                  n.
  .   .dP                  dP                   9b                 9b.    .
 4    qXb         .       dX                     Xb       .        dXp     t
 dX.    9Xb      .dXb    __                         __    dXb.     dXP     .Xb
9XXb._       _.dXXXXb dXXXXbo.                 .odXXXXb dXXXXb._       _.dXXP
 9XXXXXXXXXXXXXXXXXXXVXXXXXXXXOo.           .oOXXXXXXXXVXXXXXXXXXXXXXXXXXXXP
  \`9XXXXXXXXXXXXXXXXXXXXX'~   ~OOO8b   d8OOO~   ~\`XXXXXXXXXXXXXXXXXXXXXP'
    \`9XXXXXXXXXXXP' \`9XX'   DIE    \`98v8P'  HUMAN   \`XXP' \`9XXXXXXXXXXXP'
        ~~~~~~~       9X.          .db|db.          .XP       ~~~~~~~
                        )b.  .dbo.dP'\`v'\`9b.odb.  .dX(
                      ,dXXXXXXXXXXXb     dXXXXXXXXXXXb.
                     dXXXXXXXXXXXP'   .   \`9XXXXXXXXXXXb
                    dXXXXXXXXXXXXb   d|b   dXXXXXXXXXXXXb
                    9XXb'   \`XXXXXb.dX|Xb.dXXXXX'   \`dXXP
                     \`'      9XXXXXX(   )XXXXXXP      \`'
                              XXXX X.\`v'.X XXXX
                              XP^X'\`b   d'\`X^XX
                              X. 9  \`   '  P )X
                              \`b  \`       '  d'
                               \`             '`}
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-6 text-center uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse">Alan Turing</h2>
            <div className="text-xl md:text-2xl space-y-4 text-center max-w-3xl opacity-0 animate-[fadeIn_2s_ease_1s_forwards] font-light">
                <p className="tracking-wide">{t('spectrum.turing.fact1')}</p>
                <p className="text-cyan-300">{t('spectrum.turing.fact2')}</p>
                <p className="text-red-400"><span dangerouslySetInnerHTML={{ __html: t('spectrum.turing.fact3') }} /></p>
            </div>
            <div className="mt-12 opacity-0 animate-[fadeIn_2s_ease_5s_forwards] flex flex-col items-center pb-12">
                <p className="text-2xl md:text-4xl text-green-400 font-bold mb-4 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">{t('spectrum.turing.reward')}</p>
                <div className="flex flex-col md:flex-row gap-4 mt-6">
                  <button onClick={completeSpectrum} className="px-8 py-4 bg-cyan-800 hover:bg-cyan-600 text-white font-black tracking-widest transition-all rounded shadow-[0_0_15px_rgba(14,116,144,0.6)] hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] border border-cyan-400 active:scale-95 cursor-pointer">
                      {t('spectrum.returnButton')}
                  </button>
                  <button onClick={handleResetProgress} className="px-8 py-4 bg-red-900/60 hover:bg-red-800/80 text-red-500 hover:text-red-300 font-black tracking-widest transition-all rounded shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] border border-red-800 hover:border-red-400 active:scale-95 cursor-pointer">
                      {t('spectrum.resetButton')}
                  </button>
                </div>
            </div>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  const currentLevelDisplay = progressIndex < 10 ? 1 : (progressIndex < 20 ? 2 : 3);

  return (
    <div className="absolute inset-0 bg-[#0a1128] text-cyan-400 p-4 md:p-8 flex flex-col font-mono z-30 overflow-y-auto w-full">
      {/* Easter Egg Popup */}
      {showEasterEgg && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-green-900/95 border-2 border-green-400 text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(74,222,128,0.6)] flex flex-col items-center animate-bounce cursor-pointer max-w-sm w-full text-center" onClick={() => setShowEasterEgg(false)}>
          <span className="font-bold text-lg md:text-xl mb-1 text-yellow-300">{t('easteregg.turing.notification')}</span>
          <span className="text-green-300 font-black text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{t('easteregg.turing.fragment')}</span>
          <span className="text-xs text-green-200/70 mt-2">{t('easteregg.turing.dismiss')}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full max-w-6xl mx-auto mb-8 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">{t('spectrum.title')}</h2>
          <div className="text-cyan-200/70 mt-2 text-xl font-bold bg-cyan-950/60 border border-cyan-800/40 px-4 py-1.5 rounded-full w-fit shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> Level {currentLevelDisplay}
          </div>
        </div>
        <div className="text-left md:text-right w-full md:w-auto">
          <div className="text-xl md:text-2xl font-bold text-white mb-2">{t('spectrum.progress', { current: progressIndex + 1, total: 30 })}</div>
          <div className="w-full md:w-64 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-500 ease-out" style={{ width: `${(progressIndex / 30) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center w-full max-w-6xl mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center w-full pb-20">
          <div className="mb-8 bg-gray-900/80 p-6 border-l-4 border-cyan-600 rounded drop-shadow-xl max-w-2xl w-full text-center relative overflow-hidden backdrop-blur-md">
            <div className="text-cyan-500 uppercase tracking-widest text-sm font-black mb-3">{t('spectrum.hint.label')}</div>
            <div className="text-white text-xl md:text-2xl leading-relaxed font-medium">"{currentLevel?.hint}"</div>
          </div>
          
          <div className="text-5xl md:text-7xl lg:text-8xl font-black mb-12 tracking-[0.2em] text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.7)] py-4 min-h-[120px] flex items-center justify-center break-all text-center px-4 bg-gradient-to-b from-transparent to-black/30 w-full rounded-2xl border-y border-white/5">
            {displayedCipher}
          </div>
          
          <div className="flex gap-4 md:gap-8 mb-12 px-4 max-w-full overflow-x-auto pb-4 justify-center items-center w-full">
            {rotors.map((r, i) => (
              <EnigmaRotor key={i} index={i} value={r} onChange={(delta) => handleRotorChange(i, delta)} />
            ))}
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-md px-4">
            <input 
              type="text" 
              value={answer} 
              onChange={e => setAnswer(e.target.value.toUpperCase())}
              className="bg-black/80 border-2 border-cyan-800 px-6 py-4 text-3xl text-center w-full text-cyan-300 outline-none focus:border-cyan-400 uppercase disabled:opacity-50 transition-colors shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] focus:shadow-[0_0_25px_rgba(34,211,238,0.4)] rounded-xl font-bold"
              placeholder={t('spectrum.answerPlaceholder')}
              disabled={!!feedback}
              autoComplete="off"
            />
            <button type="submit" disabled={!!feedback || !answer} className="w-full py-5 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 text-white text-xl font-bold tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_20px_rgba(14,116,144,0.6)] hover:shadow-[0_0_30px_rgba(6,182,212,0.9)] border-2 border-cyan-400 rounded-xl active:scale-[0.98]">
              {t('spectrum.decryptButton')}
            </button>
          </form>
          
          <div className="mt-8 h-8 flex items-center justify-center">
            {feedback && (
              <div className={`text-xl md:text-2xl tracking-widest font-bold ${feedback.includes('CORRECT') ? 'text-green-400 animate-pulse drop-shadow-[0_0_15px_rgba(74,222,128,1)]' : 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]'}`}>
                {feedback}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 md:absolute md:bottom-8 md:right-8 flex flex-col md:flex-row gap-4 z-50">
        <button onClick={handleResetProgress} className="px-6 py-3 bg-red-900/60 border border-red-800 text-red-500 hover:bg-red-800/80 hover:text-red-300 hover:border-red-400 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] active:scale-95">
          {t('spectrum.resetButton')}
        </button>
        <button onClick={() => setGameState('hub')} className="px-6 py-3 bg-black/80 border border-cyan-800 text-cyan-500 hover:bg-cyan-900/80 hover:text-cyan-300 hover:border-cyan-400 transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md rounded shadow-[0_0_15px_rgba(0,0,0,0.8)] active:scale-95">
          {t('spectrum.returnButton')}
        </button>
      </div>
    </div>
  );
}
