import React, { useState, useEffect } from 'react';

export default function ModelDiagnostics() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const checks = [];

      // Check 1: Can we fetch the models directory listing?
      checks.push({
        name: 'Models directory exists',
        test: async () => {
          try {
            const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
            return response.ok ? '✓ Found' : `✗ Got ${response.status}`;
          } catch (e) {
            return `✗ ${e.message}`;
          }
        }
      });

      // Check 2: Verify TinyFaceDetector manifest
      checks.push({
        name: 'TinyFaceDetector manifest',
        test: async () => {
          try {
            const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
            if (!response.ok) return `✗ HTTP ${response.status}`;
            const json = await response.json();
            return `✓ Valid JSON (${json.length} weights)`;
          } catch (e) {
            return `✗ ${e.message}`;
          }
        }
      });

      // Check 3: Verify TinyFaceDetector shard files
      checks.push({
        name: 'TinyFaceDetector shard1.bin',
        test: async () => {
          try {
            const response = await fetch('/models/tiny_face_detector_model-shard1.bin');
            if (!response.ok) return `✗ HTTP ${response.status}`;
            const blob = await response.blob();
            return `✓ Loaded (${(blob.size / 1024 / 1024).toFixed(2)} MB)`;
          } catch (e) {
            return `✗ ${e.message}`;
          }
        }
      });

      // Check 4: Verify FaceExpressionNet manifest
      checks.push({
        name: 'FaceExpressionNet manifest',
        test: async () => {
          try {
            const response = await fetch('/models/face_expression_model-weights_manifest.json');
            if (!response.ok) return `✗ HTTP ${response.status}`;
            const json = await response.json();
            return `✓ Valid JSON (${json.length} weights)`;
          } catch (e) {
            return `✗ ${e.message}`;
          }
        }
      });

      // Check 5: Verify FaceExpressionNet shard files
      checks.push({
        name: 'FaceExpressionNet shard1.bin',
        test: async () => {
          try {
            const response = await fetch('/models/face_expression_model-shard1.bin');
            if (!response.ok) return `✗ HTTP ${response.status}`;
            const blob = await response.blob();
            return `✓ Loaded (${(blob.size / 1024 / 1024).toFixed(2)} MB)`;
          } catch (e) {
            return `✗ ${e.message}`;
          }
        }
      });

      // Check 6: Try loading face-api.js library itself
      checks.push({
        name: 'face-api.js library',
        test: async () => {
          try {
            const faceapi = await import('face-api.js');
            return faceapi ? '✓ Imported successfully' : '✗ Import failed';
          } catch (e) {
            return `✗ ${e.message}`;
          }
        }
      });

      // Run all checks
      const testResults = [];
      for (const check of checks) {
        const result = await check.test();
        testResults.push({ name: check.name, result });
      }

      setResults(testResults);
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">AI Model Diagnostics</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-700 h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((check, i) => {
              const isSuccess = check.result.startsWith('✓');
              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-2 ${
                    isSuccess
                      ? 'bg-green-900/30 border-green-500/50 text-green-300'
                      : 'bg-red-900/30 border-red-500/50 text-red-300'
                  }`}
                >
                  <div className="font-semibold">{check.name}</div>
                  <div className="text-sm mt-1 font-mono">{check.result}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h2 className="text-white font-semibold mb-2">Troubleshooting</h2>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• If shard files show 0 KB, the build may not have included them</li>
            <li>• Check that <code className="bg-slate-900 px-1">/public/models/</code> directory exists</li>
            <li>• On production, ensure models are deployed with your app</li>
            <li>• Red marks mean files are missing or inaccessible</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
