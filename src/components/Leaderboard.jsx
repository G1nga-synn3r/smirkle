import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Crown, Timer, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getGlobalLeaderboard } from '../services/scoreService';

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
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
      const firestoreScores = await getGlobalLeaderboard(25, {
        signal: abortControllerRef.current.signal,
      });

      if (firestoreScores && firestoreScores.length > 0) {
        // Map Firestore field names to UI field names
        const mappedScores = firestoreScores.map((score) => ({
          id: score.id,
          name: score.username,
          score: score.score_value,
          time: score.survival_time,
          date: score.date,
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

  // Demo scores for when Firestore is empty or not configured (top 100)
  const getDemoScores = () => [
    { id: 'demo1', name: 'Alex Chen', score: 2847, time: 45, date: '2026-02-07' },
    { id: 'demo2', name: 'Sarah Miller', score: 2653, time: 52, date: '2026-02-06' },
    { id: 'demo3', name: 'Jordan Lee', score: 2431, time: 58, date: '2026-02-05' },
    { id: 'demo4', name: 'Casey Kim', score: 2198, time: 65, date: '2026-02-04' },
    { id: 'demo5', name: 'Riley Johnson', score: 1982, time: 72, date: '2026-02-03' },
    { id: 'demo6', name: 'Morgan Davis', score: 1756, time: 80, date: '2026-02-02' },
    { id: 'demo7', name: 'Taylor Smith', score: 1523, time: 95, date: '2026-02-01' },
    { id: 'demo8', name: 'Avery Brown', score: 1289, time: 110, date: '2026-01-31' },
    { id: 'demo9', name: 'Quinn Chen', score: 1156, time: 87, date: '2026-01-30' },
    { id: 'demo10', name: 'Parker Davis', score: 1043, time: 102, date: '2026-01-29' },
    { id: 'demo11', name: 'Blake Wilson', score: 987, time: 84, date: '2026-01-28' },
    { id: 'demo12', name: 'Jordan Smith', score: 876, time: 76, date: '2026-01-27' },
    { id: 'demo13', name: 'Casey Murphy', score: 765, time: 68, date: '2026-01-26' },
    { id: 'demo14', name: 'Morgan Garcia', score: 654, time: 62, date: '2026-01-25' },
    { id: 'demo15', name: 'Riley Martinez', score: 543, time: 55, date: '2026-01-24' },
    { id: 'demo16', name: 'Avery Rodriguez', score: 432, time: 48, date: '2026-01-23' },
    { id: 'demo17', name: 'Quinn Anderson', score: 321, time: 40, date: '2026-01-22' },
    { id: 'demo18', name: 'Parker Thomas', score: 298, time: 38, date: '2026-01-21' },
    { id: 'demo19', name: 'Blake Taylor', score: 276, time: 36, date: '2026-01-20' },
    { id: 'demo20', name: 'Jordan White', score: 254, time: 34, date: '2026-01-19' },
    { id: 'demo21', name: 'Casey Harris', score: 232, time: 32, date: '2026-01-18' },
    { id: 'demo22', name: 'Morgan Martin', score: 210, time: 30, date: '2026-01-17' },
    { id: 'demo23', name: 'Riley Thompson', score: 188, time: 28, date: '2026-01-16' },
    { id: 'demo24', name: 'Avery Garcia', score: 166, time: 26, date: '2026-01-15' },
    { id: 'demo25', name: 'Quinn Lee', score: 144, time: 24, date: '2026-01-14' },
    { id: 'demo26', name: 'Parker Kim', score: 132, time: 22, date: '2026-01-13' },
    { id: 'demo27', name: 'Blake Johnson', score: 120, time: 20, date: '2026-01-12' },
    { id: 'demo28', name: 'Jordan Brown', score: 108, time: 18, date: '2026-01-11' },
    { id: 'demo29', name: 'Casey Davis', score: 96, time: 16, date: '2026-01-10' },
    { id: 'demo30', name: 'Morgan Wilson', score: 84, time: 14, date: '2026-01-09' },
    { id: 'demo31', name: 'Riley Miller', score: 72, time: 12, date: '2026-01-08' },
    { id: 'demo32', name: 'Avery Anderson', score: 60, time: 10, date: '2026-01-07' },
    { id: 'demo33', name: 'Quinn Taylor', score: 56, time: 9.3, date: '2026-01-06' },
    { id: 'demo34', name: 'Parker Thomas', score: 52, time: 8.7, date: '2026-01-05' },
    { id: 'demo35', name: 'Blake Martin', score: 48, time: 8.0, date: '2026-01-04' },
    { id: 'demo36', name: 'Jordan Garcia', score: 44, time: 7.3, date: '2026-01-03' },
    { id: 'demo37', name: 'Casey Martinez', score: 40, time: 6.7, date: '2026-01-02' },
    { id: 'demo38', name: 'Morgan Robinson', score: 36, time: 6.0, date: '2026-01-01' },
    { id: 'demo39', name: 'Riley Clark', score: 32, time: 5.3, date: '2025-12-31' },
    { id: 'demo40', name: 'Avery Rodriguez', score: 28, time: 4.7, date: '2025-12-30' },
    { id: 'demo41', name: 'Quinn Lewis', score: 26, time: 4.3, date: '2025-12-29' },
    { id: 'demo42', name: 'Parker Lee', score: 24, time: 4.0, date: '2025-12-28' },
    { id: 'demo43', name: 'Blake Walker', score: 22, time: 3.7, date: '2025-12-27' },
    { id: 'demo44', name: 'Jordan Hall', score: 20, time: 3.3, date: '2025-12-26' },
    { id: 'demo45', name: 'Casey Allen', score: 18, time: 3.0, date: '2025-12-25' },
    { id: 'demo46', name: 'Morgan Young', score: 16, time: 2.7, date: '2025-12-24' },
    { id: 'demo47', name: 'Riley King', score: 14, time: 2.3, date: '2025-12-23' },
    { id: 'demo48', name: 'Avery Wright', score: 12, time: 2.0, date: '2025-12-22' },
    { id: 'demo49', name: 'Quinn Scott', score: 10, time: 1.7, date: '2025-12-21' },
    { id: 'demo50', name: 'Parker Green', score: 8, time: 1.3, date: '2025-12-20' },
    { id: 'demo51', name: 'Blake Adams', score: 7, time: 1.2, date: '2025-12-19' },
    { id: 'demo52', name: 'Jordan Baker', score: 6, time: 1.0, date: '2025-12-18' },
    { id: 'demo53', name: 'Casey Nelson', score: 5, time: 0.8, date: '2025-12-17' },
    { id: 'demo54', name: 'Morgan Hill', score: 4, time: 0.7, date: '2025-12-16' },
    { id: 'demo55', name: 'Riley Moore', score: 3, time: 0.5, date: '2025-12-15' },
    { id: 'demo56', name: 'Avery Jackson', score: 2, time: 0.3, date: '2025-12-14' },
    { id: 'demo57', name: 'Quinn Martin', score: 2, time: 0.3, date: '2025-12-13' },
    { id: 'demo58', name: 'Parker Thompson', score: 1, time: 0.2, date: '2025-12-12' },
    { id: 'demo59', name: 'Blake White', score: 1, time: 0.2, date: '2025-12-11' },
    { id: 'demo60', name: 'Jordan Harris', score: 1, time: 0.1, date: '2025-12-10' },
  ];

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6" style={{ color: '#FFFF00' }} />;
    if (rank === 2) return <Medal className="w-6 h-6" style={{ color: '#00AAFF' }} />;
    if (rank === 3) return <Medal className="w-6 h-6" style={{ color: '#FF69B4' }} />;
    return <span className="text-lg font-bold w-8" style={{ color: '#000000' }}>#{rank}</span>;
  };

  const getRankCardStyle = (rank) => {
    if (rank === 1)
      return 'bg-yellow-100 border-3 border-black';
    if (rank === 2)
      return 'bg-blue-100 border-3 border-black';
    if (rank === 3)
      return 'bg-pink-100 border-3 border-black';
    return 'bg-white border-2 border-black hover:bg-gray-50';
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
            <p className="text-sm text-gray-400">
              {showAll ? 'Top 100 players' : 'Top 25 players'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadScores}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          {scores.length > 25 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 transition-colors"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-300">Show Less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-300">See More</span>
                </>
              )}
            </button>
          )}
        </div>
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
            <p className="text-lg font-bold text-gray-400">
              {scores[1]?.score?.toLocaleString() ?? 'N/A'}
            </p>
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
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {scores.slice(3, showAll ? undefined : 25).map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${getRankCardStyle(index + 4)}`}
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

      {/* Show More/Less Button */}
      {scores.length > 25 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 transition-all duration-300"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-medium">Show Less (Top 25)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-300 font-medium">See All (Top {scores.length})</span>
              </>
            )}
          </button>
        </div>
      )}

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
