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
// Face Detection Settings (Legacy - Backend API)
// ===========================
/**
 * Happiness/smile detection threshold (legacy)
 * @deprecated Use SMIRK_THRESHOLD_MEDIAPIPE instead
 */
export const SMILE_THRESHOLD = 0.3;

/**
 * Consecutive frames required before triggering game over
 */
export const CONSECUTIVE_FRAMES_REQUIRED = 3;

/**
 * Happiness threshold for smile fail detection
 * Values >= 0.30 trigger the fail phase after warning duration
 */
export const SMILE_FAIL_THRESHOLD = 0.3;

/**
 * Duration of warning phase before fail triggers
 * 400ms provides balance between responsiveness and fairness
 */
export const SMILE_WARNING_DURATION = 400; // milliseconds

/**
 * Minimum consecutive frames required in warning zone before timer starts
 * Prevents flickering from momentary expressions
 */
export const WARNING_ENTRY_FRAMES = 2;

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
  scoreThreshold: 0.5,
};

// ===========================
// Calibration Settings
// ===========================
/**
 * Time required for stable calibration (face + eyes + neutral expression)
 * 1 second = 1000ms for quick calibration experience
 */
export const CALIBRATION_STABILITY_DURATION = 1000;

/**
 * Check interval for calibration conditions
 * 50ms provides smooth progress updates without performance impact
 */
export const CALIBRATION_CHECK_INTERVAL = 50;

/**
 * Happiness threshold for neutral expression
 * Values below this are considered "not smiling" for calibration
 */
export const NEUTRAL_EXPRESSION_THRESHOLD = 0.15;

// ===========================
// Calibration Complete Transition
// ===========================
export const CALIBRATION_COMPLETE_TRANSITION = {
  FULLSCREEN_DELAY: 100, // ms delay before requesting fullscreen
  PIP_SHOW_DELAY: 200, // ms delay before showing PiP camera
  UI_HIDE_DELAY: 300, // ms delay before hiding calibration UI
  TIMER_START_DELAY: 0, // Immediate timer start
};

// ===========================
// Model Preload Settings
// ===========================
export const MODEL_PRELOAD = {
  TIMEOUT: 10000, // 10 seconds max for model load
  RETRY_COUNT: 0, // No retries - fail fast
  PROGRESS_UPDATE_INTERVAL: 100,
  REQUIRED_MODELS: ['face_expression_model', 'face_landmark_68_model', 'tiny_face_detector_model'],
};

// ===========================
// Webcam Settings
// ===========================
export const WEBCAM_CONFIG = {
  FAIL_FAST: true, // Fail on first permission denial
  SHOW_PERMISSION_DENIED_UI: true,
  IDEAL_WIDTH: 640,
  IDEAL_HEIGHT: 480,
  FACING_MODE: 'user',
};

// ===========================
// Punchline Detection
// ===========================
export const PUNCHLINE_THRESHOLD_REDUCTION = 0.2; // 20% reduction during punchline
export const PUNCHLINE_WINDOW_DURATION = 3000; // 3 seconds window

// ===========================
// Detection Optimization (Legacy)
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
  USER_DATA: 'smirkle_user_data',
};

// ===========================
// Model URL (Deprecated - now using MediaPipe)
// ===========================
/**
 * @deprecated Face API model URL - no longer used with MediaPipe
 */
export const MODEL_URL = '/models';

// ===========================
// Game Settings
// ===========================
export const GAME_SETTINGS = {
  maxSessionDuration: 300000, // 5 minutes max per session
  minBreakTime: 5000, // 5 seconds break between games
  maxRetries: 3, // Max connection retries
};

// ===========================
// Picture-in-Picture (PiP) Configuration
// ===========================
export const PIP_CONFIG = {
  POSITION: 'top-right',
  WIDTH: '160px',
  HEIGHT: '120px',
  Z_INDEX: 9999,
  MARGIN: '16px',
  BORDER: '2px solid rgba(139, 92, 246, 0.5)',
  BORDER_RADIUS: '8px',
  SHADOW: '0 0 20px rgba(139, 92, 246, 0.4)',
};

// ===========================
// MediaPipe Client-Side Settings
// ===========================

/**
 * Happiness/smile detection threshold for smirk detection
 * Value between 0 and 1
 * Derived from mouthHappy + mouthSmile blendshapes
 * @deprecated Use SMIRK_ENTER_THRESHOLD and SMIRK_EXIT_THRESHOLD for hysteresis
 */
