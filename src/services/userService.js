/**
 * User Service - Firestore User Profile Operations
 * 
 * Provides functions for managing user profiles in the Firestore 'users' collection.
 * Uses the db instance from ./firebaseConfig.js
 */

import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebaseConfig.js';

// Collection reference
const USERS_COLLECTION = 'users';

// Default stats for new users
const DEFAULT_USER_STATS = {
  lifetime_score: 0,
  total_games: 0,
  total_smirks_detected: 0,
  total_smiles_detected: 0,
  best_survival_time: 0,
  average_survival_time: 0,
  longest_streak: 0,
  poker_face_level: 1,
  experience: 0,
  games_played: 0,
  last_played_date: null
};

/**
 * Create or update a user profile in Firestore
 * Uses setDoc with merge to avoid race conditions between read and write
 * 
 * @param {string} userId - The unique user identifier
 * @param {Object} profileData - Profile data to save
 * @param {string} profileData.username - Display name
 * @param {string} profileData.motto - Personal mantra/tagline
 * @param {string} profileData.profile_picture_url - URL to profile image
 * @param {string} [profileData.bio] - User biography (optional)
 * @param {string} [profileData.email] - User email (optional)
 * @returns {Promise<void>}
 */
export async function createOrUpdateUser(userId, profileData) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const now = new Date().toISOString();
  
  const dataToSave = {
    username: profileData.username,
    motto: profileData.motto || '',
    profile_picture_url: profileData.profile_picture_url || '',
    bio: profileData.bio || '',
    birthdate: profileData.birthdate || '',
    updated_at: now
  };
  
  // Check if document exists using getDoc (lightweight compared to exists())
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    // Creating new user - add creation timestamp and defaults
    await setDoc(userRef, {
      ...dataToSave,
      created_at: now,
      stats: DEFAULT_USER_STATS,
      friend_list: []
    });
  } else {
    // Updating existing user - merge updates
    await setDoc(userRef, dataToSave, { merge: true });
  }
}

/**
 * Toggle a friend in the user's friend_list
 * Adds the friend if not present, removes if already in list
 * 
 * @param {string} userId - The current user's ID
 * @param {string} friendId - The friend user's ID to toggle
 * @returns {Promise<void>}
 */
export async function toggleFriend(userId, friendId) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const friendList = userData.friend_list || [];
  
  if (friendList.includes(friendId)) {
    // Remove friend
    await updateDoc(userRef, {
      friend_list: arrayRemove(friendId)
    });
  } else {
    // Add friend
    await updateDoc(userRef, {
      friend_list: arrayUnion(friendId)
    });
  }
}

/**
 * Fetch a user's profile by their ID
 * 
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object|null>} User profile data or null if not found
 * @returns {string} returns.id - The user ID
 * @returns {string} returns.username - Display name
 * @returns {string} returns.motto - Personal mantra
 * @returns {string} returns.profile_picture_url - Profile image URL
 * @returns {string} returns.bio - User biography
 * @returns {Array} returns.friend_list - Array of friend IDs
 * @returns {Object} returns.stats - User statistics
 * @returns {string} returns.created_at - Creation timestamp
 */
export async function getUserProfile(userId) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  }
  
  return null;
}

/**
 * Get multiple user profiles by IDs
 * Useful for fetching friend details or leaderboard profiles
 * 
 * @param {string[]} userIds - Array of user IDs to fetch
 * @returns {Promise<Map<string, Object>>} Map of userId -> profile data
 */
export async function getUserProfiles(userIds) {
  const profiles = new Map();
  
  // Fetch in parallel using Promise.all
  const promises = userIds.map(async (userId) => {
    const profile = await getUserProfile(userId);
    if (profile) {
      profiles.set(userId, profile);
    }
  });
  
  await Promise.all(promises);
  return profiles;
}

/**
 * Check if a user is a friend of another user
 * 
 * @param {string} userId - The current user's ID
 * @param {string} targetUserId - The target user's ID to check
 * @returns {Promise<boolean>} True if target is a friend
 */
export async function isFriend(userId, targetUserId) {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return false;
  }
  
  const friendList = userDoc.data().friend_list || [];
  return friendList.includes(targetUserId);
}

/**
 * Get user's friend list with full profile data
 * 
 * @param {string} userId - The user's ID
 * @returns {Promise<Object[]>} Array of friend profile objects
 */
export async function getFriendsWithProfiles(userId) {
  const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
  
  if (!userDoc.exists()) {
    return [];
  }
  
  const friendIds = userDoc.data().friend_list || [];
  
  if (friendIds.length === 0) {
    return [];
  }
  
  const profiles = await getUserProfiles(friendIds);
  return Array.from(profiles.values());
}

/**
 * Search for users by username or name (partial match)
 * Case-insensitive search that queries the Firestore 'users' collection
 * 
 * @param {string} searchQuery - The search term (username, name, or part of either)
 * @param {string} [currentUserId] - Optional: exclude current user from results
 * @returns {Promise<Object[]>} Array of user profiles matching the search
 */
export async function searchUsers(searchQuery, currentUserId = null) {
  if (!searchQuery || searchQuery.trim().length === 0) {
    return [];
  }

  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const usersSnapshot = await getDocs(usersRef);
    
    const searchLower = searchQuery.toLowerCase();
    const results = [];

    usersSnapshot.forEach(doc => {
      // Skip the current user if provided
      if (currentUserId && doc.id === currentUserId) {
        return;
      }

      const userData = doc.data();
      const username = (userData.username || '').toLowerCase();
      const displayName = (userData.display_name || '').toLowerCase();
      const bio = (userData.bio || '').toLowerCase();

      // Match against username, display name, or bio
      if (
        username.includes(searchLower) ||
        displayName.includes(searchLower) ||
        bio.includes(searchLower)
      ) {
        results.push({
          id: doc.id,
          username: userData.username,
          display_name: userData.display_name || userData.username,
          profile_picture_url: userData.profile_picture_url || '',
          bio: userData.bio || '',
          stats: userData.stats || {},
          created_at: userData.created_at
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export default {
  createOrUpdateUser,
  toggleFriend,
  getUserProfile,
  getUserProfiles,
  isFriend,
  getFriendsWithProfiles,
  searchUsers
};
