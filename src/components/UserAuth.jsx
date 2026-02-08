import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, MessageSquare, Sparkles, Eye, EyeOff } from 'lucide-react';
import { 
  registerUser, 
  authenticateUser, 
  getCurrentUser, 
  logoutUser,
  isUsernameAvailable,
  isEmailAvailable
} from '../utils/auth';

/**
 * UserAuth - Authentication modal component for Smirkle
 * Provides login and registration functionality with glassmorphic dark theme
 */
export default function UserAuth({ isOpen, onClose, onAuthChange }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    motto: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentUser(getCurrentUser());
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const validateLoginForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const validateRegisterForm = async () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username must be less than 20 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      } else if (!(await isEmailAvailable(formData.email))) {
        newErrors.email = 'Email already registered';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');
    
    const validationErrors = validateLoginForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const user = await authenticateUser(formData.email, formData.password);
      if (user) {
        setCurrentUser(user);
        onAuthChange?.(user);
        handleClose();
      } else {
        setGeneralError('Invalid email or password');
      }
    } catch (error) {
      setGeneralError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');
    
    const validationErrors = await validateRegisterForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const user = await registerUser({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        bio: formData.bio.trim(),
        motto: formData.motto.trim()
      });
      setCurrentUser(user);
      onAuthChange?.(user);
      handleClose();
    } catch (error) {
      setGeneralError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    onAuthChange?.(null);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: '',
      motto: ''
    });
    setErrors({});
    setGeneralError('');
    setMode('login');
    onClose();
  };

  const switchToRegister = () => {
    setMode('register');
    setErrors({});
    setGeneralError('');
  };

  const switchToLogin = () => {
    setMode('login');
    setErrors({});
    setGeneralError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-[#1a1f3c] via-[#0f1429] to-[#1a1f3c] rounded-2xl border border-blue-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-blue-500/20">
            <button
              onClick={handleClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {currentUser ? `Welcome, ${currentUser.username}!` : (mode === 'login' ? 'Welcome Back' : 'Create Account')}
                </h2>
                <p className="text-sm text-gray-400">
                  {currentUser ? 'You are logged in' : (mode === 'login' ? 'Sign in to continue playing' : 'Join the smirking challenge')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentUser ? (
              // Logged in state
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                
                {currentUser.bio && (
                  <p className="text-gray-300 mb-4 italic">"{currentUser.bio}"</p>
                )}
                
                {currentUser.motto && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-blue-500/30 mb-6">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">{currentUser.motto}</span>
                  </div>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-medium transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                {/* Form toggle */}
                <div className="flex gap-2 p-1 rounded-xl bg-white/5 mb-6">
                  <button
                    onClick={switchToLogin}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={switchToRegister}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* General error */}
                {generalError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                    {generalError}
                  </div>
                )}

                {/* Login Form */}
                {mode === 'login' && (
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
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                )}

                {/* Register Form */}
                {mode === 'register' && (
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
                      {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
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
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border ${
                            errors.confirmPassword ? 'border-red-500' : 'border-blue-500/30'
                          } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors`}
                        />
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
                    </div>

                    <div className="pt-2 border-t border-blue-500/20">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <MessageSquare className="inline w-4 h-4 mr-2" />
                        Bio (optional)
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        rows={2}
                        maxLength={150}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-blue-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/150 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Sparkles className="inline w-4 h-4 mr-2" />
                        Motto (optional)
                      </label>
                      <input
                        type="text"
                        name="motto"
                        value={formData.motto}
                        onChange={handleInputChange}
                        placeholder="Your personal mantra..."
                        maxLength={100}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-blue-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.motto.length}/100 characters</p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Footer decoration */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" />
        </div>
      </div>
    </div>
  );
}
