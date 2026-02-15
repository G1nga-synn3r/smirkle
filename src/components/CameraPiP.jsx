import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Video } from 'lucide-react';

/**
 * CameraPiP Component
 *
 * Picture-in-Picture camera view displayed in the top-right corner
 * during game play to show the player's camera feed.
 *
 * @param {Object} props
 * @param {React.Ref} props.videoRef - Shared video element ref from FaceTracker
 * @param {Object} props.config - PiP configuration from constants
 */
function CameraPiP({ videoRef, config }) {
  const canvasRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const animationFrameRef = useRef(null);

  // Default config if not provided
  const piPConfig = config || {
    POSITION: 'top-right',
    WIDTH: '160px',
    HEIGHT: '120px',
    Z_INDEX: 9999,
    MARGIN: '16px',
    BORDER: '2px solid rgba(139, 92, 246, 0.5)',
    BORDER_RADIUS: '8px',
    SHADOW: '0 0 20px rgba(139, 92, 246, 0.4)',
  };

  /**
   * Mirror the video frame to canvas for real-time display
   */
  const drawVideoFrame = useCallback(() => {
    const video = videoRef?.current;
    const canvas = canvasRef?.current;

    if (!video || !canvas || video.readyState < 2) {
      // Video not ready, retry on next frame
      return;
    }

    try {
      const ctx = canvas.getContext('2d');

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame (mirrored for selfie view)
      ctx.save();
      ctx.scale(-1, 1); // Mirror horizontally
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      setIsVideoReady(true);
    } catch (err) {
      console.warn('[CameraPiP] Error drawing video frame:', err);
      setHasError(true);
    }
  }, [videoRef]);

  /**
   * Start animation loop to update canvas
   */
  useEffect(() => {
    const animate = () => {
      drawVideoFrame();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (videoRef?.current) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef, drawVideoFrame]);

  /**
   * Handle video error
   */
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleError = () => {
      console.error('[CameraPiP] Video error detected');
      setHasError(true);
    };

    video.addEventListener('error', handleError);
    return () => video.removeEventListener('error', handleError);
  }, [videoRef]);

  // Don't render if there's an error
  if (hasError) {
    return null;
  }

  return (
    <div
      className="fixed"
      style={{
        top: piPConfig.MARGIN,
        right: piPConfig.MARGIN,
        width: piPConfig.WIDTH,
        height: piPConfig.HEIGHT,
        zIndex: piPConfig.Z_INDEX,
        borderRadius: piPConfig.BORDER_RADIUS,
        border: piPConfig.BORDER,
        boxShadow: piPConfig.SHADOW,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease-in-out',
      }}
      role="region"
      aria-label="Camera preview"
    >
      {/* Video canvas */}
      <canvas
        ref={canvasRef}
        width={160}
        height={120}
        className="w-full h-full object-cover"
        style={{
          transform: 'scaleX(-1)', // Mirror for selfie view
        }}
      />

      {/* Live indicator */}
      <div
        className="absolute top-2 left-2 flex items-center gap-1.5"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          color: '#10B981',
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span style={{ color: 'white' }}>LIVE</span>
      </div>

      {/* Video icon indicator */}
      <div
        className="absolute bottom-2 right-2"
        style={{
          opacity: 0.7,
        }}
      >
        <Video size={16} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
      </div>

      {/* Error fallback */}
      {!isVideoReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraPiP;
