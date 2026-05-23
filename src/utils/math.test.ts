import { describe, it, expect } from 'vitest';
import { lerp, clamp, map, smoothstep } from './math';

describe('math utilities', () => {
  describe('lerp', () => {
    it('interpolates between two values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });
  });

  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('map', () => {
    it('maps value from one range to another', () => {
      expect(map(5, 0, 10, 0, 100)).toBe(50);
      expect(map(0, 0, 10, 20, 40)).toBe(20);
    });
  });

  describe('smoothstep', () => {
    it('returns 0 at lower edge', () => {
      expect(smoothstep(0, 1, 0)).toBe(0);
    });

    it('returns 1 at upper edge', () => {
      expect(smoothstep(0, 1, 1)).toBe(1);
    });

    it('returns 0.5 at midpoint', () => {
      expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    });
  });
});
