import { useState, useEffect } from 'react';
import { Search, Users, UserPlus, Shield, ShieldOff, Award, Heart, Trophy, Clock, Check, X, Bell, Loader } from 'lucide-react';
import { searchUsers, isFriend, toggleFriend } from '../services/userService';
import { getCurrentUser } from '../utils/auth';

const STORAGE_KEY = 'smirkle_social_data';

// Mock friend requests
const initialFriendRequests = [
  { id: 1, name: 'Emma Wilson', username: '@emmaw', avatar: null, time: '2 hours ago' },
  { id: 2, name: 'James Brown', username: '@jamesb', avatar: null, time: '5 hours ago' },
];

// Mock activity notifications
const mockActivities = [
  { id: 1, user: 'Alex', action: 'set a 2-minute smirk-free record!', time: '2 min ago', type: 'achievement' },
  { id: 2, user: 'Sarah', action: 'earned the "Poker Face Master" badge', time: '15 min ago', type: 'badge' },
  { id: 3, user: 'Jordan', action: 'challenged you to a match', time: '1 hour ago', type: 'challenge' },
  { id: 4, user: 'Emma', action: 'is now your friend', time: '3 hours ago', type: 'friend' },
  { id: 5, user: 'Taylor', action: 'reached a 5-day streak!', time: '5 hours ago', type: 'streak' },
];

// Available badges
const allBadges = [
  { id: 1, name: 'Early Adopter', icon: '🚀', description: 'Joined during beta', earned: true, earnedDate: '2024-01-15' },
  { id: 2, name: 'The Poker Face', icon: '🎭', description: 'Maintained neutral expression for 10 minutes', earned: true, earnedDate: '2024-02-01' },
  { id: 3, name: 'Streak Master', icon: '🔥', description: '7-day smirk-free streak', earned: true, earnedDate: '2024-02-10' },
  { id: 4, name: 'Champion', icon: '🏆', description: 'Won 10 matches', earned: true, earnedDate: '2024-02-15' },
  { id: 5, name: 'Social Butterfly', icon: '🦋', description: 'Connected with 20 friends', earned: false, earnedDate: null },
  { id: 6, name: 'Marathoner', icon: '🏃', description: '30-minute smirk-free session', earned: false, earnedDate: null },
  { id: 7, name: 'Perfectionist', icon: '💎', description: '100% accuracy in a session', earned: false, earnedDate: null },
  { id: 8, name: 'Legend', icon: '⭐', description: 'Reach level 50', earned: false, earnedDate: null },
];

