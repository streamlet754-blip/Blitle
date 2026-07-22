'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createBlitle(input: {
  content: string;
  image_url?: string | null;
  code_snippet?: string | null;
  language?: string | null;
  author_id: string;
}) {
  try {
    const blitle = await prisma.blitle.create({
      data: {
        content: input.content,
        image_url: input.image_url ?? null,
        code_snippet: input.code_snippet ?? null,
        language: input.language ?? null,
        author_id: input.author_id,
      },
    });

    return { success: true, blitle };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to create blitle.',
    };
  }
}
