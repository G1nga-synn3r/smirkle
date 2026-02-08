import { useState, useEffect } from 'react';
import { User, Calendar, FileText, Quote, Eye, EyeOff, Save, Check, Shield, Trash2, Download } from 'lucide-react';

const STORAGE_KEY = 'smirkle_user_data';

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

export default function UserProfile() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    }
  }, []);

  const handleValueChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
      },
    }));
    // Hide success message when user makes changes
    setSaveSuccess(false);
  };

  const handlePrivacyToggle = (field) => {
    setSettings((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        isPrivate: !prev[field].isPrivate,
      },
    }));
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulate a brief delay for better UX
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setSaveSuccess(true);
      } catch (e) {
        console.error('Failed to save user data:', e);
      } finally {
        setIsSaving(false);
      }
    }, 500);
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

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY);
      setSettings(defaultSettings);
      setSaveSuccess(false);
    }
  };

  const handleDownloadData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      profileSettings: settings,
      publicData: getPublicData(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smirkle-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            User Profile
          </h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              isSaving
                ? 'bg-slate-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 shadow-md'
            }`}
          >
            {isSaving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check size={18} />
                Changes Saved
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 animate-fade-in">
            <Check size={18} className="text-green-400" />
            <span className="text-green-300 text-sm font-medium">Your profile has been saved successfully!</span>
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Info Banner */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-8">
            <p className="text-cyan-300 text-sm">
              <span className="font-semibold">Privacy Tip:</span> Toggle fields to{' '}
              <span className="text-red-400 font-medium">Private</span> to hide them from other players.
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
        </div>

        {/* Data & Privacy Control Section */}
        <div className="mt-8 bg-gradient-to-br from-slate-800/80 to-purple-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Shield size={24} className="text-cyan-400" />
            Data & Privacy Control
          </h2>

          {/* Privacy FAQ */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6">
            <h3 className="text-cyan-300 font-semibold mb-2">Privacy FAQ</h3>
            <p className="text-gray-300 text-sm">
              Face tracking is processed locally on your device and never uploaded to our servers. Your biometric data stays private and is only used to enhance your experience in real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownloadData}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
            >
              <Download size={18} />
              Download My Data
            </button>
            <button
              onClick={handleClearAllData}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
            >
              <Trash2 size={18} />
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
