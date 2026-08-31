import { supabase } from "@/lib/supabase";

const BUCKET = "wardrobe";
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

export async function resizeAndCompressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY });
  bitmap.close();
  return blob;
}

export async function uploadWardrobeImage(
  userId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const blob = await resizeAndCompressImage(file);
  const filename = `${crypto.randomUUID()}.jpg`;
  const path = `${userId}/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  onProgress?.(100);
  return path;
}

export async function getSignedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) { console.error("Signed URL error:", error?.message); return null; }
  return data.signedUrl;
}

export async function getSignedImageUrls(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) { console.error("Signed URLs error:", error.message); return new Map(); }
  const map = new Map<string, string>();
  for (const item of data) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function deleteWardrobeImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Could not delete image: ${error.message}`);
}
