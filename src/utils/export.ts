/**
 * Utility functions for exporting frames and data.
 */

/**
 * Capture the current frame from a canvas element as a PNG Blob.
 */
export async function captureFrame(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture frame'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Trigger a browser download for a Blob with the given filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
