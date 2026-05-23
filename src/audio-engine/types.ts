/**
 * Audio state interface representing the full analysis output per frame.
 */
export interface AudioState {
  /** Sub-bass energy (20-60Hz) */
  subBass: number;
  /** Bass energy (60-250Hz) */
  bass: number;
  /** Kick drum detection level */
  kick: number;
  /** Snare detection level */
  snare: number;
  /** Mid-range energy (500-2kHz) */
  mids: number;
  /** High frequency energy (4k-8kHz) */
  highs: number;
  /** Vocal range energy (250-4kHz) */
  vocals: number;
  /** Overall energy level (0-1) */
  energy: number;
  /** Whether a drop was detected this frame */
  dropDetected: boolean;
  /** Frequency spectrum data (256 bands, normalized 0-1) */
  spectrum: Float32Array;
  /** Estimated BPM */
  bpm: number;
  /** Whether a beat was detected this frame */
  beatDetected: boolean;
  /** Whether a peak was detected this frame */
  peakDetected: boolean;
  /** Whether silence is detected */
  silence: boolean;
  /** Whether a transition was detected */
  transitionDetected: boolean;
  /** Time-domain waveform data */
  waveform: Float32Array;
  /** Root mean square energy */
  rms: number;
  /** Spectral centroid (brightness indicator) */
  spectralCentroid: number;
  /** Spectral flatness (noise vs tone, 0-1) */
  spectralFlatness: number;
  /** Whether a kick was detected this frame */
  kickDetected: boolean;
  /** Whether a snare was detected this frame */
  snareDetected: boolean;
}

/**
 * Create a default AudioState with zeroed values.
 */
export function createDefaultAudioState(): AudioState {
  return {
    subBass: 0,
    bass: 0,
    kick: 0,
    snare: 0,
    mids: 0,
    highs: 0,
    vocals: 0,
    energy: 0,
    dropDetected: false,
    spectrum: new Float32Array(256),
    bpm: 0,
    beatDetected: false,
    peakDetected: false,
    silence: true,
    transitionDetected: false,
    waveform: new Float32Array(2048),
    rms: 0,
    spectralCentroid: 0,
    spectralFlatness: 0,
    kickDetected: false,
    snareDetected: false,
  };
}

/**
 * Named frequency band definitions.
 */
export interface FrequencyBandDefinition {
  name: string;
  lowFreq: number;
  highFreq: number;
}

/**
 * Result of frequency band analysis.
 */
export interface FrequencyBandResult {
  name: string;
  energy: number;
  peak: number;
}
