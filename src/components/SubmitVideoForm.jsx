import React, { useState } from 'react';
import { Video, Upload, CheckCircle, AlertCircle, Link, Loader2 } from 'lucide-react';

export default function SubmitVideoForm() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const validateUrl = (url) => {
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!validateUrl(videoUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call for admin workflow
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save submission to localStorage for demo
      const submissions = JSON.parse(localStorage.getItem('smirkle-submissions') || '[]');
      const newSubmission = {
        id: Date.now(),
        url: videoUrl,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };
      submissions.push(newSubmission);
      localStorage.setItem('smirkle-submissions', JSON.stringify(submissions));

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setVideoUrl('');
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <div className="p-8">
        {/* Success State */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-4">
            Submission Successful!
          </h2>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Your video is pending approval. Our admin team will review it shortly and you'll be notified once it's live on the leaderboard.
          </p>
          
          {/* Submission Details */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 max-w-md mx-auto border border-white/10">
            <div className="flex items-center gap-3 text-sm">
              <Link className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 truncate">{videoUrl}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Submitted</span>
            </div>
            <div className="w-12 h-px bg-gradient-to-r from-green-400/50 to-gray-500" />
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Pending Review</span>
            </div>
            <div className="w-12 h-px bg-gray-600" />
            <div className="flex items-center gap-2 text-gray-500">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Approved</span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Submit Another Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
          <Video className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Submit Your Video
          </h2>
          <p className="text-sm text-gray-400">Share your best smirk challenge moments</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input */}
        <div>
          <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-300 mb-2">
            Video URL
          </label>
          <div className="relative">
            <input
              type="url"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/embed/..."
              className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-white placeholder-gray-500 transition-all"
            />
            <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Submission Requirements</h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              MP4, WebM, or embeddable URL format
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Maximum 30 seconds duration
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Clear face visibility required
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              No copyrighted music
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Submit Video
            </>
          )}
        </button>
      </form>

      {/* Tips */}
      <div className="mt-8 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
        <h4 className="text-sm font-medium text-purple-300 mb-2">💡 Tips for approval</h4>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Use good lighting on your face</li>
          <li>• Keep the camera steady</li>
          <li>• Show clear emotional reactions</li>
        </ul>
      </div>
    </div>
  );
}
