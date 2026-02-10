import { useEffect, useCallback } from 'react';
import { Camera, EyeOff, Play, Clock, Zap } from 'lucide-react';

/**
 * TutorialOverlay - A semi-transparent 'How to Play' guide that appears
 * only the very first time a user opens the camera.
 * 
 * Uses LocalStorage to track hasSeenTutorial to ensure one-time display.
 */
export const TutorialOverlay = ({ onComplete }) => {
  // LocalStorage key for tracking tutorial visibility
  const TUTORIAL_STORAGE_KEY = 'smirkle_hasSeenTutorial';

  /**
   * Marks the tutorial as seen in LocalStorage
   */
  const markTutorialSeen = useCallback(() => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  }, []);

  /**
   * Handles the Start Challenge button click.
   * Updates LocalStorage and triggers the onComplete callback.
   */
  const handleStartChallenge = useCallback(() => {
    markTutorialSeen();
    onComplete?.();
  }, [markTutorialSeen, onComplete]);

  /**
   * Handles ESC key press for accessibility
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleStartChallenge();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartChallenge]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      {/* Semi-transparent backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Tutorial content card */}
      <div 
        className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.4)] 
                   border border-purple-500/30 max-w-lg w-full p-4 md:p-6
                   transform transition-all animate-fade-in
                   max-h-[90vh] overflow-y-auto"
      >
        {/* Header with icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4 shadow-lg shadow-purple-500/50">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h2 
            id="tutorial-title" 
            className="text-2xl md:text-3xl font-bold text-white mb-2"
          >
            How to Play Smirkle
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            Read the instructions carefully before you begin!
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-900/50 to-purple-800/30 rounded-xl border border-purple-500/20">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Keep a straight face while the video plays!</h3>
              <p className="text-gray-400 text-sm mt-1">
                Your webcam will monitor your facial expressions in real-time.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-900/50 to-red-800/30 rounded-xl border border-red-500/20">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <span className="text-xl">😮</span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">If you smirk, you lose!</h3>
              <p className="text-gray-400 text-sm mt-1">
                Any detected happiness (smirk detection ≥ 0.3) ends the game immediately.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-900/50 to-green-800/30 rounded-xl border border-green-500/20">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Survive as long as possible</h3>
              <p className="text-gray-400 text-sm mt-1">
                The longer you maintain a neutral expression, the higher your score!
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h4 className="font-semibold text-gray-300 text-sm uppercase tracking-wide">
              Pro Tips
            </h4>
          </div>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Ensure good lighting on your face</li>
            <li>• Stay within the camera frame</li>
            <li>• Avoid sudden movements</li>
          </ul>
        </div>

        {/* Start Challenge Button with glowing accent */}
        <button
          onClick={handleStartChallenge}
          className="group relative w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 
                     text-white text-lg font-bold rounded-xl shadow-lg
                     hover:from-purple-500 hover:via-purple-600 hover:to-blue-500
                     active:scale-[0.98] transition-all duration-200
                     focus:outline-none focus:ring-4 focus:ring-purple-500/30
                     before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r 
                     before:from-transparent before:via-white/20 before:to-transparent 
                     before:opacity-0 hover:before:opacity-100 before:transition-opacity
                     overflow-hidden"
        >
          {/* Animated glow effect */}
          <span className="absolute inset-0 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Button content */}
          <span className="relative flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            Start Challenge
          </span>
        </button>

        {/* Dismiss hint */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Press ESC or click the button above to begin
        </p>
      </div>
    </div>
  );
};

export default TutorialOverlay;
