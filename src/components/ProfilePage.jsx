import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Link as LinkIcon, Award, Trophy, Flame, Eye, EyeOff, Lock } from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import { getUserBestScore, getUserScores, getUserLifetimeScore } from '../services/scoreService';
import { calculateLevel, getEarnedBadges, getNextBadge } from '../utils/levels';

const STORAGE_KEY = 'smirkle_user_profile';

const defaultStats = {
  longestStreak: 0,
  totalWins: 0,
  pokerFaceLevel: 1,
};

const defaultProfile = {
  bio: '',
  socialLinks: { facebook: '', instagram: '', github: '' },
  location: '',
  avatar: null,
  stats: defaultStats,
  privacy: {
    bio: 'public',
    location: 'public',
    socialLinks: 'public',
    stats: 'public'
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(defaultProfile);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [zoom, setZoom] = useState(1);
  const [bestScore, setBestScore] = useState(null);
  const [allScores, setAllScores] = useState([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [lifetimeScore, setLifetimeScore] = useState(0);
  const [userLevel, setUserLevel] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [nextBadge, setNextBadge] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile({ ...defaultProfile, ...parsed });
        setEditForm({ ...defaultProfile, ...parsed });
      } catch (e) {
        console.error('Failed to load profile:', e);
      }

      // Load user's best score from Firestore
    const loadUserScores = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser?.id) {
          const best = await getUserBestScore(currentUser.id);
          if (best) {
            setBestScore(best);
          }
          
          // Also load all recent scores for later display
          const scores = await getUserScores(currentUser.id, 10);
          if (scores && scores.length > 0) {
            setAllScores(scores);
            
            // Update stats from best score
            setProfile(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                highestScore: best?.score_value || 0,
                totalScoresSubmitted: scores.length
              }
            }));
          }
          
          // Load lifetime score and calculate level
          const lifetime = await getUserLifetimeScore(currentUser.id);
          setLifetimeScore(lifetime);
          
          // Calculate level based on lifetime score
          const levelInfo = calculateLevel(lifetime);
          setUserLevel(levelInfo);
          
          // Get earned badges
          const badges = getEarnedBadges(levelInfo.level);
          setEarnedBadges(badges);
          
          // Get next badge info
          const nextBadgeInfo = getNextBadge(levelInfo.level);
          setNextBadge(nextBadgeInfo);
        }
      } catch (error) {
        console.error('Error loading user scores:', error);
      } finally {
        setIsLoadingScores(false);
      }
    };

    loadUserScores();
  }, []);

  // Save to localStorage whenever profile changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
      const scale = img.width / 300;
      ctx.clearRect(0, 0, 200, 200);
      ctx.drawImage(
        img,
        cropArea.x * scale,
        cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale,
        0,
        0,
        200,
        200
      );
      setCroppedImage(canvas.toDataURL('image/jpeg', 0.9));
      setShowCropper(false);
      setOriginalImage(null);
    };
  };

  const handleSave = () => {
    const updatedProfile = {
      ...editForm,
      avatar: croppedImage || profile.avatar,
      stats: profile.stats,
    };
    setProfile(updatedProfile);
    setEditForm(updatedProfile);
    setCroppedImage(null);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setCroppedImage(null);
    setIsEditing(false);
    setShowCropper(false);
    setOriginalImage(null);
  };

  const stats = profile.stats;

  // Helper function to check if a field is visible to others
  const isFieldPublic = (fieldName) => {
    return profile.privacy?.[fieldName] === 'public';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Profile
          </h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              {croppedImage || profile.avatar ? (
                <img
                  src={croppedImage || profile.avatar}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gradient-to-r from-cyan-400 to-purple-500 shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                  {profile.bio ? profile.bio[0].toUpperCase() : '?'}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera size={20} />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Cropper Modal */}
            {showCropper && originalImage && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold text-white mb-4">Crop Profile Picture</h3>
                  <div className="relative overflow-hidden rounded-xl mb-4" style={{ height: 300 }}>
                    <img
                      src={originalImage}
                      alt="Crop"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ transform: `scale(${zoom})` }}
                    />
                    <div
                      className="absolute border-2 border-cyan-400 rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 200,
                        height: 200,
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="text-white text-sm">Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                  </div>
                  <canvas ref={canvasRef} width={200} height={200} className="hidden" />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCropper(false);
                        setOriginalImage(null);
                      }}
                      className="flex-1 py-3 bg-slate-700 rounded-xl text-white hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCrop}
                      className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl p-6 mb-8 border border-amber-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Award className="text-amber-400" size={20} />
                {isLoadingScores ? 'Loading Stats...' : 'Game Stats'}
              </h2>
              {isEditing && (
                <button
                  onClick={() => 
                    setEditForm({
                      ...editForm,
                      privacy: {
                        ...editForm.privacy,
                        stats: editForm.privacy?.stats === 'public' ? 'private' : 'public'
                      }
                    })
                  }
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors"
                  title={editForm.privacy?.stats === 'public' ? 'Everyone can see this' : 'Only you can see this'}
                >
                  {editForm.privacy?.stats === 'public' ? (
                    <>
                      <Eye size={14} className="text-cyan-400" />
                      <span className="text-cyan-400">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} className="text-amber-400" />
                      <span className="text-amber-400">Private</span>
                    </>
                  )}
                </button>
              )}
              {!isEditing && profile.privacy?.stats === 'private' && (
                <Lock size={14} className="text-amber-400" title="This field is private" />
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                  <Trophy size={24} />
                  <span className="text-2xl font-bold">{bestScore ? Math.floor(bestScore.score_value) : 0}</span>
                </div>
                <p className="text-sm text-gray-300">Best Score</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                  <Flame size={24} />
                  <span className="text-2xl font-bold">{bestScore ? bestScore.survival_time.toFixed(1) : '0'}s</span>
                </div>
                <p className="text-sm text-gray-300">Best Time</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
                  <Award size={24} />
                  <span className="text-2xl font-bold">{allScores.length}</span>
                </div>
                <p className="text-sm text-gray-300">Games Played</p>
              </div>
            </div>
          </div>

          {/* Level & Progress Card */}
          {userLevel && (
            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-6 mb-8 border border-purple-500/30">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-300 mb-2">Current Level</p>
                <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {userLevel.level}
                </div>
              </div>
              
              {/* Lifetime Score */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-1">Lifetime Score</p>
                <p className="text-2xl font-bold text-cyan-300">
                  {lifetimeScore.toLocaleString()}
                </p>
              </div>
              
              {/* Progress to Next Level */}
              {userLevel.level < 100 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-300">Progress to Level {userLevel.level + 1}</p>
                    <p className="text-xs text-gray-400">{userLevel.progressPercentage}%</p>
                  </div>
                  <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden border border-purple-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${userLevel.progressPercentage}%` }}
                    />
                  </div>
                  {userLevel.pointsNeededForNext > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {userLevel.pointsNeededForNext.toLocaleString()} points until next level
                    </p>
                  )}
                </div>
              )}
              
              {userLevel.level === 100 && (
                <div className="text-center mb-6">
                  <p className="text-lg font-bold text-yellow-400">🏆 You've Reached Maximum Level! 🏆</p>
                </div>
              )}
            </div>
          )}

          {/* Badges Card */}
          {earnedBadges.length > 0 || nextBadge && (
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl p-6 mb-8 border border-amber-500/30">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award size={20} className="text-amber-400" />
                Achievements
              </h2>
              
              {/* Earned Badges */}
              {earnedBadges.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-300 mb-3">Earned Badges ({earnedBadges.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {earnedBadges.map((badge) => (
                      <div key={badge.level} className="flex flex-col items-center">
                        <div className="text-4xl mb-2">{badge.emoji}</div>
                        <p className="text-xs text-center text-amber-300 font-semibold">{badge.name}</p>
                        <p className="text-xs text-gray-400">Level {badge.level}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Next Badge */}
              {nextBadge && (
                <div className="border-t border-amber-500/20 pt-4">
                  <p className="text-sm text-gray-300 mb-3">Next Badge</p>
                  <div className="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl opacity-50">{nextBadge.emoji}</div>
                      <div>
                        <p className="text-sm font-semibold text-amber-300">{nextBadge.name}</p>
                        <p className="text-xs text-gray-400">Level {nextBadge.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Points needed</p>
                      <p className="text-sm font-bold text-cyan-400">
                        {Math.max(0, nextBadge.pointsNeeded - lifetimeScore).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Privacy Notice - shown during edit */}
          {isEditing && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-6">
              <p className="text-sm text-cyan-300 flex items-start gap-2">
                <Eye size={16} className="mt-0.5 flex-shrink-0" />
                <span><strong>Public fields</strong> are visible to other players. <strong>Private fields</strong> are only visible to you.</span>
              </p>
            </div>
          )}

          {/* Profile Fields */}
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">Bio</label>
                {isEditing && (
                  <button
                    onClick={() => 
                      setEditForm({
                        ...editForm,
                        privacy: {
                          ...editForm.privacy,
                          bio: editForm.privacy?.bio === 'public' ? 'private' : 'public'
                        }
                      })
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors"
                    title={editForm.privacy?.bio === 'public' ? 'Everyone can see this' : 'Only you can see this'}
                  >
                    {editForm.privacy?.bio === 'public' ? (
                      <>
                        <Eye size={14} className="text-cyan-400" />
                        <span className="text-cyan-400">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="text-amber-400" />
                        <span className="text-amber-400">Private</span>
                      </>
                    )}
                  </button>
                )}
                {!isEditing && profile.privacy?.bio === 'private' && (
                  <Lock size={14} className="text-amber-400" title="This field is private" />
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none resize-none"
                />
              ) : (
                <p className="text-white">{profile.bio || 'No bio yet'}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                  <MapPin size={16} />
                  Location
                </label>
                {isEditing && (
                  <button
                    onClick={() => 
                      setEditForm({
                        ...editForm,
                        privacy: {
                          ...editForm.privacy,
                          location: editForm.privacy?.location === 'public' ? 'private' : 'public'
                        }
                      })
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors"
                    title={editForm.privacy?.location === 'public' ? 'Everyone can see this' : 'Only you can see this'}
                  >
                    {editForm.privacy?.location === 'public' ? (
                      <>
                        <Eye size={14} className="text-cyan-400" />
                        <span className="text-cyan-400">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="text-amber-400" />
                        <span className="text-amber-400">Private</span>
                      </>
                    )}
                  </button>
                )}
                {!isEditing && profile.privacy?.location === 'private' && (
                  <Lock size={14} className="text-amber-400" title="This field is private" />
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Where are you?"
                  className="w-full px-4 py-3 bg-slate-700/50 rounded-xl text-white placeholder-gray-400 border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                />
              ) : (
                <p className="text-white flex items-center gap-2">
                  {profile.location || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </p>
              )}
            </div>

            {/* Social Links */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                  <LinkIcon size={16} />
                  Social Links
                </label>
                {isEditing && (
                  <button
                    onClick={() => 
                      setEditForm({
                        ...editForm,
                        privacy: {
                          ...editForm.privacy,
                          socialLinks: editForm.privacy?.socialLinks === 'public' ? 'private' : 'public'
                        }
                      })
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors"
                    title={editForm.privacy?.socialLinks === 'public' ? 'Everyone can see this' : 'Only you can see this'}
                  >
                    {editForm.privacy?.socialLinks === 'public' ? (
                      <>
                        <Eye size={14} className="text-cyan-400" />
                        <span className="text-cyan-400">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="text-amber-400" />
                        <span className="text-amber-400">Private</span>
                      </>
                    )}
                  </button>
                )}
                {!isEditing && profile.privacy?.socialLinks === 'private' && (
                  <Lock size={14} className="text-amber-400" title="This field is private" />
                )}
              </div>
              <div className="space-y-3">
                {['facebook', 'instagram', 'github'].map((platform) => (
                  <div key={platform} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-400 capitalize">{platform}</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.socialLinks[platform] || ''}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            socialLinks: { ...editForm.socialLinks, [platform]: e.target.value },
                          })
                        }
                        placeholder={`Your ${platform} username`}
                        className="flex-1 px-4 py-2 bg-slate-700/50 rounded-lg text-white placeholder-gray-400 border border-white/10 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
                      />
                    ) : (
                      <span className="text-white">
                        {profile.socialLinks?.[platform] || (
                          <span className="text-gray-400">Not connected</span>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Scores */}
            {allScores.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Trophy size={16} />
                  Recent Scores
                </label>
                <div className="space-y-2">
                  {allScores.slice(0, 5).map((score, index) => (
                    <div key={score.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400 font-bold">#{index + 1}</span>
                        <div>
                          <p className="text-white font-medium">{Math.floor(score.score_value)} points</p>
                          <p className="text-xs text-gray-400">{score.survival_time.toFixed(1)}s • {score.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-semibold">{Math.floor(score.survival_time)}s</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
