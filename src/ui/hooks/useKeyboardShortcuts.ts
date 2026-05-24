/**
 * Global keyboard shortcuts hook for the visualizer.
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutHandlers {
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onNextScene: () => void;
  onPreviousScene: () => void;
  onToggleUI: () => void;
  onShowUI: () => void;
  onPresetSelect: (index: number) => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlers.onTogglePlay();
          break;
        case 'KeyF':
        case 'F11':
          e.preventDefault();
          handlers.onToggleFullscreen();
          break;
        case 'KeyN':
          handlers.onNextScene();
          break;
        case 'KeyP':
          handlers.onPreviousScene();
          break;
        case 'KeyH':
          handlers.onToggleUI();
          break;
        case 'Escape':
          handlers.onShowUI();
          break;
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          handlers.onPresetSelect(parseInt(e.code.replace('Digit', '')) - 1);
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
