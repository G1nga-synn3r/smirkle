import { useState, useCallback, useRef } from 'react';

/**
 * Sound effects hook using Web Audio API
 * Generates sounds programmatically without needing audio files
 */
export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);

  // Initialize AudioContext on first use
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a comical buzzer sound (Game Over)
  const playBuzzer = useCallback(() => {
    if (isMuted) return;

    const ctx = getAudioContext();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for buzzer
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure buzzer sound
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);

    // Configure volume envelope
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    // Play sound
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);

    // Add a second dissonant oscillator for comedic effect
    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);

    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(140, ctx.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.6);

    gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

    oscillator2.start(ctx.currentTime);
    oscillator2.stop(ctx.currentTime + 0.6);
  }, [isMuted, getAudioContext]);

  // Play a short ding sound (success)
  const playDing = useCallback(() => {
    if (isMuted) return;

    const ctx = getAudioContext();

    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for ding
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Configure ding sound (sine wave with high pitch)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6

    // Configure volume envelope (quick attack, slow decay)
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    // Play sound
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, [isMuted, getAudioContext]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Resume audio context (needed for browsers that suspend it)
  const resumeAudio = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }, [getAudioContext]);

  return {
    isMuted,
    playBuzzer,
    playDing,
    toggleMute,
    resumeAudio,
  };
}
