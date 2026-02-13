import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, UserPlus, Calendar } from 'lucide-react';
import { getCurrentUser, setCurrentUser, registerUser, authenticateUser } from '../utils/auth';

/**
 * AuthGate - Authentication Gate Component for Smirkle Application
 *
 * This component serves as the main authentication entry point for the Smirkle application.
 * It manages the complete authentication flow including user registration, login, and guest
 * access modes. The component acts as a "gate" that determines whether to render the
 * protected application content or show authentication UI based on user authentication state.
 *
 * @component
 * @example
 * // Usage in App.jsx
 * <AuthGate>
 *   <MainAppContent />
 * </AuthGate>
 *
 * ## Authentication States
 *
 * The component manages three primary authentication states:
 *
 * | State | Description |
 * |-------|-------------|
 * | **Loading** | Initial app load, checking for existing session |
 * | **Authenticated** | User is logged in with registered account |
 * | **Guest** | User is playing without an account |
 * | **Unauthenticated** | User needs to register/login to access app |
 *
 * ## Features
 *
 * - **Landing Screen**: First-time users see branded landing page with call-to-action buttons
 * - **Guest Mode**: Allows immediate gameplay without account creation
 *   - Guest users get temporary session (persisted in localStorage)
 *   - Guest scores NOT saved to leaderboards
 *   - Limited profile features compared to registered users
 * - **User Registration**: Full account creation with validation
 *   - Username: 3-20 characters
 *   - Email: Valid email format required
 *   - Password: Strong password requirements (8+ chars, uppercase, lowercase, number, symbol)
 *   - Birthdate: Required, minimum age 14 for account creation
 * - **User Login**: Authentication with email/password credentials
 * - **Password Visibility Toggle**: Show/hide password during input
 * - **Form Validation**: Real-time and submit-time validation with error messages
 * - **Session Persistence**: User session persisted via localStorage
 *
 * ## Props
 *
 * | Prop | Type | Required | Description |
 * |------|------|----------|-------------|
 * | children | React.ReactNode | Yes | The protected content to render when authenticated |
 *
 * ## State Management
 *
 * ### Component State
 *
 * | State | Type | Purpose |
 * |-------|------|---------|
 * | user | UserObject | null | Current authenticated user or null |
 * | isLoading | boolean | Initial loading state while checking session |
 * | showAuthForm | boolean | Toggle between landing and auth forms |
 * | authMode | 'login' | 'register' | Current auth form mode |
 * | formData | FormDataObject | User input for auth forms |
 * | showPassword | boolean | Toggle password field visibility |
 * | errors | ErrorsObject | Form field validation errors |
 * | generalError | string | Non-field specific error messages |
 * | isSubmitting | boolean | Form submission in progress state |
 *
 * ### User Object Structure
 *
 * ```javascript
 * {
 *   id: string,          // Unique user identifier (or 'guest_' prefix for guests)
 *   username: string,     // Display name
 *   email: string,       // User email (not present for guests)
 *   isGuest: boolean,   // True if guest mode
 *   createdAt: string,  // ISO date string
 *   stats: {             // User gameplay statistics
 *     totalGames: number,
 *     totalSmirksDetected: number,
 *     totalSmilesDetected: number,
 *     bestSurvivalTime: number,
 *     averageSurvivalTime: number,
 *     achievements: array
 *   }
 * }
 * ```
 *
 * ## Dependencies
 *
 * ### External Dependencies
 *
 * - **React**: Core framework hooks (useState, useEffect)
 * - **lucide-react**: Icon components (User, Mail, Lock, etc.)
 *
 * ### Internal Dependencies
 *
 * - **../utils/auth**: Authentication utility functions
 *   - getCurrentUser(): Retrieves stored user session
 *   - setCurrentUser(user): Persists user session to storage
 *   - registerUser(data): Creates new user account
 *   - authenticateUser(email, password): Validates user credentials
 *
 * ## Password Requirements
 *
 * Registered user passwords must meet all these requirements:
 * 1. At least 8 characters in length
 * 2. Contains at least one uppercase letter (A-Z)
 * 3. Contains at least one lowercase letter (a-z)
 * 4. Contains at least one number (0-9)
 * 5. Contains at least one symbol (!@#$%^&* etc.)
 *
 * ## Age Restriction
 *
 * - Minimum age for account registration: 14 years
 * - Age calculated from birthdate against current date
 * - Guest mode has no age restrictions
 *
 * ## Persistence
 *
 * User sessions are persisted via localStorage under the 'currentUser' key.
 * This allows users to remain logged in across browser sessions.
 *
 * @param {React.ReactNode} children - The protected application content
 * @returns {JSX.Element} The authentication gate component
 */
