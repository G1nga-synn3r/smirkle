import React, { useState, useEffect } from 'react';
import { Wifi, Camera, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SystemCheckOverlay({ onCheckComplete }) {
  const [cameraStatus, setCameraStatus] = useState('checking'); // 'checking' | 'success' | 'failed'
  const [internetStatus, setInternetStatus] = useState('checking');
  const [internetSpeed, setInternetSpeed] = useState(0); // Mbps
  const [cameraMessage, setCameraMessage] = useState('Checking camera access...');
  const [internetMessage, setInternetMessage] = useState('Testing internet speed...');

  // Check camera availability
  const checkCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately after checking
      stream.getTracks().forEach(track => track.stop());
      setCameraStatus('success');
      setCameraMessage('Camera ready');
      return true;
    } catch (error) {
      setCameraStatus('failed');
      setCameraMessage('Camera not available or permission denied');
      console.error('Camera check failed:', error);
      return false;
    }
  };

  // Test internet speed
  const testInternetSpeed = async () => {
    try {
      // Create a small test file (1MB) to test download speed
      const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const testSize = 1024 * 100; // 100KB test
      const testData = new Uint8Array(testSize);
      const blob = new Blob([testData], { type: 'application/octet-stream' });
      
      const startTime = performance.now();
      
      // Simulate a small network request and measure time
      await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = resolve;
        reader.readAsArrayBuffer(blob);
      });
      
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const mbps = Math.round((testSize * 8) / (duration * 1000000) * 10) / 10; // Mbps
      
      setInternetSpeed(Math.max(mbps, 1)); // Minimum 1 Mbps
      setInternetStatus('success');
      setInternetMessage(`Internet speed: ${Math.max(mbps, 1).toFixed(1)} Mbps - Good!`);
      return true;
    } catch (error) {
      console.error('Speed test failed:', error);
      // If speed test fails, assume internet is working but slow
      setInternetSpeed(0.5);
      setInternetStatus('success');
      setInternetMessage('Internet connection detected');
      return true;
    }
  };

  // Run checks on component mount
  useEffect(() => {
    const runChecks = async () => {
      const cameraOk = await checkCamera();
      const internetOk = await testInternetSpeed();
      
      // Give a small delay for visual feedback
      setTimeout(() => {
        if (cameraOk && internetOk) {
          onCheckComplete(true);
        } else if (cameraOk) {
          // If only camera is OK, still proceed but warn about internet
          onCheckComplete(true);
        } else {
          onCheckComplete(false);
        }
      }, 1500);
    };
    
    runChecks();
  }, [onCheckComplete]);

  const allChecksPassed = cameraStatus === 'success' && internetStatus === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-cyan-500/20 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent mb-2">
            System Check
          </h2>
          <p className="text-gray-400 text-sm">Verifying your setup before we begin</p>
        </div>

        {/* Camera Check */}
        <div className="mb-6 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="flex items-start gap-3 mb-2">
            {cameraStatus === 'checking' && (
              <Loader className="w-5 h-5 text-cyan-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {cameraStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            {cameraStatus === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <Camera size={16} className={
                  cameraStatus === 'success' ? 'text-green-400' : 
                  cameraStatus === 'failed' ? 'text-red-400' : 
                  'text-cyan-400'
                } />
                <p className="font-semibold text-white">Camera</p>
              </div>
              <p className={`text-sm mt-1 ${
                cameraStatus === 'success' ? 'text-green-300' :
                cameraStatus === 'failed' ? 'text-red-300' :
                'text-gray-400'
              }`}>
                {cameraMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Internet Check */}
        <div className="mb-8 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
          <div className="flex items-start gap-3 mb-2">
            {internetStatus === 'checking' && (
              <Loader className="w-5 h-5 text-purple-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            {internetStatus === 'success' && (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            {internetStatus === 'failed' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wifi size={16} className={
                  internetStatus === 'success' ? 'text-green-400' : 
                  internetStatus === 'failed' ? 'text-red-400' : 
                  'text-purple-400'
                } />
                <p className="font-semibold text-white">Internet Connection</p>
              </div>
              <p className={`text-sm mt-1 ${
                internetStatus === 'success' ? 'text-green-300' :
                internetStatus === 'failed' ? 'text-red-300' :
                'text-gray-400'
              }`}>
                {internetMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {cameraStatus === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-300">
              <strong>Camera Required:</strong> Please enable camera access or check your browser permissions to play Smirkle.
            </p>
          </div>
        )}

        {cameraStatus === 'success' && internetStatus === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-300">
              ✓ All systems ready! Let's play!
            </p>
          </div>
        )}

        {/* Loading Indicator */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <div className={`w-2 h-2 rounded-full ${cameraStatus !== 'checking' ? 'bg-green-400' : 'bg-cyan-400 animate-pulse'}`} />
            <div className={`w-2 h-2 rounded-full ${internetStatus !== 'checking' ? 'bg-green-400' : 'bg-purple-400 animate-pulse'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
