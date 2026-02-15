/**
 * TypeScript Declarations
 *
 * Custom type declarations for the Smirkle application.
 */

// Vite worker import declarations
declare module '*.worker.js' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// Module declaration for dynamic worker imports (matches relative imports from any location)
declare module '*MediaPipeWorker.js' {
  const MediaPipeWorkerConstructor: {
    new (): Worker;
  };
  export default MediaPipeWorkerConstructor;
}

// Allow any .js file in workers directory to be imported
declare module '../workers/*.js' {
  const workerConstructor: {
    new (): Worker;
  };
  export default workerConstructor;
}

// Constants module declaration
declare module '../utils/constants' {
  export const API_URL: string;
  export const WS_URL: string;
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
  export const CALIBRATION_STABILITY_DURATION: number;
  export const CALIBRATION_CHECK_INTERVAL: number;
  export const NEUTRAL_EXPRESSION_THRESHOLD: number;
  export const CALIBRATION_COMPLETE_TRANSITION: {
    FULLSCREEN_DELAY: number;
    PIP_SHOW_DELAY: number;
    UI_HIDE_DELAY: number;
    TIMER_START_DELAY: number;
  };
  export const MODEL_PRELOAD: {
    TIMEOUT: number;
    RETRY_COUNT: number;
    PROGRESS_UPDATE_INTERVAL: number;
    REQUIRED_MODELS: string[];
  };
  export const WEBCAM_CONFIG: {
    FAIL_FAST: boolean;
    SHOW_PERMISSION_DENIED_UI: boolean;
    IDEAL_WIDTH: number;
    IDEAL_HEIGHT: number;
    FACING_MODE: string;
  };
  export const PUNCHLINE_THRESHOLD_REDUCTION: number;
  export const PUNCHLINE_WINDOW_DURATION: number;
  export const DETECTION_FRAME_SKIP: number;
  export const DETECTION_MIN_INTERVAL: number;
  export const SMIRK_CONFIDENCE_THRESHOLD: number;
  export const LOW_LIGHT_THRESHOLD: number;
  export const BRIGHTNESS_CHECK_INTERVAL: number;
  export const STORAGE_KEYS: {
    USERS: string;
    CURRENT_USER: string;
    USER_DATA: string;
  };
  export const MODEL_URL: string;
  export const GAME_SETTINGS: {
    maxSessionDuration: number;
    minBreakTime: number;
    maxRetries: number;
  };
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
  export const SMIRK_THRESHOLD_MEDIAPIPE: number;
  export const SMIRK_ENTER_THRESHOLD: number;
  export const SMIRK_EXIT_THRESHOLD: number;
  export const SMIRK_RESET_GRACE_FRAMES: number;
  export const NEUTRAL_EXPRESSION_THRESHOLD_MEDIAPIPE: number;
  export const EYE_OPENNESS_THRESHOLD_MEDIAPIPE: number;
  export const FACE_CONFIDENCE_THRESHOLD_MEDIAPIPE: number;
  export const FACE_CENTERED_TOLERANCE_MEDIAPIPE: number;
  export const WARNING_ZONE_FRAMES_MEDIAPIPE: number;
  export const MEDIAPIPE_TARGET_FPS: number;
  export const MEDIAPIPE_FRAME_SKIP: number;
  export const MEDIAPIPE_MIN_INTERVAL: number;
  export const MEDIAPIPE_USE_WEB_WORKER: boolean;
  export const MEDIAPIPE_USE_GPU: boolean;
  export const MEDIAPIPE_WASM_CDN: string;
  export const MEDIAPIPE_FACE_MODEL_URL: string;
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
  export const FACE_DETECTED_DEBOUNCE_FRAMES: number;
  export const FACE_LOST_DEBOUNCE_FRAMES: number;
  export const EYES_CLOSED_DEBOUNCE_FRAMES: number;
  export const CALIBRATION_GRACE_FRAMES: number;
  export const HAPPINESS_SMOOTHING_FACTOR: number;
  export const FACE_LOSS_TIMEOUT_FRAMES: number;
}

// Extend Window interface for performance
interface Window {
  performance: Performance;
}

// Performance interface extension
interface Performance {
  now(): number;
}
