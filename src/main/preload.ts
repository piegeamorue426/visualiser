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
});
