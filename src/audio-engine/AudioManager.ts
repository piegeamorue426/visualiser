import type { AudioState } from './types';
import { createDefaultAudioState } from './types';
import { AudioAnalyzer } from './AudioAnalyzer';

/**
 * Singleton audio manager that handles audio context creation,
 * stream acquisition, and exposes the current AudioState globally.
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  private audioContext: AudioContext | null = null;
  private analyzer: AudioAnalyzer | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private state: AudioState;
  private isInitialized = false;

  private constructor() {
    this.state = createDefaultAudioState();
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Reset the singleton (useful for testing).
   */
  static resetInstance(): void {
    if (AudioManager.instance) {
      AudioManager.instance.destroy();
    }
    AudioManager.instance = null;
  }

  /**
   * Initialize audio from a microphone stream.
   */
  async initializeFromMicrophone(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    await this.initializeFromStream(stream);
  }

  /**
   * Initialize audio from an existing MediaStream.
   * @param stream - MediaStream containing audio tracks
   */
  async initializeFromStream(stream: MediaStream): Promise<void> {
    this.destroy();

    this.stream = stream;
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.analyzer = new AudioAnalyzer(undefined, this.audioContext.sampleRate);
    this.analyzer.initialize(this.audioContext, this.sourceNode);
    this.isInitialized = true;
  }

  /**
   * Initialize from a desktop capturer stream (Electron specific).
   * The stream should be obtained via Electron's desktopCapturer API.
   * @param stream - MediaStream from desktop capture
   */
  async initializeFromDesktopCapture(stream: MediaStream): Promise<void> {
    await this.initializeFromStream(stream);
  }

  /**
   * Perform analysis and update the current state.
   * Call this once per frame (e.g., inside requestAnimationFrame).
   */
  update(): AudioState {
    if (this.analyzer && this.isInitialized) {
      this.state = this.analyzer.analyze();
    }
    return this.state;
  }

  /**
   * Get the current AudioState without performing a new analysis.
   */
  getState(): AudioState {
    return this.state;
  }

  /**
   * Get the underlying AudioContext.
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get the underlying AudioAnalyzer.
   */
  getAnalyzer(): AudioAnalyzer | null {
    return this.analyzer;
  }

  /**
   * Check if the manager is initialized and ready.
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Resume audio context (needed after user interaction in browsers).
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Enumerate available audio input devices.
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'audioinput');
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    if (this.analyzer) {
      this.analyzer.destroy();
      this.analyzer = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.state = createDefaultAudioState();
  }
}
