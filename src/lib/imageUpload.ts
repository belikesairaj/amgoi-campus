import { supabase } from '@/db/supabase';

const BUCKET = 'room-images';
const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];

export interface UploadResult {
  publicUrl: string;
  compressed: boolean;
  finalSizeKB: number;
}

export interface UploadProgress {
  percent: number;
  status: 'validating' | 'compressing' | 'uploading' | 'done' | 'error';
  message: string;
}

// Sanitize filename to only English letters and numbers
const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

// Compress image to WEBP, max 1080p, quality 0.8, iterating down until under 1 MB
const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const maxDim = 1080;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const tryCompress = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return; }
            if (blob.size <= MAX_SIZE_BYTES || quality <= 0.1) {
              resolve(blob);
            } else {
              tryCompress(Math.round((quality - 0.1) * 10) / 10);
            }
          },
          'image/webp',
          quality,
        );
      };
      tryCompress(0.8);
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });

export const uploadRoomImage = async (
  file: File,
  onProgress: (progress: UploadProgress) => void,
): Promise<UploadResult> => {
  // Step 1: Validate type
  onProgress({ percent: 5, status: 'validating', message: 'Validating file...' });

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload JPEG, PNG, GIF, WEBP, or AVIF.');
  }

  let uploadBlob: Blob = file;
  let compressed = false;
  let contentType = file.type;

  // Step 2: Compress client-side if over 1 MB
  if (file.size > MAX_SIZE_BYTES) {
    onProgress({ percent: 20, status: 'compressing', message: 'Image too large — compressing automatically...' });
    uploadBlob = await compressImage(file);
    compressed = true;
    contentType = 'image/webp';
    onProgress({ percent: 50, status: 'compressing', message: `Compressed to ${(uploadBlob.size / 1024).toFixed(1)} KB` });
  }

  // Step 3: Build unique storage path
  const ext = contentType === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg');
  const baseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ''));
  const filePath = `rooms/${Date.now()}_${baseName}.${ext}`;

  onProgress({ percent: 60, status: 'uploading', message: 'Uploading to storage...' });

  // Step 4: Send to Edge Function as raw bytes with metadata in headers.
  // This avoids direct browser→Storage requests that are blocked by sandbox
  // Content-Security-Policy or cross-origin restrictions.
  const arrayBuffer = await uploadBlob.arrayBuffer();

  const { data, error } = await supabase.functions.invoke<{ publicUrl: string; error?: string }>(
    'upload-room-image',
    {
      method: 'POST',
      headers: {
        'x-file-name': filePath,
        'x-content-type': contentType,
        'content-type': 'application/octet-stream',
      },
      body: arrayBuffer,
    },
  );

  console.log('[imageUpload] Edge Function raw response — data:', data, 'error:', error);

  if (error) {
    // Read actual error message from Edge Function response body
    let detail = error.message;
    try {
      const text = await (error as { context?: Response }).context?.text?.();
      if (text) {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) detail = parsed.error;
      }
    } catch { /* ignore parse errors */ }
    throw new Error(`Upload failed: ${detail}`);
  }

  if (!data?.publicUrl) {
    console.error('[imageUpload] No publicUrl in response. Full data:', data);
    throw new Error('Upload failed: no public URL returned.');
  }

  const publicUrl = data.publicUrl;
  console.log('[imageUpload] Final publicUrl:', publicUrl);

  onProgress({
    percent: 100,
    status: 'done',
    message: compressed
      ? `Uploaded & compressed to ${(uploadBlob.size / 1024).toFixed(1)} KB`
      : `Uploaded successfully (${(uploadBlob.size / 1024).toFixed(1)} KB)`,
  });

  return { publicUrl, compressed, finalSizeKB: Math.round(uploadBlob.size / 1024) };
};

// Delete an image from storage given its public URL
export const deleteRoomImage = async (publicUrl: string): Promise<void> => {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const filePath = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([filePath]);
};
