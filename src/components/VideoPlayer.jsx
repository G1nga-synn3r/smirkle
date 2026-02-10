import React, { useEffect, useRef, useState, useCallback } from 'react';
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
 */
function VideoPlayer({ 
  isSmiling, 
  videoRef: propVideoRef, 
  currentVideo, 
  onVideoChange,
  onResetHappiness 
}) {
  const localVideoRef = useRef(null);
  const videoElement = propVideoRef || localVideoRef;
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [fadeState, setFadeState] = useState('idle');
  
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
    if (video && isSmiling) {
      video.pause();
      // Trigger haptic feedback on player failure (smiling)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
        console.log('[Haptic] Vibration triggered: player failed (smiling)');
      }
    }
  }, [isSmiling]);

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

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Video element with fade effect */}
      <video
        ref={videoElement}
        className={`w-full h-full object-cover ${getFadeClass()}`}
        autoPlay
        playsInline
        muted={false}
        loop={false}
      />
      
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
