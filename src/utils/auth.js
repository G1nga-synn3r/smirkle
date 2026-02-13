/**
 * Authentication utilities with Firestore network storage
 * Part of the Smirkle User Profile System
 *
 * Features:
 * - Network-first registration with syncing state
 * - Firestore user profile storage
 * - LocalStorage fallback for offline mode
 * - Unique Player ID generation
 */

import { hashPassword, verifyPassword, hashPasswordSync } from './passwordHash';
import { db, isFirebaseInitialized } from '../services/firebaseConfig';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';

// Storage keys for offline fallback
const STORAGE_KEYS = {
  CURRENT_USER: 'smirkle_currentUser',
  USERS_DB: 'smirkle_users_db',
  SYNC_QUEUE: 'smirkle_sync_queue',
};

// Collection references
const USERS_COLLECTION = 'users';

/**
 * Generate a unique user ID (Player ID)
 * Used as the primary identifier for Firestore documents
 */
export function generateUserId() {
  return 'player_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Check if Firestore is available
 */
function isNetworkAvailable() {
  return isFirebaseInitialized() && db !== null;
}

// ============================================
// FIRESTORE NETWORK OPERATIONS
// ============================================

/**
 * Save user profile to Firestore network
 * @param {string} playerId - Unique player identifier
 * @param {Object} profileData - User profile data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function saveUserToFirestore(playerId, profileData) {
  if (!isNetworkAvailable()) {
    return { success: false, error: 'Network not available' };
  }

  try {
    const userDocRef = doc(db, USERS_COLLECTION, playerId);
    const now = new Date().toISOString();

    const profilePayload = {
      playerId,
      username: profileData.username,
      email: profileData.email.toLowerCase(),
      birthdate: profileData.birthdate,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      bio: profileData.bio || '',
      motto: profileData.motto || '',
      isNetworkSynced: true,
      syncStatus: 'synced',
    };

    await setDoc(userDocRef, profilePayload);
    return { success: true };
  } catch (error) {
    console.error('[Auth] Firestore save error:', error);
    return { success: false, error: error.message || 'Firestore save failed' };
  }
}

/**
 * Check if username exists in Firestore
 */
async function checkUsernameExistsFirestore(username) {
  if (!isNetworkAvailable()) return false;

  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('username', '==', username.toLowerCase())
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('[Auth] Username check error:', error);
    return false;
  }
}

/**
 * Check if email exists in Firestore
 */
async function checkEmailExistsFirestore(email) {
  if (!isNetworkAvailable()) return false;

  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('[Auth] Email check error:', error);
    return false;
  }
}

// ============================================
// LOCALSTORAGE FALLBACK OPERATIONS
// ============================================

/**
 * Get all registered users from LocalStorage
 */
export function getUsersFromStorage() {
  const data = localStorage.getItem(STORAGE_KEYS.USERS_DB);
  return data ? JSON.parse(data) : [];
}

/**
 * Save users array to LocalStorage
 */
function saveUsersToStorage(users) {
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
}

/**
 * Find a user by email in LocalStorage
 */
function findUserByEmailStorage(email) {
  const users = getUsersFromStorage();
  return users.find((u) => u.email === email.toLowerCase());
}

/**
 * Find a user by username in LocalStorage
 */
function findUserByUsernameStorage(username) {
  const users = getUsersFromStorage();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

/**
 * Add user to LocalStorage (fallback mode)
 */
function addUserToStorage(userWithPassword) {
  const users = getUsersFromStorage();
  users.push(userWithPassword);
  saveUsersToStorage(users);
}

/**
 * Queue data for sync when network becomes available
 */
function queueForSync(item) {
  const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE) || '[]');
  queue.push({ ...item, timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
}

// ============================================
// REGISTRATION WITH NETWORK SYNC
// ============================================

// Export registration status for UI feedback
export const RegistrationStatus = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  CHECKING_AVAILABILITY: 'checking_availability',
  SYNCING: 'syncing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  OFFLINE_FALLBACK: 'offline_fallback',
};

// Registration state subscriber
let registrationStateCallback = null;
export function onRegistrationStateChange(callback) {
  registrationStateCallback = callback;
}

function setRegistrationState(state, progress = 0, error = null) {
  if (registrationStateCallback) {
    registrationStateCallback({ state, progress, error });
  }
}

