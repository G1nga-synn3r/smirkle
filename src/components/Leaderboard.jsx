import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Crown, Timer, RefreshCw } from 'lucide-react';
import { getGlobalLeaderboard } from '../services/scoreService';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    loadScores();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadScores = async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    try {
      // Try to fetch from Firestore first
      const firestoreScores = await getGlobalLeaderboard(10, { signal: abortControllerRef.current.signal });
      
      if (firestoreScores && firestoreScores.length > 0) {
        // Map Firestore field names to UI field names
        const mappedScores = firestoreScores.map(score => ({
          id: score.id,
          name: score.username,
          score: score.score_value,
          time: score.survival_time,
          date: score.date
        }));
        setScores(mappedScores);
      } else {
        // Fallback to demo scores when Firestore is empty
        setScores(getDemoScores());
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error('Error loading scores from Firestore:', error);
      // Fallback to demo scores on error
      setScores(getDemoScores());
    }
    setIsLoading(false);
  };

  // Demo scores for when Firestore is empty or not configured
  const getDemoScores = () => [
    { id: 'demo1', name: 'Alex Chen', score: 2847, time: 45, date: '2026-02-07' },
    { id: 'demo2', name: 'Sarah Miller', score: 2653, time: 52, date: '2026-02-06' },
    { id: 'demo3', name: 'Jordan Lee', score: 2431, time: 58, date: '2026-02-05' },
    { id: 'demo4', name: 'Casey Kim', score: 2198, time: 65, date: '2026-02-04' },
    { id: 'demo5', name: 'Riley Johnson', score: 1982, time: 72, date: '2026-02-03' },
    { id: 'demo6', name: 'Morgan Davis', score: 1756, time: 80, date: '2026-02-02' },
    { id: 'demo7', name: 'Taylor Smith', score: 1523, time: 95, date: '2026-02-01' },
    { id: 'demo8', name: 'Avery Brown', score: 1289, time: 110, date: '2026-01-31' },
  ];

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500 w-8">#{rank}</span>;
  };

  const getRankCardStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-orange-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 via-gray-300/5 to-gray-400/10 border-gray-300/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20 border-amber-500/30';
    return 'bg-white/5 border-white/10 hover:bg-white/10';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Leaderboard
            </h2>
            <p className="text-sm text-gray-400">{scores.length} players</p>
          </div>
        </div>
        <button
          onClick={loadScores}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Top 3 Podium */}
      {scores.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-8">
          {/* 2nd Place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-gray-800">2</span>
            </div>
            <p className="font-medium text-gray-300">{scores[1]?.name}</p>
            <p className="text-lg font-bold text-gray-400">{scores[1]?.score?.toLocaleString() ?? 'N/A'}</p>
            <div className="w-24 h-20 bg-gradient-to-t from-gray-400/30 to-gray-400/10 rounded-t-lg mt-2 flex items-end justify-center pb-2">
              <span className="text-xs text-gray-500">{formatTime(scores[1]?.time)}</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="text-center -mt-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2 shadow-lg shadow-yellow-500/30">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <p className="font-bold text-white text-lg">{scores[0]?.name}</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {scores[0]?.score.toLocaleString()}
            </p>
            <div className="w-28 h-28 bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 rounded-t-lg mt-2 flex items-end justify-center pb-2">
              <span className="text-sm text-yellow-500/70">{formatTime(scores[0]?.time)}</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <p className="font-medium text-gray-300">{scores[2]?.name}</p>
            <p className="text-lg font-bold text-amber-600">{scores[2]?.score.toLocaleString()}</p>
            <div className="w-24 h-16 bg-gradient-to-t from-amber-600/30 to-amber-600/10 rounded-t-lg mt-2 flex items-end justify-center pb-2">
              <span className="text-xs text-gray-500">{formatTime(scores[2]?.time)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Score List */}
      <div className="space-y-2">
        {scores.slice(3).map((player, index) => (
          <div
            key={player.id}
            className={`
              flex items-center gap-4 p-4 rounded-xl transition-all duration-200
              ${getRankCardStyle(index + 4)}
            `}
          >
            {getRankIcon(index + 4)}
            <div className="flex-1">
              <p className="font-medium text-white">{player.name}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <Timer className="w-3 h-3" />
                <span>{formatTime(player.time)}</span>
                <span>•</span>
                <span>{formatDate(player.date)}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {player.score.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {scores.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No scores yet. Be the first to play!</p>
        </div>
      )}
    </div>
  );
}
