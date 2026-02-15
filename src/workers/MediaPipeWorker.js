/**
 * MediaPipe Worker for Smirkle Face Detection
 *
 * Responsibilities:
 * - Load MediaPipe Tasks WASM modules from CDN
 * - Initialize FaceLandmarker with WebGL acceleration
 * - Process video frames from main thread
 * - Return detection results with performance metrics
 * - Handle GPU/CPU fallback automatically
 * - Send unified loading progress for competition-ready startup flow
 *
 * Bundled using Vite's worker import system
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

import {
  // Existing constants that should be used
  MEDIAPIPE_WASM_CDN,
  SMIRK_ENTER_THRESHOLD,
  NEUTRAL_EXPRESSION_THRESHOLD_MEDIAPIPE,
  EYE_OPENNESS_THRESHOLD_MEDIAPIPE,
  FACE_CENTERED_TOLERANCE_MEDIAPIPE,

  // New constants to add
  MEDIAPIPE_INIT_MAX_RETRIES,
  MEDIAPIPE_UI_UPDATE_DELAY_MS,
  MEDIAPIPE_FACE_LANDMARKER_MODEL_SHORT_RANGE,
  MEDIAPIPE_NUM_FACES,
  DEFAULT_EYE_OPENNESS,
  DEFAULT_FACE_CONFIDENCE,
  DEFAULT_NO_FACE_CONFIDENCE,
  BLENDSHAPE_WEIGHT_MOUTH_HAPPY,
  BLENDSHAPE_WEIGHT_MOUTH_SMILE,
  BLENDSHAPE_WEIGHT_MOUTH_OPEN,
  MIN_IRIS_LANDMARKS_COUNT,
  LEFT_EYE_LANDMARK_START_INDEX,
  LEFT_EYE_LANDMARK_END_INDEX,
  RIGHT_EYE_LANDMARK_START_INDEX,
  RIGHT_EYE_LANDMARK_END_INDEX,
  EYE_HEIGHT_MULTIPLIER,
  NOSE_TIP_LANDMARK_INDEX,
  CHIN_LANDMARK_INDEX,
  LEFT_EYE_POSE_LANDMARK_INDEX,
  RIGHT_EYE_POSE_LANDMARK_INDEX,
  HEAD_POSE_SCALE_FACTOR,
  MS_PER_SECOND,
} from '@/utils/constants';

// CDN for WASM files
const VISION_CDN = MEDIAPIPE_WASM_CDN;

// Quality levels based on GPU/CPU mode
const QUALITY_HIGH = 'high';
const QUALITY_MEDIUM = 'medium';
// const QUALITY_LOW = 'low'; // Reserved for future use

// Worker state
let faceLandmarker = null;
let isInitialized = false;
let useGPU = true;
const performanceMetrics = {
  totalFrames: 0,
  totalLatency: 0,
  avgLatency: 0,
  gpuEnabled: true,
  cpuFallback: false,
};

// Message handlers
const messageHandlers = {
  INIT: handleInit,
  DETECT: handleDetect,
  SET_GPU: handleSetGPU,
  GET_PERFORMANCE: handleGetPerformance,
};

/**
 * Send loading progress to main thread
 * @param {string} stage - Current loading stage
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} [error] - Optional error message
 */
function sendLoadingProgress(stage, progress, error = null) {
  self.postMessage({
    type: 'loadingProgress',
    payload: { stage, progress, error },
  });
}

/**
 * Get user-friendly error message based on error type
 * @param {Error} error - The error that occurred
 * @param {string} stage - The stage at which the error occurred
 * @returns {string} User-friendly error message
 */
