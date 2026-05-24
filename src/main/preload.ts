import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAudioDevices: (): Promise<MediaDeviceInfo[]> =>
    ipcRenderer.invoke('audio:get-devices'),
  selectAudioDevice: (deviceId: string): Promise<void> =>
    ipcRenderer.invoke('audio:select-device', deviceId),
  onAudioData: (callback: (data: Float32Array) => void): void => {
    ipcRenderer.on('audio:data', (_event, data) => callback(data));
  },
  getPresets: (): Promise<string[]> => ipcRenderer.invoke('presets:list'),
  loadPreset: (name: string): Promise<unknown> =>
    ipcRenderer.invoke('presets:load', name),
  savePreset: (name: string, data: unknown): Promise<void> =>
    ipcRenderer.invoke('presets:save', name, data),
  setWindowMode: (mode: string): Promise<void> =>
    ipcRenderer.invoke('set-window-mode', mode),
  importPreset: (): Promise<unknown> =>
    ipcRenderer.invoke('import-preset'),
  exportPreset: (data: unknown): Promise<string | null> =>
    ipcRenderer.invoke('export-preset', data),
  getDesktopSources: (): Promise<Array<{ id: string; name: string; thumbnailDataUrl: string }>> =>
    ipcRenderer.invoke('get-desktop-sources'),
  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-app-version'),
  exportFrame: (dataUrl: string): Promise<string | null> =>
    ipcRenderer.invoke('export-frame', dataUrl),
  onTrayAction: (callback: (action: string, data?: unknown) => void): void => {
    ipcRenderer.on('tray:toggle-play', () => callback('toggle-play'));
    ipcRenderer.on('tray:load-scene', (_event, sceneId) => callback('load-scene', sceneId));
  },
});
