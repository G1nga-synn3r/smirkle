/**
 * Error Tracking Service for Face Detection
 * 
 * Provides structured error logging for debugging face detection issues.
 * Captures failure reasons, metadata, and detection context for real-time debugging.
 */

// Error categories for face detection
export const ErrorCategory = {
  MODEL_LOADING: 'MODEL_LOADING',
  WEBCAM_ACCESS: 'WEBCAM_ACCESS',
  FACE_DETECTION: 'FACE_DETECTION',
  NO_FACE_DETECTED: 'NO_FACE_DETECTED',
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  CALIBRATION: 'CALIBRATION',
  BRIGHTNESS: 'BRIGHTNESS',
  PERMISSION: 'PERMISSION'
};

// Failure reasons for each category
export const FailureReason = {
  // Model loading
  FETCH_ERROR: 'FETCH_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  
  // Webcam access
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  DEVICE_IN_USE: 'DEVICE_IN_USE',
  OVERCONSTRAINED: 'OVERCONSTRAINED',
  NOT_READABLE: 'NOT_READABLE',
  
  // Face detection
  DETECTION_FAILED: 'DETECTION_FAILED',
  EXPRESSION_ANALYSIS_FAILED: 'EXPRESSION_ANALYSIS_FAILED',
  
  // No face detected
  NO_FACE_IN_FRAME: 'NO_FACE_IN_FRAME',
  FACE_TOO_SMALL: 'FACE_TOO_SMALL',
  FACE_NOT_CENTERED: 'FACE_NOT_CENTERED',
  
  // Low confidence
  CONFIDENCE_BELOW_THRESHOLD: 'CONFIDENCE_BELOW_THRESHOLD',
  UNSTABLE_DETECTION: 'UNSTABLE_DETECTION',
  
  // Calibration
  CALIBRATION_TIMEOUT: 'CALIBRATION_TIMEOUT',
  CALIBRATION_NOT_NEUTRAL: 'CALIBRATION_NOT_NEUTRAL',
  CALIBRATION_INTERRUPTED: 'CALIBRATION_INTERRUPTED',
  
  // Brightness
  LOW_LIGHT: 'LOW_LIGHT'
};

// Session context for error tracking
let sessionContext = {
  sessionId: null,
  startTime: null,
  userAgent: null,
  isMobile: false,
  videoWidth: 0,
  videoHeight: 0
};

/**
 * Initialize the error tracker with session context
 * @param {Object} context - Session context values
 */
export function initErrorTracker(context = {}) {
  sessionContext = {
    sessionId: generateSessionId(),
    startTime: new Date().toISOString(),
    userAgent: navigator.userAgent,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
              (window.innerWidth <= 428 && window.innerHeight <= 926),
    videoWidth: context.videoWidth || 0,
    videoHeight: context.videoHeight || 0,
    ...context
  };
  
  console.log('[ErrorTracker] Session initialized:', {
    sessionId: sessionContext.sessionId,
    startTime: sessionContext.startTime,
    isMobile: sessionContext.isMobile
  });
  
  return sessionContext;
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the current session context
 */
export function getSessionContext() {
  return { ...sessionContext };
}

/**
 * Track a face detection error with structured metadata
 * @param {string} category - Error category from ErrorCategory
 * @param {string} reason - Failure reason from FailureReason
 * @param {Object} metadata - Additional context metadata
 */
export function trackError(category, reason, metadata = {}) {
  const errorEntry = {
    timestamp: new Date().toISOString(),
    sessionId: sessionContext.sessionId,
    category,
    reason,
    metadata: {
      ...sessionContext,
      ...metadata,
      // Include detection-specific metadata
      detectionAttempts: (metadata.detectionAttempts || 0) + 1,
      lastDetectionTime: Date.now()
    },
    // Include any error message if provided
    errorMessage: metadata.error?.message || null,
    errorStack: metadata.error?.stack || null
  };
  
  // Log to console in a structured format
  console.group(`[FaceDetection Error] ${category}/${reason}`);
  console.log('Timestamp:', errorEntry.timestamp);
  console.log('Session:', errorEntry.sessionId);
  console.log('Metadata:', errorEntry.metadata);
  if (errorEntry.errorMessage) {
    console.log('Error:', errorEntry.errorMessage);
  }
  console.groupEnd();
  
  // Store error in session storage for persistence across reloads
  storeError(errorEntry);
  
  return errorEntry;
}

/**
 * Track a successful face detection event
 * @param {Object} data - Detection data
 */
export function trackDetectionSuccess(data) {
  const entry = {
    timestamp: new Date().toISOString(),
    sessionId: sessionContext.sessionId,
    type: 'DETECTION_SUCCESS',
    data: {
      ...sessionContext,
      ...data,
      detectionTime: Date.now()
    }
  };
  
  console.log('[FaceDetection Success]', {
    timestamp: entry.timestamp,
    probability: data.probability,
    faceCentered: data.isFaceCentered,
    consecutiveDetections: data.consecutiveCount
  });
  
  return entry;
}

/**
 * Track calibration events
 * @param {string} event - Calibration event type
 * @param {Object} data - Calibration data
 */
export function trackCalibrationEvent(event, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    sessionId: sessionContext.sessionId,
    type: 'CALIBRATION_EVENT',
    event,
    data: {
      ...sessionContext,
      ...data
    }
  };
  
  console.log(`[Calibration ${event}]`, entry.data);
  
  return entry;
}

