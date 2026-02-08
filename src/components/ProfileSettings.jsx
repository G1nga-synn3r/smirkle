import { useState, useEffect } from 'react';
import { User, Calendar, FileText, Quote, Eye, EyeOff, Save, X, Smartphone, SmartphoneVibrate } from 'lucide-react';

const STORAGE_KEY = 'smirkle_profile_settings';
const HAPTIC_STORAGE_KEY = 'smirkle_haptic_enabled';

const defaultSettings = {
  name: {
    value: '',
    isPrivate: false,
  },
  birthdate: {
    value: '',
    isPrivate: false,
  },
  bio: {
    value: '',
    isPrivate: false,
  },
  motto: {
    value: '',
    isPrivate: false,
  },
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

  // Load haptic preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (saved !== null) {
      setHapticEnabled(JSON.parse(saved));
    }
  }, []);

  // Save haptic preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(hapticEnabled));
  }, [hapticEnabled]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to load profile settings:', e);
      }
    }
  }, []);

  // Save to localStorage whenever settings change (debounced)
  useEffect(() => {
    if (isDirty) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }, 1000); // Debounce 1 second to reduce I/O
      return () => clearTimeout(timeoutId);
    }
  }, [settings, isDirty]);

  const handleValueChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
      },
    }));
    setIsDirty(true);
  };

  const handlePrivacyToggle = (field) => {
    setSettings((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        isPrivate: !prev[field].isPrivate,
      },
    }));
    setIsDirty(true);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
    setIsDirty(false);
    setShowResetConfirm(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsDirty(false);
  };

  const getPublicData = () => {
    const publicData = {};
    Object.entries(settings).forEach(([key, data]) => {
      if (!data.isPrivate && data.value.trim()) {
        publicData[key] = data.value;
      }
    });
    return publicData;
  };

  const getPrivateData = () => {
    const privateData = {};
    Object.entries(settings).forEach(([key, data]) => {
      if (data.isPrivate) {
        privateData[key] = {
          value: data.value,
          isPrivate: true,
        };
      }
    });
    return privateData;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Profile Settings
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
          <div className="mb-8 p-5 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${hapticEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-gray-400'}`}>
                  <SmartphoneVibrate size={24} />
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

          {/* Info Banner */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-8">
            <p className="text-cyan-300 text-sm">
              <span className="font-semibold">Privacy Tip:</span> Toggle fields to{' '}
              <span className="text-red-400 font-medium">Private</span> to hide them from other players.
              Private fields are flagged in your user data and won't be visible to anyone else.
            </p>
          </div>

          {/* Settings Fields */}
          <div className="space-y-6">
            {Object.entries(settings).map(([field, data]) => {
              const Icon = fieldIcons[field];
              const isPrivate = data.isPrivate;

              return (
                <div
                  key={field}
                  className={`relative p-4 rounded-xl transition-all ${
                    isPrivate
                      ? 'bg-red-500/5 border border-red-500/20'
                      : 'bg-slate-700/30 border border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <Icon size={18} className={isPrivate ? 'text-red-400' : 'text-cyan-400'} />
                      {fieldLabels[field]}
                    </label>
                    <button
                      onClick={() => handlePrivacyToggle(field)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isPrivate
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
                      {isPrivate ? 'Private' : 'Public'}
                    </button>
                  </div>

                  {field === 'birthdate' ? (
                    <input
                      type="date"
                      value={data.value}
                      onChange={(e) => handleValueChange(field, e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border focus:ring-2 outline-none transition-all ${
                        isPrivate
                          ? 'bg-slate-800/50 border-red-500/30 focus:border-red-500 focus:ring-red-500/20'
                          : 'bg-slate-700/50 border-white/10 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                  ) : field === 'bio' ? (
                    <textarea
                      value={data.value}
                      onChange={(e) => handleValueChange(field, e.target.value)}
                      placeholder={fieldPlaceholders[field]}
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border focus:ring-2 outline-none resize-none transition-all ${
                        isPrivate
                          ? 'bg-slate-800/50 border-red-500/30 focus:border-red-500 focus:ring-red-500/20'
                          : 'bg-slate-700/50 border-white/10 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={data.value}
                      onChange={(e) => handleValueChange(field, e.target.value)}
                      placeholder={fieldPlaceholders[field]}
                      className={`w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 border focus:ring-2 outline-none transition-all ${
                        isPrivate
                          ? 'bg-slate-800/50 border-red-500/30 focus:border-red-500 focus:ring-red-500/20'
                          : 'bg-slate-700/50 border-white/10 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                  )}

                  {/* Privacy Indicator */}
                  {isPrivate && data.value.trim() && (
                    <div className="absolute top-4 right-4">
                      <span className="text-xs text-red-400/70">Hidden from others</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview Section */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">What Others See</h3>
            <div className="bg-gradient-to-br from-slate-700/50 to-purple-800/50 rounded-xl p-4">
              {Object.keys(getPublicData()).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(getPublicData()).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 capitalize">{fieldLabels[key]}:</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No public fields yet. Set some fields to Public to share them.
                </p>
              )}
            </div>
          </div>

          {/* Data Structure Preview */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">User Data Object Structure</h3>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                {JSON.stringify(
                  {
                    publicProfile: getPublicData(),
                    privateProfile: getPrivateData(),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Private fields are stored separately and won't be exposed in API responses to other users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
