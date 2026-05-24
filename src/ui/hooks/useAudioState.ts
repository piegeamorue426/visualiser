/**
 * React hook providing real-time audio state with RAF-synced updates.
 */

import { useState, useEffect, useRef } from 'react';
import type { AudioState } from '@audio/types';
import { createDefaultAudioState } from '@audio/types';
import type { Engine } from '@core/Engine';

export function useAudioState(engine: Engine | null): AudioState {
  const [audioState, setAudioState] = useState<AudioState>(createDefaultAudioState());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!engine) return;

    const update = () => {
      if (engine.getIsRunning()) {
        setAudioState(engine.getAudioState());
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [engine]);

  return audioState;
}
