/**
 * useMediaPipe Hook
 *
 * React hook for MediaPipe face detection with Web Worker support.
 * Handles worker lifecycle, message passing, and state management.
 * Updated with unified loading sequence for competition-ready startup flow.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WorkerInitMessage,
  WorkerDetectMessage,
  WorkerSetGPUMessage,
  DetectionResult,
  PerformanceMetrics,
  MediaPipeState,
  LoadingStage,
} from '../types/WorkerMessageProtocol';
import {
  detectGPUCapability,
  selectFallbackStrategy,
  getFallbackConfig,
} from '../utils/gpuDetector';
import { DynamicResolutionManager } from '../services/DynamicResolutionManager';

// Worker constructor type for dynamic import
type MediaPipeWorkerConstructor = new () => Worker;

export interface UseMediaPipeOptions {
  onDetection?: (result: DetectionResult, performance: PerformanceMetrics) => void;
  onError?: (error: string) => void;
  onCPUFallback?: (enabled: boolean) => void;
  onLoadingProgress?: (stage: LoadingStage, progress: number) => void;
  onModelsLoaded?: (cpuFallback: boolean, currentQuality: string) => void;
  targetFPS?: number;
  autoInitialize?: boolean;
}

export interface UseMediaPipeReturn extends MediaPipeState {
  initialize: () => Promise<void>;
  detect: (imageBitmap: ImageBitmap) => void;
  setGPU: (enabled: boolean) => void;
  getPerformance: () => void;
  reset: () => void;

  // Camera state management (called from FaceTracker)
  setCameraReady: (ready: boolean, error?: string) => void;
  setFirstFrameReceived: (received: boolean) => void;
  setDetectionReady: (ready: boolean) => void;
  setCameraStatus: (status: 'checking' | 'active' | 'error') => void;
}

const DEFAULT_OPTIONS: Required<UseMediaPipeOptions> = {
  onDetection: () => {},
  onError: () => {},
  onCPUFallback: () => {},
  onLoadingProgress: () => {},
  onModelsLoaded: () => {},
  targetFPS: 30,
  autoInitialize: true,
};

export function useMediaPipe(options: UseMediaPipeOptions = {}): UseMediaPipeReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const workerRef = useRef<Worker | null>(null);
  const workerConstructorRef = useRef<MediaPipeWorkerConstructor | null>(null);
  const resolutionManagerRef = useRef<DynamicResolutionManager | null>(null);
  const frameCountRef = useRef(0);
  const workerReadyRef = useRef(false);

  const [state, setState] = useState<MediaPipeState>({
    isInitialized: false,
    isLoading: true,
    modelsLoaded: false,
    loadingStage: 'initializing',
    loadingProgress: 0,
    gpuEnabled: true,
    cpuFallback: false,
    error: null,

    // Camera readiness state
    cameraReady: false,
    cameraStatus: 'checking',
    cameraError: null,
    firstFrameReceived: false,

    // Detection state
    detectionReady: false,

    lastResult: null,
    performance: null,
  });

  /**
   * Initialize the MediaPipe worker
   */
  const initialize = useCallback(async () => {
    if (workerRef.current && workerReadyRef.current) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      loadingStage: 'initializing',
      loadingProgress: 0,
    }));

    try {
      // Detect GPU capabilities
      const gpuInfo = await detectGPUCapability();

      // Select fallback strategy
      const strategy = selectFallbackStrategy(gpuInfo);
      const config = getFallbackConfig(strategy);

      // Dynamically import worker module
      const MediaPipeWorkerModule = await import('../workers/MediaPipeWorker.js');
      workerConstructorRef.current = MediaPipeWorkerModule.default as MediaPipeWorkerConstructor;
      workerRef.current = new workerConstructorRef.current();

      // Set up message handler
      workerRef.current.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'loadingProgress':
            // Track loading progress from worker
            setState((prev) => ({
              ...prev,
              loadingStage: payload.stage,
              loadingProgress: payload.progress,
            }));
            opts.onLoadingProgress(payload.stage, payload.progress);
            break;

          case 'modelsLoaded':
            // ALL models loaded - this is the key state transition
            workerReadyRef.current = true;
            setState((prev) => ({
              ...prev,
              isInitialized: true,
              isLoading: false,
              modelsLoaded: true,
              loadingStage: 'complete',
              loadingProgress: 100,
              gpuEnabled: payload.gpuEnabled,
              cpuFallback: payload.cpuFallback,
            }));
            if (payload.cpuFallback) {
              opts.onCPUFallback(true);
            }
            opts.onModelsLoaded(payload.cpuFallback, payload.currentQuality);
            break;

          case 'INIT_SUCCESS':
            // Legacy support - may still be sent by older worker versions
            workerReadyRef.current = true;
            setState((prev) => ({
              ...prev,
              isInitialized: true,
              isLoading: false,
              modelsLoaded: true,
              gpuEnabled: payload.gpuEnabled,
              cpuFallback: payload.cpuFallback,
            }));
            if (payload.cpuFallback) {
              opts.onCPUFallback(true);
            }
            break;

          case 'INIT_ERROR':
            // Legacy error handling
            console.error('[useMediaPipe] Worker init error:', payload.error);
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: payload.error,
              loadingStage: 'error',
            }));
            opts.onError(payload.error);
            break;

          case 'initError':
            // New unified error handling with user-friendly messages
            console.error('[useMediaPipe] Fatal error:', payload);
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: payload.userFriendlyMessage || payload.error,
              loadingStage: payload.stage,
            }));
            opts.onError(payload.userFriendlyMessage || payload.error);
            break;

          case 'DETECT_RESULT':
            handleDetectionResult(payload);
            break;

          case 'DETECT_ERROR':
            console.error('[useMediaPipe] Detection error:', payload.error);
            opts.onError(payload.error);
            break;

          case 'PERFORMANCE_METRICS':
            // Performance metrics update
            break;

          default:
            console.warn('[useMediaPipe] Unknown message type:', type);
        }
      };

      // Initialize worker with GPU preference
      const initMessage: WorkerInitMessage = {
        type: 'INIT',
        data: { enableGPU: !config.useCPU },
      };
      workerRef.current.postMessage(initMessage);

      // Initialize resolution manager
      resolutionManagerRef.current = new DynamicResolutionManager(640, 480, {
        highQualityFPS: 45,
        mediumQualityFPS: 30,
        minAcceptableFPS: 20,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[useMediaPipe] Initialization failed:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        loadingStage: 'error',
      }));
      opts.onError(errorMessage);
    }
  }, [opts]);

  /**
   * Handle detection results from worker
   */
  const handleDetectionResult = useCallback(
    (payload: DetectionResult & { performance: PerformanceMetrics }) => {
      const { performance, ...result } = payload;

      // Update resolution manager with performance metrics
      if (resolutionManagerRef.current) {
        resolutionManagerRef.current.recordPerformance(performance.fps, performance.latency);
      }

      // Update state
      setState((prev) => ({
        ...prev,
        lastResult: result,
        performance,
      }));

      // Callback
      opts.onDetection(result, performance);
    },
    [opts]
  );

  /**
   * Send frame to worker for detection
   */
  const detect = useCallback((imageBitmap: ImageBitmap) => {
    const worker = workerRef.current;
    if (!worker || !workerReadyRef.current) {
      console.warn('[useMediaPipe] Cannot detect: worker not ready');
      return;
    }

    const timestamp = performance.now();

    const message: WorkerDetectMessage = {
      type: 'DETECT',
      data: { imageBitmap, timestamp },
    };

    worker.postMessage(message);
    frameCountRef.current++;
  }, []);

  /**
   * Toggle GPU mode
   */
  const setGPU = useCallback(
    (enabled: boolean) => {
      const worker = workerRef.current;
      if (!worker) return;

      const message: WorkerSetGPUMessage = {
        type: 'SET_GPU',
        data: { enabled },
      };

      worker.postMessage(message);

      setState((prev) => ({
        ...prev,
        gpuEnabled: enabled,
        cpuFallback: !enabled,
      }));

      opts.onCPUFallback(!enabled);
    },
    [opts]
  );

  /**
   * Get performance metrics from worker
   */
  const getPerformance = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    worker.postMessage({ type: 'GET_PERFORMANCE' });
  }, []);

  /**
   * Reset worker and state
   */
  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    frameCountRef.current = 0;
    workerReadyRef.current = false;

    setState({
      isInitialized: false,
      isLoading: true,
      modelsLoaded: false,
      loadingStage: 'initializing',
      loadingProgress: 0,
      gpuEnabled: true,
      cpuFallback: false,
      error: null,

      // Camera readiness state
      cameraReady: false,
      cameraStatus: 'checking',
      cameraError: null,
      firstFrameReceived: false,

      // Detection state
      detectionReady: false,

      lastResult: null,
      performance: null,
    });

    if (resolutionManagerRef.current) {
      resolutionManagerRef.current.reset();
    }
  }, []);

  /**
   * Set camera ready state
   * Called from FaceTracker when camera is fully ready
   */
  const setCameraReady = useCallback((ready: boolean, error?: string) => {
    setState((prev) => ({
      ...prev,
      cameraReady: ready,
      cameraStatus: ready ? 'active' : prev.cameraStatus,
      cameraError: error || null,
      firstFrameReceived: ready || prev.firstFrameReceived,
    }));
  }, []);

  /**
   * Set first frame received state
   */
  const setFirstFrameReceived = useCallback((received: boolean) => {
    setState((prev) => ({
      ...prev,
      firstFrameReceived: received,
    }));
  }, []);

  /**
   * Set detection ready state (first valid face detection)
   */
  const setDetectionReady = useCallback((ready: boolean) => {
    setState((prev) => ({
      ...prev,
      detectionReady: ready,
    }));
  }, []);

  /**
   * Set camera status
   */
  const setCameraStatus = useCallback((status: 'checking' | 'active' | 'error') => {
    setState((prev) => ({
      ...prev,
      cameraStatus: status,
    }));
  }, []);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (opts.autoInitialize) {
      initialize();
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [initialize, opts.autoInitialize]);

  return {
    ...state,
    initialize,
    detect,
    setGPU,
    getPerformance,
    reset,

    // Camera state management
    setCameraReady,
    setFirstFrameReceived,
    setDetectionReady,
    setCameraStatus,
  };
}
