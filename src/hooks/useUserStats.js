import { useState, useEffect, useCallback } from 'react';

const STATS_STORAGE_KEY = 'smirkle_user_stats';

const defaultStats = {
  longestStreak: 0,
  totalWins: 0,
  pokerFaceLevel: 1,
  experience: 0,
  gamesPlayed: 0,
  lastPlayedDate: null,
};

export function useUserStats() {
  const [stats, setStats] = useState(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // Load stats from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats({ ...defaultStats, ...parsed });
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    }
  }, [stats, isLoading]);

  const updateStats = useCallback((updates) => {
    setStats((prev) => {
      const newStats = { ...prev, ...updates };
      return newStats;
    });
  }, []);

  const addWin = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      totalWins: prev.totalWins + 1,
      experience: prev.experience + 100,
    }));
  }, []);

  const updateStreak = useCallback(() => {
    setStats((prev) => {
      const today = new Date().toDateString();
      const lastPlayed = prev.lastPlayedDate;
      let newStreak = prev.longestStreak;

      if (lastPlayed !== today) {
        // Check if it's consecutive
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastPlayed === yesterday.toDateString()) {
          newStreak = prev.longestStreak + 1;
        } else if (lastPlayed !== today) {
          newStreak = 1;
        }
      }

      return {
        ...prev,
        longestStreak: newStreak,
        lastPlayedDate: today,
      };
    });
  }, []);

  const incrementPokerFace = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      pokerFaceLevel: prev.pokerFaceLevel + 1,
    }));
  }, []);

  const recordGamePlayed = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
    }));
  }, []);

  const resetStats = useCallback(() => {
    setStats(defaultStats);
    localStorage.removeItem(STATS_STORAGE_KEY);
  }, []);

  return {
    stats,
    isLoading,
    updateStats,
    addWin,
    updateStreak,
    incrementPokerFace,
    recordGamePlayed,
    resetStats,
  };
}

export default useUserStats;
