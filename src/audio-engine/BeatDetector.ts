/**
 * Beat detection using energy flux onset detection with adaptive threshold.
 *
 * The algorithm tracks energy history and detects sudden increases
 * above an adaptive threshold derived from recent energy statistics.
 */
export interface BeatDetectionResult {
  /** Whether a beat was detected this frame */
  detected: boolean;
  /** Strength of the detected beat (0-1) */
  strength: number;
  /** Confidence score (0-1) based on consistency */
  confidence: number;
  /** Time of last beat in ms */
  lastBeatTime: number;
}

export interface BeatDetectorOptions {
  /** Number of frames to keep in energy history */
  historySize?: number;
  /** Multiplier for adaptive threshold (higher = less sensitive) */
  thresholdMultiplier?: number;
  /** Minimum time between beats in ms */
  minBeatInterval?: number;
  /** Decay rate for confidence (0-1) */
  confidenceDecay?: number;
}

const DEFAULT_OPTIONS: Required<BeatDetectorOptions> = {
  historySize: 43,
  thresholdMultiplier: 1.4,
  minBeatInterval: 200,
  confidenceDecay: 0.95,
};

export class BeatDetector {
  private options: Required<BeatDetectorOptions>;
  private energyHistory: number[] = [];
  private lastBeatTime = 0;
  private confidence = 0;
  private beatIntervals: number[] = [];
  private lastEnergy = 0;

  constructor(options?: BeatDetectorOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Process a new energy value and detect if a beat occurred.
   * @param energy - current frame energy (0-1)
   * @param currentTime - current time in ms
   * @returns beat detection result
   */
  detect(energy: number, currentTime: number): BeatDetectionResult {
    this.energyHistory.push(energy);

    // Keep history within bounds
    if (this.energyHistory.length > this.options.historySize) {
      this.energyHistory.shift();
    }

    // Need at least some history to detect
    if (this.energyHistory.length < 4) {
      this.lastEnergy = energy;
      return {
        detected: false,
        strength: 0,
        confidence: this.confidence,
        lastBeatTime: this.lastBeatTime,
      };
    }

    // Calculate energy flux (positive difference from previous frame)
    const flux = Math.max(0, energy - this.lastEnergy);
    this.lastEnergy = energy;

    // Calculate adaptive threshold from history
    const threshold = this.calculateThreshold();

    // Check if energy flux exceeds threshold and minimum interval has passed
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    const detected =
      flux > threshold && timeSinceLastBeat > this.options.minBeatInterval;

    let strength = 0;

    if (detected) {
      strength = Math.min(1, flux / (threshold * 2));

      // Track beat intervals for confidence calculation
      if (this.lastBeatTime > 0) {
        this.beatIntervals.push(timeSinceLastBeat);
        if (this.beatIntervals.length > 16) {
          this.beatIntervals.shift();
        }
      }

      this.lastBeatTime = currentTime;
      this.confidence = Math.min(1, this.confidence + 0.2);
    } else {
      this.confidence *= this.options.confidenceDecay;
    }

    return {
      detected,
      strength,
      confidence: this.confidence,
      lastBeatTime: this.lastBeatTime,
    };
  }

  /**
   * Get recorded beat intervals (useful for BPM estimation).
   */
  getBeatIntervals(): number[] {
    return [...this.beatIntervals];
  }

  /**
   * Reset the detector state.
   */
  reset(): void {
    this.energyHistory = [];
    this.beatIntervals = [];
    this.lastBeatTime = 0;
    this.confidence = 0;
    this.lastEnergy = 0;
  }

  /**
   * Calculate adaptive threshold from energy history.
   * Uses mean + multiplier * standard deviation.
   */
  private calculateThreshold(): number {
    const history = this.energyHistory;
    const len = history.length;
    if (len === 0) return 0;

    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += history[i];
    }
    const mean = sum / len;

    let varianceSum = 0;
    for (let i = 0; i < len; i++) {
      const diff = history[i] - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / len);

    // Threshold based on mean flux - use stdDev as sensitivity
    return (mean + stdDev) * this.options.thresholdMultiplier * 0.1;
  }
}
