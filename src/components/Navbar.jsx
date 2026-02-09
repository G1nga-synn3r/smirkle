import { Home, Trophy, User, Upload } from 'lucide-react';

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
  // Fallback to 'home' if activeTab is undefined
  const activeTabFallback = activeTab || 'home';
  // Validate props and provide defaults
  if (!setActiveTab) {
    console.warn('Navbar: setActiveTab prop is required');
  }

  // Get username once to avoid multiple calls
  const username = user?.username || user?.name || null;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'leaderboard', label: 'Trophy', icon: Trophy },
    { id: 'submit', label: 'Upload', icon: Upload },
    { id: 'profile', label: 'User', icon: User }
  ];

  const handleNavClick = (tabId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (setActiveTab) {
      setActiveTab(tabId);
    }
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 
                 bg-[#0a0e27]/95 backdrop-blur-xl 
                 border-t border-blue-500/20 
                 safe-area-pb"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 20px)' 
      }}
    >
      <div className="flex items-end justify-around h-16 px-2">
        {/* Username Display */}
        {username && (
          <div className="absolute top-2 left-4 text-xs text-cyan-400 font-medium">
            {username}
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTabFallback === item.id;
          
          return (
            <button
              key={item.id}
              onClick={(e) => handleNavClick(item.id, e)}
              className={`
                flex flex-col items-center justify-center 
                flex-1 h-full min-w-[64px] max-w-[100px]
                relative overflow-hidden
                transition-all duration-300 ease-out
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
              aria-label={item.label}
              role="button"
              tabIndex={0}
            >
              {/* Active indicator - glowing gradient bar at top */}
              <div 
                className={`
                  absolute top-0 left-1/2 -translate-x-1/2 
                  w-12 h-1 rounded-full
                  transition-all duration-300 ease-out
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 shadow-lg shadow-purple-500/50' 
                    : 'opacity-0'
                  }
                `}
              />
              
              {/* Icon container with scale and glow effect */}
              <div 
                className={`
                  relative p-2 rounded-xl
                  transition-all duration-300 ease-out
                  ${isActive 
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/25 scale-110' 
                    : 'hover:bg-white/5 scale-100'
                  }
                `}
              >
                <Icon 
                  className={`
                    w-6 h-6 transition-all duration-300
                    ${isActive 
                      ? 'text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text' 
                      : ''
                    }
                  `}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Glow effect for active icon */}
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-xl blur-lg bg-gradient-to-r from-purple-500/30 to-pink-500/30 -z-10"
                  />
                )}
              </div>
              
              {/* Label with fade transition */}
              <span 
                className={`
                  text-[10px] font-medium mt-1
                  transition-all duration-300 ease-out
                  ${isActive 
                    ? 'text-white opacity-100 transform translate-y-0' 
                    : 'opacity-60 transform translate-y-1'
                  }
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
