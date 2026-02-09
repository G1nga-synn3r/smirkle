/**
 * Score Service - Firestore Leaderboard Operations
 * 
 * Provides functions for managing game scores in the Firestore 'scores' collection.
 * Uses the db instance from ./firebaseConfig.js
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig.js';

// Collection reference
const SCORES_COLLECTION = 'scores';

/**
 * Save a new score to Firestore
 * 
 * @param {Object} scoreData - Score data to save
 * @param {string} scoreData.userId - The unique user identifier
 * @param {string} scoreData.username - The user's display name
 * @param {number} scoreData.scoreValue - The calculated score (survival_time * 100)
 * @param {number} scoreData.survivalTime - Survival time in seconds
 * @param {boolean} [scoreData.isGuest=false] - Whether score is from guest session
 * @returns {Promise<string>} The ID of the created score document
 */
export async function saveScore({ userId, username, scoreValue, survivalTime, isGuest = false }) {
  const scoreData = {
    user_id: userId,
    username: username,
    score_value: scoreValue,
    survival_time: survivalTime,
    timestamp: serverTimestamp(),
    date: new Date().toISOString().split('T')[0],
    is_guest: isGuest
  };
  
  const docRef = await addDoc(collection(db, SCORES_COLLECTION), scoreData);
  return docRef.id;
}

/**
 * Get the global leaderboard with top scores
 * 
 * @param {number} [count=10] - Number of top scores to return
 * @returns {Promise<Object[]>} Array of score objects ordered by score_value descending
 */
export async function getGlobalLeaderboard(count = 10) {
  const q = query(
    collection(db, SCORES_COLLECTION),
    orderBy('score_value', 'desc'),
    limit(count)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get scores for a specific user
 * 
 * @param {string} userId - The user ID to fetch scores for
 * @param {number} [count=10] - Maximum number of scores to return
 * @returns {Promise<Object[]>} Array of the user's scores
 */
export async function getUserScores(userId, count = 10) {
  const q = query(
    collection(db, SCORES_COLLECTION),
    where('user_id', '==', userId),
    orderBy('score_value', 'desc'),
    limit(count)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Get a user's best score
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The user's best score or null
 */
export async function getUserBestScore(userId) {
  const q = query(
    collection(db, SCORES_COLLECTION),
    where('user_id', '==', userId),
    orderBy('score_value', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Get a user's rank on the global leaderboard
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<number|null>} The user's rank (1-based) or null if no scores
 */
export async function getUserRank(userId) {
  const bestScore = await getUserBestScore(userId);
  if (!bestScore) return null;
  
  // Count how many scores are higher than this user's best
  const q = query(
    collection(db, SCORES_COLLECTION),
    where('score_value', '>', bestScore.score_value)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size + 1;
}

export default {
  saveScore,
  getGlobalLeaderboard,
  getUserScores,
  getUserBestScore,
  getUserRank
};
