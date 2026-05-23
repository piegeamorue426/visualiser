/**
 * Keyboard shortcut definitions and configuration.
 */

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
}

export const DEFAULT_SHORTCUTS: KeyBinding[] = [
  { key: ' ', action: 'toggle-play', description: 'Play/Pause visualizer' },
  { key: 'f', action: 'toggle-fullscreen', description: 'Toggle fullscreen' },
  { key: 'ArrowRight', action: 'next-scene', description: 'Next scene' },
  { key: 'ArrowLeft', action: 'prev-scene', description: 'Previous scene' },
  { key: 'ArrowUp', action: 'next-preset', description: 'Next preset' },
  { key: 'ArrowDown', action: 'prev-preset', description: 'Previous preset' },
  { key: 'h', action: 'toggle-ui', description: 'Hide/show UI overlay' },
  { key: 's', ctrl: true, action: 'screenshot', description: 'Capture screenshot' },
  { key: 'p', action: 'toggle-panel', description: 'Toggle control panel' },
  { key: 'Escape', action: 'close-overlay', description: 'Close active overlay' },
  { key: '1', action: 'preset-1', description: 'Load preset 1' },
  { key: '2', action: 'preset-2', description: 'Load preset 2' },
  { key: '3', action: 'preset-3', description: 'Load preset 3' },
  { key: '4', action: 'preset-4', description: 'Load preset 4' },
  { key: '5', action: 'preset-5', description: 'Load preset 5' },
  { key: '6', action: 'preset-6', description: 'Load preset 6' },
  { key: '7', action: 'preset-7', description: 'Load preset 7' },
  { key: '8', action: 'preset-8', description: 'Load preset 8' },
  { key: '9', action: 'preset-9', description: 'Load preset 9' },
  { key: 'm', action: 'toggle-mute', description: 'Toggle audio input mute' },
  { key: 'r', action: 'random-scene', description: 'Load random scene' },
  { key: 'c', action: 'toggle-camera-mode', description: 'Cycle camera mode' },
  { key: 'b', action: 'toggle-bloom', description: 'Toggle bloom effect' },
];

/**
 * Match a keyboard event against a key binding.
 */
export function matchesBinding(event: KeyboardEvent, binding: KeyBinding): boolean {
  if (event.key !== binding.key) return false;
  if (binding.ctrl && !event.ctrlKey) return false;
  if (binding.shift && !event.shiftKey) return false;
  if (binding.alt && !event.altKey) return false;
  if (!binding.ctrl && event.ctrlKey) return false;
  if (!binding.shift && event.shiftKey) return false;
  if (!binding.alt && event.altKey) return false;
  return true;
}
