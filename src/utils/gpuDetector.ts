/**
 * GPU Detection Utility
 * 
 * Detects GPU capabilities and determines appropriate fallback strategy
 */

export interface GPUInfo {
  supported: boolean;
  renderer: string;
  vendor: string;
  fallbackReason?: string;
}

export interface FallbackConfig {
  useCPU: boolean;
  reduceDetectionFrequency: boolean;
  targetFPS: number;
  resolutionScale: number;
  enableFrameSkipping: boolean;
}

export type FallbackStrategy = 'GPU_FAILURE' | 'WEAK_GPU' | 'CPU_ONLY';

// Known problematic GPUs (software renderers)
const PROBLEMATIC_GPUS = [
  'llvmpipe',
  'swiftshader',
  'mesa llvmpipe',
  'softpipe',
  'mesasw',
  'swiftshader'
];

// Known weak GPUs (integrated or older mobile)
const WEAK_GPUS = [
  'intel hd 3000',
  'intel hd 4000',
  'intel hd 500',
  'intel hd 4400',
  'intel hd 5500',
  'adreno 305',
  'adreno 306',
  'adreno 308',
  'mali-400',
  'mali-450',
  'powervr'
];

/**
 * Detect GPU capabilities of the current device
 */
export async function detectGPUCapability(): Promise<GPUInfo> {
  // Check if WebGL is available
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return {
      supported: false,
      renderer: 'unknown',
      vendor: 'unknown',
      fallbackReason: 'WebGL not supported'
    };
  }
  
  // Try to get WebGL 2 context first
  if (gl instanceof WebGL2RenderingContext) {
    console.log('[GPUDetector] WebGL 2.0 supported');
  } else {
    console.log('[GPUDetector] WebGL 1.0 only (limited performance expected)');
  }
  
  // Try to get debug renderer info
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  let renderer = 'unknown';
  let vendor = 'unknown';
  
  if (debugInfo) {
    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    console.log(`[GPUDetector] GPU: ${renderer} (${vendor})`);
  } else {
    console.log('[GPUDetector] Debug info not available, cannot identify GPU');
  }
  
  // Check for software renderers
  const isSoftwareRenderer = PROBLEMATIC_GPUS.some(
    gpu => renderer.toLowerCase().includes(gpu)
  );
  
  if (isSoftwareRenderer) {
    return {
      supported: false,
      renderer,
      vendor,
      fallbackReason: 'Software renderer detected (no GPU acceleration)'
    };
  }
  
  // Check for weak GPUs
  const isWeakGPU = WEAK_GPUS.some(
    gpu => renderer.toLowerCase().includes(gpu)
  );
  
  if (isWeakGPU) {
    return {
      supported: true,
      renderer,
      vendor,
      fallbackReason: 'Weak GPU detected (reduced performance expected)'
    };
  }
  
  // Good GPU detected
  return {
    supported: true,
    renderer,
    vendor
  };
}

/**
 * Fallback configuration for each strategy
 */
export const FALLBACK_CONFIG: Record<FallbackStrategy, FallbackConfig> = {
  GPU_FAILURE: {
    useCPU: true,
    reduceDetectionFrequency: true,
    targetFPS: 20,
    resolutionScale: 0.75,
    enableFrameSkipping: true
  },
  WEAK_GPU: {
    useCPU: false,
    reduceDetectionFrequency: false,
    targetFPS: 30,
    resolutionScale: 0.875,
    enableFrameSkipping: true
  },
  CPU_ONLY: {
    useCPU: true,
    reduceDetectionFrequency: true,
    targetFPS: 15,
    resolutionScale: 0.5,
    enableFrameSkipping: true
  }
};

/**
 * Select appropriate fallback strategy based on GPU info
 */
export function selectFallbackStrategy(gpuInfo: GPUInfo): FallbackStrategy {
  if (!gpuInfo.supported) {
    return 'GPU_FAILURE';
  }
  
  if (gpuInfo.fallbackReason?.includes('Weak')) {
    return 'WEAK_GPU';
  }
  
  // Default to CPU-only for unknown situations
  return 'CPU_ONLY';
}

/**
 * Get fallback config by strategy
 */
export function getFallbackConfig(strategy: FallbackStrategy): FallbackConfig {
  return FALLBACK_CONFIG[strategy];
}

/**
 * Check if device supports required features
 */
export function checkDeviceCapabilities(): {
  webglSupported: boolean;
  webglVersion: number;
  workerSupported: boolean;
  canRunMediaPipe: boolean;
} {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  return {
    webglSupported: !!gl,
    webglVersion: gl instanceof WebGL2RenderingContext ? 2 : gl instanceof WebGLRenderingContext ? 1 : 0,
    workerSupported: typeof Worker !== 'undefined',
    canRunMediaPipe: !!gl && typeof Worker !== 'undefined'
  };
}

/**
 * Log device capabilities to console
 */
export function logDeviceCapabilities(): void {
  const caps = checkDeviceCapabilities();
  const gpu = detectGPUCapability();
  
  gpu.then(info => {
    console.log('[GPUDetector] === Device Capabilities ===');
    console.log(`[GPUDetector] WebGL: ${caps.webglSupported} (v${caps.webglVersion})`);
    console.log(`[GPUDetector] Web Worker: ${caps.workerSupported}`);
    console.log(`[GPUDetector] MediaPipe Capable: ${caps.canRunMediaPipe}`);
    console.log(`[GPUDetector] GPU Supported: ${info.supported}`);
    console.log(`[GPUDetector] Fallback: ${info.fallbackReason || 'None'}`);
    console.log('[GPUDetector] ==========================');
  });
}
