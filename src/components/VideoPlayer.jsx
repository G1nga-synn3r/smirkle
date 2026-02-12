import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { VIDEO_DATABASE } from '../data/videoLibrary.js';

// Module-level tracking for recently played videos (last 3 rounds)
// Uses a WeakMap for HMR-safe module state without import.meta.hot
const recentVideosModule = {
  history: [],
  maxHistory: 3,
  
  add(videoId) {
    this.history = [...this.history, videoId].slice(-this.maxHistory);
  },
  
  isRecentlyPlayed(videoId) {
    return this.history.includes(videoId);
  },
  
  clear() {
    this.history = [];
  },
  
  getHistory() {
    return [...this.history];
  }
};

/**
 * Select a random video that hasn't been played in the last 3 rounds
 * Supports 'Shuffled Queue' anti-repeat logic
 * @param {Array} excludeIds - Video IDs to exclude from selection
 * @returns {Object} Selected video object
 */
function getNextVideo(excludeIds = []) {
  // Filter out recently played videos (last 3 rounds)
  const availableVideos = VIDEO_DATABASE.filter(
    video => !recentVideosModule.isRecentlyPlayed(video.id) && !excludeIds.includes(video.id)
  );

  // If all videos were played recently, fallback to full database
  const pool = availableVideos.length > 0 ? availableVideos : VIDEO_DATABASE;
  
  if (pool.length === 0) {
    return VIDEO_DATABASE[0]; // Fallback to first video
  }
  
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedVideo = pool[randomIndex];

  // Update recent videos (keep last 3)
  recentVideosModule.add(selectedVideo.id);

  return selectedVideo;
}

/**
 * VideoPlayer Component
 * Handles video playback with fade transitions and anti-repeat selection
 * 
 * @param {Object} props
 * @param {boolean} props.isSmiling - Whether the user is smiling (pauses video)
 * @param {React.Ref} props.videoRef - Shared video element ref
 * @param {Object} props.currentVideo - Currently selected video object
 * @param {Function} props.onVideoChange - Callback when video changes
 * @param {Function} props.onResetHappiness - Callback to reset Face-API happiness score
 * @param {number} props.survivalTime - Current survival time for score display
 * @param {React.Ref} props.cameraRef - Ref to camera canvas for fullscreen display
 */
