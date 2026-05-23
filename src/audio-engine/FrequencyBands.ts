import type { FrequencyBandDefinition, FrequencyBandResult } from './types';

/**
 * Standard named frequency band definitions.
 */
export const FREQUENCY_BANDS: FrequencyBandDefinition[] = [
  { name: 'subBass', lowFreq: 20, highFreq: 60 },
  { name: 'bass', lowFreq: 60, highFreq: 250 },
  { name: 'lowMids', lowFreq: 250, highFreq: 500 },
  { name: 'mids', lowFreq: 500, highFreq: 2000 },
  { name: 'upperMids', lowFreq: 2000, highFreq: 4000 },
  { name: 'highs', lowFreq: 4000, highFreq: 8000 },
  { name: 'brilliance', lowFreq: 8000, highFreq: 20000 },
];

/**
 * Convert a frequency in Hz to an FFT bin index.
 * @param frequency - frequency in Hz
 * @param fftSize - the FFT size (e.g. 2048)
 * @param sampleRate - the audio sample rate (e.g. 44100)
 * @returns bin index (clamped to valid range)
 */
export function frequencyToBin(
  frequency: number,
  fftSize: number,
  sampleRate: number
): number {
  const binCount = fftSize / 2;
  const binWidth = sampleRate / fftSize;
  const bin = Math.round(frequency / binWidth);
  return Math.max(0, Math.min(bin, binCount - 1));
}

/**
 * Get the average energy within a frequency range from FFT data.
 * The FFT data is expected to be in decibels (as from AnalyserNode.getFloatFrequencyData)
 * or normalized 0-255 (from getByteFrequencyData).
 *
 * @param fftData - frequency domain data array
 * @param lowFreq - lower frequency bound in Hz
 * @param highFreq - upper frequency bound in Hz
 * @param fftSize - FFT size
 * @param sampleRate - audio sample rate
 * @returns average energy value across the band
 */
export function getBandEnergy(
  fftData: Float32Array | Uint8Array,
  lowFreq: number,
  highFreq: number,
  fftSize: number,
  sampleRate: number
): number {
  const lowBin = frequencyToBin(lowFreq, fftSize, sampleRate);
  const highBin = frequencyToBin(highFreq, fftSize, sampleRate);

  if (lowBin > highBin || lowBin >= fftData.length) {
    return 0;
  }

  let sum = 0;
  const endBin = Math.min(highBin, fftData.length - 1);
  for (let i = lowBin; i <= endBin; i++) {
    sum += fftData[i];
  }

  const count = endBin - lowBin + 1;
  return count > 0 ? sum / count : 0;
}

/**
 * Get the peak value within a frequency range from FFT data.
 */
export function getBandPeak(
  fftData: Float32Array | Uint8Array,
  lowFreq: number,
  highFreq: number,
  fftSize: number,
  sampleRate: number
): number {
  const lowBin = frequencyToBin(lowFreq, fftSize, sampleRate);
  const highBin = frequencyToBin(highFreq, fftSize, sampleRate);

  if (lowBin > highBin || lowBin >= fftData.length) {
    return 0;
  }

  let peak = 0;
  const endBin = Math.min(highBin, fftData.length - 1);
  for (let i = lowBin; i <= endBin; i++) {
    if (fftData[i] > peak) {
      peak = fftData[i];
    }
  }

  return peak;
}

/**
 * Analyze all standard frequency bands.
 * @param fftData - normalized frequency data (0-1 range or 0-255)
 * @param fftSize - FFT size
 * @param sampleRate - sample rate
 * @returns array of band results
 */
export function analyzeAllBands(
  fftData: Float32Array | Uint8Array,
  fftSize: number,
  sampleRate: number
): FrequencyBandResult[] {
  return FREQUENCY_BANDS.map((band) => ({
    name: band.name,
    energy: getBandEnergy(fftData, band.lowFreq, band.highFreq, fftSize, sampleRate),
    peak: getBandPeak(fftData, band.lowFreq, band.highFreq, fftSize, sampleRate),
  }));
}
