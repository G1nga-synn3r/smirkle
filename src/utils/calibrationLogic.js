/**
 * Calibration Logic Utility
 *
 * Manages the calibration state machine for face detection calibration.
 * Handles the 1-second stability timer for face + eyes + neutral expression.
 */

import {
  CALIBRATION_STABILITY_DURATION,
  CALIBRATION_CHECK_INTERVAL,
  NEUTRAL_EXPRESSION_THRESHOLD,
} from './constants';

/**
 * Calibration Status Types
 */
export const CALIBRATION_STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  NO_FACE: 'no_face',
  EYES_CLOSED: 'eyes_closed',
  SMILING: 'smiling',
  STABLE: 'stable',
  COMPLETE: 'complete',
  FAILED: 'failed',
};

/**
 * Calibration Failure Reasons
 */
export const CALIBRATION_FAILURE = {
  NO_FACE: 'no_face',
  EYES_CLOSED: 'eyes_closed',
  SMILING: 'smiling',
  TIMEOUT: 'timeout',
};

/**
 * CalibrationManager Class
 *
 * Manages the calibration state and stability timer.
 * Conditions required for calibration:
 * - Face detected
 * - Eyes open
 * - Not smiling (happiness < NEUTRAL_EXPRESSION_THRESHOLD)
 *
 * All conditions must remain true for 1 continuous second.
 */
class CalibrationManager {
  constructor(options = {}) {
    this.config = {
      stabilityDuration: options.stabilityDuration || CALIBRATION_STABILITY_DURATION,
      checkInterval: options.checkInterval || CALIBRATION_CHECK_INTERVAL,
      neutralThreshold: options.neutralThreshold || NEUTRAL_EXPRESSION_THRESHOLD,
    };

    this.state = {
      status: CALIBRATION_STATUS.IDLE,
      faceDetected: false,
      eyesOpen: false,
      notSmiling: true,
      timerValue: 0,
      timerActive: false,
      complete: false,
      failedReason: null,
      progress: 0,
    };

    this.checkInterval = null;
    this.onComplete = null;
    this.onUpdate = null;
  }

  /**
   * Check if all calibration conditions are met
   * @param {Object} detectionData - Detection results from FaceTracker
   * @returns {boolean} All conditions met
   */
  checkConditions(detectionData) {
    const { faceDetected, eyesOpen, happinessScore } = detectionData;
    const notSmiling = happinessScore < this.config.neutralThreshold;

    this.state.faceDetected = faceDetected;
    this.state.eyesOpen = eyesOpen;
    this.state.notSmiling = notSmiling;

    return faceDetected && eyesOpen && notSmiling;
  }

  /**
   * Process detection update from FaceTracker
   * @param {Object} detectionData - Detection results
   * @returns {Object} Current calibration state
   */
  processDetection(detectionData) {
    // If already complete, ignore further detections
    if (this.state.complete) {
      return this.getState();
    }

    const allConditionsMet = this.checkConditions(detectionData);

    if (allConditionsMet) {
      // All conditions met - start or continue timer
      if (!this.state.timerActive) {
        // Start 1-second timer
        this.state.timerActive = true;
        this.state.timerValue = 0;
        this.state.status = CALIBRATION_STATUS.STABLE;
      } else {
        // Continue timer
        this.state.timerValue += this.config.checkInterval;
      }

      // Update progress percentage
      this.state.progress = Math.min(
        (this.state.timerValue / this.config.stabilityDuration) * 100,
        100
      );

      // Check if 1 second elapsed - calibration complete!
      if (this.state.timerValue >= this.config.stabilityDuration) {
        this.complete();
      }
    } else {
      // Reset timer on any condition failure
      if (this.state.timerActive) {
        this.state.timerActive = false;
        this.state.timerValue = 0;
        this.state.progress = 0;
      }

      // Determine status based on failed condition
      if (!detectionData.faceDetected) {
        this.state.status = CALIBRATION_STATUS.NO_FACE;
        this.state.failedReason = CALIBRATION_FAILURE.NO_FACE;
      } else if (!detectionData.eyesOpen) {
        this.state.status = CALIBRATION_STATUS.EYES_CLOSED;
        this.state.failedReason = CALIBRATION_FAILURE.EYES_CLOSED;
      } else if (detectionData.happinessScore >= this.config.neutralThreshold) {
        this.state.status = CALIBRATION_STATUS.SMILING;
        this.state.failedReason = CALIBRATION_FAILURE.SMILING;
      } else {
        this.state.status = CALIBRATION_STATUS.CHECKING;
        this.state.failedReason = null;
      }
    }

    // Notify update callback
    if (this.onUpdate) {
      this.onUpdate(this.getState());
    }

    return this.getState();
  }

  /**
   * Complete calibration successfully
   */
  complete() {
    this.state.complete = true;
    this.state.timerActive = false;
    this.state.status = CALIBRATION_STATUS.COMPLETE;
    this.state.progress = 100;

    if (this.onComplete) {
      this.onComplete(true);
    }

    this.stop();
  }

  /**
   * Fail calibration
   * @param {string} reason - Failure reason
   */
  fail(reason) {
    this.state.complete = false;
    this.state.status = CALIBRATION_STATUS.FAILED;
    this.state.failedReason = reason;

    if (this.onComplete) {
      this.onComplete(false, reason);
    }

    this.stop();
  }

  /**
   * Get current state for UI updates
   * @returns {Object} Current calibration state
   */
  getState() {
    return {
      status: this.state.status,
      faceDetected: this.state.faceDetected,
      eyesOpen: this.state.eyesOpen,
      notSmiling: this.state.notSmiling,
      timerValue: this.state.timerValue,
      timerActive: this.state.timerActive,
      complete: this.state.complete,
      failedReason: this.state.failedReason,
      progress: this.state.progress,
      stabilityDuration: this.config.stabilityDuration,
    };
  }

  /**
   * Start calibration monitoring
   * @param {Function} onComplete - Callback when calibration completes or fails
   * @param {Function} onUpdate - Optional callback for state updates
   */
  start(onComplete, onUpdate = null) {
    this.onComplete = onComplete;
    this.onUpdate = onUpdate;

    // Reset state
    this.state = {
      status: CALIBRATION_STATUS.CHECKING,
      faceDetected: false,
      eyesOpen: false,
      notSmiling: true,
      timerValue: 0,
      timerActive: false,
      complete: false,
      failedReason: null,
      progress: 0,
    };

    // Start check interval
    this.checkInterval = setInterval(() => {
      // Waiting for detection data via processDetection
      // Timer is advanced in processDetection
    }, this.config.checkInterval);
  }

  /**
   * Stop calibration monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Reset calibration state
   */
  reset() {
    this.stop();
    this.state = {
      status: CALIBRATION_STATUS.IDLE,
      faceDetected: false,
      eyesOpen: false,
      notSmiling: true,
      timerValue: 0,
      timerActive: false,
      complete: false,
      failedReason: null,
      progress: 0,
    };
    this.onComplete = null;
    this.onUpdate = null;
  }

  /**
   * Check if calibration is ready to start
   * @param {Object} prerequisites - Prerequisites status
   * @returns {boolean} Ready to start
   */
  static canStart(prerequisites) {
    return {
      modelsLoaded: prerequisites.modelsLoaded === true,
      cameraReady: prerequisites.cameraReady === true,
    };
  }
}

/**
 * Helper function to create a calibration manager instance
 * @param {Object} options - Configuration options
 * @returns {CalibrationManager} New calibration manager instance
 */
export function createCalibrationManager(options = {}) {
  return new CalibrationManager(options);
}

export default CalibrationManager;
