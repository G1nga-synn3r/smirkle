import React from 'react';
import { Gamepad2, Trophy, Video, VolumeX, Volume2 } from 'lucide-react';

export default function Navbar({ currentView, onNavigate, isMuted, onToggleMute }) {
  const navItems = [
    { id: 'game', label: 'Game', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'submit', label: 'Submit', icon: Video }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e27]/90 backdrop-blur-md border-b border-blue-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Image - Links to Game */}
          <button
            onClick={() => onNavigate('game')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Smirkle Logo" className="h-10 w-auto" />
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25' 
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mute Toggle & User Stats */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onToggleMute}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-green-400" />
              )}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-yellow-400">🏆</span>
              <span className="text-sm font-medium text-gray-300">1,247</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
          </div>
        </div>
      </div>
    </nav>
  );
}
