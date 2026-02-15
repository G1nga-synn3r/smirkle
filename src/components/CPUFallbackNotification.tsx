/**
 * CPU Fallback Notification Component
 *
 * Displays a subtle, non-intrusive notification when the app
 * is running in CPU fallback mode.
 */

interface CPUFallbackNotificationProps {
  visible: boolean;
  onDismiss?: () => void;
}

export function CPUFallbackNotification({ visible, onDismiss }: CPUFallbackNotificationProps) {
  if (!visible) return null;

  return (
    <div className="cpu-fallback-notification" onClick={onDismiss}>
      <div className="cpu-fallback-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="16"
          height="16"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="cpu-fallback-message">
        Running in compatibility mode — performance may be reduced
      </span>
      {onDismiss && (
        <button className="cpu-fallback-dismiss" onClick={onDismiss} aria-label="Dismiss">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="14"
            height="14"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default CPUFallbackNotification;
