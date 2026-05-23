/**
 * Simple typed event emitter for decoupled communication between systems.
 */

export interface EventMap {
  beat: { strength: number };
  drop: { energy: number };
  sceneChange: { sceneId: string };
  presetLoaded: { presetId: string };
  qualityChanged: { scale: number };
}

type EventHandler<T> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();

  /**
   * Subscribe to an event.
   */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event.
   */
  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Remove all listeners.
   */
  clear(): void {
    this.listeners.clear();
  }
}
