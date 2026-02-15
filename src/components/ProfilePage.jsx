/**
 * ProfilePage.jsx
 *
 * Comprehensive user profile management component for the Smirkle game platform.
 * This component serves as the central hub for user identity and gamification data,
 * providing a complete interface for profile viewing, editing, and stats tracking.
 *
 * @module ProfilePage
 * @version 1.0.0
 * @author Smirkle Development Team
 * @license MIT
 *
 * ============================================================================
 * COMPONENT PURPOSE AND RESPONSIBILITIES
 * ============================================================================
 *
 * The ProfilePage component is responsible for:
 *
 * 1. **User Profile Management**
 *    - Displaying user avatar with fallback initials
 *    - Managing user bio, location, and social media links
 *    - Providing inline editing capabilities for profile fields
 *    - Avatar image upload with integrated cropper functionality
 *
 * 2. **Privacy Control System**
 *    - Per-field privacy settings (public/private visibility)
 *    - Visual indicators for public/private status
 *    - Privacy-aware rendering based on field visibility
 *
 * 3. **Gamification Statistics**
 *    - Displaying best score and survival time
 *    - Tracking games played and lifetime score
 *    - Level progression system with progress bar
 *    - Achievement badges (earned and next milestone)
 *
 * 4. **Data Persistence**
 *    - LocalStorage-based profile caching
 *    - Firebase-backed score data retrieval
 *    - Real-time stats updates from scoreService
 *
 * ============================================================================
 * STATE MANAGEMENT
 * ============================================================================
 *
 * ProfilePage uses React useState and useRef hooks for state management:
 *
 * **Profile State**
 * @state profile - User profile object containing bio, socialLinks, location,
 *                 avatar, stats, and privacy settings. Initialized with defaultProfile.
 * @state editForm - Copy of profile for editing. Synced on save/cancel operations.
 * @state isEditing - Boolean flag controlling edit mode (true = editing, false = view).
 *
 * **Image Cropping State**
 * @state showCropper - Controls cropper modal visibility.
 * @state croppedImage - Final cropped avatar image as base64 data URL.
 * @state originalImage - Original uploaded image before cropping.
 * @state cropArea - Object with {x, y, width, height} for crop region.
 * @state zoom - Zoom level for the cropper interface.
 * @state fileInputRef - Reference to hidden file input element.
 * @state canvasRef - Reference to canvas element for image processing.
 *
 * **Score Data State**
 * @state bestScore - User's highest score record from Firebase.
 * @state allScores - Array of recent game scores (limit: 10).
 * @state lifetimeScore - Total accumulated score across all games.
 * @state isLoadingScores - Loading state for async score operations.
 * @state userLevel - Computed level based on lifetime score.
 * @state earnedBadges - Array of badges earned at current level.
 * @state nextBadge - Next badge milestone information.
 *
 * **State Persistence**
 * - Profile data is automatically saved to localStorage on changes
 * - Profile is loaded from localStorage on component mount
 * - Score data is fetched from Firebase on component mount
 *
 * ============================================================================
 * DEPENDENCIES
 * ============================================================================
 *
 * **React Core**
 * - react: useState, useEffect, useRef hooks
 *
 * **External Libraries**
 * - lucide-react: Icon components (Camera, MapPin, LinkIcon, Award,
 *                 Trophy, Flame, Eye, EyeOff, Lock)
 *
 * **Internal Modules**
 * - ../utils/auth: getCurrentUser() - Retrieves authenticated user
 * - ../services/scoreService: Firebase score operations
 *   - getUserBestScore(userId) - Fetches highest score
 *   - getUserScores(userId, limit) - Fetches recent scores
 *   - getUserLifetimeScore(userId) - Fetches total accumulated score
 * - ../utils/levels: Gamification utilities
 *   - calculateLevel(lifetimeScore) - Computes level from score
 *   - getEarnedBadges(level) - Returns badges for current level
 *   - getNextBadge(level) - Returns next badge milestone
 *
 * **Constants**
 * - STORAGE_KEY: localStorage key for profile persistence ('smirkle_user_profile')
 * - AVATAR_SIZE: Target avatar dimensions (200x200px)
 * - MAX_LEVEL: Maximum achievable level (100)
 *
 * ============================================================================
 * KEY FUNCTIONS
 * ============================================================================
 *
 * **Data Loading Functions**
 *
 * loadUserScores()
 * --------------------------
 * Asynchronously loads all user score data from Firebase.
 *
 * @async
 * @returns {Promise<void>} Resolves when all data is loaded
 *
 * @throws {Error} Logs error to console if data fetching fails
 *
 * Steps:
 * 1. Get current authenticated user via getCurrentUser()
 * 2. Parallel fetch: bestScore, recentScores (10), lifetimeScore
 * 3. Update state with fetched data
 * 4. Calculate level, earned badges, and next badge
 * 5. Set isLoadingScores to false on completion
 *
 * Image Handling Functions
 *
 * handleImageUpload(event)
 * --------------------------
 * Processes file input change event for avatar upload.
 *
 * @param {ChangeEvent} e - File input change event
 * @returns {void}
 *
 * Steps:
 * 1. Extract file from event.target.files
 * 2. Validate file exists
 * 3. Read file as DataURL via FileReader
 * 4. Set originalImage and show cropper on load
 *
 * handleCrop()
 * --------------------------
 * Performs image cropping on canvas and generates avatar.
 *
 * @returns {void}
 *
 * Steps:
 * 1. Get canvas 2D context
 * 2. Create Image from originalImage
 * 3. Calculate scale factor (image width / 300)
 * 4. Draw cropped region to canvas at AVATAR_SIZE
 * 5. Export as JPEG (quality: 0.9)
 * 6. Update croppedImage and hide cropper
 *
 * handleSave()
 * --------------------------
 * Commits profile changes to state and storage.
 *
 * @returns {void}
 *
 * Steps:
 * 1. Merge editForm with croppedImage (if available)
 * 2. Preserve original stats object
 * 3. Update profile and editForm state
 * 4. Clear temporary cropped image
 * 5. Exit edit mode
 *
 * handleCancel()
 * --------------------------
 * Discards unsaved profile changes and exits edit mode.
 *
 * @returns {void}
 *
 * Steps:
 * 1. Restore editForm from current profile
 * 2. Clear all temporary states (croppedImage, showCropper, originalImage)
 * 3. Exit edit mode
 *
 * Privacy Functions
 *
 * togglePrivacy(field)
 * --------------------------
 * Toggles privacy setting between 'public' and 'private'.
 *
 * @param {string} field - Profile field name to toggle
 * @returns {void}
 *
 * @example
 * togglePrivacy('bio'); // Toggles bio from public to private or vice versa
 *
 * isFieldPublic(fieldName)
 * --------------------------
 * Checks if a profile field is set to public visibility.
 *
 * @param {string} fieldName - Name of the field to check
 * @returns {boolean} True if field is public, false otherwise
 *
 * Render Helper Functions
 *
 * renderAvatar()
 * --------------------------
 * Renders profile avatar with priority: croppedImage > profile.avatar > initials.
 *
 * @returns {JSX.Element} Avatar image or initials placeholder
 *
 * renderStats()
 * --------------------------
 * Renders game statistics card with best score, time, and games played.
 * Includes privacy toggle when editing and lock icon when private.
 *
 * @returns {JSX.Element} Stats display component
 *
 * renderLevelProgress()
 * --------------------------
 * Renders level progression card with current level, lifetime score,
 * progress bar to next level, and max level achievement message.
 *
 * @returns {JSX.Element|null} Level progress component or null if not loaded
 *
 * renderBadges()
 * --------------------------
 * Renders achievements section with earned badges grid and next badge
 * milestone information with points needed.
 *
 * @returns {JSX.Element|null} Badges component or null if no badges
 *
 * ============================================================================
 * SUB-COMPONENTS
 * ============================================================================
 *
 * PrivacyToggle({ field, value, onToggle })
 * ------------------------------------------
 * Button component for toggling field privacy between public/private.
 *
 * @param {string} field - Field identifier for accessibility
 * @param {string} value - Current privacy value ('public'|'private')
 * @param {Function} onToggle - Click handler function
 * @returns {JSX.Element} Toggle button with icon and label
 *
 * SocialLinkInput({ platform, value, onChange })
 * ----------------------------------------------
 * Input field for entering social media profile URLs.
 *
 * @param {Object} platform - Platform configuration {key, label, placeholder}
 * @param {string} value - Current URL value
 * @param {Function} onChange - Change handler function
 * @returns {JSX.Element} URL input with label
 *
 * SocialLinkDisplay({ links })
 * ----------------------------
 * Displays clickable social media links in a list format.
 *
 * @param {Object} links - Social links object keyed by platform
 * @returns {JSX.Element} List of social links or "No social links" message
 *
 * RecentScores({ scores })
 * ------------------------
 * Displays recent game scores with icons and titles based on survival time.
 *
 * @param {Array} scores - Array of score objects with survival_time, date, id
 * @returns {JSX.Element} Recent games list with score titles and icons
 *
 * ============================================================================
 * CONSTANTS AND CONFIGURATION
 * ============================================================================
 *
 * defaultStats: Initial stats object
 *   - longestStreak: 0
 *   - totalWins: 0
 *   - pokerFaceLevel: 1
 *
 * defaultProfile: Initial profile structure
 *   - bio: ''
 *   - socialLinks: { facebook: '', instagram: '', github: '' }
 *   - location: ''
 *   - avatar: null
 *   - stats: defaultStats
 *   - privacy: { bio: 'public', location: 'public', socialLinks: 'public', stats: 'public' }
 *
 * socialPlatforms: Supported social platforms array
 *   - Facebook (facebook.com)
 *   - Instagram (instagram.com)
 *   - GitHub (github.com)
 *
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * Basic Usage:
 * ```jsx
 * import ProfilePage from './components/ProfilePage';
 *
 * function App() {
 *   return <ProfilePage />;
 * }
 * ```
 *
 * With Custom Styling:
 * The component uses Tailwind CSS classes and inherits from the global
 * theme. Custom styling can be applied via the parent container.
 *
 * ============================================================================
 * PERFORMANCE CONSIDERATIONS
 * ============================================================================
 *
 * 1. Profile is loaded once on mount via useEffect
 * 2. Score data fetched once on mount with Promise.all for efficiency
 * 3. localStorage updates on every profile change (debounce recommended for high-frequency updates)
 * 4. Image cropping uses canvas for client-side processing
 * 5. Sub-components (PrivacyToggle, SocialLinkInput, etc.) are defined inline
 *    for better component cohesion
 *
 * ============================================================================
 * ERROR HANDLING
 * ============================================================================
 *
 * - Invalid localStorage data is caught and logged; falls back to defaults
 * - Failed score fetches are logged; component continues to render with partial data
 * - FileReader errors during image upload are silently handled
 * - Canvas operations assume valid image and cropArea
 *
 * ============================================================================
 * ACCESSIBILITY
 * ============================================================================
 *
 * - Buttons have title attributes for screen readers
 * - Inputs have associated labels
 * - Privacy toggle states are visually distinct
 * - Focus states are maintained on form elements
 * - External links have rel="noopener noreferrer" for security
 */

