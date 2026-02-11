/**
 * Application constants
 * Shared constants across the Smirkle application
 */

// ===========================
// API Configuration
// ===========================
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// ===========================
// Face Detection Settings
// ===========================
/**
 * Happiness/smile detection threshold
 * Value between 0 and 1 - higher values require a more obvious smile
 * Used for smirk detection (happiness >= 0.3 = smirk)
 */
export const SMILE_THRESHOLD = 0.3;

/**
 * Consecutive frames required before triggering game over
 * Prevents false positives from single-frame detections
 */
export const CONSECUTIVE_FRAMES_REQUIRED = 3;

/**
 * Frame capture interval in milliseconds
 * Lower = more responsive but higher bandwidth
 */
export const FRAME_CAPTURE_INTERVAL = 100;

/**
 * Face detection options (kept for reference, not used with backend)
 */
export const FACE_DETECTION_OPTIONS = {
  inputSize: 320,
  scoreThreshold: 0.5
};

// ===========================
// Calibration Settings
// ===========================
export const CALIBRATION_STABILITY_DURATION = 3000; // 3 seconds stable detection
export const CALIBRATION_DETECTION_INTERVAL = 100; // Check every 100ms
export const NEUTRAL_EXPRESSION_THRESHOLD = 0.15; // Happiness below 15% considered neutral

// ===========================
// Punchline Detection
// ===========================
export const PUNCHLINE_THRESHOLD_REDUCTION = 0.2; // 20% reduction during punchline
export const PUNCHLINE_WINDOW_DURATION = 3000; // 3 seconds window

// ===========================
// Detection Optimization
// ===========================
export const DETECTION_FRAME_SKIP = 2; // Skip N frames between detections
export const DETECTION_MIN_INTERVAL = 100; // Minimum ms between detections
export const SMIRK_CONFIDENCE_THRESHOLD = 0.85; // Higher threshold for confidence

// ===========================
// Low-Light Detection
// ===========================
export const LOW_LIGHT_THRESHOLD = 40; // Average pixel value below this triggers warning
export const BRIGHTNESS_CHECK_INTERVAL = 500; // Check brightness every 500ms

// ===========================
// Storage Keys
// ===========================
export const STORAGE_KEYS = {
  USERS: 'smirkle_users',
  CURRENT_USER: 'smirkle_currentUser',
  USER_DATA: 'smirkle_user_data'
};

// ===========================
// Model URL (Deprecated - now using backend)
// ===========================
/**
 * @deprecated Face API model URL - no longer used with backend API
 * Kept for reference during migration
 */
export const MODEL_URL = '/models';

// ===========================
// Game Settings
// ===========================
export const GAME_SETTINGS = {
  maxSessionDuration: 300000, // 5 minutes max per session
  minBreakTime: 5000, // 5 seconds break between games
  maxRetries: 3 // Max connection retries
};
