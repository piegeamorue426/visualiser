/**
 * Community system type definitions.
 */

import type { Preset } from '@presets/types';

export interface CommunityPreset extends Preset {
  author: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  uploadedAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  presets: string[];
}
