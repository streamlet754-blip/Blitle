'use server';

import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function uploadImage(formData: FormData) {
  const file = formData.get('image') as File | null;

  if (!file) {
    return { success: false, error: 'No image provided.' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only image files are allowed.' };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Image must be smaller than 2MB.' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Unsupported image type. Use JPG, PNG, or WebP.' };
  }

  const fileName = `${randomUUID()}-${file.name.replace(/\s+/g, '-')}`;
  const supabaseServer = await createClient();
  const { data, error } = await supabaseServer.storage
    .from('blitle-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Upload failed.' };
  }

  const { data: publicUrlData } = supabaseServer.storage.from('blitle-images').getPublicUrl(data.path);

  return { success: true, url: publicUrlData.publicUrl };
}
