/**
 * SystemCheckOverlay Component
 * 
 * Displays system checks during startup.
 * Uses unified cameraReady state from parent (FaceTrackerMediaPipe).
 * Shows CPU fallback badge when compatibility mode is active.
 * 
 * Key behavior:
 * - modelsLoaded becomes true ONLY when worker sends 'modelsLoaded' message
 * - cameraReady becomes true ONLY when stream.active AND first frame received
 * - Calibration starts only when BOTH cameraReady AND modelsLoaded are true
 */

import { useEffect, useState } from 'react';
import { Wifi, Camera, CheckCircle, AlertCircle, Loader, Brain, Cpu, ArrowRight } from 'lucide-react';

export interface SystemCheckCompleteData {
  cameraReady: boolean;
  modelsLoaded: boolean;
  cpuFallback: boolean;
  loadingStage: string;
}

export interface SystemCheckOverlayProps {
  onCheckComplete: (result: SystemCheckCompleteData) => void;
  
  // Unified camera state from parent (FaceTrackerMediaPipe)
  cameraReady: boolean;
  cameraError?: string | null;
  
  // Model loading state from parent (useMediaPipe hook)
  modelsLoaded: boolean;
  loadingProgress?: number;
  cpuFallback?: boolean;
  modelError?: string | null;
  loadingStage?: string;
}

const DEFAULT_PROPS: Required<SystemCheckOverlayProps> = {
  onCheckComplete: () => {},
  cameraReady: false,
  cameraError: null,
  modelsLoaded: false,
  loadingProgress: 0,
  cpuFallback: false,
  modelError: null,
  loadingStage: 'initializing'
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
  
  const [checkComplete, setCheckComplete] = useState(false);
  const [showReadyMessage, setShowReadyMessage] = useState(false);
  
  // Determine checkmark states from unified props
  const cameraStatus = p.cameraReady ? 'success' : 
                       p.cameraError ? 'failed' : 'checking';
  
  const modelsStatus = p.modelsLoaded ? 'success' :
                      p.modelError ? 'failed' : 'checking';
  
  // Check completion - wait for BOTH cameraReady AND modelsLoaded
  useEffect(() => {
    if (checkComplete) return;
    
    if (p.cameraReady && p.modelsLoaded) {
      console.log('[SystemCheck] All checks passed:', {
        cameraReady: p.cameraReady,
        modelsLoaded: p.modelsLoaded,
        cpuFallback: p.cpuFallback
      });
      
      // Show ready message briefly
      setShowReadyMessage(true);
      
      // Delay for visual satisfaction
      const timer = setTimeout(() => {
        setCheckComplete(true);
        p.onCheckComplete({
          cameraReady: true,
          modelsLoaded: true,
          cpuFallback: p.cpuFallback || false,
          loadingStage: p.loadingStage || 'complete'
        });
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [p.cameraReady, p.modelsLoaded, p.cpuFallback, p.loadingStage, p.onCheckComplete, checkComplete]);
  
  /**
   * Get models message based on stage
   */
  const getModelsMessage = (): string => {
    if (p.modelError) return p.modelError;
    if (modelsStatus === 'success') return 'Facial Recognition Models Loaded';
    if (modelsStatus === 'failed') return 'Model loading failed';
    return STAGE_NAMES[p.loadingStage] || 'Loading AI models...';
  };
  
  /**
   * Get camera message
   */
  const getCameraMessage = (): string => {
    if (p.cameraError) return p.cameraError;
    if (cameraStatus === 'success') return 'Camera ready';
    if (cameraStatus === 'failed') return 'Camera check failed';
    return 'Waiting for camera...';
  };
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${checkComplete ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-cyan-500/20 shadow-2xl transition-all duration-500 ${checkComplete ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2">
            System Check
          </h2>
          <p className="text-gray-400 text-sm">Verifying your setup before we begin</p>
        </div>
        
        {/* Models Check */}
        <div className={`mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 transition-all duration-300 ${modelsStatus === 'success' ? 'border-green-500/30 bg-green-500/5' : ''}`}>
          <div className="flex items-start gap-3 mb-2">
            {modelsStatus === 'checking' && (
              <Loader className="w-5 h-5 text-yellow-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {modelsStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5 checkmark-success" />
            )}
            {modelsStatus === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 checkmark-failed" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Brain size={16} className={
                  modelsStatus === 'success' ? 'text-green-400' : 
                  modelsStatus === 'failed' ? 'text-red-400' : 
                  'text-yellow-400'
                } />
                <p className="font-semibold text-white">AI Models</p>
                {/* CPU fallback badge */}
                {p.cpuFallback && modelsStatus === 'success' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Cpu size={10} />
                    Compatibility Mode
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 transition-colors duration-300 ${
                modelsStatus === 'success' ? 'text-green-300' :
                modelsStatus === 'failed' ? 'text-red-300' :
                modelsStatus === 'checking' ? 'text-yellow-300' :
                'text-gray-400'
              }`}>
                {getModelsMessage()}
              </p>
              {/* Progress bar */}
              {modelsStatus === 'checking' && (
                <div className="w-full h-1 bg-slate-600 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-100"
                    style={{ width: `${p.loadingProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Camera Check */}
        <div className={`mb-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 transition-all duration-300 ${cameraStatus === 'success' ? 'border-green-500/30 bg-green-500/5' : ''}`}>
          <div className="flex items-start gap-3 mb-2">
            {cameraStatus === 'checking' && (
              <Loader className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {cameraStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5 checkmark-success" />
            )}
            {cameraStatus === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 checkmark-failed" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <Camera size={16} className={
                  cameraStatus === 'success' ? 'text-green-400' : 
                  cameraStatus === 'failed' ? 'text-red-400' : 
                  'text-cyan-400'
                } />
                <p className="font-semibold text-white">Camera</p>
              </div>
              <p className={`text-sm mt-1 transition-colors duration-300 ${
                cameraStatus === 'success' ? 'text-green-300' :
                cameraStatus === 'failed' ? 'text-red-300' :
                'text-gray-400'
              }`}>
                {getCameraMessage()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Internet Check */}
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
        {cameraStatus === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-300">
              <strong>Camera Required:</strong> Please enable camera access to play Smirkle.
            </p>
          </div>
        )}
        
        {/* All Ready Message */}
        {showReadyMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 animate-fade-in">
            <p className="text-sm text-green-300 flex items-center gap-2">
              <CheckCircle size={16} />
              All systems ready!
              {p.cpuFallback && ' Running in compatibility mode.'}
            </p>
          </div>
        )}
        
        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${p.modelsLoaded ? 'bg-green-400 scale-125' : 'bg-yellow-400 animate-pulse'}`} />
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${cameraStatus === 'success' ? 'bg-green-400 scale-125' : 'bg-cyan-400 animate-pulse'}`} />
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        </div>
        
        {/* Continue Button */}
        <div className="mt-6 flex justify-center">
          <button
            disabled={!p.cameraReady || !p.modelsLoaded}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              p.cameraReady && p.modelsLoaded
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-400 hover:to-purple-500 transform hover:scale-105 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {p.cameraReady && p.modelsLoaded ? (
              <>
                Continue
                <ArrowRight size={18} />
              </>
            ) : (
              'Checking...'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
