/**
 * Electron IPC handlers for bridging main and renderer processes.
 */

import {
  ipcMain,
  dialog,
  desktopCapturer,
  BrowserWindow,
} from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { app } from 'electron';

export function registerIpcHandlers(): void {
  // Audio device enumeration
  ipcMain.handle('get-audio-devices', async () => {
    // Audio device enumeration must happen in renderer process via navigator.mediaDevices
    // This handler exists for cases where the main process needs to be involved
    return [];
  });

  // Desktop capturer sources for system audio
  ipcMain.handle('get-desktop-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
      });
      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnailDataUrl: source.thumbnail.toDataURL(),
      }));
    } catch {
      return [];
    }
  });

  // Window mode handler
  ipcMain.handle(
    'set-window-mode',
    async (event, mode: string) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;

      switch (mode) {
        case 'fullscreen':
          win.setFullScreen(!win.isFullScreen());
          break;
        case 'transparent':
          win.setBackgroundColor('#00000000');
          win.setOpacity(1);
          break;
        case 'always-on-top':
          win.setAlwaysOnTop(!win.isAlwaysOnTop());
          break;
        case 'frameless':
          // Frameless requires window recreation, set flag for next launch
          break;
        case 'normal':
          win.setFullScreen(false);
          win.setAlwaysOnTop(false);
          win.setBackgroundColor('#0a0a0f');
          break;
      }
    }
  );

  // Export frame as PNG
  ipcMain.handle('export-frame', async (event, dataUrl: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const result = await dialog.showSaveDialog(win, {
      defaultPath: `visualiser-frame-${Date.now()}.png`,
      filters: [{ name: 'Images', extensions: ['png'] }],
    });

    if (result.canceled || !result.filePath) return null;

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    await writeFile(result.filePath, base64Data, 'base64');
    return result.filePath;
  });

  // Import preset from file
  ipcMain.handle('import-preset', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      filters: [{ name: 'JSON Presets', extensions: ['json'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const content = await readFile(result.filePaths[0], 'utf-8');
    return JSON.parse(content);
  });

  // Export preset to file
  ipcMain.handle('export-preset', async (event, data: unknown) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const result = await dialog.showSaveDialog(win, {
      defaultPath: `visualiser-preset-${Date.now()}.json`,
      filters: [{ name: 'JSON Presets', extensions: ['json'] }],
    });

    if (result.canceled || !result.filePath) return null;

    await writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return result.filePath;
  });

  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}