/**
 * Register a new user with network-first approach
 *
 * Flow:
 * 1. Validate inputs locally
 * 2. Check username/email availability (network if available)
 * 3. Generate unique Player ID
 * 4. Save to Firestore network (with syncing state)
 * 5. Fall back to LocalStorage if network fails
 * 6. Return user profile only after network confirms (or fallback)
 *
 * @param {Object} userData - Registration data
 * @param {string} userData.username - Display name
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password
 * @param {string} userData.birthdate - Birthdate (YYYY-MM-DD)
 * @param {string} [userData.bio] - Biography (optional)
 * @param {string} [userData.motto] - Personal motto (optional)
 * @returns {Promise<{success: boolean, user?: Object, error?: string, offline?: boolean}>}
 */
export async function registerUser(userData) {
  const { username, email, password, birthdate, bio = '', motto = '' } = userData;

  // Validate required fields
  if (!username || !email || !password) {
    return { success: false, error: 'Username, email, and password are required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Invalid email format' };
  }

  // Update UI state
  setRegistrationState(RegistrationStatus.VALIDATING, 10);

  // Check availability (prefer network, fallback to storage)
  const networkAvailable = isNetworkAvailable();

  setRegistrationState(RegistrationStatus.CHECKING_AVAILABILITY, 25);

  let usernameExists = false;
  let emailExists = false;

  if (networkAvailable) {
    // Check Firestore
    usernameExists = await checkUsernameExistsFirestore(username);
    emailExists = await checkEmailExistsFirestore(email);
  } else {
    // Check LocalStorage
    usernameExists = !!findUserByUsernameStorage(username);
    emailExists = !!findUserByEmailStorage(email);
  }

  if (usernameExists) {
    return { success: false, error: 'Username already taken' };
  }

  if (emailExists) {
    return { success: false, error: 'Email already registered' };
  }

  // Generate unique Player ID
  const playerId = generateUserId();

  // Hash the password for secure storage
  const hashedPassword = await hashPassword(password);

  // Create user profile object
  const newUserProfile = {
    playerId,
    username,
    email: email.toLowerCase(),
    birthdate,
    bio,
    motto,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isGuest: false,
    isNetworkSynced: false,
    syncStatus: 'pending',
    stats: {
      totalGames: 0,
      totalSmirksDetected: 0,
      totalSmilesDetected: 0,
      bestSurvivalTime: 0,
      averageSurvivalTime: 0,
      achievements: [],
    },
  };

  // Attempt network save first
  if (networkAvailable) {
    setRegistrationState(RegistrationStatus.SYNCING, 50, 'Saving profile to network...');

    const firestoreResult = await saveUserToFirestore(playerId, {
      username,
      email,
      birthdate,
      bio,
      motto,
    });

    if (firestoreResult.success) {
      // Network save successful
      newUserProfile.isNetworkSynced = true;
      newUserProfile.syncStatus = 'synced';

      // Also save to LocalStorage for offline access
      addUserToStorage({ ...newUserProfile, password: hashedPassword });

      setRegistrationState(RegistrationStatus.COMPLETE, 100, 'Profile saved successfully!');

      // Set as current user
      setCurrentUser(newUserProfile);

      return {
        success: true,
        user: newUserProfile,
        offline: false,
      };
    } else {
      // Network failed, fall back to LocalStorage
      console.warn(
        '[Auth] Firestore save failed, falling back to LocalStorage:',
        firestoreResult.error
      );
      setRegistrationState(
        RegistrationStatus.OFFLINE_FALLBACK,
        75,
        'Network unavailable, saving locally...'
      );

      // Save to LocalStorage
      addUserToStorage({ ...newUserProfile, password: hashedPassword });

      // Queue for later sync
      queueForSync({ type: 'register', playerId, data: newUserProfile });

      newUserProfile.isNetworkSynced = false;
      newUserProfile.syncStatus = 'offline_queued';

      setRegistrationState(
        RegistrationStatus.COMPLETE,
        100,
        'Saved offline - will sync when online'
      );

      setCurrentUser(newUserProfile);

      return {
        success: true,
        user: newUserProfile,
        offline: true,
        syncQueued: true,
      };
    }
  } else {
    // Network not available, save to LocalStorage
    setRegistrationState(
      RegistrationStatus.OFFLINE_FALLBACK,
      50,
      'Offline mode - saving locally...'
    );

    addUserToStorage({ ...newUserProfile, password: hashedPassword });

    newUserProfile.isNetworkSynced = false;
    newUserProfile.syncStatus = 'offline';

    setRegistrationState(RegistrationStatus.COMPLETE, 100, 'Saved offline');

    setCurrentUser(newUserProfile);

    return {
      success: true,
      user: newUserProfile,
      offline: true,
    };
  }
}