export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    birthdate: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check for existing user session on component mount
    // This restores the user session from localStorage if it exists
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    // Clear loading state after session check completes
    setIsLoading(false);
  }, []);

  const handleGuestPlay = () => {
    // Creates a temporary guest user session for immediate gameplay
    // Guest sessions are temporary and scores are NOT saved to leaderboards
    const guestUser = {
      id: 'guest_' + Date.now(), // Unique guest ID with timestamp
      username: 'Guest',         // Default display name
      email: 'guest@smirkle.app', // Placeholder email for guest accounts
      isGuest: true,             // Flag to distinguish guest from registered users
      createdAt: new Date().toISOString(), // Session creation timestamp
      stats: {                   // Initialize empty stats object for guest
        totalGames: 0,
        totalSmirksDetected: 0,
        totalSmilesDetected: 0,
        bestSurvivalTime: 0,
        averageSurvivalTime: 0,
        achievements: [],
      },
    };
    // Persist guest session to localStorage
    setCurrentUser(guestUser);
    // Update component state to reflect guest login
    setUser(guestUser);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /\d/.test(p) },
    { label: 'One symbol', test: (p) => /[!@#$%^&*()_+\-=\[\]{};:'"|,.<>\/?]/.test(p) },
  ];

  const isPasswordValid = () => {
    return passwordRequirements.every((req) => req.test(formData.password));
  };

  const validateRegisterForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required (3-20 characters)';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = 'Username must be 3-20 characters';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid()) {
      newErrors.password = 'Password does not meet all requirements';
    }
    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required';
    } else {
      const birthDate = new Date(formData.birthdate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 14) {
        newErrors.birthdate = 'You must be at least 14 years old to create an account';
      }
    }
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError('');

    const validationErrors = validateLoginForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const user = await authenticateUser(formData.email, formData.password);
      if (user) {
        setUser(user);
        setShowAuthForm(false);
      } else {
        setGeneralError('Invalid email or password');
      }
    } catch (error) {
      setGeneralError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError('');

    const validationErrors = validateRegisterForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const user = await registerUser({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        birthdate: formData.birthdate,
      });
      setUser(user);
      setShowAuthForm(false);
    } catch (error) {
      setGeneralError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchAuthMode = () => {
    setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setErrors({});
    setGeneralError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1429] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated or guest, show the app
  if (user) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#0f1429] flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-600/20 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {!showAuthForm ? (
        // Landing Screen
        <div className="relative w-full max-w-md">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-float">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Smirkle
            </h1>
            <p className="text-xl text-gray-400">The Smile Detection Challenge</p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4">
            {/* Create Profile Button */}
            <button
              onClick={() => setShowAuthForm(true)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-2xl shadow-purple-500/25 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <UserPlus className="w-5 h-5" />
              Create Profile
            </button>

            {/* Guest Play Button */}
            <button
              onClick={handleGuestPlay}
              className="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-medium text-lg transition-all duration-200 flex items-center justify-center gap-3"
            >
              <User className="w-5 h-5" />
              Play as Guest
            </button>
          </div>

          {/* Info cards */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-purple-400">🏆</div>
              <p className="text-sm text-gray-400 mt-2">Leaderboards</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-pink-400">🎯</div>
              <p className="text-sm text-gray-400 mt-2">Achievements</p>
            </div>
          </div>

          {/* Guest disclaimer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Guest scores won't be saved to leaderboards
          </p>
        </div>
      ) : (
        // Auth Form (Login/Register)
        <div className="relative w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => setShowAuthForm(false)}
            className="absolute -top-12 left-0 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back
          </button>

          {/* Form container */}
          <div className="bg-gradient-to-br from-[#1a1f3c] via-[#0f1429] to-[#1a1f3c] rounded-2xl border border-blue-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-blue-500/20">
              <h2 className="text-xl font-bold text-white">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {authMode === 'login'
                  ? 'Sign in to save your progress'
                  : 'Join the smirking challenge'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* General error */}
              {generalError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                  {generalError}
                </div>
              )}

              {/* Form toggle */}
              <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-6">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setErrors({});
                    setGeneralError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    authMode === 'login'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setErrors({});
                    setGeneralError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                    authMode === 'register'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Login Form */}
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                          errors.email ? 'border-red-500' : 'border-blue-500/30'
                        } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border ${
                          errors.password ? 'border-red-500' : 'border-blue-500/30'
                        } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {authMode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="YourUsername"
                        maxLength={20}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                          errors.username ? 'border-red-500' : 'border-blue-500/30'
                        } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                          errors.email ? 'border-red-500' : 'border-blue-500/30'
                        } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Birthdate
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleInputChange}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                          errors.birthdate ? 'border-red-500' : 'border-blue-500/30'
                        } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                    </div>
                    {errors.birthdate && (
                      <p className="mt-1 text-sm text-red-400">{errors.birthdate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border ${
                          errors.password ? 'border-red-500' : 'border-blue-500/30'
                        } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                    )}

                    {/* Password Requirements Display */}
                    <div className="mt-3 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              req.test(formData.password)
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/5 text-gray-500'
                            }`}
                          >
                            {req.test(formData.password) ? '✓' : '○'}
                          </span>
                          <span
                            className={
                              req.test(formData.password) ? 'text-green-400' : 'text-gray-500'
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                  >
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/5">
              <p className="text-center text-sm text-gray-400">
                {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={switchAuthMode}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  {authMode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