function VideoPlayer({ 
  isSmiling, 
  isEyesOpen = false,
  videoRef: propVideoRef, 
  currentVideo, 
  onVideoChange,
  onResetHappiness,
  survivalTime = 0,
  cameraRef,
  isFullscreenActive = false,
  onToggleFullscreen,
  warningActive = false,
  failPhase = false
}) {
  const localVideoRef = useRef(null);
  const videoElement = propVideoRef || localVideoRef;
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [fadeState, setFadeState] = useState('idle');
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive);
  const fullscreenContainerRef = useRef(null);
  
  // Store handleCanPlayThrough in a ref to avoid scope issues
  const handleCanPlayThroughRef = useRef(null);

  /**
   * Get session statistics for debugging
   */
  const getSessionStats = useCallback(() => {
    return {
      recentVideos: recentVideosModule.getHistory(),
      totalInDatabase: VIDEO_DATABASE.length
    };
  }, []);

  // Handle video source changes with fade effect
  useEffect(() => {
    if (!currentVideo) return;

    const video = videoElement.current;
    if (!video) return;

    // Start fade out
    setFadeState('fade-out');

    // Reset happiness score when video changes
    if (onResetHappiness) {
      onResetHappiness();
    }

    // After fade out, load new video
    const fadeOutTimer = setTimeout(() => {
      setIsVideoLoaded(false);
      
      video.src = currentVideo.url;
      video.load();
      
      video.play().catch(e => {
        console.error('Autoplay blocked, user interaction required:', e.message);
      });

      // Start fade in after video starts
      const handleCanPlayThrough = () => {
        setIsVideoLoaded(true);
        setFadeState('fade-in');
        if (onVideoChange) {
          onVideoChange(currentVideo, getSessionStats());
        }
        video.removeEventListener('canplaythrough', handleCanPlayThroughRef.current);
      };
      
      // Store handler in ref for cleanup access
      handleCanPlayThroughRef.current = handleCanPlayThrough;
      
      video.addEventListener('canplaythrough', handleCanPlayThrough);
    }, 500); // Match transition duration

    return () => {
      clearTimeout(fadeOutTimer);
      if (handleCanPlayThroughRef.current && video) {
        video.removeEventListener('canplaythrough', handleCanPlayThroughRef.current);
      }
    };
  }, [currentVideo, onResetHappiness, onVideoChange, getSessionStats]);

  // Handle smile detection pause with haptic feedback
  useEffect(() => {
    const video = videoElement.current;
    if (video) {
      if (isSmiling || !isEyesOpen) {
        // Pause whenever the user is smiling OR eyes are closed/not detected
        if (!video.paused) {
          video.pause();
          console.log('[Video] Paused: smiling or eyes closed');
        }
        // Trigger haptic feedback on player failure (smiling)
        if (isSmiling && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]); // Strong vibration pattern on fail
          console.log('[Haptic] Vibration triggered: player failed (smiling)');
        }
      } else {
        // Resume video only if eyes open, not smiling, and video is loaded
        if (video.paused && isVideoLoaded) {
          video.play().catch(err => console.warn('[Video] Auto-play failed (browser policy):', err.message));
          console.log('[Video] Playing: conditions met (eyes open & not smiling)');
        }
      }
    }
  }, [isSmiling, isEyesOpen, isVideoLoaded]);

  // Sync external fullscreen state with internal state
  useEffect(() => {
    if (isFullscreenActive && !isFullscreen) {
      console.log('[Video] Auto-entering fullscreen mode');
      handleFullscreenClick();
    }
  }, [isFullscreenActive, isFullscreen, handleFullscreenClick]);

  // Handle fullscreen button click
  const handleFullscreenClick = useCallback(async () => {
    const container = fullscreenContainerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
          await container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes (in case exited by ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentFullscreen = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
      );
      setIsFullscreen(currentFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Determine fade classes based on fade state
  const getFadeClass = () => {
    switch (fadeState) {
      case 'fade-out':
        return 'opacity-0 transition-opacity duration-500';
      case 'fade-in':
        return 'opacity-100 transition-opacity duration-500';
      default:
        return 'opacity-0';
    }
  };

  // Determine if video should display (for fade-in after loaded)
  const shouldShowVideo = isVideoLoaded || fadeState === 'idle';

  // Fullscreen layout
  if (isFullscreen && cameraRef?.current) {
    return (
      <div 
        ref={fullscreenContainerRef}
        className="fixed inset-0 bg-black z-40 flex items-center justify-center"
      >
        {/* Main video fullscreen */}
        <div className="relative w-full h-full">
          <video
            ref={videoElement}
            className={`w-full h-full object-cover ${getFadeClass()}`}
            autoPlay
            playsInline
            muted={false}
            loop={false}
          />

          {/* Warning Overlay - Yellow tint */}
          {warningActive && (
            <div className="absolute inset-0 bg-yellow-500/20 pointer-events-none z-20 animate-pulse" />
          )}
          
          {/* Fail Overlay - Red flash */}
          {failPhase && (
            <div className="absolute inset-0 bg-red-600/80 pointer-events-none z-30 flex items-center justify-center animate-pulse">
              <h1 className="text-6xl md:text-8xl font-bold text-white animate-bounce">FAIL</h1>
            </div>
          )}

          {/* Score overlay - bottom center */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/20 shadow-2xl z-30">
            <p className="text-gray-300 text-sm font-medium">Score</p>
            <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
              {Math.floor(survivalTime * 100)}
            </p>
          </div>

          {/* Camera preview - bottom right corner */}
          <div className="absolute bottom-6 right-6 w-40 h-40 rounded-2xl overflow-hidden bg-black/80 border-2 border-cyan-400 shadow-2xl z-20">
            <canvas
              ref={cameraRef}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/50 rounded-2xl" />
          </div>

          {/* Exit fullscreen button - top right */}
          <button
            onClick={handleFullscreenClick}
            className="absolute top-6 right-6 p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white shadow-lg hover:scale-110 transition-transform z-30"
            title="Exit Fullscreen"
          >
            <Minimize size={24} />
          </button>

          {/* Loading placeholder when no video */}
          {!currentVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <p className="text-gray-400">Loading video...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={fullscreenContainerRef} className="relative w-full h-full overflow-hidden">
      {/* Video element with fade effect */}
      <video
        ref={videoElement}
        className={`w-full h-full object-cover ${getFadeClass()}`}
        autoPlay
        playsInline
        muted={false}
        loop={false}
      />
      
      {/* Warning Overlay - Yellow tint */}
      {warningActive && (
        <div className="absolute inset-0 bg-yellow-500/20 pointer-events-none z-20 animate-pulse" />
      )}
      
      {/* Fail Overlay - Red flash */}
      {failPhase && (
        <div className="absolute inset-0 bg-red-600/80 pointer-events-none z-30 flex items-center justify-center animate-pulse">
          <h1 className="text-6xl md:text-8xl font-bold text-white animate-bounce">FAIL</h1>
        </div>
      )}
      
      {/* Fullscreen button - top right */}
      <button
        onClick={handleFullscreenClick}
        className="absolute top-4 right-4 p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white shadow-lg hover:scale-110 transition-transform z-20"
        title="Toggle Fullscreen"
      >
        <Maximize size={20} />
      </button>

      {/* Score display in normal mode */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 z-10">
        <p className="text-gray-300 text-xs font-medium">Score: {Math.floor(survivalTime * 100)}</p>
      </div>
      
      {/* Loading placeholder when no video */}
      {!currentVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <p className="text-gray-400">Loading video...</p>
        </div>
      )}
    </div>
  );
}

// Export the getNextVideo function for external use
export { getNextVideo };

export default VideoPlayer;
