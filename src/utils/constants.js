 /**
 * Application constants
 * Shared constants across the Smirkle application
 */

/**
 * Face API model URL
 * Points to /models directory in public folder
 * Works on both localhost:5173 and smirkle.vercel.app
 */
export const MODEL_URL = '/models';

/**
 * Happiness/smile detection threshold
 * Value between 0 and 1 - higher values require a more obvious smile
 */
export const SMILE_THRESHOLD = 0.3;

/**
 * Face detection options
 */
export const FACE_DETECTION_OPTIONS = {
  inputSize: 320,
  scoreThreshold: 0.5
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  USERS: 'smirkle_users',
  CURRENT_USER: 'smirkle_currentUser',
  USER_DATA: 'smirkle_user_data'
};
