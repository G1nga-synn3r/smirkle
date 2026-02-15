import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { registerUser, RegistrationStatus, onRegistrationStateChange } from '../utils/auth';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthdate: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Network sync state
  const [syncState, setSyncState] = useState({
    state: RegistrationStatus.IDLE,
    progress: 0,
    message: null,
    isOnline: navigator.onLine,
  });

  // Listen for registration state changes from auth.js
  useEffect(() => {
    const handleStateChange = (newState) => {
      setSyncState((prev) => ({ ...prev, ...newState }));
    };

    const unsubscribe = onRegistrationStateChange(handleStateChange);

    // Listen for online/offline events
    const handleOnline = () => setSyncState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /\d/.test(p) },
    { label: 'One symbol', test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
  ];

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'username') {
      if (!value.trim()) {
        newErrors.username = 'Username is required';
      } else if (value.trim().length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else {
        delete newErrors.username;
      }
    }

    if (name === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else {
        const failingRequirements = passwordRequirements.filter((req) => !req.test(value));
        if (failingRequirements.length > 0) {
          newErrors.password = 'Password does not meet all requirements';
        } else {
          delete newErrors.password;
        }
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    if (name === 'birthdate') {
      if (!value) {
        newErrors.birthdate = 'Birthdate is required';
      } else {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 14) {
          newErrors.birthdate = 'You must be at least 14 years old to create an account';
        } else {
          delete newErrors.birthdate;
        }
      }
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const isPasswordValid = () => {
    return passwordRequirements.every((req) => req.test(formData.password));
  };

  const isFormValid = () => {
    const birthDate = new Date(formData.birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const isAgeValid = age >= 14;

    return (
      formData.username.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      isPasswordValid() &&
      formData.confirmPassword === formData.password &&
      formData.confirmPassword !== '' &&
      formData.birthdate !== '' &&
      isAgeValid
    );
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = {
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      birthdate: true,
    };
    setTouched(allTouched);

    validateField('username', formData.username);
    validateField('email', formData.email);
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);
    validateField('birthdate', formData.birthdate);

    if (isFormValid()) {
      setIsSubmitting(true);
      setGeneralError('');
      setRegistrationSuccess(false);

      try {
        const result = await registerUser({
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          birthdate: formData.birthdate,
        });

        if (result.success) {
          setRegisteredUser(result.user);
          setRegistrationSuccess(true);
        } else {
          setGeneralError(result.error || 'Registration failed. Please try again.');
        }
      } catch (error) {
        setGeneralError(error.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Determine if we're in a syncing/loading state
  const isSyncing = [
    RegistrationStatus.VALIDATING,
    RegistrationStatus.CHECKING_AVAILABILITY,
    RegistrationStatus.SYNCING,
    RegistrationStatus.OFFLINE_FALLBACK,
  ].includes(syncState.state);

  const isComplete = syncState.state === RegistrationStatus.COMPLETE;
  const isFailed = syncState.state === RegistrationStatus.FAILED;

  // Get status message and color
  const getStatusConfig = () => {
    switch (syncState.state) {
      case RegistrationStatus.VALIDATING:
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bg: 'bg-blue-500/20',
          message: 'Validating inputs...',
        };
      case RegistrationStatus.CHECKING_AVAILABILITY:
        return {
          icon: Loader2,
          color: 'text-blue-500',
          bg: 'bg-blue-500/20',
          message: 'Checking username availability...',
        };
      case RegistrationStatus.SYNCING:
        return {
          icon: Loader2,
          color: 'text-green-500',
          bg: 'bg-green-500/20',
          message: syncState.message || 'Saving profile to network...',
        };
      case RegistrationStatus.OFFLINE_FALLBACK:
        return {
          icon: WifiOff,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/20',
          message: syncState.message || 'Network unavailable, saving locally...',
        };
      case RegistrationStatus.COMPLETE:
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-500/20',
          message: syncState.message || 'Profile saved!',
        };
      case RegistrationStatus.FAILED:
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bg: 'bg-red-500/20',
          message: syncState.error || 'Registration failed',
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
          <p className="text-gray-600 mb-4">
            Welcome, <span className="font-semibold">{registeredUser?.username}</span>!
          </p>

          {/* Network sync status */}
          <div
            className={`p-4 rounded-lg ${syncState.isOnline ? 'bg-green-50' : 'bg-yellow-50'} mb-4`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {syncState.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-yellow-500" />
              )}
              <span
                className={`text-sm font-medium ${syncState.isOnline ? 'text-green-700' : 'text-yellow-700'}`}
              >
                {syncState.isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {registeredUser?.isNetworkSynced
                ? 'Your profile is saved to the cloud and accessible from any device.'
                : "Your profile is saved locally. It will sync to the cloud when you're back online."}
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Player ID:{' '}
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {registeredUser?.playerId}
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* General error message */}
          {generalError && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {generalError}
            </div>
          )}

          {/* Syncing status indicator */}
          {isSyncing && statusConfig && (
            <div className={`p-4 rounded-lg ${statusConfig.bg} border border-current/30`}>
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = statusConfig.icon;
                  return (
                    <Icon
                      className={`w-5 h-5 ${statusConfig.color} ${isSyncing ? 'animate-spin' : ''}`}
                    />
                  );
                })()}
                <div>
                  <p className={`text-sm font-medium ${statusConfig.color}`}>
                    {statusConfig.message}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusConfig.color.replace('text-', 'bg-')} transition-all duration-300`}
                      style={{ width: `${syncState.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Failed status indicator */}
          {isFailed && statusConfig && (
            <div className={`p-4 rounded-lg ${statusConfig.bg} border border-current/30`}>
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = statusConfig.icon;
                  return <Icon className={`w-5 h-5 ${statusConfig.color}`} />;
                })()}
                <p className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.message}
                </p>
              </div>
            </div>
          )}

          {/* Network status indicator */}
          {!syncState.isOnline && !isComplete && (
            <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-yellow-400">
                You&apos;re offline. Profile will sync when online.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSyncing}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                touched.username && errors.username
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Enter your username"
            />
            {touched.username && errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSyncing}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                touched.email && errors.email
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Enter your email"
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSyncing}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                touched.password && errors.password
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Create a password"
            />
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}

            <div className="mt-3 space-y-2">
              {passwordRequirements.map((req, index) => {
                const isMet = req.test(formData.password);
                return (
                  <div
                    key={index}
                    className={`flex items-center text-sm ${
                      isMet ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    <span
                      className={`mr-2 flex items-center justify-center w-4 h-4 rounded-full text-xs ${
                        isMet ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isMet ? '✓' : '○'}
                    </span>
                    {req.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSyncing}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                touched.confirmPassword && errors.confirmPassword
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
              } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="Confirm your password"
            />
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Birthdate Field - Age Gate (minimum 14 years) */}
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline w-4 h-4 mr-2" />
              Birthdate
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSyncing}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                  touched.birthdate && errors.birthdate
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Select your birthdate"
              />
            </div>
            {touched.birthdate && errors.birthdate && (
              <p className="mt-1 text-sm text-red-500">{errors.birthdate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              You must be at least 14 years old to create an account
            </p>
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting || isSyncing}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              isFormValid() && !isSubmitting && !isSyncing
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSyncing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </span>
            ) : isSubmitting ? (
              'Creating account...'
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistrationForm;
