import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface ScoreEntry {
  username: string;
  totalFragments: number;
  completedModesCount: number;
}

interface LeaderboardData {
  lastUpdated: string;
  scores: ScoreEntry[];
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'GitHub' | 'Firestore'>('GitHub');

  const fetchData = async () => {
    setLoading(true);
    try {
      const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/setuju/Solstice-Arcade---Festival-of-Light/main/data/leaderboard.json';
      const res = await fetch(GITHUB_RAW_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error("Fetch failed");
      
      const json = await res.json();
      setData(json);
      setSource('GitHub');
    } catch (e) {
      console.warn("Leaderboard GitHub fetch failed, falling back to Firestore.", e);
      try {
        if (!db) throw new Error("DB uninitialized");
        const usersRef = collection(db, 'users');
        const qRef = query(usersRef, orderBy('totalFragments', 'desc'), limit(20));
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
        setData({
          lastUpdated: new Date().toISOString(),
          scores
        });
        setSource('Firestore');
      } catch (dbErr) {
        console.warn("Firestore fallback failed", dbErr);
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-black/60 border border-purple-500/30 rounded-xl p-4 backdrop-blur-md">
      <div className="flex justify-between items-center border-b border-purple-500/30 pb-3 mb-3">
        <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl">🏆</span> Operatif Terbaik
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 subtle-scrollbar">
        {loading && !data && <div className="text-center text-white/50 text-xs mt-10 animate-pulse">Menghubungi satelit...</div>}
        {!loading && (!data || !data.scores) && <div className="text-center text-red-400 text-xs mt-10">Leaderboard offline.</div>}
        
        {data && data.scores && data.scores.map((sc, i) => (
          <div key={i} className="flex justify-between items-center py-2.5 text-sm border-b border-white/5 hover:bg-white/5 px-2 rounded-lg transition-colors group">
            <div className="flex items-center gap-3 w-2/3">
              <span className={`font-bold w-6 text-right ${i === 0 ? 'text-yellow-400 text-base' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-purple-400/50 text-xs'}`}>
                {i + 1}.
              </span>
              <span className="truncate font-medium group-hover:text-white text-white/80 transition-colors" title={sc.username}>{sc.username}</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-md text-xs shadow-sm">
                 {sc.totalFragments}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40 flex justify-between items-center font-mono">
        <span>SYNC: {data ? new Date(data.lastUpdated).toLocaleTimeString() : 'N/A'}</span>
        <button className="hover:text-white px-2 py-1 bg-white/5 rounded transition-colors uppercase tracking-widest" onClick={fetchData} title={`Source: ${source}`}>Refresh</button>
      </div>
    </div>
  );
}
