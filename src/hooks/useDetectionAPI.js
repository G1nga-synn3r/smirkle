/**
 * useDetectionAPI Hook
 * Manages communication with the emotion recognition backend API.
 * 
 * Responsibilities:
 * - Connect to the backend API
 * - Send webcam frames for analysis
 * - Handle WebSocket connections for real-time updates
 * - Manage connection state and reconnection
 * - Provide detection results to components
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

// Detection settings
const SMIRK_THRESHOLD = parseFloat(import.meta.env.VITE_SMIRK_THRESHOLD || '0.3');
const CONSECUTIVE_FRAMES_REQUIRED = parseInt(import.meta.env.VITE_CONSECUTIVE_FRAMES_REQUIRED || '3', 10);
const FRAME_CAPTURE_INTERVAL = parseInt(import.meta.env.VITE_FRAME_CAPTURE_INTERVAL || '100', 10);
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;

/**
 * Connection states for the detection API
 */
export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

/**
 * Main hook for backend emotion detection API
 */
export function useDetectionAPI() {
  // Connection state
  const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
  const [isConnected, setIsConnected] = useState(false);
  
  // Session and detection state
  const [sessionId, setSessionId] = useState(null);
  const [lastDetection, setLastDetection] = useState(null);
  const [consecutiveSmirkCount, setConsecutiveSmirkCount] = useState(0);
  
  // Error state
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  
  // Refs for maintaining state across renders
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const abortControllerRef = useRef(null);
  const frameCountRef = useRef(0);
  
  /**
   * Create a new game session
   */
  const createSession = useCallback(async (userId) => {
    try {
      setConnectionState(CONNECTION_STATE.CONNECTING);
      setError(null);
      setErrorType(null);
      
      const response = await fetch(`${API_URL}/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          difficulty: 'random'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`);
      }
      
      const sessionData = await response.json();
      setSessionId(sessionData.session_id);
      
      return sessionData;
    } catch (err) {
      setError(err.message);
      setErrorType('SESSION_CREATION_ERROR');
      setConnectionState(CONNECTION_STATE.ERROR);
      throw err;
    }
  }, []);
  
  /**
   * Connect to WebSocket for real-time detection
   */
  const connectWebSocket = useCallback((session) => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    setConnectionState(CONNECTION_STATE.CONNECTING);
    
    try {
      socketRef.current = new WebSocket(
        `${WS_URL}/ws?session_id=${session.session_id}`
      );
      
      socketRef.current.onopen = () => {
        console.log('[DetectionAPI] WebSocket connected');
        setIsConnected(true);
        setConnectionState(CONNECTION_STATE.CONNECTED);
        reconnectAttemptsRef.current = 0;
      };
      
      socketRef.current.onclose = (event) => {
        console.log('[DetectionAPI] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          handleReconnect(session);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionState(CONNECTION_STATE.ERROR);
          setError('Max reconnection attempts reached');
          setErrorType('MAX_RECONNECT_ATTEMPTS');
        }
      };
      
      socketRef.current.onerror = (err) => {
        console.error('[DetectionAPI] WebSocket error:', err);
        setConnectionState(CONNECTION_STATE.ERROR);
        setError('WebSocket connection error');
        setErrorType('WEBSOCKET_ERROR');
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'detection_result') {
            handleDetectionResult(data.payload);
          } else if (data.type === 'game_over') {
            handleGameOver(data.payload);
          } else if (data.type === 'pong') {
            // Handle pong response for latency tracking
            console.log('[DetectionAPI] Latency:', data.latency_ms, 'ms');
          }
        } catch (err) {
          console.error('[DetectionAPI] Error parsing WebSocket message:', err);
        }
      };
      
    } catch (err) {
      console.error('[DetectionAPI] WebSocket connection failed:', err);
      setConnectionState(CONNECTION_STATE.ERROR);
      setError(err.message);
      setErrorType('WEBSOCKET_CONNECTION_FAILED');
    }
  }, []);
  
  /**
   * Handle reconnection with exponential backoff
   */
  const handleReconnect = useCallback((session) => {
    setConnectionState(CONNECTION_STATE.RECONNECTING);
    reconnectAttemptsRef.current += 1;
    
    const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);
    console.log(`[DetectionAPI] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    
    setTimeout(() => {
      connectWebSocket(session);
    }, delay);
  }, [connectWebSocket]);
  
  /**
   * Handle detection result from WebSocket
   */
  const handleDetectionResult = useCallback((detection) => {
    setLastDetection(detection);
    
    // Track consecutive smirk frames
    if (detection.is_smirk) {
      setConsecutiveSmirkCount(prev => prev + 1);
    } else {
      setConsecutiveSmirkCount(0);
    }
  }, []);
  
  /**
   * Handle game over event
   */
  const handleGameOver = useCallback((gameOverData) => {
    console.log('[DetectionAPI] Game over:', gameOverData);
    setLastDetection(prev => ({
      ...prev,
      game_over: true,
      game_over_reason: gameOverData.reason
    }));
    setConsecutiveSmirkCount(0);
  }, []);
  
  /**
   * Send a frame to the backend via REST API
   * Used as fallback when WebSocket is not available
   */
  const sendFrame = useCallback(async (frameData, metadata = {}) => {
    if (!sessionId) {
      console.warn('[DetectionAPI] Cannot send frame: no session');
      return null;
    }
    
    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`${API_URL}/analyze-emotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frame: frameData,
          session_id: sessionId,
          timestamp: metadata.timestamp || Date.now(),
          frame_number: metadata.frameNumber || frameCountRef.current++,
          quality_check: metadata.qualityCheck !== false
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`Frame analysis failed: ${response.status}`);
      }
      
      const detection = await response.json();
      handleDetectionResult(detection);
      
      return detection;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[DetectionAPI] Frame analysis aborted');
        return null;
      }
      console.error('[DetectionAPI] Error sending frame:', err);
      setError(err.message);
      setErrorType('FRAME_ANALYSIS_ERROR');
      return null;
    }
  }, [sessionId, handleDetectionResult]);
  
  /**
   * Send ping to check WebSocket connection
   */
  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now()
      }));
    }
  }, []);
  
  /**
   * Reset session state
   */
  const resetSession = useCallback(async () => {
    if (sessionId) {
      try {
        await fetch(`${API_URL}/session/${sessionId}/reset`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('[DetectionAPI] Error resetting session:', err);
      }
    }
    
    setSessionId(null);
    setLastDetection(null);
    setConsecutiveSmirkCount(0);
    setError(null);
    setErrorType(null);
    setConnectionState(CONNECTION_STATE.DISCONNECTED);
  }, [sessionId]);
  
  /**
   * Disconnect and cleanup
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000, 'Client disconnect');
      socketRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState(CONNECTION_STATE.DISCONNECTED);
    reconnectAttemptsRef.current = 0;
  }, []);
  
  /**
   * Get session status
   */
  const getSessionStatus = useCallback(async () => {
    if (!sessionId) return null;
    
    try {
      const response = await fetch(`${API_URL}/session/${sessionId}/status`);
      if (!response.ok) throw new Error('Failed to get session status');
      return await response.json();
    } catch (err) {
      console.error('[DetectionAPI] Error getting session status:', err);
      return null;
    }
  }, [sessionId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    // Connection state
    connectionState,
    isConnected,
    
    // Session and detection
    sessionId,
    lastDetection,
    consecutiveSmirkCount,
    
    // Detection thresholds
    smirkThreshold: SMIRK_THRESHOLD,
    consecutiveFramesRequired: CONSECUTIVE_FRAMES_REQUIRED,
    
    // Error state
    error,
    errorType,
    
    // Methods
    createSession,
    connectWebSocket,
    sendFrame,
    sendPing,
    resetSession,
    disconnect,
    getSessionStatus,
    
    // Computed states
    isGameOver: lastDetection?.game_over === true || 
                lastDetection?.game_over_reason === 'smirk_detected' ||
                consecutiveSmirkCount >= CONSECUTIVE_FRAMES_REQUIRED,
    happinessScore: lastDetection?.happiness || 0,
    isSmirking: lastDetection?.is_smirk || false
  };
}

/**
 * Simplified hook for just sending frames (no session management)
 */
export function useEmotionDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const analyzeFrame = useCallback(async (frameData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/analyze-emotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          frame: frameData,
          session_id: 'single-frame-session',
          timestamp: Date.now(),
          frame_number: 0
        })
      });
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }
      
      const detection = await response.json();
      setResult(detection);
      return detection;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    analyzeFrame,
    isLoading,
    error,
    result,
    clearResult: () => setResult(null),
    clearError: () => setError(null)
  };
}

export default useDetectionAPI;
