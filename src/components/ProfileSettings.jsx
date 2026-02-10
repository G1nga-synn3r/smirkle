import { useState, useEffect } from 'react';
import { User, Calendar, FileText, Quote, Eye, EyeOff, Save, X, Vibrate, Volume2, VolumeX, Settings, Monitor, Check } from 'lucide-react';

const STORAGE_KEY = 'smirkle_app_settings';
const HAPTIC_STORAGE_KEY = 'smirkle_haptic_enabled';
const VOLUME_STORAGE_KEY = 'smirkle_volume';
const VIDEO_QUALITY_STORAGE_KEY = 'smirkle_video_quality';

// Video quality options
const VIDEO_QUALITY_OPTIONS = [
  { value: '240', label: '240p (Low)', description: 'Best for slow connections' },
  { value: '360', label: '360p (Medium)', description: 'Balanced quality' },
  { value: '480', label: '480p (SD)', description: 'Standard definition' },
  { value: '720', label: '720p (HD)', description: 'High definition' },
  { value: '1080', label: '1080p (Full HD)', description: 'Best quality' },
];

// Default settings
const defaultSettings = {
  hapticEnabled: true,
  volume: 100,
  videoQuality: '720',
};

const fieldLabels = {
  name: 'Name',
  birthdate: 'Birthdate',
  bio: 'Bio',
  motto: 'Motto',
};

const fieldPlaceholders = {
  name: 'Enter your name',
  birthdate: 'YYYY-MM-DD',
  bio: 'Tell us about yourself...',
  motto: 'Your favorite saying...',
};

const fieldIcons = {
  name: User,
  birthdate: Calendar,
  bio: FileText,
  motto: Quote,
};

export default function ProfileSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [volume, setVolume] = useState(100);
  const [videoQuality, setVideoQuality] = useState('720');

  // Load all settings from localStorage on mount
  useEffect(() => {
    // Load haptic preference
    const savedHaptic = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (savedHaptic !== null) {
      setHapticEnabled(JSON.parse(savedHaptic));
    }

    // Load volume
    const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (savedVolume !== null) {
      setVolume(parseInt(savedVolume, 10));
    }

    // Load video quality
    const savedQuality = localStorage.getItem(VIDEO_QUALITY_STORAGE_KEY);
    if (savedQuality !== null) {
      setVideoQuality(savedQuality);
    }

    // Load other settings
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...defaultSettings, ...parsed }));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Save haptic preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(hapticEnabled));
  }, [hapticEnabled]);

  // Save volume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
  }, [volume]);

  // Save video quality to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(VIDEO_QUALITY_STORAGE_KEY, videoQuality);
  }, [videoQuality]);

  // Save to localStorage whenever settings change (debounced)
  useEffect(() => {
    if (isDirty) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }, 1000); // Debounce 1 second to reduce I/O
      return () => clearTimeout(timeoutId);
    }
  }, [settings, isDirty]);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    setIsDirty(true);
  };

  const handleVideoQualityChange = (quality) => {
    setVideoQuality(quality);
    setIsDirty(true);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    setHapticEnabled(true);
    setVolume(100);
    setVideoQuality('720');
    localStorage.removeItem(STORAGE_KEY);
    setIsDirty(false);
    setShowResetConfirm(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsDirty(false);
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX size={20} />;
    if (volume < 50) return <Volume2 size={20} className="text-orange-400" />;
    if (volume < 80) return <Volume2 size={20} className="text-yellow-400" />;
    return <Volume2 size={20} className="text-green-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            Settings
          </h1>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-sm text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleReset}
              onMouseEnter={() => setShowResetConfirm(true)}
              onMouseLeave={() => setShowResetConfirm(false)}
              className="px-4 py-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              <X size={18} />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                isDirty
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 shadow-md'
                  : 'bg-slate-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>

        {/* Reset Confirmation Tooltip */}
        {showResetConfirm && (
          <div className="absolute mt-16 mr-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg shadow-lg border border-slate-700 z-10">
            Reset all settings to defaults?
          </div>
        )}

        {/* Reset Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-white mb-2">Reset Settings?</h3>
              <p className="text-gray-400 mb-6">
                This will permanently delete all your profile settings. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 bg-slate-700 rounded-xl text-white hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Haptic Feedback Toggle */}
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${hapticEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-gray-400'}`}>
                  <Vibrate size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Haptic Feedback</h3>
                  <p className="text-sm text-gray-400">Vibrate when a smirk is detected</p>
                </div>
              </div>
              <button
                onClick={() => setHapticEnabled(!hapticEnabled)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${
                  hapticEnabled 
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/30' 
                    : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                    hapticEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${volume > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-gray-400'}`}>
                  {getVolumeIcon()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Volume</h3>
                  <p className="text-sm text-gray-400">Adjust sound effects volume</p>
                </div>
              </div>
              <span className="text-white font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Mute</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Video Quality Selector */}
          <div className="mb-6 p-5 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-green-500/20 text-green-400">
                <Monitor size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Video Quality</h3>
                <p className="text-sm text-gray-400">Select video playback quality</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VIDEO_QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleVideoQualityChange(option.value)}
                  className={`relative p-4 rounded-xl text-left transition-all ${
                    videoQuality === option.value
                      ? 'bg-gradient-to-br from-green-500/30 to-cyan-500/30 border-2 border-green-500/50'
                      : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700/70'
                  }`}
                >
                  {videoQuality === option.value && (
                    <div className="absolute top-2 right-2">
                      <Check size={16} className="text-green-400" />
                    </div>
                  )}
                  <div className={`font-semibold ${videoQuality === option.value ? 'text-white' : 'text-gray-300'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-medium rounded-xl transition-all"
          >
            Reset All Settings to Default
          </button>
        </div>
      </div>
    </div>
  );
}
