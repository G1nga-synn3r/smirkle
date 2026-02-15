import { Home, Trophy, User, Upload, Users, Settings } from 'lucide-react';

/**
 * Bottom Navigation Bar Component
 *
 * Features:
 * - Fixed bottom position with high z-index (stays above video player)
 * - Flexbox layout for perfect icon alignment (thumb-friendly)
 * - Active state with vibrant gradient and glow effect
 * - Smooth spring transitions between tabs
 * - Proper prop validation for activeTab and setActiveTab
 * - Displays current username if user is logged in
 */
export default function Navbar({ activeTab, setActiveTab, user }) {
  // Fallback to 'game' if activeTab is undefined
  const activeTabFallback = activeTab || 'game';
  // Validate props and provide defaults
  if (!setActiveTab) {
    console.warn('Navbar: setActiveTab prop is required');
  }

  // Get username once to avoid multiple calls
  const username = user?.username || user?.name || null;

  const navItems = [
    { id: 'game', label: 'Home', icon: Home },
    { id: 'leaderboard', label: 'Trophy', icon: Trophy },
    { id: 'social', label: 'Friends', icon: Users },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'submit', label: 'Upload', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'User', icon: User },
  ];

  const handleNavClick = (tabId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  // Pop art color rotation for nav items
  const popArtColors = [
    { bg: '#FF0000', text: '#FFFFFF' }, // red
    { bg: '#FFFF00', text: '#000000' }, // yellow
    { bg: '#00AAFF', text: '#000000' }, // blue
    { bg: '#FF69B4', text: '#000000' }, // pink
    { bg: '#00FF7F', text: '#000000' }, // lime
    { bg: '#9B59B6', text: '#FFFFFF' }, // purple
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 
                 bg-white border-t-4 border-black
                 safe-area-pb"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        boxShadow: '0 -4px 0 0 #000000',
      }}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {/* Username Display */}
        {username && (
          <div className="absolute top-2 left-4 text-xs font-bold text-black">{username}</div>
        )}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTabFallback === item.id;
          const color = popArtColors[index % popArtColors.length];

          return (
            <button
              key={item.id}
              onClick={(e) => handleNavClick(item.id, e)}
              className={`
                flex flex-col items-center justify-center 
                flex-1 h-full min-w-[64px] max-w-[100px]
                relative overflow-hidden
                transition-all duration-200 ease-out
                ${isActive ? 'text-black' : 'text-gray-600 hover:text-black'}
              `}
              aria-label={item.label}
              role="button"
              tabIndex={0}
            >
              {/* Active indicator - solid color bar at top */}
              <div
                className={`
                  absolute top-0 left-1/2 -translate-x-1/2 
                  w-12 h-1
                  transition-all duration-200 ease-out
                  ${isActive ? 'opacity-100' : 'opacity-0'}
                `}
                style={{ backgroundColor: color.bg }}
              />

              {/* Icon container with pop art style */}
              <div
                className={`
                  relative p-2 rounded-lg
                  transition-all duration-200 ease-out
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
                style={
                  isActive
                    ? {
                        backgroundColor: color.bg,
                        border: '3px solid #000000',
                        boxShadow: '2px 2px 0 0 #000000',
                      }
                    : {}
                }
              >
                <Icon
                  className="w-6 h-6 transition-all duration-200"
                  style={isActive ? { color: color.text } : {}}
                  strokeWidth={isActive ? 3 : 2}
                />
              </div>

              {/* Label with bold font */}
              <span
                className={`
                  text-[10px] font-bold mt-1
                  transition-all duration-200 ease-out
                  ${isActive ? 'text-black' : 'text-gray-500'}
                `}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
