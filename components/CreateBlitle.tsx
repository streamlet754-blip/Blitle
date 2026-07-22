'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createBlitle, uploadImage } from '@/app/actions';

const MAX_WORDS = 60;
const MAX_CHARS = 350;

export function CreateBlitle() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('tsx');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wordCount = useMemo(() => content.trim().split(/\s+/).filter(Boolean).length, [content]);
  const charCount = content.length;
  const isOverLimit = wordCount > MAX_WORDS || charCount > MAX_CHARS;
  const counterColor = wordCount >= MAX_WORDS ? 'text-rose-400' : wordCount >= 50 ? 'text-yellow-400' : 'text-slate-400';

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB.');
      return;
    }

    setError(null);
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (isOverLimit) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setError(`Keep it under ${MAX_WORDS} words or ${MAX_CHARS} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadResult = await uploadImage(formData);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }
        imageUrl = uploadResult.url ?? null;
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('image_url', imageUrl ?? '');
      formData.append('code_snippet', showCode ? codeSnippet : '');
      formData.append('language', showCode ? language : '');

      const result = await createBlitle(formData);
      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess('Blitle created successfully.');
      setContent('');
      setCodeSnippet('');
      setImagePreview(null);
      setImageFile(null);
      setShowCode(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_40%)]" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className={counterColor}>{wordCount} words</span>
          <span className="text-slate-400">{charCount}/{MAX_CHARS} chars</span>
        </div>

        <motion.div animate={isShaking ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }} transition={{ duration: 0.35 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_CHARS}
            placeholder="Write your blitle..."
            className="min-h-32 w-full rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
          />
        </motion.div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 transition hover:border-sky-500 hover:text-white">
            <span>Add image</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
            <input type="checkbox" checked={showCode} onChange={() => setShowCode((prev) => !prev)} className="rounded border-slate-600 bg-slate-900 text-sky-500" />
            <span>Code block</span>
          </label>
        </div>

        {imagePreview ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800/80">
            <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" />
          </div>
        ) : null}

        {showCode ? (
          <div className="mt-4 space-y-3">
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="Paste your code here"
              className="min-h-28 w-full rounded-2xl border border-slate-700/70 bg-slate-950/80 p-3 font-mono text-sm text-slate-100"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-xl border border-slate-700/70 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="tsx">TypeScript</option>
              <option value="ts">TypeScript</option>
              <option value="js">JavaScript</option>
              <option value="jsx">JavaScript JSX</option>
              <option value="py">Python</option>
              <option value="json">JSON</option>
              <option value="bash">Bash</option>
            </select>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-400">{success}</p> : null}

        <motion.button
          type="submit"
          disabled={isSubmitting || isOverLimit}
          whileHover={!isSubmitting && !isOverLimit ? { scale: 1.01, y: -1 } : undefined}
          whileTap={!isSubmitting && !isOverLimit ? { scale: 0.99 } : undefined}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Posting...' : 'Create Blitle'}
        </motion.button>
      </div>
    </motion.form>
  );
}
