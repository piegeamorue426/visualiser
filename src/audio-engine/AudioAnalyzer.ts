import { DEFAULTS } from '@config/defaults';
import type { AudioState } from './types';
import { createDefaultAudioState } from './types';
import { getBandEnergy } from './FrequencyBands';
import { BeatDetector } from './BeatDetector';
import { EnergyTracker } from './EnergyTracker';
import { BPMEstimator } from './BPMEstimator';
import { AudioSmoother } from './AudioSmoother';

/**
 * Main audio analysis class using Web Audio API AnalyserNode.
 *
 * Integrates frequency band analysis, beat detection, BPM estimation,
 * and energy tracking into a single coherent AudioState per frame.
 */
export class AudioAnalyzer {
  private analyserNode: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioNode | null = null;
  private fftSize: number;
  private sampleRate: number;

  // Internal buffers
  private frequencyData: Float32Array<ArrayBuffer> = new Float32Array(0);
  private timeDomainData: Float32Array<ArrayBuffer> = new Float32Array(0);
  private byteFrequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  // Analysis components
  private beatDetector: BeatDetector;
  private energyTracker: EnergyTracker;
  private bpmEstimator: BPMEstimator;

  // Smoothers for each band
  private bassSmoother: AudioSmoother;
  private subBassSmoother: AudioSmoother;
  private midsSmoother: AudioSmoother;
  private highsSmoother: AudioSmoother;
  private energySmoother: AudioSmoother;

  private state: AudioState;
  private frameTime = 0;

  constructor(fftSize: number = DEFAULTS.FFT_SIZE, sampleRate: number = 44100) {
    this.fftSize = fftSize;
    this.sampleRate = sampleRate;
    this.state = createDefaultAudioState();

    this.beatDetector = new BeatDetector();
    this.energyTracker = new EnergyTracker();
    this.bpmEstimator = new BPMEstimator();

    this.bassSmoother = new AudioSmoother({ attackFrames: 2, releaseFrames: 6 });
    this.subBassSmoother = new AudioSmoother({ attackFrames: 2, releaseFrames: 8 });
    this.midsSmoother = new AudioSmoother({ attackFrames: 2, releaseFrames: 5 });
    this.highsSmoother = new AudioSmoother({ attackFrames: 1, releaseFrames: 4 });
    this.energySmoother = new AudioSmoother({ attackFrames: 2, releaseFrames: 10 });
  }

  /**
   * Initialize the analyzer with a Web Audio API context and source node.
   * @param audioContext - the AudioContext
   * @param sourceNode - the source node (e.g., MediaStreamSource)
   */
  initialize(audioContext: AudioContext, sourceNode: AudioNode): void {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    this.sampleRate = audioContext.sampleRate;

    this.analyserNode = audioContext.createAnalyser();
    this.analyserNode.fftSize = this.fftSize;
    this.analyserNode.smoothingTimeConstant = DEFAULTS.SMOOTHING_TIME_CONSTANT;
    this.analyserNode.minDecibels = DEFAULTS.MIN_DECIBELS;
    this.analyserNode.maxDecibels = DEFAULTS.MAX_DECIBELS;

    sourceNode.connect(this.analyserNode);

    const binCount = this.analyserNode.frequencyBinCount;
    this.frequencyData = new Float32Array(binCount);
    this.timeDomainData = new Float32Array(this.fftSize);
    this.byteFrequencyData = new Uint8Array(binCount);
  }

