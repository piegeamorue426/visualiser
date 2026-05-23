import { describe, it, expect } from 'vitest';
import {
  frequencyToBin,
  getBandEnergy,
  getBandPeak,
  analyzeAllBands,
  FREQUENCY_BANDS,
} from '../FrequencyBands';

describe('FrequencyBands', () => {
  const fftSize = 2048;
  const sampleRate = 44100;
  const binCount = fftSize / 2; // 1024 bins

  describe('frequencyToBin', () => {
    it('should map 0 Hz to bin 0', () => {
      expect(frequencyToBin(0, fftSize, sampleRate)).toBe(0);
    });

    it('should map Nyquist frequency to last bin', () => {
      const nyquist = sampleRate / 2;
      expect(frequencyToBin(nyquist, fftSize, sampleRate)).toBe(binCount - 1);
    });

    it('should map known frequencies correctly', () => {
      // Bin width = 44100 / 2048 = ~21.53 Hz per bin
      const binWidth = sampleRate / fftSize;

      // 100 Hz should map to bin ~4.6 -> rounds to 5
      const bin100 = frequencyToBin(100, fftSize, sampleRate);
      expect(bin100).toBe(Math.round(100 / binWidth));

      // 1000 Hz should map to bin ~46.4 -> rounds to 46
      const bin1000 = frequencyToBin(1000, fftSize, sampleRate);
      expect(bin1000).toBe(Math.round(1000 / binWidth));
    });

    it('should clamp to valid range', () => {
      expect(frequencyToBin(-100, fftSize, sampleRate)).toBe(0);
      expect(frequencyToBin(100000, fftSize, sampleRate)).toBe(binCount - 1);
    });
  });

  describe('getBandEnergy', () => {
    it('should return 0 for empty data in a range', () => {
      const data = new Float32Array(binCount);
      const energy = getBandEnergy(data, 60, 250, fftSize, sampleRate);
      expect(energy).toBe(0);
    });

    it('should correctly calculate average energy for a band', () => {
      const data = new Float32Array(binCount);
      // Fill bass range (60-250 Hz) with value 0.5
      const lowBin = frequencyToBin(60, fftSize, sampleRate);
      const highBin = frequencyToBin(250, fftSize, sampleRate);
      for (let i = lowBin; i <= highBin; i++) {
        data[i] = 0.5;
      }

      const energy = getBandEnergy(data, 60, 250, fftSize, sampleRate);
      expect(energy).toBeCloseTo(0.5, 5);
    });

    it('should handle partial energy in a band', () => {
      const data = new Float32Array(binCount);
      // Fill only half the bins in the range
      const lowBin = frequencyToBin(60, fftSize, sampleRate);
      const highBin = frequencyToBin(250, fftSize, sampleRate);
      const midBin = Math.floor((lowBin + highBin) / 2);

      for (let i = lowBin; i <= midBin; i++) {
        data[i] = 1.0;
      }
      // Leave the rest at 0

      const energy = getBandEnergy(data, 60, 250, fftSize, sampleRate);
      // Should be less than 1 since half the bins are 0
      expect(energy).toBeGreaterThan(0);
      expect(energy).toBeLessThan(1);
    });

    it('should isolate bands correctly (no bleed between bands)', () => {
      const data = new Float32Array(binCount);
      // Fill only the mids range (500-2000 Hz)
      const lowBin = frequencyToBin(500, fftSize, sampleRate);
      const highBin = frequencyToBin(2000, fftSize, sampleRate);
      for (let i = lowBin; i <= highBin; i++) {
        data[i] = 0.8;
      }

      // Mids should have energy
      const midsEnergy = getBandEnergy(data, 500, 2000, fftSize, sampleRate);
      expect(midsEnergy).toBeCloseTo(0.8, 5);

      // Sub-bass should have zero energy
      const subBassEnergy = getBandEnergy(data, 20, 60, fftSize, sampleRate);
      expect(subBassEnergy).toBe(0);

      // Highs should have zero energy
      const highsEnergy = getBandEnergy(data, 4000, 8000, fftSize, sampleRate);
      expect(highsEnergy).toBe(0);
    });
  });

  describe('getBandPeak', () => {
    it('should return the peak value in a frequency range', () => {
      const data = new Float32Array(binCount);
      const lowBin = frequencyToBin(60, fftSize, sampleRate);
      const highBin = frequencyToBin(250, fftSize, sampleRate);

      // Set one bin to a high value
      const peakBin = Math.floor((lowBin + highBin) / 2);
      data[peakBin] = 0.9;

      const peak = getBandPeak(data, 60, 250, fftSize, sampleRate);
      expect(peak).toBeCloseTo(0.9, 5);
    });

    it('should return 0 for empty data', () => {
      const data = new Float32Array(binCount);
      const peak = getBandPeak(data, 60, 250, fftSize, sampleRate);
      expect(peak).toBe(0);
    });
  });

  describe('analyzeAllBands', () => {
    it('should return results for all standard bands', () => {
      const data = new Float32Array(binCount);
      data.fill(0.3);

      const results = analyzeAllBands(data, fftSize, sampleRate);
      expect(results).toHaveLength(FREQUENCY_BANDS.length);
      expect(results).toHaveLength(7);

      // Each band should have a name, energy, and peak
      for (const result of results) {
        expect(result.name).toBeDefined();
        expect(result.energy).toBeGreaterThan(0);
        expect(result.peak).toBeGreaterThan(0);
      }
    });

    it('should have correct band names', () => {
      const data = new Float32Array(binCount);
      const results = analyzeAllBands(data, fftSize, sampleRate);
      const names = results.map((r) => r.name);
      expect(names).toEqual([
        'subBass',
        'bass',
        'lowMids',
        'mids',
        'upperMids',
        'highs',
        'brilliance',
      ]);
    });
  });
});
