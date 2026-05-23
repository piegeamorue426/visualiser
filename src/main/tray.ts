/**
 * System tray integration with quick actions.
 */

import { Tray, Menu, nativeImage, BrowserWindow } from 'electron';

let tray: Tray | null = null;

/**
 * Create a simple 16x16 colored square icon as a placeholder tray icon.
 */
function createTrayIcon(): Electron.NativeImage {
  // Create a simple cyan-colored 16x16 PNG data URL
  const size = 16;
  const canvas = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAI0lEQVQ4T2P8z8Dwn4EIwMgwagBZoTC4QoFxNBTIiiYyUwMA+X4EEQE8FAAAAAAASUVORK5CYII=`;
  return nativeImage.createFromDataURL(canvas);
}

export function createTray(mainWindow: BrowserWindow): Tray {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('Visualiser');

  const sceneIds = [
    'circular-spectrum',
    'trap-nation-ring',
    'particle-galaxy',
    'infinite-tunnel',
    'neon-waveform',
    'audio-terrain',
    'geometric-pulse',
    'space',
    'cyberpunk-city',
    'reactive-vortex',
    'energy-storm',
    'fluid-simulation',
  ];

  const sceneMenuItems = sceneIds.map((id) => ({
    label: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    click: () => {
      mainWindow.webContents.send('tray:load-scene', id);
    },
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Toggle Visualizer',
      click: () => {
        mainWindow.webContents.send('tray:toggle-play');
      },
    },
    { type: 'separator' },
    {
      label: 'Scenes',
      submenu: sceneMenuItems,
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        mainWindow.destroy();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
  });

  return tray;
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