export default function SocialHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState(initialFriendRequests);
  const [privacyMode, setPrivacyMode] = useState('Friends Only');
  const [activities, setActivities] = useState(mockActivities);
  const [badges, setBadges] = useState(allBadges);
  const [activeTab, setActiveTab] = useState('feed');
  const [currentUser, setCurrentUser] = useState(null);
  const [friendsList, setFriendsList] = useState([]);

  // Load privacy setting from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_privacy`);
    if (saved) {
      setPrivacyMode(saved);
    }

    // Get current user
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Save privacy setting when changed
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_privacy`, privacyMode);
  }, [privacyMode]);

  // Search users with debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery, currentUser?.id);
        
        // Add friend status to each result
        const enrichedResults = await Promise.all(
          results.map(async (user) => {
            const isFriendStatus = await isFriend(currentUser?.id, user.id);
            return {
              ...user,
              isFriend: isFriendStatus,
              avatar: user.profile_picture_url || null
            };
          })
        );
        
        setSearchResults(enrichedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.id]);

  const handleAcceptRequest = (id) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleRejectRequest = (id) => {
    setFriendRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleAddFriend = async (userId) => {
    try {
      await toggleFriend(currentUser?.id, userId);
      
      // Update search results to reflect friend status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, isFriend: !user.isFriend }
            : user
        )
      );
    } catch (error) {
      console.error('Error toggling friend:', error);
    }
  };

  const earnedBadgesCount = badges.filter(b => b.earned).length;
  const totalBadgesCount = badges.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Social Hub
          </h1>
          {/* Privacy Toggle */}
          <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-xl rounded-xl p-2 border border-white/10">
            <span className={`text-sm px-3 py-1 rounded-lg transition-colors ${privacyMode === 'Public' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}>
              <Shield size={16} className="inline mr-1" />
              Public
            </span>
            <button
              onClick={() => setPrivacyMode(privacyMode === 'Public' ? 'Friends Only' : 'Public')}
              className={`relative w-12 h-6 rounded-full transition-colors ${privacyMode === 'Public' ? 'bg-cyan-500' : 'bg-purple-500'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${privacyMode === 'Public' ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm px-3 py-1 rounded-lg transition-colors ${privacyMode === 'Friends Only' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400'}`}>
              <ShieldOff size={16} className="inline mr-1" />
              Friends Only
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'feed', label: 'Activity Feed', icon: Bell },
            { id: 'find', label: 'Find Friends', icon: Search },
            { id: 'requests', label: `Requests (${friendRequests.length})`, icon: UserPlus },
            { id: 'badges', label: 'Badges', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'bg-slate-800/80 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Activity Feed */}
          {activeTab === 'feed' && (
            <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Bell className="text-cyan-400" size={24} />
                Activity Feed
              </h2>
              <div className="space-y-4">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-2xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'achievement' ? 'bg-amber-500/20 text-amber-400' :
                      activity.type === 'badge' ? 'bg-purple-500/20 text-purple-400' :
                      activity.type === 'challenge' ? 'bg-red-500/20 text-red-400' :
                      activity.type === 'friend' ? 'bg-green-500/20 text-green-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {activity.type === 'achievement' && <Trophy size={20} />}
                      {activity.type === 'badge' && <Award size={20} />}
                      {activity.type === 'challenge' && <Heart size={20} />}
                      {activity.type === 'friend' && <Users size={20} />}
                      {activity.type === 'streak' && <Clock size={20} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        <span className="font-semibold text-cyan-400">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Find Friends */}
          {activeTab === 'find' && (
            <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Search className="text-cyan-400" size={24} />
                Find Friends
              </h2>
              
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                />
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {isSearching && searchQuery.trim().length > 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader size={24} className="animate-spin text-cyan-400" />
                  </div>
                )}
                {!isSearching && searchResults.length > 0 && searchResults.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-2xl hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.display_name} className="w-full h-full object-cover" />
                      ) : (
                        (user.display_name || user.username)[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{user.display_name || user.username}</p>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      {user.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{user.bio}</p>}
                    </div>
                    <button
                      onClick={() => handleAddFriend(user.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-opacity whitespace-nowrap ${
                        user.isFriend 
                          ? 'bg-green-600/50 hover:bg-green-600/70' 
                          : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90'
                      }`}
                    >
                      {user.isFriend ? (
                        <>
                          <Check size={18} />
                          Friend
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                ))}
                {!isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No users found for "{searchQuery}"</p>
                )}
                {searchQuery.trim().length === 0 && (
                  <p className="text-center text-gray-400 py-8">Start typing to search for players...</p>
                )}
              </div>
            </div>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
            <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-cyan-400" size={24} />
                Friend Requests
              </h2>
              
              {friendRequests.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No pending friend requests</p>
              ) : (
                <div className="space-y-3">
                  {friendRequests.map(request => (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-2xl"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
                        {request.avatar ? (
                          <img src={request.avatar} alt={request.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          request.name[0]
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{request.name}</p>
                        <p className="text-sm text-gray-400">{request.username}</p>
                        <p className="text-xs text-gray-500 mt-1">{request.time}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          {activeTab === 'badges' && (
            <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Award className="text-cyan-400" size={24} />
                  Badges
                </h2>
                <div className="text-sm text-gray-400">
                  <span className="text-cyan-400 font-semibold">{earnedBadgesCount}</span> / {totalBadgesCount} earned
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                    style={{ width: `${(earnedBadgesCount / totalBadgesCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map(badge => (
                  <div
                    key={badge.id}
                    className={`relative p-6 rounded-2xl text-center transition-all ${
                      badge.earned
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 hover:scale-105'
                        : 'bg-slate-700/30 border border-white/10 opacity-50 grayscale'
                    }`}
                  >
                    <div className="text-4xl mb-3">{badge.icon}</div>
                    <h3 className={`font-semibold mb-1 ${badge.earned ? 'text-white' : 'text-gray-400'}`}>
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-400">{badge.description}</p>
                    {badge.earned && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
