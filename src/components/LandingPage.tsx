import React from 'react';
import { ResponsiveLeaderboard } from './ResponsiveLeaderboard';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface LandingPageProps {
  onPlay: (mode?: string) => void;
}

export function LandingPage({ onPlay }: LandingPageProps) {
  const { user } = useGame();
  const { t } = useLanguage();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const gameModes = [
    { id: 'spectrum', nama: t('landing.modes.spectrum.name'), classes: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/50', hoverBorder: 'group-hover:border-orange-500/80', shadow: 'hover:shadow-[0_15px_30px_-5px_rgba(249,115,22,0.3)]' }, deskripsi: t('landing.modes.spectrum.desc'), ikon: '🧩' },
    { id: 'galveston', nama: t('landing.modes.galveston.name'), classes: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/50', hoverBorder: 'group-hover:border-red-500/80', shadow: 'hover:shadow-[0_15px_30px_-5px_rgba(239,68,68,0.3)]' }, deskripsi: t('landing.modes.galveston.desc'), ikon: '🥁' },
    { id: 'sumo', nama: t('landing.modes.sumo.name'), classes: { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/50', hoverBorder: 'group-hover:border-yellow-400/80', shadow: 'hover:shadow-[0_15px_30px_-5px_rgba(250,204,21,0.3)]' }, deskripsi: t('landing.modes.sumo.desc'), ikon: '🤼' },
    { id: 'shadowchef', nama: t('landing.modes.shadowchef.name'), classes: { text: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/50', hoverBorder: 'group-hover:border-green-500/80', shadow: 'hover:shadow-[0_15px_30px_-5px_rgba(34,197,94,0.3)]' }, deskripsi: t('landing.modes.shadowchef.desc'), ikon: '🍣' },
    { id: 'longestsecond', nama: t('landing.modes.longestsecond.name'), classes: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/50', hoverBorder: 'group-hover:border-blue-500/80', shadow: 'hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.3)]' }, deskripsi: t('landing.modes.longestsecond.desc'), ikon: '⏳' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0514] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">
      {/* Background with Stars */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a134a]/40 via-[#0a0514] to-[#0a0514]"></div>
        <div className="stars-bg"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0a0514]/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
              <span className="text-xl">☀️</span>
            </div>
            <span className="font-['Orbitron'] font-bold text-lg md:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
              SOLSTICE ARCADE
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide font-['Poppins'] items-center">
            <a href="#hero" onClick={(e) => handleScroll(e, 'hero')} className="text-white/70 hover:text-white transition-colors">{t('landing.nav.home')}</a>
            <a href="#modes" onClick={(e) => handleScroll(e, 'modes')} className="text-white/70 hover:text-white transition-colors">{t('landing.nav.games')}</a>
            <a href="#leaderboard" onClick={(e) => handleScroll(e, 'leaderboard')} className="text-white/70 hover:text-white transition-colors">{t('landing.nav.leaderboard')}</a>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button 
              onClick={() => onPlay('hub')}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full font-bold transition-all hover:scale-105 active:scale-95 text-sm"
            >
              {user ? t('landing.nav.enterHub') : t('landing.nav.login')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        
        {/* Hero Section */}
        <section id="hero" className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative staggered-entrance">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-mono tracking-widest backdrop-blur uppercase">
            {t('landing.hero.subtitle')}
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black font-['Orbitron'] mb-6 tracking-tight leading-[1.1]">
            <span dangerouslySetInnerHTML={{ __html: t('landing.hero.title_html') }} />
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed font-['Poppins']">
            {t('landing.hero.desc')}
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => onPlay('hub')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-full transition-all active:scale-95 tracking-wide text-lg relative overflow-hidden group border border-blue-400/50 hover-glow-cycle"
            >
              <div className="absolute inset-0 bg-white/20 w-full translate-x-[-100%] skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative z-10">{t('landing.hero.cta')}</span>
            </button>
          </div>
        </section>

        {/* Game Modes */}
        <section id="modes" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-['Orbitron'] mb-4">{t('landing.modes.title')}</h2>
            <p className="text-white/50 text-lg font-['Poppins']">{t('landing.modes.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameModes.map((mode, index) => (
              <div 
                key={mode.id} 
                className={`group bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/5 transition-all duration-300 hover:-translate-y-2 ${mode.classes.border} ${mode.classes.hoverBorder} ${mode.classes.shadow}`}
              >
                <div className={`w-16 h-16 rounded-2xl ${mode.classes.bg} flex items-center justify-center text-3xl mb-6 border border-white/5`}>
                  {mode.ikon}
                </div>
                <h3 className={`text-2xl font-bold mb-3 font-['Orbitron'] ${mode.classes.text}`}>{mode.nama}</h3>
                <p className="text-white/60 leading-relaxed font-['Poppins'] mb-8 min-h-[60px] text-sm">
                  {mode.deskripsi}
                </p>
                <button 
                  onClick={() => onPlay(mode.id)}
                  className="w-full py-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl font-bold tracking-widest text-sm transition-colors uppercase"
                >
                  {t('landing.modes.cta')}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard Section */}
        <section id="leaderboard" className="py-24 px-6 relative bg-black/40 border-t border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold font-['Orbitron'] mb-4 text-purple-400">{t('landing.leaderboard.title')}</h2>
              <p className="text-white/50 text-lg font-['Poppins']">{t('landing.leaderboard.subtitle')}</p>
            </div>
            
            <div className="h-[600px] w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.15)] border-2 border-purple-500/20 bg-[#0a0a14]/80 backdrop-blur-xl">
              <ResponsiveLeaderboard />
            </div>
          </div>
        </section>

        {/* About / Footer */}
        <footer id="about" className="py-12 border-t border-white/5 bg-[#05020a]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">☀️</span>
                <h3 className="font-['Orbitron'] text-2xl font-bold text-white/90">Solstice Arcade</h3>
              </div>
              <p className="text-white/50 text-sm max-w-md font-['Poppins']">
                {t('landing.footer.desc')}
              </p>
            </div>
            <div className="flex flex-col md:items-end gap-4">
              <div className="flex gap-4">
                <a href="https://github.com/setuju/Solstice-Arcade---Festival-of-Light" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors title='GitHub'">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              </div>
              <p className="text-white/30 text-xs">© 2026 AI Studio. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
