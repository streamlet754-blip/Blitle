# Blitle

Blitle is a Next.js App Router project with Prisma and Supabase integration.

## Local setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Create a `.env.local` file with your Supabase keys and any local values.
3. Run the app
   ```bash
   npm run dev
   ```

## Deployment

### GitHub
1. Initialize a git repo
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Push to GitHub
   ```bash
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Vercel
1. Connect the GitHub repo in Vercel.
2. Set the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. For local SQLite use, do not add `DATABASE_URL`; for Supabase deployment, set `DATABASE_URL` to your Supabase connection string.

### Custom domain
1. Add `blitle.com` in Vercel Domains.
2. Configure DNS with your domain registrar using the records Vercel provides.
3. Wait for verification and SSL provisioning.
