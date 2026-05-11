export function playAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Create a pleasant but noticeable multi-tone chime
    oscillator.type = 'sine';
    
    // Play sequence
    const now = audioCtx.currentTime;
    
    // Tone 1
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    // Tone 2
    oscillator.frequency.setValueAtTime(659.25, now + 0.3); // E5
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    // Tone 3
    oscillator.frequency.setValueAtTime(783.99, now + 0.6); // G5
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    oscillator.start(now);
    oscillator.stop(now + 1.6);
  } catch (e) {
    console.error('AudioContext not supported or failed to play', e);
  }
}
