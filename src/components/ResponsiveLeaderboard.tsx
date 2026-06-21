import React, { useEffect, useState } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';

interface ScoreEntry {
  username: string;
  totalFragments: number;
  completedModesCount: number;
}

interface LeaderboardData {
  lastUpdated: string;
  scores: ScoreEntry[];
}

export function ResponsiveLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'Firestore' | 'Mock'>('Firestore');
  const { t } = useLanguage();

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Try Firestore
    try {
      if (!db || !isFirebaseConfigured) throw new Error("DB uninitialized");
      const usersRef = collection(db, 'users');
      const qRef = query(usersRef, orderBy('totalFragments', 'desc'), limit(10));
      const snap = await getDocs(qRef);
      const scores: ScoreEntry[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.totalFragments > 0) {
          scores.push({
             username: d.username || "Anonymous",
             totalFragments: d.totalFragments,
             completedModesCount: d.completedModes ? Object.keys(d.completedModes).filter(k => d.completedModes[k]).length : 0
          });
        }
      });
      
      if (scores.length > 0) {
        const newData = {
          lastUpdated: new Date().toISOString(),
          scores
        };
        setData(newData);
        setSource('Firestore');
        localStorage.setItem('leaderboardCache', JSON.stringify(newData));
        setLoading(false);
        return;
      }
    } catch (dbErr) {
      console.warn("Firestore fetch failed", dbErr);
    }
    
    // 2. Fallback to cache if Firestore failed
    const cached = localStorage.getItem('leaderboardCache');
    if (cached) {
      const parsedCache: LeaderboardData = JSON.parse(cached);
      const cacheTimestamp = new Date(parsedCache.lastUpdated).getTime();
      const oneHourInMs = 60 * 60 * 1000;
      
      if (Date.now() - cacheTimestamp < oneHourInMs) {
        setData(parsedCache);
        setSource('Mock'); // Label as cached/mock
        setLoading(false);
        return;
      }
    }
    
    // 3. Complete failure
    setData(null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#110a1f]/80 border border-purple-500/30 rounded-xl p-4 backdrop-blur-md shadow-2xl">
      <div className="flex justify-between items-center border-b border-purple-500/30 pb-3 mb-3 shrink-0">
        <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">🏆</span> {t('leaderboard.topOperatives')}
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 subtle-scrollbar">
        {loading && !data ? (
          <div className="space-y-3 mt-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg border border-white/5"></div>
            ))}
          </div>
        ) : !data ? (
            <div className="text-center text-red-400 text-xs mt-10 p-4 bg-red-900/20 border border-red-500/20 rounded-lg">
              {t('leaderboard.unavailable')}
            </div>
        ) : data.scores.length === 0 ? (
            <div className="text-center text-white/50 text-xs mt-10">{t('leaderboard.noData')}</div>
        ) : (
            data.scores.map((sc, i) => (
              <div key={i} className="flex justify-between items-center py-2 text-sm border-b border-white/5 hover:bg-white/10 px-2 rounded-lg transition-colors group">
                <div className="flex items-center gap-3 w-2/3">
                  <span className={`font-bold w-6 text-right ${i === 0 ? 'text-yellow-400 text-base' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-purple-400/50 text-xs'}`}>
                    {i + 1}.
                  </span>
                  <span className="truncate font-medium group-hover:text-white text-white/80 transition-colors" title={sc.username}>{sc.username}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-md text-xs shadow-sm shadow-yellow-500/10">
                     {sc.totalFragments}
                  </span>
                </div>
              </div>
            ))
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono shrink-0">
        <div>
          {t('leaderboard.lastUpdate')}: {data ? new Date(data.lastUpdated).toLocaleTimeString() : 'N/A'}
          {source === 'Mock' && <span className="ml-2 text-red-400">(OFFLINE)</span>}
          {source === 'Firestore' && <span className="ml-2 text-amber-400">(LIVE)</span>}
        </div>
        <button 
          className="hover:text-white hover:bg-white/10 px-3 py-1.5 bg-white/5 rounded transition-colors uppercase tracking-widest active:scale-95 cursor-pointer" 
          onClick={fetchData} 
          disabled={loading}
        >
          {loading ? t('leaderboard.syncing') : t('leaderboard.refresh')}
        </button>
      </div>
    </div>
  );
}
