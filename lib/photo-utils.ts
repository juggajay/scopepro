/**
 * Client-side photo processing utilities.
 * Resize images using canvas to strip EXIF data and reduce file size.
 */

/**
 * Resize an image file to a maximum dimension while maintaining aspect ratio.
 * The canvas redraw naturally strips EXIF data (including orientation, GPS, etc.).
 * Outputs as JPEG at 0.85 quality.
 *
 * @param file - The original image File
 * @param maxDimension - Maximum width or height in pixels (default 1200)
 * @returns A resized Blob in JPEG format
 */
export async function resizePhoto(
  file: File,
  maxDimension: number = 1200,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only downscale, never upscale
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas 2D context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create image blob"));
          }
        },
        "image/jpeg",
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
