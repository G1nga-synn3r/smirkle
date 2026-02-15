/**
 * TypeScript Declarations for constants module
 *
 * Type declarations for the Smirkle application constants.
 */

// ===========================
// API Configuration
// ===========================
export const API_URL: string;
export const WS_URL: string;

// ===========================
// Face Detection Settings (Legacy - Backend API)
// ===========================
/**
 * @deprecated Use SMIRK_ENTER_THRESHOLD and SMIRK_EXIT_THRESHOLD instead
 */
export const SMILE_THRESHOLD: number;
export const CONSECUTIVE_FRAMES_REQUIRED: number;
export const SMILE_FAIL_THRESHOLD: number;
export const SMILE_WARNING_DURATION: number;
export const WARNING_ENTRY_FRAMES: number;
export const FRAME_CAPTURE_INTERVAL: number;
export const FACE_DETECTION_OPTIONS: {
  inputSize: number;
  scoreThreshold: number;
};

// ===========================
// Calibration Settings
// ===========================
export const CALIBRATION_STABILITY_DURATION: number;
export const CALIBRATION_CHECK_INTERVAL: number;
export const NEUTRAL_EXPRESSION_THRESHOLD: number;
export const CALIBRATION_COMPLETE_TRANSITION: {
  FULLSCREEN_DELAY: number;
  PIP_SHOW_DELAY: number;
  UI_HIDE_DELAY: number;
  TIMER_START_DELAY: number;
};

// ===========================
// Model Preload Settings
// ===========================
export const MODEL_PRELOAD: {
  TIMEOUT: number;
  RETRY_COUNT: number;
  PROGRESS_UPDATE_INTERVAL: number;
  REQUIRED_MODELS: string[];
};

// ===========================
// Webcam Settings
// ===========================
export const WEBCAM_CONFIG: {
  FAIL_FAST: boolean;
  SHOW_PERMISSION_DENIED_UI: boolean;
  IDEAL_WIDTH: number;
  IDEAL_HEIGHT: number;
  FACING_MODE: string;
};

// ===========================
// Punchline Detection
// ===========================
export const PUNCHLINE_THRESHOLD_REDUCTION: number;
export const PUNCHLINE_WINDOW_DURATION: number;

// ===========================
// Detection Optimization (Legacy)
// ===========================
export const DETECTION_FRAME_SKIP: number;
export const DETECTION_MIN_INTERVAL: number;
export const SMIRK_CONFIDENCE_THRESHOLD: number;

// ===========================
// Low-Light Detection
// ===========================
export const LOW_LIGHT_THRESHOLD: number;
export const BRIGHTNESS_CHECK_INTERVAL: number;

// ===========================
// Storage Keys
// ===========================
export const STORAGE_KEYS: {
  USERS: string;
  CURRENT_USER: string;
  USER_DATA: string;
};

// ===========================
// Model URL (Deprecated)
// ===========================
/**
 * @deprecated Face API model URL - no longer used with MediaPipe
 */
export const MODEL_URL: string;

// ===========================
// Game Settings
// ===========================
export const GAME_SETTINGS: {
  maxSessionDuration: number;
  minBreakTime: number;
  maxRetries: number;
};

// ===========================
// Picture-in-Picture (PiP) Configuration
// ===========================
export const PIP_CONFIG: {
  POSITION: string;
  WIDTH: string;
  HEIGHT: string;
  Z_INDEX: number;
  MARGIN: string;
  BORDER: string;
  BORDER_RADIUS: string;
  SHADOW: string;
};

// ===========================
// MediaPipe Client-Side Settings
// ===========================
/**
 * @deprecated Use SMIRK_ENTER_THRESHOLD and SMIRK_EXIT_THRESHOLD for hysteresis
 */
export const SMIRK_THRESHOLD_MEDIAPIPE: number;
export const SMIRK_ENTER_THRESHOLD: number;
export const SMIRK_EXIT_THRESHOLD: number;
export const SMIRK_RESET_GRACE_FRAMES: number;
export const NEUTRAL_EXPRESSION_THRESHOLD_MEDIAPIPE: number;
export const EYE_OPENNESS_THRESHOLD_MEDIAPIPE: number;
export const FACE_CONFIDENCE_THRESHOLD_MEDIAPIPE: number;
export const FACE_CENTERED_TOLERANCE_MEDIAPIPE: number;
export const WARNING_ZONE_FRAMES_MEDIAPIPE: number;