// ============================================
// AUTHENTICATION & SESSION MANAGEMENT
// ============================================

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email, password) {
  // Try LocalStorage first (works offline)
  const user = findUserByEmailStorage(email);

  if (user) {
    // Check password
    const isHashed = user.password && user.password.length === 64;
    let isValid = false;

    if (isHashed) {
      isValid = await verifyPassword(password, user.password);
    } else {
      isValid = user.password === password;
      if (isValid) {
        const hashedPassword = await hashPassword(password);
        const users = getUsersFromStorage();
        const updatedUsers = users.map((u) =>
          u.email === email.toLowerCase() ? { ...u, password: hashedPassword } : u
        );
        saveUsersToStorage(updatedUsers);
      }
    }

    if (isValid) {
      // Update last login
      const { password: _, ...userWithoutPassword } = user;
      userWithoutPassword.lastLogin = new Date().toISOString();

      // Update in storage
      const users = getUsersFromStorage();
      const updatedUsers = users.map((u) =>
        u.email === email.toLowerCase() ? { ...u, ...userWithoutPassword, password: undefined } : u
      );
      saveUsersToStorage(updatedUsers);

      setCurrentUser(userWithoutPassword);

      return userWithoutPassword;
    }
  }

  return null;
}

/**
 * Set current logged-in user (local session)
 */
export function setCurrentUser(user) {
  const safeUser = { ...user };
  delete safeUser.password;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
}

/**
 * Get current logged-in user
 */
export function getCurrentUser() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Check if current user is a guest
 */
export function isGuest() {
  const user = getCurrentUser();
  return user?.isGuest === true;
}

/**
 * Check if user profile is synced to network
 */
export function isNetworkSynced() {
  const user = getCurrentUser();
  return user?.isNetworkSynced === true;
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
  const user = getCurrentUser();
  return {
    isSynced: user?.isNetworkSynced || false,
    status: user?.syncStatus || 'unknown',
  };
}

/**
 * Logout current user
 */
export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * Update current user profile
 */
export async function updateUserProfile(updates) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'No user logged in' };
  }

  const users = getUsersFromStorage();
  const userIndex = users.findIndex((u) => u.playerId === currentUser.playerId);

  if (userIndex === -1) {
    return { success: false, error: 'User not found' };
  }

  // Update local storage
  const updatedUser = {
    ...users[userIndex],
    ...updates,
    playerId: currentUser.playerId,
    email: currentUser.email,
    updatedAt: new Date().toISOString(),
  };

  delete updatedUser.password;

  users[userIndex] = updatedUser;
  saveUsersToStorage(users);

  // Try network update
  if (isNetworkAvailable() && currentUser.isNetworkSynced) {
    try {
      const userDocRef = doc(db, USERS_COLLECTION, currentUser.playerId);
      await setDoc(
        userDocRef,
        {
          ...updatedUser,
          syncStatus: 'updated',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[Auth] Profile update to Firestore failed:', error);
      queueForSync({ type: 'update', playerId: currentUser.playerId, data: updatedUser });
    }
  }

  setCurrentUser(updatedUser);

  return { success: true, user: updatedUser };
}

/**
 * Check username availability (checks both network and storage)
 */
export async function isUsernameAvailable(username) {
  if (isNetworkAvailable()) {
    return !(await checkUsernameExistsFirestore(username));
  }
  return !findUserByUsernameStorage(username);
}

/**
 * Check email availability (checks both network and storage)
 */
export async function isEmailAvailable(email) {
  if (isNetworkAvailable()) {
    return !(await checkEmailExistsFirestore(email));
  }
  return !findUserByEmailStorage(email);
}