  /**
   * Perform a full analysis frame and return the current AudioState.
   * Call this once per animation frame.
   */
  analyze(): AudioState {
    if (!this.analyserNode) {
      return this.state;
    }

    this.frameTime = performance.now();

    // Get raw data from analyser
    this.analyserNode.getFloatFrequencyData(this.frequencyData);
    this.analyserNode.getFloatTimeDomainData(this.timeDomainData);
    this.analyserNode.getByteFrequencyData(this.byteFrequencyData);

    // Compute frequency bands (using byte data normalized to 0-1)
    const normalizedData = new Float32Array(this.byteFrequencyData.length);
    for (let i = 0; i < this.byteFrequencyData.length; i++) {
      normalizedData[i] = this.byteFrequencyData[i] / 255;
    }

    const subBass = getBandEnergy(normalizedData, 20, 60, this.fftSize, this.sampleRate);
    const bass = getBandEnergy(normalizedData, 60, 250, this.fftSize, this.sampleRate);
    const lowMids = getBandEnergy(normalizedData, 250, 500, this.fftSize, this.sampleRate);
    const mids = getBandEnergy(normalizedData, 500, 2000, this.fftSize, this.sampleRate);
    const upperMids = getBandEnergy(normalizedData, 2000, 4000, this.fftSize, this.sampleRate);
    const highs = getBandEnergy(normalizedData, 4000, 8000, this.fftSize, this.sampleRate);
    const vocals = getBandEnergy(normalizedData, 250, 4000, this.fftSize, this.sampleRate);

    // RMS calculation from time domain
    let rmsSum = 0;
    for (let i = 0; i < this.timeDomainData.length; i++) {
      rmsSum += this.timeDomainData[i] * this.timeDomainData[i];
    }
    const rms = Math.sqrt(rmsSum / this.timeDomainData.length);

    // Overall energy (weighted combination of bands)
    const energy = this.energySmoother.smooth(
      subBass * 0.2 + bass * 0.3 + mids * 0.25 + highs * 0.15 + rms * 0.1
    );

    // Spectral centroid
    const spectralCentroid = this.computeSpectralCentroid(normalizedData);

    // Spectral flatness
    const spectralFlatness = this.computeSpectralFlatness(normalizedData);

    // Beat detection
    const beatResult = this.beatDetector.detect(energy, this.frameTime);

    // BPM estimation
    if (beatResult.detected) {
      this.bpmEstimator.addBeat(this.frameTime);
    }
    const bpmEstimate = this.bpmEstimator.getEstimate();

    // Energy tracking
    const energyState = this.energyTracker.update(energy);

    // Kick and snare detection (based on specific frequency bands)
    const kickEnergy = subBass + bass * 0.5;
    const snareEnergy = upperMids * 0.5 + highs * 0.3;
    const kickDetected = kickEnergy > 0.6 && beatResult.detected;
    const snareDetected = snareEnergy > 0.4 && beatResult.detected;

    // Build spectrum (downsample to 256 bands)
    const spectrum = this.state.spectrum;
    const ratio = normalizedData.length / 256;
    for (let i = 0; i < 256; i++) {
      const startIdx = Math.floor(i * ratio);
      const endIdx = Math.floor((i + 1) * ratio);
      let sum = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += normalizedData[j];
      }
      spectrum[i] = sum / (endIdx - startIdx);
    }

    // Copy waveform
    const waveform = this.state.waveform;
    if (waveform.length === this.timeDomainData.length) {
      waveform.set(this.timeDomainData);
    }

    // Update state
    this.state.subBass = this.subBassSmoother.smooth(subBass);
    this.state.bass = this.bassSmoother.smooth(bass);
    this.state.mids = this.midsSmoother.smooth(mids);
    this.state.highs = this.highsSmoother.smooth(highs);
    this.state.vocals = vocals;
    this.state.kick = kickEnergy;
    this.state.snare = snareEnergy;
    this.state.energy = energy;
    this.state.rms = rms;
    this.state.spectralCentroid = spectralCentroid;
    this.state.spectralFlatness = spectralFlatness;
    this.state.beatDetected = beatResult.detected;
    this.state.bpm = bpmEstimate.bpm;
    this.state.dropDetected = energyState.dropDetected;
    this.state.peakDetected = energyState.peakDetected;
    this.state.silence = energyState.silence;
    this.state.transitionDetected = energyState.transitionDetected;
    this.state.kickDetected = kickDetected;
    this.state.snareDetected = snareDetected;

    return this.state;
  }

  /**
   * Get the current audio state without re-analyzing.
   */
  getState(): AudioState {
    return this.state;
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.sourceNode && this.analyserNode) {
      try {
        this.sourceNode.disconnect(this.analyserNode);
      } catch {
        // Already disconnected
      }
    }
    this.analyserNode = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.beatDetector.reset();
    this.energyTracker.reset();
    this.bpmEstimator.reset();
  }

  /**
   * Compute spectral centroid (center of mass of the spectrum).
   * Returns normalized value (0-1 representing low to high).
   */
  private computeSpectralCentroid(data: Float32Array): number {
    let weightedSum = 0;
    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      weightedSum += i * data[i];
      sum += data[i];
    }

    if (sum === 0) return 0;
    return (weightedSum / sum) / data.length;
  }

  /**
   * Compute spectral flatness (ratio of geometric to arithmetic mean).
   * 1 = white noise, 0 = pure tone.
   */
  private computeSpectralFlatness(data: Float32Array): number {
    const len = data.length;
    if (len === 0) return 0;

    let logSum = 0;
    let sum = 0;
    let nonZeroCount = 0;

    for (let i = 0; i < len; i++) {
      const val = Math.max(data[i], 1e-10); // avoid log(0)
      logSum += Math.log(val);
      sum += data[i];
      if (data[i] > 1e-10) nonZeroCount++;
    }

    if (sum === 0 || nonZeroCount === 0) return 0;

    const geometricMean = Math.exp(logSum / len);
    const arithmeticMean = sum / len;

    return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  }
}
