import React from 'react';
import { Eye, CheckCircle, AlertCircle, EyeOff, Frown, Loader, User } from 'lucide-react';
import { CALIBRATION_STATUS } from '../utils/calibrationLogic';

/**
 * CalibrationOverlay - A centered overlay that guides the user to
 * 'Look at the Camera' for 1 second to stabilize face detection
 * before the TutorialOverlay or game starts.
 *
 * Displays a progress ring and status messages during calibration.
 *
 * Calibration conditions:
 * - Face must be detected
 * - Eyes must be open
 * - Neutral expression (not smiling)
 */
export const CalibrationOverlay = ({ status = 'idle', progress = 0 }) => {
  // Status messages for different calibration states
  const statusMessages = {
    idle: 'Initializing calibration...',
    checking: 'Looking at you...',
    no_face: 'Face not detected',
    eyes_closed: 'Please open your eyes',
    smiling: 'Keep a neutral expression',
    stable: 'Hold still...',
    complete: 'Calibration Complete!',
    failed: 'Calibration failed',
  };

  // Calculate progress ring stroke
  const strokeDashoffset = 283 - (283 * progress) / 100; // 283 is circumference of r=45

  // Determine if calibration is in progress (showing progress ring)
  const showProgress = ['checking', 'stable'].includes(status);
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';
  const isStable = status === 'stable';

  // Status icon based on state
  const getStatusIcon = () => {
    if (isComplete) return CheckCircle;
    if (isFailed) return AlertCircle;
    if (status === 'no_face') return User;
    if (status === 'eyes_closed') return EyeOff;
    if (status === 'smiling') return Frown;
    if (status === 'checking' || status === 'stable') return Eye;
    return Loader;
  };

  const StatusIcon = getStatusIcon();

  // Get icon color based on status
  const getIconColor = () => {
    if (isComplete) return 'text-green-400';
    if (isFailed) return 'text-red-400';
    if (status === 'no_face') return 'text-yellow-400';
    if (status === 'eyes_closed') return 'text-orange-400';
    if (status === 'smiling') return 'text-pink-400';
    return 'text-purple-400';
  };

  // Get card border color
  const getBorderColor = () => {
    if (isComplete) return 'border-green-500/50 shadow-green-500/20';
    if (isFailed) return 'border-red-500/50 shadow-red-500/20';
    if (status === 'stable') return 'border-purple-500/50 shadow-purple-500/20';
    return 'border-purple-500/30';
  };

  // Get header background gradient
  const getHeaderGradient = () => {
    if (isComplete) return 'bg-gradient-to-br from-green-500 to-emerald-600';
    if (isFailed) return 'bg-gradient-to-br from-red-500 to-orange-600';
    if (status === 'stable') return 'bg-gradient-to-br from-purple-500 to-pink-600';
    return 'bg-gradient-to-br from-purple-600 to-pink-600';
  };

  // Calculate remaining time in seconds
  const getRemainingTime = () => {
    if (progress >= 100) return 0;
    return Math.ceil((100 - progress) / 100); // Convert to seconds
  };

  // Get current condition being checked
  const getCurrentCondition = () => {
    switch (status) {
      case 'no_face':
        return 'Ensure your face is visible';
      case 'eyes_closed':
        return 'Keep your eyes open';
      case 'smiling':
        return 'Relax your face';
      case 'checking':
        return 'Checking conditions...';
      case 'stable':
        return `Hold still for ${getRemainingTime()}s`;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-title"
    >
      {/* Calibration content card */}
      <div
        className={`
          relative bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.4)] 
          border p-8 text-center
          transform transition-all animate-fade-in
          ${getBorderColor()}
        `}
      >
        {/* Header with icon */}
        <div className="mb-6">
          <div
            className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg
            ${getHeaderGradient()}
          `}
          >
            <StatusIcon
              className={`w-8 h-8 text-white ${status === 'checking' ? 'animate-pulse' : ''}`}
            />
          </div>

          <h2 id="calibration-title" className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isComplete ? 'Calibration Complete!' : 'Look at the Camera'}
          </h2>
          <p className={`text-sm md:text-base ${getIconColor()}`}>{statusMessages[status]}</p>
        </div>

        {/* Progress ring - only show when in progress */}
        {showProgress && (
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="45"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>

            {/* Percentage in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Success indicator */}
        {isComplete && (
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>
        )}

        {/* Status indicator for failed/progress states */}
        {!isComplete && !isFailed && !showProgress && (
          <div className="mb-4">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getIconColor().replace('text-', 'bg-').replace('400', '500/20')}`}
            >
              <StatusIcon className={`w-5 h-5 ${getIconColor()}`} />
              <span className="font-medium">{getCurrentCondition()}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2 text-sm text-gray-400 mb-4">
          {!isComplete && !isFailed && (
            <>
              <p>• Face must be visible in camera</p>
              <p>• Keep your eyes open</p>
              <p>• Maintain a neutral expression</p>
              <p className="text-purple-300 mt-2">
                Hold for {getRemainingTime()} more second{getRemainingTime() !== 1 ? 's' : ''}
              </p>
            </>
          )}
          {isComplete && (
            <p className="text-green-400">Face detection is stable. Starting game...</p>
          )}
          {isFailed && (
            <p className="text-red-400">{statusMessages[status]}. Please reload and try again.</p>
          )}
        </div>

        {/* Stability indicator bar */}
        {isStable && (
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Pulse animation hint */}
        {!isComplete && !isFailed && showProgress && (
          <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
            <Eye className="w-4 h-4 animate-pulse" />
            <span>Calibrating...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalibrationOverlay;
