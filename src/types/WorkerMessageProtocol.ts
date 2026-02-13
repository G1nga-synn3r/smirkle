/**
 * Worker Message Protocol Type Definitions
 * 
 * Type-safe message definitions for MediaPipe Worker communication
 * Updated with unified loading sequence for competition-ready startup flow
 */

// Loading progress stages for unified model loading
export type LoadingStage = 
  | 'initializing'
  | 'wasm_loading'
  | 'wasm_loaded'
  | 'model_loading'
  | 'model_loaded'
  | 'gpu_initializing'
  | 'gpu_initialized'
  | 'complete'
  | 'error';

export type QualityLevel = 'high' | 'medium' | 'low';

// Main Thread → Worker Messages
export interface WorkerInitMessage {
  type: 'INIT';
  data: {
    enableGPU?: boolean; // Default: true
    retryCount?: number;  // For internal retry tracking
  };
}

export interface WorkerDetectMessage {
  type: 'DETECT';
  data: {
    imageBitmap: ImageBitmap;
    timestamp: number;
  };
}

export interface WorkerSetGPUMessage {
  type: 'SET_GPU';
  data: {
    enabled: boolean;
  };
}

export interface WorkerGetPerformanceMessage {
  type: 'GET_PERFORMANCE';
}

export type WorkerMessage = 
  | WorkerInitMessage 
  | WorkerDetectMessage 
  | WorkerSetGPUMessage 
  | WorkerGetPerformanceMessage;

// Worker → Main Thread Messages
export interface WorkerLoadingProgressMessage {
  type: 'loadingProgress';
  payload: {
    stage: LoadingStage;
    progress: number; // 0-100
    error?: string;
  };
}

export interface WorkerModelsLoadedMessage {
  type: 'modelsLoaded';
  payload: {
    cpuFallback: boolean;
    currentQuality: QualityLevel;
    gpuEnabled: boolean;
    timestamp: number;
  };
}

export interface WorkerInitSuccessMessage {
  type: 'INIT_SUCCESS';
  payload: {
    gpuEnabled: boolean;
    modelLoaded: boolean;
    cpuFallback: boolean;
  };
}

export interface WorkerInitErrorMessage {
  type: 'INIT_ERROR';
  payload: {
    error: string;
    fallbackMode?: 'CPU';
    recoverable?: boolean;
  };
}

// New unified error message with user-friendly messaging
export interface WorkerInitFatalErrorMessage {
  type: 'initError';
  payload: {
    error: string;
    stage: LoadingStage;
    userFriendlyMessage: string;
    recoverable: boolean;
  };
}

export interface WorkerDetectResultMessage {
  type: 'DETECT_RESULT';
  payload: {
    faceDetected: boolean;
    faceConfidence: number;
    happinessScore: number;
    isSmirking: boolean;
    neutralExpression: boolean;
    eyesOpen: boolean;
    leftEyeOpenness: number;
    rightEyeOpenness: number;
    headPose: {
      pitch: number;
      yaw: number;
      roll: number;
    };
    faceCentered: boolean;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    performance: {
      latency: number;
      fps: number;
      avgLatency: number;
      gpuEnabled: boolean;
      cpuFallback: boolean;
    };
  };
}

export interface WorkerDetectErrorMessage {
  type: 'DETECT_ERROR';
  payload: {
    error: string;
  };
}

export interface WorkerPerformanceMetricsMessage {
  type: 'PERFORMANCE_METRICS';
  payload: {
    totalFrames: number;
    totalLatency: number;
    avgLatency: number;
    gpuEnabled: boolean;
    cpuFallback: boolean;
  };
}

export interface WorkerErrorMessage {
  type: 'ERROR';
  payload: {
    error: string;
  };
}

export type WorkerResponse = 
  | WorkerInitSuccessMessage
  | WorkerInitErrorMessage
  | WorkerModelsLoadedMessage
  | WorkerLoadingProgressMessage
  | WorkerInitFatalErrorMessage
  | WorkerDetectResultMessage
  | WorkerDetectErrorMessage
  | WorkerPerformanceMetricsMessage
  | WorkerErrorMessage;

// Type guards
export function isWorkerInitMessage(value: unknown): value is WorkerInitMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type: unknown }).type === 'INIT'
  );
}

export function isWorkerDetectMessage(value: unknown): value is WorkerDetectMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type: unknown }).type === 'DETECT'
  );
}

export function isWorkerResponseType(value: string): value is WorkerResponse['type'] {
  return [
    'INIT_SUCCESS',
    'INIT_ERROR',
    'modelsLoaded',
    'loadingProgress',
    'initError',
    'DETECT_RESULT',
    'DETECT_ERROR',
    'PERFORMANCE_METRICS',
    'ERROR'
  ].includes(value);
}

// Detection result type for use in components
export interface DetectionResult {
  faceDetected: boolean;
  faceConfidence: number;
  happinessScore: number;
  isSmirking: boolean;
  neutralExpression: boolean;
  eyesOpen: boolean;
  leftEyeOpenness: number;
  rightEyeOpenness: number;
  headPose: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  faceCentered: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PerformanceMetrics {
  latency: number;
  fps: number;
  avgLatency: number;
  gpuEnabled: boolean;
  cpuFallback: boolean;
}

// Camera readiness states
export type CameraStatus = 'checking' | 'active' | 'error';

export interface MediaPipeState {
  // Model loading state
  isInitialized: boolean;
  isLoading: boolean;
  modelsLoaded: boolean;
  loadingStage: LoadingStage | null;
  loadingProgress: number;
  gpuEnabled: boolean;
  cpuFallback: boolean;
  error: string | null;
  
  // Camera readiness state (unified signal)
  cameraReady: boolean;
  cameraStatus: CameraStatus;
  cameraError: string | null;
  firstFrameReceived: boolean;
  
  // Detection state
  detectionReady: boolean;
  lastResult: DetectionResult | null;
  performance: PerformanceMetrics | null;
}

