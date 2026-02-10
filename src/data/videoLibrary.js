/**
 * Smirkle Video Library
 * Centralized video data management for the 'Try Not to Laugh' challenge
 * 
 * Schema: { id, title, url, difficulty, tags, previewImage, punchlineTimestamp }
 * Difficulty levels: Easy, Medium, Hard
 * punchlineTimestamp: Time in seconds where the "punchline" occurs
 */

// Difficulty level constants
export const DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

// Video database with high-quality Pexels content
export const VIDEO_DATABASE = [
  {
    id: 'video_001',
    title: 'Funny Cat Jumps',
    url: 'https://videos.pexels.com/video-files/4025164/4025164-uhd_2560_1440_25fps.mp4',
    difficulty: DIFFICULTY.EASY,
    tags: ['animals', 'cats', 'comedy', 'pets', 'funny'],
    previewImage: 'https://images.pexels.com/videos/4025164/free-video-4025164.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 8.5
  },
  {
    id: 'video_002',
    title: 'Comedy Club Performance',
    url: 'https://videos.pexels.com/video-files/856973/856973-uhd_2560_1440_25fps.mp4',
    difficulty: DIFFICULTY.MEDIUM,
    tags: ['stand-up', 'comedy', 'adult', 'live', 'humor'],
    previewImage: 'https://images.pexels.com/videos/856973/free-video-856973.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 15.2
  },
  {
    id: 'video_003',
    title: 'Stand-up Comedy Special',
    url: 'https://videos.pexels.com/video-files/855070/855070-uhd_2560_1440_25fps.mp4',
    difficulty: DIFFICULTY.HARD,
    tags: ['stand-up', 'comedy', 'special', 'professional', 'jokes'],
    previewImage: 'https://images.pexels.com/videos/855070/free-video-855070.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 22.8
  },
  {
    id: 'video_004',
    title: 'Baby Laughing Hysterically',
    url: 'https://videos.pexels.com/video-files/3196344/3196344-uhd_2560_1440_25fps.mp4',
    difficulty: DIFFICULTY.EASY,
    tags: ['babies', 'laughter', 'cute', 'funny', 'kids'],
    previewImage: 'https://images.pexels.com/videos/3196344/free-video-3196344.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 6.3
  },
  {
    id: 'video_005',
    title: 'Dog Fail Compilation',
    url: 'https://videos.pexels.com/video-files/4033003/4033003-uhd_2560_1440_30fps.mp4',
    difficulty: DIFFICULTY.MEDIUM,
    tags: ['dogs', 'fail', 'funny', 'animals', 'compilation'],
    previewImage: 'https://images.pexels.com/videos/4033003/free-video-4033003.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 12.7
  },
  {
    id: 'video_006',
    title: 'Improv Comedy Skit',
    url: 'https://videos.pexels.com/video-files/854671/854671-uhd_2560_1440_24fps.mp4',
    difficulty: DIFFICULTY.HARD,
    tags: ['improv', 'comedy', 'skit', 'funny', 'actors'],
    previewImage: 'https://images.pexels.com/videos/854671/free-video-854671.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 18.4
  },
  {
    id: 'video_007',
    title: 'Funny Office Moments',
    url: 'https://videos.pexels.com/video-files/3205917/3205917-uhd_2560_1440_25fps.mp4',
    difficulty: DIFFICULTY.EASY,
    tags: ['office', 'work', 'funny', 'professional', 'everyday'],
    previewImage: 'https://images.pexels.com/videos/3205917/free-video-3205917.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 9.1
  },
  {
    id: 'video_008',
    title: 'Stand-up Comedian Routine',
    url: 'https://videos.pexels.com/video-files/856980/856980-uhd_2560_1440_25fps.mp4',
    difficulty: DIFFICULTY.HARD,
    tags: ['stand-up', 'comedian', 'routine', 'adult', 'humor'],
    previewImage: 'https://images.pexels.com/videos/856980/free-video-856980.jpg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    punchlineTimestamp: 25.6
  }
];

/**
 * Utility functions for video data management
 */

/**
 * Get all videos from the database
 * @returns {Array} Complete video database array
 */
export const getAllVideos = () => {
  return VIDEO_DATABASE;
};

/**
 * Filter videos by difficulty level
 * @param {string} difficulty - DIFFICULTY.EASY, DIFFICULTY.MEDIUM, or DIFFICULTY.HARD
 * @returns {Array} Filtered video array
 */
export const getVideosByDifficulty = (difficulty) => {
  return VIDEO_DATABASE.filter(video => video.difficulty === difficulty);
};

/**
 * Find a single video by its unique ID
 * @param {string} id - Video identifier (e.g., 'video_001')
 * @returns {Object|undefined} The video object or undefined if not found
 */
export const getVideoById = (id) => {
  return VIDEO_DATABASE.find(video => video.id === id);
};

/**
 * Filter videos by a specific tag
 * @param {string} tag - Tag to filter by
 * @returns {Array} Array of videos containing the specified tag
 */
export const getVideosByTag = (tag) => {
  return VIDEO_DATABASE.filter(video => video.tags.includes(tag));
};

/**
 * Get a random video from the database
 * @returns {Object} Random video object
 */
export const getRandomVideo = () => {
  const randomIndex = Math.floor(Math.random() * VIDEO_DATABASE.length);
  return VIDEO_DATABASE[randomIndex];
};

/**
 * Search videos by title (case-insensitive)
 * @param {string} searchTerm - Term to search for in video titles
 * @returns {Array} Array of matching videos
 */
