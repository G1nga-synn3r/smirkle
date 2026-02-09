import React from 'react';
import { Eye, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * CalibrationOverlay - A centered overlay that guides the user to
 * 'Look at the Camera' for 3 seconds to stabilize face detection
 * before the TutorialOverlay or game starts.
 * 
 * Displays a progress ring and status messages during calibration.
 */
export const CalibrationOverlay = ({ 
  status = 'waiting', 
  progress = 0 
}) => {
  // Status messages for different calibration states
  const statusMessages = {
    waiting: 'Detecting face...',
    detecting: 'Looking at you...',
    stable: 'Hold still...',
    complete: 'Ready!',
    failed: 'Face not detected'
  };

  // Calculate progress ring stroke
  const strokeDashoffset = 283 - (283 * progress) / 100; // 283 is circumference of r=45
  
  // Determine if calibration is successful
  const isComplete = status === 'complete';
  const isFailed = status === 'failed';
  const isStable = status === 'stable';
  
  // Status icon
  const StatusIcon = isComplete ? CheckCircle : isFailed ? AlertCircle : Eye;

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
          border border-purple-500/30 p-8 text-center
          transform transition-all animate-fade-in
          ${isComplete ? 'border-green-500/50 shadow-green-500/20' : ''}
          ${isFailed ? 'border-red-500/50 shadow-red-500/20' : ''}
        `}
      >
        {/* Header with icon */}
        <div className="mb-6">
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg
            ${isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600' : ''}
            ${isFailed ? 'bg-gradient-to-br from-red-500 to-orange-600' : ''}
            ${!isComplete && !isFailed ? 'bg-gradient-to-br from-purple-600 to-pink-600' : ''}
          `}>
            <StatusIcon className="w-8 h-8 text-white" />
          </div>
          
          <h2 
            id="calibration-title" 
            className="text-2xl md:text-3xl font-bold text-white mb-2"
          >
            {isComplete ? 'Calibration Complete!' : 'Look at the Camera'}
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            {statusMessages[status]}
          </p>
        </div>

        {/* Progress ring - only show when not complete/failed */}
        {!isComplete && !isFailed && (
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
              <span className="text-3xl font-bold text-white">
                {Math.round(progress)}%
              </span>
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

        {/* Instructions */}
        <div className="space-y-2 text-sm text-gray-400 mb-4">
          {!isComplete && !isFailed && (
            <>
              <p>• Position your face within the camera frame</p>
              <p>• Keep a neutral expression</p>
              <p>• Stay still for {Math.ceil((100 - progress) * 0.03)} seconds</p>
            </>
          )}
          {isComplete && (
            <p className="text-green-400">
              Face detection is now stable. Starting game...
            </p>
          )}
          {isFailed && (
            <p className="text-red-400">
              Please try again. Make sure your face is visible and well-lit.
            </p>
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
        {!isComplete && !isFailed && (
          <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
            <Eye className="w-4 h-4 animate-pulse" />
            <span>Calibrating detection...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalibrationOverlay;
