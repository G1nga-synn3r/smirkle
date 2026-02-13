import React from 'react';

/**
 * WarningBox Component
 * Displays specific warning messages based on Guardian Logic states.
 *
 * @param {string} type - Warning type: 'faceNotCentered', 'eyesClosed', 'lowLight'
 * @param {string} message - Custom message (overrides default if provided)
 * @param {boolean} visible - Whether to show the warning
 * @param {string} className - Additional CSS classes
 */
function WarningBox({ type = 'faceNotCentered', message, visible = false, className = '' }) {
  // Default messages based on warning type
  const defaultMessages = {
    faceNotCentered: 'Face Not Centered',
    eyesClosed: 'Please Open Your Eyes',
    lowLight: 'Room Too Dark',
    smiling: "Don't smile!",
  };

  // Icon components for each warning type
  const icons = {
    faceNotCentered: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    eyesClosed: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
    lowLight: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
    smiling: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  // Background colors based on warning type
  const bgColors = {
    faceNotCentered: 'from-yellow-500/90 to-orange-500/90',
    eyesClosed: 'from-red-500/90 to-pink-500/90',
    lowLight: 'from-gray-600/90 to-gray-800/90',
    smiling: 'from-yellow-400/90 to-orange-400/90',
  };

  // Border colors based on warning type
  const borderColors = {
    faceNotCentered: 'border-yellow-400',
    eyesClosed: 'border-red-400',
    lowLight: 'border-gray-400',
    smiling: 'border-yellow-300',
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  const displayMessage = message || defaultMessages[type] || 'Warning';
  const icon = icons[type] || icons.faceNotCentered;
  const bgClass = bgColors[type] || bgColors.faceNotCentered;
  const borderClass = borderColors[type] || borderColors.faceNotCentered;

  return (
    <div
      className={`
        absolute top-4 left-1/2 transform -translate-x-1/2 z-40
        bg-gradient-to-r ${bgClass}
        backdrop-blur-md
        border-2 ${borderClass}
        rounded-2xl
        px-6 py-4
        shadow-[0_0_30px_rgba(0,0,0,0.5)]
        animate-pulse
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-white">{icon}</div>
        <div className="text-white font-bold text-lg tracking-wide">{displayMessage}</div>
      </div>
    </div>
  );
}

export default WarningBox;
