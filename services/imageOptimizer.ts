
/**
 * Optimizes an image file for AI analysis.
 * Resizes large images to a maximum dimension and converts to efficient WebP format.
 */
export const optimizeImage = (
  file: File, 
  maxDimension: number = 2048, 
  quality: number = 0.8
): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      // If it's not an image (e.g. vector), we can't optimize it for vision API.
      // The calling code should handle this check, but we reject here for safety.
      reject(new Error('File is not a supported image format for optimization'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      // Clean up memory
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }
      
      // Use high quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as WebP
      const mimeType = 'image/webp';
      // toDataURL returns "data:image/webp;base64,....."
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64 = dataUrl.split(',')[1];
      
      resolve({ base64, mimeType });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = url;
  });
};
