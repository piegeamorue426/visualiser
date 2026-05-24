/**
 * Energy tracker for detecting drops, buildups, silence, and peaks.
 *
 * Maintains a rolling history of energy values and analyzes patterns.
 */
export interface EnergyState {
  /** Current energy level (0-1) */
  current: number;
  /** Average energy over the history window */
  average: number;
  /** Whether a drop was detected (sudden decrease after high energy) */
  dropDetected: boolean;
  /** Whether a buildup is occurring (gradually increasing energy) */
  buildupDetected: boolean;
  /** Whether silence is detected (energy below threshold for N frames) */
  silence: boolean;
  /** Whether a peak was detected (local maximum) */
  peakDetected: boolean;
  /** Whether a transition was detected (significant change in average energy) */
  transitionDetected: boolean;
}

export interface EnergyTrackerOptions {
  /** Number of frames to keep in history */
  historySize?: number;
  /** Energy threshold below which silence is detected */
  silenceThreshold?: number;
  /** Number of consecutive silent frames to trigger silence state */
  silenceFrames?: number;
  /** Minimum drop ratio to detect a drop (e.g. 0.5 = energy halved) */
  dropRatio?: number;
  /** Number of frames to evaluate for buildup detection */
  buildupWindow?: number;
  /** Minimum energy increase across buildup window to count as buildup */
  buildupThreshold?: number;
}

const DEFAULT_OPTIONS: Required<EnergyTrackerOptions> = {
  historySize: 128,
  silenceThreshold: 0.02,
  silenceFrames: 30,
  dropRatio: 0.4,
  buildupWindow: 32,
  buildupThreshold: 0.3,
};

export class EnergyTracker {
  private options: Required<EnergyTrackerOptions>;
  private history: number[] = [];
  private silentFrameCount = 0;
  private previousAverage = 0;

  constructor(options?: EnergyTrackerOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Update tracker with new energy value and return current state.
   * @param energy - current energy value (0-1)
   * @returns current energy state with detection flags
   */
  update(energy: number): EnergyState {
    this.history.push(energy);
    if (this.history.length > this.options.historySize) {
      this.history.shift();
    }

    const average = this.calculateAverage();
    const silence = this.detectSilence(energy);
    const dropDetected = this.detectDrop(energy);
    const buildupDetected = this.detectBuildup();
    const peakDetected = this.detectPeak();
    const transitionDetected = this.detectTransition(average);

    this.previousAverage = average;

    return {
      current: energy,
      average,
      dropDetected,
      buildupDetected,
      silence,
      peakDetected,
      transitionDetected,
    };
  }

  /**
   * Reset tracker state.
   */
  reset(): void {
    this.history = [];
    this.silentFrameCount = 0;
    this.previousAverage = 0;
  }

  /**
   * Get the energy history.
   */
  getHistory(): number[] {
    return [...this.history];
  }

  private calculateAverage(): number {
    if (this.history.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < this.history.length; i++) {
      sum += this.history[i];
    }
    return sum / this.history.length;
  }

  private detectSilence(energy: number): boolean {
    if (energy < this.options.silenceThreshold) {
      this.silentFrameCount++;
    } else {
      this.silentFrameCount = 0;
    }
    return this.silentFrameCount >= this.options.silenceFrames;
  }

  private detectDrop(energy: number): boolean {
    if (this.history.length < 8) return false;

    // Look at the recent past (before this frame) to find a high energy period
    const recentWindow = this.history.slice(-8, -1);
    const recentAvg =
      recentWindow.reduce((sum, v) => sum + v, 0) / recentWindow.length;

    // Drop: energy suddenly much lower than recent average
    return recentAvg > 0.2 && energy < recentAvg * this.options.dropRatio;
  }

  private detectBuildup(): boolean {
    const window = this.options.buildupWindow;
    if (this.history.length < window) return false;

    const recent = this.history.slice(-window);

    // Check if energy is consistently increasing
    const firstHalf = recent.slice(0, Math.floor(window / 2));
    const secondHalf = recent.slice(Math.floor(window / 2));

    const firstAvg =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    return secondAvg - firstAvg > this.options.buildupThreshold;
  }

  private detectPeak(): boolean {
    if (this.history.length < 3) return false;

    const len = this.history.length;
    const current = this.history[len - 1];
    const prev = this.history[len - 2];
    const prevPrev = this.history[len - 3];

    // Peak: previous frame was higher than its neighbors
    return prev > prevPrev && prev > current;
  }

  private detectTransition(currentAverage: number): boolean {
    if (this.previousAverage === 0) return false;

    const change = Math.abs(currentAverage - this.previousAverage);
    return change > 0.1;
  }
}
