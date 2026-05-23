/**
 * BPM estimation using autocorrelation of beat onset intervals.
 *
 * Maintains a rolling BPM estimate with confidence score.
 * Supports tempo range 60-200 BPM.
 */
export interface BPMEstimate {
  /** Estimated BPM (0 if unknown) */
  bpm: number;
  /** Confidence in the estimate (0-1) */
  confidence: number;
}

export interface BPMEstimatorOptions {
  /** Minimum BPM to detect */
  minBPM?: number;
  /** Maximum BPM to detect */
  maxBPM?: number;
  /** Number of intervals to keep for estimation */
  historySize?: number;
  /** Smoothing factor for BPM estimate (0-1, higher = more smoothing) */
  smoothing?: number;
}

const DEFAULT_OPTIONS: Required<BPMEstimatorOptions> = {
  minBPM: 60,
  maxBPM: 200,
  historySize: 24,
  smoothing: 0.8,
};

export class BPMEstimator {
  private options: Required<BPMEstimatorOptions>;
  private beatIntervals: number[] = [];
  private currentBPM = 0;
  private confidence = 0;
  private lastBeatTime = 0;

  constructor(options?: BPMEstimatorOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Record a beat event and update BPM estimate.
   * @param beatTime - timestamp of the beat in ms
   * @returns current BPM estimate with confidence
   */
  addBeat(beatTime: number): BPMEstimate {
    if (this.lastBeatTime > 0) {
      const interval = beatTime - this.lastBeatTime;
      const bpmFromInterval = 60000 / interval;

      // Only accept intervals that yield valid BPM
      if (bpmFromInterval >= this.options.minBPM && bpmFromInterval <= this.options.maxBPM) {
        this.beatIntervals.push(interval);
        if (this.beatIntervals.length > this.options.historySize) {
          this.beatIntervals.shift();
        }
      }
    }

    this.lastBeatTime = beatTime;

    if (this.beatIntervals.length >= 3) {
      const estimatedBPM = this.estimateFromIntervals();
      if (estimatedBPM > 0) {
        if (this.currentBPM === 0) {
          this.currentBPM = estimatedBPM;
        } else {
          // Smooth the BPM transition
          this.currentBPM =
            this.currentBPM * this.options.smoothing +
            estimatedBPM * (1 - this.options.smoothing);
        }
        this.confidence = this.calculateConfidence();
      }
    }

    return { bpm: this.currentBPM, confidence: this.confidence };
  }

  /**
   * Process intervals directly (useful when receiving intervals from BeatDetector).
   * @param intervals - array of beat intervals in ms
   * @returns current BPM estimate with confidence
   */
  processIntervals(intervals: number[]): BPMEstimate {
    this.beatIntervals = [];
    for (const interval of intervals) {
      const bpmFromInterval = 60000 / interval;
      if (bpmFromInterval >= this.options.minBPM && bpmFromInterval <= this.options.maxBPM) {
        this.beatIntervals.push(interval);
      }
    }

    if (this.beatIntervals.length >= 3) {
      const estimatedBPM = this.estimateFromIntervals();
      if (estimatedBPM > 0) {
        this.currentBPM = estimatedBPM;
        this.confidence = this.calculateConfidence();
      }
    }

    return { bpm: this.currentBPM, confidence: this.confidence };
  }

  /**
   * Get the current BPM estimate.
   */
  getEstimate(): BPMEstimate {
    return { bpm: this.currentBPM, confidence: this.confidence };
  }

  /**
   * Reset the estimator.
   */
  reset(): void {
    this.beatIntervals = [];
    this.currentBPM = 0;
    this.confidence = 0;
    this.lastBeatTime = 0;
  }

  /**
   * Estimate BPM using autocorrelation on beat intervals.
   * Finds the most common interval pattern.
   */
  private estimateFromIntervals(): number {
    if (this.beatIntervals.length < 3) return 0;

    const intervals = this.beatIntervals;

    // Use autocorrelation approach: find the dominant period
    // Convert intervals to BPM values
    const bpmValues = intervals.map((i) => 60000 / i);

    // Find clusters of similar BPM values using a simple histogram approach
    const binSize = 2; // 2 BPM resolution
    const bins = new Map<number, number[]>();

    for (const bpm of bpmValues) {
      const binKey = Math.round(bpm / binSize) * binSize;
      if (!bins.has(binKey)) {
        bins.set(binKey, []);
      }
      bins.get(binKey)!.push(bpm);
    }

    // Find the bin with the most values
    let bestBin: number[] = [];
    for (const values of bins.values()) {
      if (values.length > bestBin.length) {
        bestBin = values;
      }
    }

    if (bestBin.length === 0) return 0;

    // Average the values in the dominant bin
    const sum = bestBin.reduce((s, v) => s + v, 0);
    return sum / bestBin.length;
  }

  /**
   * Calculate confidence based on consistency of intervals.
   */
  private calculateConfidence(): number {
    if (this.beatIntervals.length < 3) return 0;

    const intervals = this.beatIntervals;
    const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;

    // Calculate coefficient of variation
    let varianceSum = 0;
    for (const interval of intervals) {
      const diff = interval - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / intervals.length);
    const cv = stdDev / mean;

    // Lower CV = more consistent = higher confidence
    // CV of 0 = perfect confidence, CV of 0.5 = low confidence
    const confidence = Math.max(0, Math.min(1, 1 - cv * 2));

    // Scale by number of intervals (more data = higher confidence)
    const dataFactor = Math.min(1, this.beatIntervals.length / 8);

    return confidence * dataFactor;
  }
}
