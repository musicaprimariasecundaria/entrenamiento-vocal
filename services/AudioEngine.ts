
import { getNoteFromFrequency, NoteInfo } from '../utils/musicTheory';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private buffer: Float32Array = new Float32Array(2048);
  private isListening: boolean = false;
  private activeOscillators: OscillatorNode[] = [];

  public async initialize() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      try {
        // Race condition fix: don't let resume hang forever if browser is picky
        const resumePromise = this.audioContext.resume();
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
        await Promise.race([resumePromise, timeoutPromise]);
      } catch(e) {
        console.warn("Resume warning:", e);
      }
    }
  }

  public async startMicrophone() {
    await this.initialize();
    if (this.isListening) return;

    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true, 
          autoGainControl: false,
          noiseSuppression: false // Desactivado para evitar que filtre notas sostenidas
        } 
      });
      this.analyser = this.audioContext!.createAnalyser();
      this.analyser.fftSize = 2048;
      this.buffer = new Float32Array(this.analyser.fftSize);
      
      this.sourceNode = this.audioContext!.createMediaStreamSource(this.microphoneStream);
      this.sourceNode.connect(this.analyser);
      this.isListening = true;
    } catch (err) {
      console.error("Error accessing microphone", err);
      throw new Error("Permiso de micrófono denegado");
    }
  }

  public stopMicrophone() {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.analyser = null;
    this.isListening = false;
  }

  public getPitch(): NoteInfo | null {
    if (!this.analyser || !this.isListening) return null;

    this.analyser.getFloatTimeDomainData(this.buffer);
    const frequency = this.autoCorrelate(this.buffer, this.audioContext!.sampleRate);

    if (frequency === -1) return null;
    return getNoteFromFrequency(frequency);
  }

  public playTone(frequency: number, duration: number = 0.5, type: OscillatorType = 'triangle') {
    if (!this.audioContext) return;
    
    duration = Math.max(0.1, duration);

    try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type; 
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        const now = this.audioContext.currentTime;
        const attack = 0.05;
        const release = 0.1;
        
        // FIX: Robust envelope scheduling to avoid "Overlap" errors with short durations
        if (duration < attack + release) {
            // Short note mode
            const mid = duration / 2;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + mid);
            gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
        } else {
            // Normal note mode
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + attack);
            // Use linearRamp for sustain to be safe against overlap
            gainNode.gain.linearRampToValueAtTime(0.2, now + duration - release);
            gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
        }

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start();
        oscillator.stop(now + duration + 0.1); // buffer de seguridad
    } catch (e) {
        console.error("Error playing tone", e);
    }
  }

  public stopAllSounds() {
      this.activeOscillators.forEach(osc => {
          try { osc.stop(); } catch(e) {}
      });
      this.activeOscillators = [];
  }

  // Autocorrelation
  private autoCorrelate(buf: Float32Array, sampleRate: number): number {
    const SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // UMBRAL REDUCIDO: 0.005
    // Esto permite captar voces suaves o micrófonos con ganancia baja
    if (rms < 0.005) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++)
      if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    const buf2 = buf.slice(r1, r2);
    const c = new Array(buf2.length).fill(0);
    
    for (let i = 0; i < buf2.length; i++) {
      for (let j = 0; j < buf2.length - i; j++) {
        c[i] = c[i] + buf2[j] * buf2[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    
    for (let i = d; i < buf2.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    
    let T0 = maxpos;

    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}

export const audioEngine = new AudioEngine();