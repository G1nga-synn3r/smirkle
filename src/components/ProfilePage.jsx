import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Link as LinkIcon, Award, Trophy, Flame } from 'lucide-react';

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
    }
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
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              Stats
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                  <Flame size={24} />
                  <span className="text-2xl font-bold">{stats.longestStreak}</span>
                </div>
                <p className="text-sm text-gray-300">Longest Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                  <Trophy size={24} />
                  <span className="text-2xl font-bold">{stats.totalWins}</span>
                </div>
                <p className="text-sm text-gray-300">Total Wins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 mb-1">
                  <Award size={24} />
                  <span className="text-2xl font-bold">{stats.pokerFaceLevel}</span>
                </div>
                <p className="text-sm text-gray-300">Poker Face</p>
              </div>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <MapPin size={16} />
                Location
              </label>
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
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <LinkIcon size={16} />
                Social Links
              </label>
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
          </div>
        </div>
      </div>
    </div>
  );
}