import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Link as LinkIcon,
  Award,
  Trophy,
  Flame,
  Eye,
  Lock,
} from 'lucide-react';
import { getCurrentUser } from '../utils/auth';
import { getUserBestScore, getUserScores, getUserLifetimeScore } from '../services/scoreService';
import { calculateLevel, getEarnedBadges, getNextBadge } from '../utils/levels';

// Constants
const STORAGE_KEY = 'smirkle_user_profile';
const AVATAR_SIZE = 200;
const MAX_LEVEL = 100;

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
    stats: 'public',
  },
};

const socialPlatforms = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
];

// ============== Sub-Components ==============

function PrivacyToggle({ field, value, onToggle }) {
  const isPublic = value === 'public';
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors"
      title={isPublic ? 'Everyone can see this' : 'Only you can see this'}
    >
      {isPublic ? (
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
  );
}

function SocialLinkInput({ platform, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{platform.label}</label>
      <input
        type="url"
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
        placeholder={platform.placeholder}
      />
    </div>
  );
}

function SocialLinkDisplay({ links }) {
  const hasLinks = socialPlatforms.some((p) => links?.[p.key]);

  if (!hasLinks) {
    return <p className="text-gray-400 text-sm">No social links added</p>;
  }

  return (
    <div className="space-y-2 pl-4 border-l-2 border-slate-600">
      {socialPlatforms.map(
        (platform) =>
          links?.[platform.key] && (
            <a
              key={platform.key}
              href={links[platform.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span className="text-sm">{platform.label}</span>
            </a>
          )
      )}
    </div>
  );
}

function RecentScores({ scores }) {
  const getScoreTitle = (time) => {
    if (time >= 30) return 'Champion';
    if (time >= 15) return 'Survivor';
    return 'Novice';
  };

  const getScoreIcon = (time) => {
    if (time >= 30) return <Trophy size={18} className="text-yellow-400" />;
    if (time >= 15) return <Award size={18} className="text-cyan-400" />;
    return <Flame size={18} className="text-orange-400" />;
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Games</h3>
      <div className="space-y-3">
        {scores.map((score, index) => (
          <div
            key={score.id || index}
            className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                {getScoreIcon(score.survival_time)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {getScoreTitle(score.survival_time)}
                </p>
                <p className="text-xs text-gray-400">
                  {score.survival_time.toFixed(1)}s • {score.date}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-cyan-400 font-semibold">{Math.floor(score.survival_time)}s</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============== Main Component ==============

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

  // ============== Data Loading ==============

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

  useEffect(() => {
    loadUserScores();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const loadUserScores = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.id) {
        setIsLoadingScores(false);
        return;
      }

      const [best, scores, lifetime] = await Promise.all([
        getUserBestScore(currentUser.id),
        getUserScores(currentUser.id, 10),
        getUserLifetimeScore(currentUser.id),
      ]);

      if (best) setBestScore(best);
      if (scores?.length) {
        setAllScores(scores);
        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            highestScore: best?.score_value || 0,
            totalScoresSubmitted: scores.length,
          },
        }));
      }

      setLifetimeScore(lifetime);

      const levelInfo = calculateLevel(lifetime);
      setUserLevel(levelInfo);
      setEarnedBadges(getEarnedBadges(levelInfo.level));
      setNextBadge(getNextBadge(levelInfo.level));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading user scores:', error);
      }
    } finally {
      setIsLoadingScores(false);
    }
  };

  // ============== Image Handling ==============

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = originalImage;
    img.onload = () => {
      const scale = img.width / 300;
      ctx.clearRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
      ctx.drawImage(
        img,
        cropArea.x * scale,
        cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale,
        0,
        0,
        AVATAR_SIZE,
        AVATAR_SIZE
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

  // ============== Privacy Handling ==============

  const togglePrivacy = (field) => {
    setEditForm((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: prev.privacy?.[field] === 'public' ? 'private' : 'public',
      },
    }));
  };

  const isFieldPublic = (fieldName) => profile.privacy?.[fieldName] === 'public';

  const handleSocialLinkChange = (key, value) => {
    setEditForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  // ============== Render Helpers ==============

  const renderAvatar = () => {
    const src = croppedImage || profile.avatar;
    if (src) {
      return (
        <img
          src={src}
          alt="Profile"
          className="w-32 h-32 rounded-full object-cover border-4 border-gradient-to-r from-cyan-400 to-purple-500 shadow-lg"
        />
      );
    }
    return (
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
        {profile.bio ? profile.bio[0].toUpperCase() : '?'}
      </div>
    );
  };

  const renderStats = () => (
    <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-2xl p-6 mb-8 border border-amber-500/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="text-amber-400" size={20} />
          {isLoadingScores ? 'Loading Stats...' : 'Game Stats'}
        </h2>
        {isEditing && (
          <PrivacyToggle
            field="stats"
            value={editForm.privacy?.stats}
            onToggle={() => togglePrivacy('stats')}
          />
        )}
        {!isEditing && profile.privacy?.stats === 'private' && (
          <Lock size={14} className="text-amber-400" title="This field is private" />
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
            <Trophy size={24} />
            <span className="text-2xl font-bold">
              {bestScore ? Math.floor(bestScore.score_value) : 0}
            </span>
          </div>
          <p className="text-sm text-gray-300">Best Score</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
            <Flame size={24} />
            <span className="text-2xl font-bold">
              {bestScore ? bestScore.survival_time.toFixed(1) : '0'}s
            </span>
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
  );

  const renderLevelProgress = () => {
    if (!userLevel) return null;

    const isMaxLevel = userLevel.level >= MAX_LEVEL;

    return (
      <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-6 mb-8 border border-purple-500/30">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-300 mb-2">Current Level</p>
          <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {userLevel.level}
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">Lifetime Score</p>
          <p className="text-2xl font-bold text-cyan-300">{lifetimeScore.toLocaleString()}</p>
        </div>

        {!isMaxLevel && (
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

        {isMaxLevel && (
          <div className="text-center mb-6">
            <p className="text-lg font-bold text-yellow-400">
              🏆 You&apos;ve Reached Maximum Level! 🏆
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderBadges = () => {
    if (earnedBadges.length === 0 && !nextBadge) return null;

    return (
      <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl p-6 mb-8 border border-amber-500/30">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award size={20} className="text-amber-400" />
          Achievements
        </h2>

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
    );
  };

  const renderBioField = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300">Bio</label>
        {isEditing && (
          <PrivacyToggle
            field="bio"
            value={editForm.privacy?.bio}
            onToggle={() => togglePrivacy('bio')}
          />
        )}
      </div>
      {isEditing ? (
        <textarea
          value={editForm.bio}
          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
          rows={3}
          placeholder="Tell us about yourself..."
        />
      ) : (
        <p className="text-gray-200">{profile.bio || 'No bio yet'}</p>
      )}
    </div>
  );

  const renderLocationField = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300 flex items-center gap-1">
          <MapPin size={14} /> Location
        </label>
        {isEditing && (
          <PrivacyToggle
            field="location"
            value={editForm.privacy?.location}
            onToggle={() => togglePrivacy('location')}
          />
        )}
      </div>
      {isEditing ? (
        <input
          type="text"
          value={editForm.location}
          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
          placeholder="Where are you from?"
        />
      ) : (
        <p className="text-gray-200 flex items-center gap-1">
          {profile.location || 'Location not set'}
        </p>
      )}
    </div>
  );

  const renderSocialLinksField = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-300 flex items-center gap-1">
          <LinkIcon size={14} /> Social Links
        </label>
        {isEditing && (
          <PrivacyToggle
            field="socialLinks"
            value={editForm.privacy?.socialLinks}
            onToggle={() => togglePrivacy('socialLinks')}
          />
        )}
      </div>
      {isEditing ? (
        <div className="space-y-3 pl-4 border-l-2 border-slate-600">
          {socialPlatforms.map((platform) => (
            <SocialLinkInput
              key={platform.key}
              platform={platform}
              value={editForm.socialLinks[platform.key]}
              onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
            />
          ))}
        </div>
      ) : (
        <SocialLinkDisplay links={profile.socialLinks} />
      )}
    </div>
  );

  const renderPrivacyNotice = () =>
    isEditing && (
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-6">
        <p className="text-sm text-cyan-300 flex items-start gap-2">
          <Eye size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            <strong>Public fields</strong> are visible to other players.{' '}
            <strong>Private fields</strong> are only visible to you.
          </span>
        </p>
      </div>
    );

  const renderCropper = () => {
    if (!showCropper || !originalImage) return null;

    return (
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
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
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
          <canvas ref={canvasRef} width={AVATAR_SIZE} height={AVATAR_SIZE} className="hidden" />
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
    );
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
              {renderAvatar()}
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
            {renderCropper()}
          </div>

          {renderPrivacyNotice()}
          {renderStats()}
          {renderLevelProgress()}
          {renderBadges()}

          {/* Profile Fields */}
          <div className="space-y-6">
            {renderBioField()}
            {renderLocationField()}
            {renderSocialLinksField()}
          </div>

          {allScores.length > 0 && <RecentScores scores={allScores} />}
        </div>
      </div>
    </div>
  );
}
