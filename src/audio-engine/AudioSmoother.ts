/**
 * Exponential moving average smoother with configurable attack/release times.
 *
 * Attack time controls how quickly the value rises (shorter = more responsive).
 * Release time controls how quickly the value falls (longer = smoother decay).
 */
export interface AudioSmootherOptions {
  /** Attack time in frames (how quickly value rises). Default: 2 */
  attackFrames?: number;
  /** Release time in frames (how quickly value falls). Default: 8 */
  releaseFrames?: number;
}

const DEFAULT_OPTIONS: Required<AudioSmootherOptions> = {
  attackFrames: 2,
  releaseFrames: 8,
};

export class AudioSmoother {
  private options: Required<AudioSmootherOptions>;
  private currentValue = 0;
  private attackCoeff: number;
  private releaseCoeff: number;

  constructor(options?: AudioSmootherOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    // Convert frame counts to smoothing coefficients
    // Higher frame count = more smoothing = coefficient closer to 1
    this.attackCoeff = this.framesToCoeff(this.options.attackFrames);
    this.releaseCoeff = this.framesToCoeff(this.options.releaseFrames);
  }

  /**
   * Process a new input value and return the smoothed result.
   * @param input - raw input value
   * @returns smoothed output value
   */
  smooth(input: number): number {
    // Use attack coefficient when rising, release when falling
    const coeff = input > this.currentValue ? this.attackCoeff : this.releaseCoeff;
    this.currentValue = this.currentValue * coeff + input * (1 - coeff);
    return this.currentValue;
  }

  /**
   * Get the current smoothed value without updating.
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Reset the smoother to zero.
   */
  reset(): void {
    this.currentValue = 0;
  }

  /**
   * Set the current value directly (useful for initialization).
   */
  setValue(value: number): void {
    this.currentValue = value;
  }

  /**
   * Update attack/release parameters.
   */
  setOptions(options: AudioSmootherOptions): void {
    if (options.attackFrames !== undefined) {
      this.options.attackFrames = options.attackFrames;
      this.attackCoeff = this.framesToCoeff(options.attackFrames);
    }
    if (options.releaseFrames !== undefined) {
      this.options.releaseFrames = options.releaseFrames;
      this.releaseCoeff = this.framesToCoeff(options.releaseFrames);
    }
  }

  /**
   * Convert a frame count to an EMA coefficient.
   * The coefficient determines how much of the old value is retained.
   */
  private framesToCoeff(frames: number): number {
    if (frames <= 0) return 0;
    // EMA time constant: after `frames` frames, the old value contributes ~37%
    return Math.exp(-1 / frames);
  }
}

/**
 * Create a bank of smoothers for smoothing multiple channels.
 */
export function createSmootherBank(
  count: number,
  options?: AudioSmootherOptions
): AudioSmoother[] {
  return Array.from({ length: count }, () => new AudioSmoother(options));
}
