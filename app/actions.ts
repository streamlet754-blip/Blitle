'use server';

import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';

const prisma = new PrismaClient();

export async function uploadImage(formData: FormData) {
  const file = formData.get('image') as File | null;

  if (!file) {
    return { success: false, error: 'No image provided.' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only image files are allowed.' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Unsupported image type. Use JPG, PNG, or WebP.' };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Image must be smaller than 2MB.' };
  }

  const fileName = `${randomUUID()}-${file.name.replace(/\s+/g, '-')}`;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('blitle-images').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Upload failed.' };
  }

  const { data: publicUrlData } = supabase.storage.from('blitle-images').getPublicUrl(data.path);

  return { success: true, url: publicUrlData.publicUrl };
}

export async function createBlitle(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Please log in before creating a blitle.' };
  }

  const content = formData.get('content')?.toString() ?? '';
  const image_url = formData.get('image_url')?.toString() ?? '';
  const code_snippet = formData.get('code_snippet')?.toString() ?? '';
  const language = formData.get('language')?.toString() ?? '';

  if (!content.trim()) {
    return { success: false, error: 'Content is required.' };
  }

  try {
    const blitle = await prisma.blitle.create({
      data: {
        content,
        image_url: image_url || null,
        code_snippet: code_snippet || null,
        language: language || null,
        author_id: user.id,
      },
    });

    return { success: true, blitle };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to create blitle.' };
  }
}