function getUserFriendlyError(error, stage) {
  const errorMessage = error?.message || String(error);

  if (stage === 'wasm_loading' || errorMessage.includes('WASM') || errorMessage.includes('fetch')) {
    return 'Failed to load AI models. Please check your internet connection and refresh the page.';
  }

  if (
    stage === 'gpu_initializing' ||
    errorMessage.includes('WebGL') ||
    errorMessage.includes('GPU')
  ) {
    return 'Graphics acceleration unavailable. Switching to CPU mode for compatibility.';
  }

  if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
    return 'Network error while loading models. Please check your connection and refresh.';
  }

  if (errorMessage.includes('QuotaExceededError') || errorMessage.includes('memory')) {
    return 'Insufficient memory to run face detection. Try closing other tabs and refreshing.';
  }

  return `Initialization error: ${errorMessage}`;
}

/**
 * Initialize MediaPipe Tasks with unified loading sequence
 * Only sends 'modelsLoaded' message AFTER all models are successfully loaded
 */
async function handleInit(data) {
  const { enableGPU = true, retryCount = 0 } = data;
  const MAX_RETRIES = MEDIAPIPE_INIT_MAX_RETRIES;

  useGPU = enableGPU;
  let cpuFallback = false;
  let currentQuality = QUALITY_HIGH;

  try {
    // Stage 1: Initializing (0%)
    sendLoadingProgress('initializing', 0);

    // Stage 2: Load WASM from CDN with retry (10-30%)
    try {
      sendLoadingProgress('wasm_loading', 10);

      // Small delay to allow UI to update
      await new Promise((resolve) => setTimeout(resolve, MEDIAPIPE_UI_UPDATE_DELAY_MS));

      const vision = await FilesetResolver.forVisionTasks(VISION_CDN);

      sendLoadingProgress('wasm_loaded', 30);
    } catch (wasmError) {
      // Retry once if this is the first failure
      if (retryCount < MAX_RETRIES) {
        return handleInit({ ...data, retryCount: retryCount + 1 });
      }

      // If retry failed, try CPU fallback with fresh retry count
      if (!useGPU) {
        throw wasmError;
      }

      cpuFallback = true;
      currentQuality = QUALITY_MEDIUM;
    }

    // Stage 3: GPU/CPU detection (50%)
    if (!cpuFallback && useGPU) {
      try {
        sendLoadingProgress('gpu_initializing', 50);

        // Check if GPU is actually available
        if (!navigator.gpu) {
          cpuFallback = true;
          currentQuality = QUALITY_MEDIUM;
        }
      } catch (gpuError) {
        cpuFallback = true;
        currentQuality = QUALITY_MEDIUM;
      }
    }

    // Stage 4: Initialize FaceLandmarker (70-90%)
    const delegate = cpuFallback ? 'CPU' : 'GPU';

    sendLoadingProgress('model_loading', 70);

    faceLandmarker = await FaceLandmarker.createFromOptions(
      cpuFallback
        ? await FilesetResolver.forVisionTasks(VISION_CDN)
        : await FilesetResolver.forVisionTasks(VISION_CDN),
      {
        outputFaceBlendshapes: true,
        outputIrisLandmarks: true,
        faceLandmarkerModelSelection: MEDIAPIPE_FACE_LANDMARKER_MODEL_SHORT_RANGE, // 0 = short-range, 1 = full-range
        runningMode: 'VIDEO',
        numFaces: MEDIAPIPE_NUM_FACES,
        delegate: delegate,
      }
    );

    sendLoadingProgress('model_loaded', 90);

    // Update state
    isInitialized = true;
    performanceMetrics.gpuEnabled = !cpuFallback;
    performanceMetrics.cpuFallback = cpuFallback;

    // Stage 5: Complete (100%)
    // THIS IS THE KEY: Only send modelsLoaded AFTER all initialization is complete
    sendLoadingProgress('complete', 100);

    // Send single unified modelsLoaded message
    self.postMessage({
      type: 'modelsLoaded',
      payload: {
        cpuFallback,
        currentQuality,
        gpuEnabled: !cpuFallback,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    const stage = 'error';
    const userFriendlyMessage = getUserFriendlyError(error, stage);

    // Send error message
    self.postMessage({
      type: 'initError',
      payload: {
        error: error.message,
        stage,
        userFriendlyMessage,
        recoverable: retryCount < MAX_RETRIES,
      },
    });

    // If not using GPU and we have retries, retry with GPU
    if (!useGPU && retryCount < MAX_RETRIES) {
      return handleInit({ ...data, enableGPU: true, retryCount: retryCount + 1 });
    }

    // If using GPU and we have retries, fallback to CPU
    if (useGPU && retryCount < MAX_RETRIES) {
      return handleInit({ ...data, enableGPU: false, retryCount: retryCount + 1 });
    }
  }
}

/**
 * Process video frame and return detection results
 */
async function handleDetect(data) {
  if (!isInitialized || !faceLandmarker) {
    self.postMessage({
      type: 'DETECT_ERROR',
      payload: { error: 'FaceLandmarker not initialized' },
    });
    return;
  }

  const { imageBitmap, timestamp } = data;
  const startTime = performance.now();

  try {
    // Run detection
    const result = faceLandmarker.detectForVideo(imageBitmap, timestamp);

    const latency = performance.now() - startTime;

    // Update performance metrics
    performanceMetrics.totalFrames++;
    performanceMetrics.totalLatency += latency;
    performanceMetrics.avgLatency =
      performanceMetrics.totalLatency / performanceMetrics.totalFrames;

    // Process results
    const detectionResult = processDetectionResult(result);

    self.postMessage({
      type: 'DETECT_RESULT',
      payload: {
        ...detectionResult,
        performance: {
          latency,
          fps: MS_PER_SECOND / latency,
          avgLatency: performanceMetrics.avgLatency,
          gpuEnabled: performanceMetrics.gpuEnabled,
          cpuFallback: performanceMetrics.cpuFallback,
        },
      },
    });
  } catch (error) {
    self.postMessage({
      type: 'DETECT_ERROR',
      payload: { error: error.message },
    });
  }
}

/**
 * Toggle GPU mode at runtime
 */
function handleSetGPU(data) {
  useGPU = data.enabled;
  performanceMetrics.gpuEnabled = useGPU;
  performanceMetrics.cpuFallback = !useGPU;
}

/**
 * Return current performance metrics
 */
function handleGetPerformance() {
  self.postMessage({
    type: 'PERFORMANCE_METRICS',
    payload: performanceMetrics,
  });
}

/**
 * Process MediaPipe results into game-ready format
 * Includes null-safe access and default fallbacks for stability
 */
function processDetectionResult(result) {
  // No face detected - return safe defaults
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return {
      faceDetected: false,
      happinessScore: 0,
      eyesOpen: { left: DEFAULT_EYE_OPENNESS, right: DEFAULT_EYE_OPENNESS }, // Default to open to prevent false "eyes closed"
      faceConfidence: DEFAULT_NO_FACE_CONFIDENCE,
      isSmirking: false,
      neutralExpression: true,
      leftEyeOpenness: DEFAULT_EYE_OPENNESS,
      rightEyeOpenness: DEFAULT_EYE_OPENNESS,
      headPose: { pitch: 0, yaw: 0, roll: 0 },
      faceCentered: false,
      boundingBox: null,
    };
  }

  const face = result.faceLandmarks[0];
  const blendshapes = result.faceBlendshapes?.[0]?.blendshapes || [];

  // Calculate happiness score from blendshapes
  const happinessScore = calculateHappinessScore(blendshapes);

  // Calculate eye openness with fallback
  const eyesOpen = calculateEyeOpenness(result);

  // Calculate head pose (simplified)
  const headPose = calculateHeadPose(face);

  // Get face confidence - use a reasonable default if not available
  const faceConfidence =
    result.faceLandmarks?.[0]?.length > 0 ? DEFAULT_FACE_CONFIDENCE : DEFAULT_NO_FACE_CONFIDENCE;

  // Determine if eyes are open based on threshold
  const eyesOpenThreshold = EYE_OPENNESS_THRESHOLD_MEDIAPIPE;
  const bothEyesOpen = eyesOpen.left >= eyesOpenThreshold && eyesOpen.right >= eyesOpenThreshold;

  return {
    faceDetected: true,
    faceConfidence,
    happinessScore,
    isSmirking: happinessScore >= SMIRK_ENTER_THRESHOLD,
    neutralExpression: happinessScore < NEUTRAL_EXPRESSION_THRESHOLD_MEDIAPIPE,
    eyesOpen: bothEyesOpen, // Boolean for backward compatibility
    leftEyeOpenness: eyesOpen.left,
    rightEyeOpenness: eyesOpen.right,
    headPose,
    faceCentered: isFaceCentered(headPose),
    boundingBox: result.faceBoundingBoxes?.[0] || null,
  };
}

/**
 * Calculate happiness from blendshapes
 * Weighted combination for smirk detection sensitivity
 */
function calculateHappinessScore(blendshapes) {
  const mouthHappy = blendshapes.find((b) => b.categoryName === 'mouthHappy')?.score || 0;
  const mouthSmile = blendshapes.find((b) => b.categoryName === 'mouthSmile')?.score || 0;
  const mouthOpen = blendshapes.find((b) => b.categoryName === 'mouthOpen')?.score || 0;

  // Weighted combination for smirk detection
  return mouthHappy * 0.7 + mouthSmile * 0.25 + mouthOpen * 0.05;
}

/**
 * Calculate eye openness from iris landmarks
 */
function calculateEyeOpenness(result) {
  const irisLandmarks = result.irisLandmarks?.[0] || [];

  if (irisLandmarks.length < 10) {
    return { left: 1, right: 1 };
  }

  // Left eye landmarks: indices 0-5
  // Right eye landmarks: indices 6-11

  const leftEyeHeight = calculateEyeHeight(irisLandmarks.slice(0, 6));
  const rightEyeHeight = calculateEyeHeight(irisLandmarks.slice(6, 12));

  return {
    left: Math.min(1, leftEyeHeight * 2),
    right: Math.min(1, rightEyeHeight * 2),
  };
}

/**
 * Calculate vertical eye opening from landmarks
 */
function calculateEyeHeight(eyeLandmarks) {
  const topPoint = Math.min(...eyeLandmarks.map((p) => p.y));
  const bottomPoint = Math.max(...eyeLandmarks.map((p) => p.y));
  return bottomPoint - topPoint;
}

/**
 * Calculate head pose from landmarks
 * Simplified pose estimation using key facial landmarks
 */
function calculateHeadPose(landmarks) {
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Simplified pose calculations
  const yaw = (leftEye.x - rightEye.x) * 50;
  const pitch = (noseTip.y - chin.y) * 50;
  const roll = 0;

  return { pitch, yaw, roll };
}

/**
 * Check if face is centered within tolerance thresholds
 */
function isFaceCentered(headPose) {
  const YAW_THRESHOLD = 15;
  const PITCH_THRESHOLD = 15;

  return Math.abs(headPose.yaw) <= YAW_THRESHOLD && Math.abs(headPose.pitch) <= PITCH_THRESHOLD;
}

// Worker message listener
self.onmessage = function (event) {
  const { type, id, data } = event.data;

  if (messageHandlers[type]) {
    messageHandlers[type](data, id);
  } else {
    self.postMessage({
      type: 'ERROR',
      payload: { error: `Unknown message type: ${type}` },
    });
  }
};

// Worker API object for module export (used in tests or direct imports)
const MediaPipeWorker = {
  messageHandlers,
  handleInit,
  handleDetect,
  handleSetGPU,
  handleGetPerformance,
};

export default MediaPipeWorker;