/**
 * Store error in session storage for persistence
 */
function storeError(errorEntry) {
  try {
    const stored = sessionStorage.getItem('faceDetectionErrors');
    const errors = stored ? JSON.parse(stored) : [];
    
    // Keep only the last 50 errors
    errors.push(errorEntry);
    if (errors.length > 50) {
      errors.shift();
    }
    
    sessionStorage.setItem('faceDetectionErrors', JSON.stringify(errors));
  } catch (e) {
    console.warn('[ErrorTracker] Failed to store error:', e);
  }
}

/**
 * Retrieve stored errors for debugging
 */
export function getStoredErrors() {
  try {
    const stored = sessionStorage.getItem('faceDetectionErrors');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('[ErrorTracker] Failed to retrieve stored errors:', e);
    return [];
  }
}

/**
 * Clear stored errors
 */
export function clearStoredErrors() {
  try {
    sessionStorage.removeItem('faceDetectionErrors');
    console.log('[ErrorTracker] Stored errors cleared');
  } catch (e) {
    console.warn('[ErrorTracker] Failed to clear stored errors:', e);
  }
}

/**
 * Export all errors for debugging
 */
export function exportErrors() {
  const errors = getStoredErrors();
  const exportData = {
    sessionContext,
    errors,
    exportedAt: new Date().toISOString()
  };
  
  console.log('[ErrorTracker] Exporting errors:', exportData);
  return exportData;
}

/**
 * Convenience function to track model loading errors
 */
export function trackModelError(error, context = {}) {
  let reason = FailureReason.UNKNOWN_ERROR;
  
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    reason = FailureReason.FETCH_ERROR;
  } else if (error.message?.includes('parse')) {
    reason = FailureReason.PARSE_ERROR;
  } else if (error.name === 'TypeError') {
    reason = FailureReason.NETWORK_ERROR;
  }
  
  return trackError(ErrorCategory.MODEL_LOADING, reason, {
    modelUrl: context.modelUrl,
    error
  });
}

/**
 * Convenience function to track webcam access errors
 */
export function trackWebcamError(error) {
  let reason = FailureReason.UNKNOWN_ERROR;
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    reason = FailureReason.PERMISSION_DENIED;
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    reason = FailureReason.DEVICE_NOT_FOUND;
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    reason = FailureReason.DEVICE_IN_USE;
  } else if (error.name === 'OverconstrainedError') {
    reason = FailureReason.OVERCONSTRAINED;
  }
  
  return trackError(ErrorCategory.WEBCAM_ACCESS, reason, { error });
}

/**
 * Convenience function to track face detection failures
 */
export function trackFaceDetectionError(error, context = {}) {
  let reason = FailureReason.DETECTION_FAILED;
  
  if (context.noFaceDetected) {
    reason = FailureReason.NO_FACE_IN_FRAME;
  } else if (context.faceTooSmall) {
    reason = FailureReason.FACE_TOO_SMALL;
  } else if (!context.isFaceCentered) {
    reason = FailureReason.FACE_NOT_CENTERED;
  }
  
  return trackError(ErrorCategory.FACE_DETECTION, reason, {
    ...context,
    error
  });
}

/**
 * Convenience function to track low confidence detections
 */
export function trackLowConfidence(probability, threshold, context = {}) {
  return trackError(ErrorCategory.LOW_CONFIDENCE, FailureReason.CONFIDENCE_BELOW_THRESHOLD, {
    probability,
    threshold,
    ...context
  });
}

/**
 * Convenience function to track calibration failures
 */
export function trackCalibrationError(event, data) {
  let reason = FailureReason.CALIBRATION_TIMEOUT;
  
  if (event === 'not_neutral') {
    reason = FailureReason.CALIBRATION_NOT_NEUTRAL;
  } else if (event === 'interrupted') {
    reason = FailureReason.CALIBRATION_INTERRUPTED;
  }
  
  return trackError(ErrorCategory.CALIBRATION, reason, { data });
}

/**
 * Convenience function to track brightness warnings
 */
export function trackBrightnessWarning(brightness, threshold) {
  return trackError(ErrorCategory.BRIGHTNESS, FailureReason.LOW_LIGHT, {
    brightness,
    threshold
  });
}
