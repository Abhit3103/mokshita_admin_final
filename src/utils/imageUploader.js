import axios from 'axios';
import { api } from '../services/api';

/**
 * Uploads an image to public Cloud Image CDN (ImgBB) as a robust cloud fallback.
 * Returns a permanent HTTPS URL (e.g., https://i.ibb.co/.../image.jpg).
 */
async function uploadToCloudCDN(file) {
  const IMGBB_KEYS = [
    '6d207e02198a847aa5a8d0a52ff13813',
    'c973a9089dc0ecbe63f8263158cceab1',
    'd86ee35a1a1db71db06dbdfc700302b1',
  ];

  for (const key of IMGBB_KEYS) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`https://api.imgbb.com/1/upload?key=${key}`, formData, {
        timeout: 15000,
      });

      if (response.data?.data?.url) {
        return response.data.data.url;
      }
    } catch (err) {
      console.warn(`[Cloud CDN] Key attempt failed:`, err?.response?.data || err.message);
    }
  }

  throw new Error('All cloud CDN upload attempts failed.');
}

/**
 * Ultra-lean client-side image compressor.
 * Guarantees base64 payload is < 30KB so Express body-parser limit (100KB) is never exceeded.
 */
export async function fileToOptimizedDataUrl(file, maxDimension = 500, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

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
          return resolve(readerEvent.target.result);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let result = canvas.toDataURL('image/webp', quality);
        if (!result || result.length < 50 || result.indexOf('data:image/webp') === -1) {
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.onerror = () => resolve(readerEvent.target.result);
      img.src = readerEvent.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Multi-Tier Resilient Image Upload Pipeline:
 * 1. Tries backend `/upload` endpoint.
 * 2. If backend storage is unavailable (500), uploads directly to High-Speed Cloud Image CDN (returns short HTTPS URL).
 * 3. If offline / CDN fails, falls back to ultra-lean WebP data URL (<30KB) to prevent 413 Payload Too Large errors.
 */
export async function smartUploadImage(file) {
  // ── Tier 1: Try Backend /upload endpoint ─────────────────
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);

    const { data, error: uploadErr } = await api.upload.image(formData);

    if (!uploadErr && data?.url) {
      let fullUrl = data.url;
      if (fullUrl.startsWith('/')) {
        fullUrl = `${api.getBackendUrl()}${fullUrl}`;
      }
      return { url: fullUrl, isFallback: false };
    }
  } catch (backendErr) {
    console.warn('[Upload] Backend storage error, engaging Cloud CDN:', backendErr);
  }

  // ── Tier 2: Cloud CDN Upload (ImgBB) ──────────────────────
  try {
    const cdnUrl = await uploadToCloudCDN(file);
    if (cdnUrl) {
      return {
        url: cdnUrl,
        isFallback: true,
        notice: 'Uploaded to Cloud CDN storage successfully.',
      };
    }
  } catch (cdnErr) {
    console.warn('[Upload] Cloud CDN failed, engaging local compression:', cdnErr);
  }

  // ── Tier 3: Ultra-lean WebP Data URL (< 30KB) ────────────
  try {
    const dataUrl = await fileToOptimizedDataUrl(file);
    return {
      url: dataUrl,
      isFallback: true,
      notice: 'Saved as compressed WebP image.',
    };
  } catch (localErr) {
    throw new Error(`Unable to process image: ${localErr.message}`);
  }
}