export const searchVideosByTitle = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  return VIDEO_DATABASE.filter(video => 
    video.title.toLowerCase().includes(term)
  );
};

/**
 * Get difficulty distribution counts
 * @returns {Object} Count of videos per difficulty level
 */
export const getDifficultyDistribution = () => {
  return {
    easy: VIDEO_DATABASE.filter(v => v.difficulty === DIFFICULTY.EASY).length,
    medium: VIDEO_DATABASE.filter(v => v.difficulty === DIFFICULTY.MEDIUM).length,
    hard: VIDEO_DATABASE.filter(v => v.difficulty === DIFFICULTY.HARD).length
  };
};

/**
 * Shuffled queue manager for anti-repeat gameplay
 */
export class VideoQueueManager {
  /**
   * @param {Array} videoDatabase - Optional custom database, defaults to VIDEO_DATABASE
   */
  constructor(videoDatabase = VIDEO_DATABASE) {
    this.allVideos = videoDatabase;
    this.playedVideos = new Set();
    this.currentQueue = [];
  }

  /**
   * Generates a shuffled queue excluding already played videos
   * Uses Fisher-Yates shuffle algorithm
   * @returns {Array} Shuffled video queue
   */
  generateShuffledQueue() {
    const availableVideos = this.allVideos.filter(
      video => !this.playedVideos.has(video.id)
    );
    
    const shuffled = [...availableVideos];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    this.currentQueue = shuffled;
    return shuffled;
  }

  /**
   * Marks a video as played
   * @param {string} videoId - ID of the video that was played
   */
  markVideoPlayed(videoId) {
    this.playedVideos.add(videoId);
  }

  /**
   * Gets the next video from the queue
   * Regenerates queue if empty
   * @returns {Object|undefined} Next video object or undefined if no videos available
   */
  getNextVideo() {
    if (this.currentQueue.length === 0) {
      this.generateShuffledQueue();
    }
    return this.currentQueue.pop();
  }

  /**
   * Checks if a specific video has been played in the current session
   * @param {string} videoId - ID to check
   * @returns {boolean} True if video has been played
   */
  hasBeenPlayed(videoId) {
    return this.playedVideos.has(videoId);
  }

  /**
   * Gets the count of unique videos played
   * @returns {number} Number of videos played
   */
  getPlayedCount() {
    return this.playedVideos.size;
  }

  /**
   * Gets the count of remaining videos in the queue
   * @returns {number} Number of videos remaining
   */
  getRemainingCount() {
    return this.currentQueue.length;
  }

  /**
   * Gets session statistics
   * @returns {Object} Session stats including counts and played video IDs
   */
  getSessionStats() {
    return {
      totalVideos: this.allVideos.length,
      playedCount: this.getPlayedCount(),
      remainingCount: this.getRemainingCount(),
      playedVideoIds: Array.from(this.playedVideos)
    };
  }

  /**
   * Resets the session - clears played videos and queue
   */
  resetSession() {
    this.playedVideos.clear();
    this.currentQueue = [];
  }
}

/**
 * Pre-loader for video caching
 * Uses <link rel='preload' as='video'> to cache upcoming videos
 */
export class VideoPreFetcher {
  /**
   * Create preload links for the next N videos in queue
   * @param {Array} videos - Array of video objects to preload
   * @param {number} count - Number of videos to preload (default: 3)
   */
  static preloadVideos(videos, count = 3) {
    const videosToPreload = videos.slice(0, count);
    
    videosToPreload.forEach((video, index) => {
      // Check if link already exists
      const existingLink = document.querySelector(
        `link[rel="preload"][as="video"][data-video-id="${video.id}"]`
      );
      
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = video.url;
        link.setAttribute('data-video-id', video.id);
        link.setAttribute('data-preload-index', index);
        document.head.appendChild(link);
        
        console.log(`[VideoPreFetcher] Preloading video ${index + 1}/${count}: ${video.title}`);
      }
    });
    
    // Clean up old preload links (keep only current preloads)
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="video"]');
    preloadLinks.forEach(link => {
      const linkVideoId = link.getAttribute('data-video-id');
      const isInCurrentPreload = videosToPreload.some(v => v.id === linkVideoId);
      if (!isInCurrentPreload) {
        link.remove();
      }
    });
  }
  
  /**
   * Clear all video preload links
   */
  static clearPreloads() {
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="video"]');
    preloadLinks.forEach(link => link.remove());
    console.log('[VideoPreFetcher] Cleared all preload links');
  }
  
  /**
   * Preload a specific video by ID
   * @param {string} videoId - ID of video to preload
   */
  static preloadVideoById(videoId) {
    const video = VIDEO_DATABASE.find(v => v.id === videoId);
    if (video) {
      const existingLink = document.querySelector(
        `link[rel="preload"][as="video"][data-video-id="${videoId}"]`
      );
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = video.url;
        link.setAttribute('data-video-id', videoId);
        document.head.appendChild(link);
        console.log(`[VideoPreFetcher] Preloading: ${video.title}`);
      }
    }
  }
}

// Export singleton instance for app-wide access
export const videoQueueManager = new VideoQueueManager(VIDEO_DATABASE);

// Export default for convenient imports
export default {
  VIDEO_DATABASE,
  DIFFICULTY,
  videoQueueManager,
  VideoPreFetcher,
  getAllVideos,
  getVideosByDifficulty,
  getVideoById,
  getVideosByTag,
  getRandomVideo,
  searchVideosByTitle,
  getDifficultyDistribution
};
