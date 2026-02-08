import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Video, VolumeX, Volume2, User } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import UserAuth from './UserAuth';

export default function Navbar({ currentView, onNavigate, isMuted, onToggleMute }) {
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check for logged in user
    setCurrentUser(getCurrentUser());
  }, []);

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

          {/* Mute Toggle & User/Auth Section */}
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
            
            {/* User Stats */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-yellow-400">🏆</span>
              <span className="text-sm font-medium text-gray-300">1,247</span>
            </div>
            
            {/* Login Button / User Profile */}
            {currentUser ? (
              <button 
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-white">{currentUser.username}</p>
                  {currentUser.motto && (
                    <p className="text-xs text-gray-400 truncate max-w-[120px]">{currentUser.motto}</p>
                  )}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* UserAuth Modal */}
      <UserAuth 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)}
        onAuthChange={(user) => setCurrentUser(user)}
      />
    </nav>
  );
}
