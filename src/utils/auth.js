/**
 * Authentication utilities for LocalStorage-based user management
 * Part of the Smirkle User Profile System
 */

// Storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'smirkle_currentUser',
  USERS_DB: 'smirkle_users_db'
};

/**
 * Generate a unique user ID
 */
export function generateUserId() {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

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
export function saveUsersToStorage(users) {
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
}

/**
 * Find a user by email
 */
export function findUserByEmail(email) {
  const users = getUsersFromStorage();
  return users.find(u => u.email === email.toLowerCase());
}

/**
 * Find a user by username
 */
export function findUserByUsername(username) {
  const users = getUsersFromStorage();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

/**
 * Authenticate user with email and password
 * Returns user profile without password if successful, null otherwise
 */
export function authenticateUser(email, password) {
  const users = getUsersFromStorage();
  const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
  
  if (user) {
    // Update last login timestamp
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.lastLogin = new Date().toISOString();
    
    // Update in storage
    const updatedUsers = users.map(u => 
      u.email === email.toLowerCase() ? { ...u, lastLogin: userWithoutPassword.lastLogin } : u
    );
    saveUsersToStorage(updatedUsers);
    
    // Set as current user
    setCurrentUser(userWithoutPassword);
    
    return userWithoutPassword;
  }
  
  return null;
}

/**
 * Register a new user
 */
export function registerUser(userData) {
  const { username, email, password, bio = '', motto = '' } = userData;
  
  // Validate required fields
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Check if username already exists
  if (findUserByUsername(username)) {
    throw new Error('Username already taken');
  }
  
  // Check if email already exists
  if (findUserByEmail(email)) {
    throw new Error('Email already registered');
  }
  
  // Create new user profile
  const newUser = {
    id: generateUserId(),
    username,
    email: email.toLowerCase(),
    bio,
    motto,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    stats: {
      totalGames: 0,
      totalSmirksDetected: 0,
      totalSmilesDetected: 0,
      bestSurvivalTime: 0,
      averageSurvivalTime: 0,
      achievements: []
    }
  };
  
  // Store with password (in production, use proper hashing)
  const users = getUsersFromStorage();
  users.push({ ...newUser, password });
  saveUsersToStorage(users);
  
  // Auto-login
  const { password: _, ...userWithoutPassword } = newUser;
  setCurrentUser(userWithoutPassword);
  
  return userWithoutPassword;
}

/**
 * Set current logged-in user
 */
export function setCurrentUser(user) {
  // Remove sensitive data before storing
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
 * Logout current user
 */
export function logoutUser() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * Update current user profile
 */
export function updateUserProfile(updates) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('No user logged in');
  }
  
  const users = getUsersFromStorage();
  const userIndex = users.findIndex(u => u.id === currentUser.id);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Update user data
  const updatedUser = {
    ...users[userIndex],
    ...updates,
    id: currentUser.id, // Prevent ID changes
    email: currentUser.email // Prevent email changes
  };
  
  // Remove password if present in updates
  delete updatedUser.password;
  
  users[userIndex] = { ...users[userIndex], ...updatedUser };
  saveUsersToStorage(users);
  
  // Update current user session
  setCurrentUser(updatedUser);
  
  return updatedUser;
}

/**
 * Check username availability
 */
export function isUsernameAvailable(username) {
  return !findUserByUsername(username);
}

/**
 * Check email availability
 */
export function isEmailAvailable(email) {
  return !findUserByEmail(email);
}