export const SMIRK_THRESHOLD_MEDIAPIPE = 0.3;

/**
 * Threshold to enter smirking state
 * When happiness score >= this value, user is considered smirking
 */
export const SMIRK_ENTER_THRESHOLD = 0.30;

/**
 * Threshold to exit smirking state (lower = more stable)
 * When currently smirking and happiness score < this value, user exits smirking state
 * Lower than ENTER threshold to prevent flickering on borderline expressions
 */
export const SMIRK_EXIT_THRESHOLD = 0.20;

/**
 * Grace frames before resetting smirk counter
 * Number of consecutive frames below exit threshold before resetting smirk frame count
 * Prevents "gaming" the system by brief expression changes
 */
export const SMIRK_RESET_GRACE_FRAMES = 2;

/**
 * Neutral expression threshold for MediaPipe
 * Values below this are considered "not smiling" for calibration
 */
export const NEUTRAL_EXPRESSION_THRESHOLD_MEDIAPIPE = 0.15;

/**
 * Eye openness threshold for MediaPipe
 * Values below this are considered "eyes closed"
 */
export const EYE_OPENNESS_THRESHOLD_MEDIAPIPE = 0.5;

/**
 * Face detection confidence threshold for MediaPipe
 * Only process frames with face confidence >= this value
 */
export const FACE_CONFIDENCE_THRESHOLD_MEDIAPIPE = 0.7;

/**
 * Head pose tolerance for "face centered"
 * Yaw: -15 to 15 degrees, Pitch: -15 to 15 degrees
 */
export const FACE_CENTERED_TOLERANCE_MEDIAPIPE = 15;

/**
 * Warning zone frames before smirk detection
 * Provides early warning without triggering game over
 */
export const WARNING_ZONE_FRAMES_MEDIAPIPE = 10;

// ===========================
// Performance Settings (MediaPipe)
// ===========================

/**
 * Target FPS for MediaPipe inference
 * Adjust based on device capabilities
 */
export const MEDIAPIPE_TARGET_FPS = 30;

/**
 * Frame skip for performance optimization
 * Process every Nth frame
 */
export const MEDIAPIPE_FRAME_SKIP = 1;

/**
 * Minimum interval between detections (ms)
 * For performance throttling on low-end devices
 */
export const MEDIAPIPE_MIN_INTERVAL = 33;

/**
 * Web worker enabled
 * Offload MediaPipe to worker thread
 */
export const MEDIAPIPE_USE_WEB_WORKER = true;

/**
 * GPU acceleration enabled by default
 */
export const MEDIAPIPE_USE_GPU = true;

/**
 * CDN URL for MediaPipe WASM files
 */
export const MEDIAPIPE_WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

/**
 * CDN URL for MediaPipe face landmarker model
 */
export const MEDIAPIPE_FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// ===========================
// Dynamic Resolution Settings
// ===========================

export const DYNAMIC_RESOLUTION = {
  HIGH_QUALITY_FPS: 45,
  MEDIUM_QUALITY_FPS: 30,
  MIN_ACCEPTABLE_FPS: 20,
  HIGH_QUALITY_SCALE: 1.0,
  MEDIUM_QUALITY_SCALE: 0.75,
  LOW_QUALITY_SCALE: 0.5,
  HIGH_QUALITY_TARGET_FPS: 30,
  MEDIUM_QUALITY_TARGET_FPS: 25,
  LOW_QUALITY_TARGET_FPS: 15,
};

// ===========================
// Face Detection Debounce Settings
// ===========================

/**
 * Number of consecutive frames required to confirm face detection
 * Prevents flicker from momentary detection drops
 */
export const FACE_DETECTED_DEBOUNCE_FRAMES = 3;

/**
 * Number of consecutive frames required to confirm face loss
 * Higher threshold prevents false "face not detected" from brief occlusions
 */
export const FACE_LOST_DEBOUNCE_FRAMES = 10;

/**
 * Number of consecutive frames required to confirm eyes closed
 * Prevents false positives from blinking
 */
export const EYES_CLOSED_DEBOUNCE_FRAMES = 5;

/**
 * Grace frames allowed during calibration before resetting progress
 * Prevents calibration reset from single-frame detection failures
 */
