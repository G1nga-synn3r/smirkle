/**
 * Dynamic Resolution Manager
 * 
 * Adjusts camera resolution based on real-time performance metrics.
 * Ensures smooth operation across different device capabilities.
 */

export interface ResolutionState {
  width: number;
  height: number;
  scale: number;
  targetFPS: number;
  currentFPS: number;
  quality: 'high' | 'medium' | 'low';
}

export interface PerformanceThresholds {
  highQualityFPS: number;
  mediumQualityFPS: number;
  minAcceptableFPS: number;
}

export interface DynamicResolutionStats {
  avgFPS: number;
  avgLatency: number;
  quality: string;
}

export class DynamicResolutionManager {
  private state: ResolutionState;
  private thresholds: PerformanceThresholds;
  private fpsHistory: number[];
  private latencyHistory: number[];
  private readonly MAX_HISTORY = 30;
  private readonly MIN_SAMPLES = 10;
  
  constructor(
    initialWidth: number = 640,
    initialHeight: number = 480,
    thresholds?: Partial<PerformanceThresholds>
  ) {
    this.state = {
      width: initialWidth,
      height: initialHeight,
      scale: 1,
      targetFPS: 30,
      currentFPS: 30,
      quality: 'high'
    };
    
    this.thresholds = {
      highQualityFPS: 45,
      mediumQualityFPS: 30,
      minAcceptableFPS: 20,
      ...thresholds
    };
    
    this.fpsHistory = [];
    this.latencyHistory = [];
    
    console.log('[DynamicResolutionManager] Initialized');
  }
  
  /**
   * Record performance metrics from latest detection
   */
  recordPerformance(fps: number, latency: number): void {
    this.fpsHistory.push(fps);
    this.latencyHistory.push(latency);
    
    // Keep only the last MAX_HISTORY samples
    if (this.fpsHistory.length > this.MAX_HISTORY) {
      this.fpsHistory.shift();
      this.latencyHistory.shift();
    }
    
    // Evaluate performance if we have enough samples
    if (this.fpsHistory.length >= this.MIN_SAMPLES) {
      this.evaluatePerformance();
    }
    
    this.state.currentFPS = fps;
  }
  
  /**
   * Evaluate performance and adjust resolution if needed
   */
  private evaluatePerformance(): void {
    const avgFPS = this.getAverage(this.fpsHistory);
    const avgLatency = this.getAverage(this.latencyHistory);
    
    // Check if FPS is stable and good enough for upgrade
    if (avgFPS >= this.thresholds.highQualityFPS && avgLatency < 20) {
      this.upgradeQuality();
    }
    // Downgrade if FPS drops below medium threshold
    else if (avgFPS < this.thresholds.mediumQualityFPS) {
      this.downgradeQuality();
    }
    // Emergency downgrade if FPS is critically low
    else if (avgFPS < this.thresholds.minAcceptableFPS) {
      this.emergencyDowngrade();
    }
    
    console.log(
      `[DynamicResolutionManager] FPS: ${avgFPS.toFixed(1)}, ` +
      `Latency: ${avgLatency.toFixed(1)}ms, ` +
      `Quality: ${this.state.quality}`
    );
  }
  
  /**
   * Upgrade quality level
   */
  private upgradeQuality(): void {
    if (this.state.quality === 'low') {
      this.setQuality('medium');
    } else if (this.state.quality === 'medium') {
      this.setQuality('high');
    }
    // Already at high, no action needed
  }
  
  /**
   * Downgrade quality level
   */
  private downgradeQuality(): void {
    if (this.state.quality === 'high') {
      this.setQuality('medium');
    } else if (this.state.quality === 'medium') {
      this.setQuality('low');
    }
    // Already at low, no action needed
  }
  
  /**
   * Emergency downgrade for critically low performance
   */
  private emergencyDowngrade(): void {
    if (this.state.quality !== 'low') {
      console.warn('[DynamicResolutionManager] Emergency downgrade to low quality');
      this.setQuality('low');
      this.state.targetFPS = 15;
    }
  }
  
  /**
   * Set quality level and adjust resolution accordingly
   */
  private setQuality(quality: 'high' | 'medium' | 'low'): void {
    const qualityScales: Record<'high' | 'medium' | 'low', number> = {
      high: 1.0,
      medium: 0.75,
      low: 0.5
    };
    
    const qualityTargetFPS: Record<'high' | 'medium' | 'low', number> = {
      high: 30,
      medium: 25,
      low: 15
    };
    
    this.state.quality = quality;
    this.state.scale = qualityScales[quality];
    this.state.targetFPS = qualityTargetFPS[quality];
    
    // Calculate new resolution
    const baseWidth = 640;
    const baseHeight = 480;
    
    this.state.width = Math.floor(baseWidth * this.state.scale);
    this.state.height = Math.floor(baseHeight * this.state.scale);
    
    console.log(
      `[DynamicResolutionManager] Quality: ${quality}, ` +
      `Scale: ${(this.state.scale * 100).toFixed(0)}%, ` +
      `Resolution: ${this.state.width}x${this.state.height}, ` +
      `Target FPS: ${this.state.targetFPS}`
    );
  }
  
  /**
   * Calculate average of numeric array
   */
  private getAverage(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  /**
   * Get current resolution settings
   */
  getResolution(): { width: number; height: number; scale: number } {
    return {
      width: this.state.width,
      height: this.state.height,
      scale: this.state.scale
    };
  }
  
  /**
   * Get current quality level
   */
  getQuality(): string {
    return this.state.quality;
  }
  
  /**
   * Get performance statistics
   */
  getStats(): DynamicResolutionStats {
    return {
      avgFPS: this.getAverage(this.fpsHistory),
      avgLatency: this.getAverage(this.latencyHistory),
      quality: this.state.quality
    };
  }
  
  /**
   * Get target FPS
   */
  getTargetFPS(): number {
    return this.state.targetFPS;
  }
  
  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    return this.state.currentFPS;
  }
  
  /**
   * Reset to initial high-quality state
   */
  reset(): void {
    this.state.scale = 1;
    this.state.quality = 'high';
    this.state.width = 640;
    this.state.height = 480;
    this.state.targetFPS = 30;
    this.fpsHistory = [];
    this.latencyHistory = [];
    
    console.log('[DynamicResolutionManager] Reset to high quality');
  }
  
  /**
   * Force a specific quality level
   */
  setForcedQuality(quality: 'high' | 'medium' | 'low'): void {
    this.setQuality(quality);
  }
  
  /**
   * Check if quality upgrade is available
   */
  canUpgrade(): boolean {
    return this.state.quality === 'medium' || this.state.quality === 'low';
  }
  
  /**
   * Check if resolution has been downgraded
   */
  isDowngraded(): boolean {
    return this.state.quality !== 'high';
  }
}
