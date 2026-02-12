/**
 * SystemCheckOverlay Component
 * 
 * Displays system checks during startup.
 * Now receives model loading state from props - no fake loading simulation.
 * Shows spinner until modelsLoaded === true (from MediaPipeWorker).
 * Shows CPU fallback badge when compatibility mode is active.
 * 
 * Key behavior:
 * - modelsLoaded becomes true ONLY when worker sends 'modelsLoaded' message
 * - Calibration starts only when BOTH cameraReady AND modelsLoaded are true
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, Camera, CheckCircle, AlertCircle, Loader, Brain, Cpu } from 'lucide-react';
import { WEBCAM_CONFIG } from '../utils/constants';

export interface SystemCheckCompleteData {
  cameraReady: boolean;
  modelsLoaded: boolean;
  cpuFallback: boolean;
  loadingStage: string;
}

export interface SystemCheckOverlayProps {
  onCheckComplete: (result: SystemCheckCompleteData) => void;
  
  // Model loading state from parent (useMediaPipe hook)
  modelsLoading?: boolean;
  modelsLoaded?: boolean;
  loadingStage?: string;
  loadingProgress?: number;
  cpuFallback?: boolean;
  modelError?: string | null;
  
  // Camera state from parent
  cameraReady?: boolean;
  cameraStatus?: 'checking' | 'success' | 'failed';
  cameraError?: string | null;
  
  // Optional: Pass worker ref for direct message listening
  workerRef?: React.MutableRefObject<Worker | null>;
}

const DEFAULT_PROPS: Required<SystemCheckOverlayProps> = {
  onCheckComplete: () => {},
  modelsLoading: false,
  modelsLoaded: false,
  loadingStage: 'initializing',
  loadingProgress: 0,
  cpuFallback: false,
  modelError: null,
  cameraReady: false,
  cameraStatus: 'checking',
  cameraError: null,
  workerRef: null
};

// Stage display names for user feedback
const STAGE_NAMES: Record<string, string> = {
  'initializing': 'Initializing...',
  'wasm_loading': 'Loading WASM modules...',
  'wasm_loaded': 'WASM modules loaded',
  'model_loading': 'Loading face detection models...',
  'model_loaded': 'Face detection models loaded',
  'gpu_initializing': 'Initializing GPU acceleration...',
  'gpu_initialized': 'GPU initialized',
  'complete': 'All models loaded',
  'error': 'Error loading models'
};

export default function SystemCheckOverlay(props: SystemCheckOverlayProps) {
  const p = { ...DEFAULT_PROPS, ...props };
  
  // Local state for camera check (runs independently)
  const [localCameraStatus, setLocalCameraStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [localCameraError, setLocalCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(p.cameraReady);
  const [checkComplete, setCheckComplete] = useState(false);
  
  // Determine effective values (use props if provided, otherwise local)
  const effectiveModelsLoading = p.modelsLoading || false;
  const effectiveModelsLoaded = p.modelsLoaded || false;
  const effectiveLoadingStage = p.loadingStage || 'initializing';
  const effectiveLoadingProgress = p.loadingProgress || 0;
  const effectiveCpuFallback = p.cpuFallback || false;
  const effectiveModelError = p.modelError;
  
  // Determine camera status
  const effectiveCameraStatus = p.cameraStatus !== undefined ? p.cameraStatus : localCameraStatus;
  const effectiveCameraError = p.cameraError !== undefined ? p.cameraError : localCameraError;
  const effectiveCameraReady = p.cameraReady !== undefined ? p.cameraReady : cameraReady;
  
  /**
   * Check camera availability
   */
  const checkCamera = useCallback(async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }
      
      const constraints = {
        video: {
          width: { ideal: WEBCAM_CONFIG.IDEAL_WIDTH },
          height: { ideal: WEBCAM_CONFIG.IDEAL_HEIGHT },
          facingMode: WEBCAM_CONFIG.FACING_MODE
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop the stream immediately after checking
      stream.getTracks().forEach(track => track.stop());
      
      setLocalCameraStatus('success');
      setCameraReady(true);
      console.log('[SystemCheck] Camera check passed');
      return true;
    } catch (error) {
      console.error('[SystemCheck] Camera check failed:', error);
      setLocalCameraStatus('failed');
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setLocalCameraError('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setLocalCameraError('No camera found. Please connect a camera.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setLocalCameraError('Camera is in use by another application.');
      } else {
        setLocalCameraError(`Camera error: ${error.message || 'Unknown error'}`);
      }
      
      return false;
    }
  }, []);
  
  /**
   * Listen for worker messages directly (if workerRef is provided)
   */
  useEffect(() => {
    if (!p.workerRef?.current) return;
    
    const worker = p.workerRef.current;
    
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      if (type === 'loadingProgress') {
        console.log(`[SystemCheck] Worker progress: ${payload.stage} - ${payload.progress}%`);
      }
      
      if (type === 'modelsLoaded') {
        console.log('[SystemCheck] Worker sent modelsLoaded:', payload);
      }
      
      if (type === 'initError') {
        console.error('[SystemCheck] Worker error:', payload);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    return () => worker.removeEventListener('message', handleMessage);
  }, [p.workerRef]);
  
  /**
   * Run camera check on mount (if camera state not provided via props)
   */
  useEffect(() => {
    if (p.cameraStatus === undefined) {
      checkCamera();
    }
  }, [p.cameraStatus, checkCamera]);
  
  /**
   * Check completion - wait for BOTH cameraReady AND modelsLoaded
   */
  useEffect(() => {
    if (checkComplete) return;
    
    // Only proceed if both are ready
    if (effectiveCameraReady && effectiveModelsLoaded) {
      console.log('[SystemCheck] All checks passed:', {
        cameraReady: effectiveCameraReady,
        modelsLoaded: effectiveModelsLoaded,
        cpuFallback: effectiveCpuFallback
      });
      
      setCheckComplete(true);
      
      // Small delay for visual satisfaction
      setTimeout(() => {
        p.onCheckComplete({
          cameraReady: effectiveCameraReady,
          modelsLoaded: effectiveModelsLoaded,
          cpuFallback: effectiveCpuFallback,
          loadingStage: effectiveLoadingStage
        });
      }, 500);
    }
  }, [effectiveCameraReady, effectiveModelsLoaded, effectiveCpuFallback, effectiveLoadingStage, checkComplete, p]);
  
  /**
   * Determine models status for display
   */
  const getModelsStatus = (): 'pending' | 'checking' | 'success' | 'failed' => {
    if (effectiveModelError) return 'failed';
    if (effectiveModelsLoaded) return 'success';
    if (effectiveModelsLoading) return 'checking';
    return 'pending';
  };
  
  const modelsStatus = getModelsStatus();
  
  /**
   * Get models message based on stage
   */
  const getModelsMessage = (): string => {
    if (effectiveModelError) return effectiveModelError;
    if (modelsStatus === 'success') return 'Facial Recognition Models Loaded';
    if (modelsStatus === 'failed') return 'Model loading failed';
    return STAGE_NAMES[effectiveLoadingStage] || 'Loading AI models...';
  };
  
  /**
   * Get camera message
   */
  const getCameraMessage = (): string => {
    if (effectiveCameraError) return effectiveCameraError;
    if (effectiveCameraStatus === 'success') return 'Camera ready';
    if (effectiveCameraStatus === 'failed') return 'Camera check failed';
    return 'Checking camera access...';
  };
  
  // All checks passed flag
  const allChecksPassed = 
    effectiveCameraStatus === 'success' && 
    effectiveModelsLoaded;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-cyan-500/20 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2">
            System Check
          </h2>
          <p className="text-gray-400 text-sm">Verifying your setup before we begin</p>
        </div>
        
        {/* Models Check */}
        <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="flex items-start gap-3 mb-2">
            {/* Spinner disappears immediately when modelsLoaded === true */}
            {modelsStatus === 'pending' && (
              <Loader className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {modelsStatus === 'checking' && (
              <Loader className="w-5 h-5 text-yellow-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {modelsStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            {modelsStatus === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Brain size={16} className={
                  modelsStatus === 'success' ? 'text-green-400' : 
                  modelsStatus === 'failed' ? 'text-red-400' : 
                  'text-yellow-400'
                } />
                <p className="font-semibold text-white">AI Models</p>
                {/* CPU fallback badge - subtle compatibility mode indicator */}
                {effectiveCpuFallback && modelsStatus === 'success' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Cpu size={10} />
                    Compatibility Mode
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${
                modelsStatus === 'success' ? 'text-green-300' :
                modelsStatus === 'failed' ? 'text-red-300' :
                modelsStatus === 'checking' ? 'text-yellow-300' :
                'text-gray-400'
              }`}>
                {getModelsMessage()}
              </p>
              {/* Progress bar for real loading */}
              {modelsStatus === 'checking' && (
                <div className="w-full h-1 bg-slate-600 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-100"
                    style={{ width: `${effectiveLoadingProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Camera Check */}
        <div className="mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="flex items-start gap-3 mb-2">
            {effectiveCameraStatus === 'checking' && (
              <Loader className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {effectiveCameraStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            {effectiveCameraStatus === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <Camera size={16} className={
                  effectiveCameraStatus === 'success' ? 'text-green-400' : 
                  effectiveCameraStatus === 'failed' ? 'text-red-400' : 
                  'text-cyan-400'
                } />
                <p className="font-semibold text-white">Camera</p>
              </div>
              <p className={`text-sm mt-1 ${
                effectiveCameraStatus === 'success' ? 'text-green-300' :
                effectiveCameraStatus === 'failed' ? 'text-red-300' :
                'text-gray-400'
              }`}>
                {getCameraMessage()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Internet Check - non-blocking */}
        <div className="mb-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-green-400" />
              <p className="font-semibold text-white">Internet Connection</p>
            </div>
            <div className="flex-1">
              <p className="text-sm mt-1 text-green-300">
                Required for initial model download
              </p>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {effectiveCameraStatus === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-300">
              <strong>Camera Required:</strong> Please enable camera access to play Smirkle.
            </p>
          </div>
        )}
        
        {/* All Ready Message */}
        {allChecksPassed && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-300">
              ✓ All systems ready!{effectiveCpuFallback ? ' Running in compatibility mode.' : ''}
            </p>
          </div>
        )}
        
        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${effectiveModelsLoaded ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            <div className={`w-2 h-2 rounded-full ${effectiveCameraStatus === 'success' ? 'bg-green-400' : 'bg-cyan-400 animate-pulse'}`} />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