// ===========================
// Performance Settings (MediaPipe)
// ===========================
export const MEDIAPIPE_TARGET_FPS: number;
export const MEDIAPIPE_FRAME_SKIP: number;
export const MEDIAPIPE_MIN_INTERVAL: number;
export const MEDIAPIPE_USE_WEB_WORKER: boolean;
export const MEDIAPIPE_USE_GPU: boolean;
export const MEDIAPIPE_WASM_CDN: string;
export const MEDIAPIPE_FACE_MODEL_URL: string;

// ===========================
// Dynamic Resolution Settings
// ===========================
export const DYNAMIC_RESOLUTION: {
  HIGH_QUALITY_FPS: number;
  MEDIUM_QUALITY_FPS: number;
  MIN_ACCEPTABLE_FPS: number;
  HIGH_QUALITY_SCALE: number;
  MEDIUM_QUALITY_SCALE: number;
  LOW_QUALITY_SCALE: number;
  HIGH_QUALITY_TARGET_FPS: number;
  MEDIUM_QUALITY_TARGET_FPS: number;
  LOW_QUALITY_TARGET_FPS: number;
};

// ===========================
// Face Detection Debounce Settings
// ===========================
export const FACE_DETECTED_DEBOUNCE_FRAMES: number;
export const FACE_LOST_DEBOUNCE_FRAMES: number;
export const EYES_CLOSED_DEBOUNCE_FRAMES: number;
export const CALIBRATION_GRACE_FRAMES: number;
export const HAPPINESS_SMOOTHING_FACTOR: number;
export const FACE_LOSS_TIMEOUT_FRAMES: number;

// ===========================
// MediaPipe Worker Initialization
// ===========================
export const MEDIAPIPE_INIT_MAX_RETRIES: number;
export const MEDIAPIPE_UI_UPDATE_DELAY_MS: number;

// ===========================
// MediaPipe Face Landmarker Configuration
// ===========================
export const MEDIAPIPE_FACE_LANDMARKER_MODEL_SHORT_RANGE: number;
export const MEDIAPIPE_FACE_LANDMARKER_MODEL_FULL_RANGE: number;
export const MEDIAPIPE_NUM_FACES: number;

// ===========================
// Default Detection Values
// ===========================
export const DEFAULT_EYE_OPENNESS: number;
export const DEFAULT_FACE_CONFIDENCE: number;
export const DEFAULT_NO_FACE_CONFIDENCE: number;

// ===========================
// Blendshape Weights for Happiness Score
// ===========================
export const BLENDSHAPE_WEIGHT_MOUTH_HAPPY: number;
export const BLENDSHAPE_WEIGHT_MOUTH_SMILE: number;
export const BLENDSHAPE_WEIGHT_MOUTH_OPEN: number;

// ===========================
// MediaPipe Iris Landmark Indices
// ===========================
export const MIN_IRIS_LANDMARKS_COUNT: number;
export const LEFT_EYE_LANDMARK_START_INDEX: number;
export const LEFT_EYE_LANDMARK_END_INDEX: number;
export const RIGHT_EYE_LANDMARK_START_INDEX: number;
export const RIGHT_EYE_LANDMARK_END_INDEX: number;
export const EYE_HEIGHT_MULTIPLIER: number;

// ===========================
// MediaPipe Facial Landmark Indices (for Head Pose)
// ===========================
export const NOSE_TIP_LANDMARK_INDEX: number;
export const CHIN_LANDMARK_INDEX: number;
export const LEFT_EYE_POSE_LANDMARK_INDEX: number;
export const RIGHT_EYE_POSE_LANDMARK_INDEX: number;
export const HEAD_POSE_SCALE_FACTOR: number;

// ===========================
// Utility Constants
// ===========================
export const MS_PER_SECOND: number;