export const CALIBRATION_GRACE_FRAMES = 3;

/**
 * Smoothing factor for happiness score (0-1)
 * Higher = more responsive, Lower = more smooth
 * 0.3 provides good balance between responsiveness and stability
 */
export const HAPPINESS_SMOOTHING_FACTOR = 0.3;

/**
 * Maximum frames allowed without face detection before game over
 * At 30fps, 90 frames = 3 seconds of face loss before game ends
 * This prevents players from avoiding detection by covering camera
 */
export const FACE_LOSS_TIMEOUT_FRAMES = 90;

// ===========================
// MediaPipe Worker Initialization
// ===========================

/**
 * Maximum retry attempts for MediaPipe initialization
 */
export const MEDIAPIPE_INIT_MAX_RETRIES = 1;

/**
 * Delay before WASM loading to allow UI update (in milliseconds)
 */
export const MEDIAPIPE_UI_UPDATE_DELAY_MS = 100;

// ===========================
// MediaPipe Face Landmarker Configuration
// ===========================

/**
 * Face landmarker model selection
 * 0 = short-range (optimized for faces within 2 meters)
 * 1 = full-range (for faces further away)
 */
export const MEDIAPIPE_FACE_LANDMARKER_MODEL_SHORT_RANGE = 0;
export const MEDIAPIPE_FACE_LANDMARKER_MODEL_FULL_RANGE = 1;

/**
 * Number of faces to detect simultaneously
 */
export const MEDIAPIPE_NUM_FACES = 1;

// ===========================
// Default Detection Values
// ===========================

/**
 * Default eye openness when detection unavailable
 * 1 = fully open (prevents false "eyes closed" detection)
 */
export const DEFAULT_EYE_OPENNESS = 1;

/**
 * Default face confidence when face is detected
 * High confidence assumed when landmarks are present
 */
export const DEFAULT_FACE_CONFIDENCE = 0.95;

/**
 * Default confidence when no face detected
 */
export const DEFAULT_NO_FACE_CONFIDENCE = 0;

// ===========================
// Blendshape Weights for Happiness Score
// ===========================

/**
 * Weight for mouthHappy blendshape in happiness calculation
 * Primary contributor to smirk detection
 */
export const BLENDSHAPE_WEIGHT_MOUTH_HAPPY = 0.7;

/**
 * Weight for mouthSmile blendshape in happiness calculation
 * Secondary contributor for subtle smiles
 */
export const BLENDSHAPE_WEIGHT_MOUTH_SMILE = 0.25;

/**
 * Weight for mouthOpen blendshape in happiness calculation
 * Minor contributor for laughing expressions
 */
export const BLENDSHAPE_WEIGHT_MOUTH_OPEN = 0.05;

// ===========================
// MediaPipe Iris Landmark Indices
// ===========================

/**
 * Minimum iris landmarks required for eye openness calculation
 */
export const MIN_IRIS_LANDMARKS_COUNT = 10;

/**
 * Iris landmark indices for eye openness
 * Left eye: indices 0-5, Right eye: indices 6-11
 */
export const LEFT_EYE_LANDMARK_START_INDEX = 0;
export const LEFT_EYE_LANDMARK_END_INDEX = 6;
export const RIGHT_EYE_LANDMARK_START_INDEX = 6;  // Same as LEFT_EYE_LANDMARK_END_INDEX
export const RIGHT_EYE_LANDMARK_END_INDEX = 12;

/**
 * Multiplier for eye height to normalize openness
 */
export const EYE_HEIGHT_MULTIPLIER = 2;

// ===========================
// MediaPipe Facial Landmark Indices (for Head Pose)
// ===========================

/**
 * Key facial landmark indices for head pose estimation
 * Based on MediaPipe's 468-point face mesh
 */
export const NOSE_TIP_LANDMARK_INDEX = 1;
export const CHIN_LANDMARK_INDEX = 152;
export const LEFT_EYE_POSE_LANDMARK_INDEX = 33;
export const RIGHT_EYE_POSE_LANDMARK_INDEX = 263;

/**
 * Scaling factor for head pose calculations
 * Converts normalized coordinates to approximate degrees
 */
export const HEAD_POSE_SCALE_FACTOR = 50;

// ===========================
// Utility Constants
// ===========================

/**
 * Milliseconds per second (for FPS calculations)
 */
export const MS_PER_SECOND = 1000;
