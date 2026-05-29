# MindScape Psychology Blog

A premium psychology blog with memory games, bookstore, and admin dashboard.

## Features

- **Blog System** - Create, edit, publish posts with rich HTML content
- **Search** - Full-text search across all articles
- **Memory Games** (3 games)
  - Memory Cards - Flip and match psychology concepts
  - Word Association - Timed quiz on psychology pioneers
  - Number Sequence - Cognitive recall training
- **Bookstore** - bKash payment integration for Bangladesh
- **Admin Dashboard**
  - Posts management
  - Books management
  - Contact messages
  - Newsletter subscribers
  - Orders tracking (pending/paid/cancelled)
- **Static Pages** - About, Contact, Privacy Policy, Terms of Service
- **SEO Ready** - Dynamic sitemap, robots.txt, Open Graph meta tags
- **AdSense Ready** - Just uncomment and add your publisher ID

## Tech Stack

- Next.js 13.5 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL database)
- shadcn/ui components

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

This project is ready for Vercel deployment:

### Step 1: Push to GitHub (Already Done)
✅ Code is pushed to: `the-tarek-series/the-tarek-series-blog`

### Step 2: Deploy on Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select `the-tarek-series/the-tarek-series-blog`
4. Add these environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tashzttlbxxxbyzkgqjb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhc2h6dHRsYnh4eGJ5emtncWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTEyMTMsImV4cCI6MjA5NTA4NzIxM30.3xOf8HXLZe0oyH7WZQJHxVqm4V30y-MS3aVRMw8nSu8` |

5. Click "Deploy"
6. Wait for deployment to complete
7. Your site will be live at: `https://your-project-name.vercel.app`

## bKash Payment Setup

Update the bKash merchant number in `/components/bookstore/bookstore-page.tsx`:
- Search for `01712-345678` and replace with your bKash merchant number

## Admin Access

Admin dashboard is publicly accessible for demo. For production, add authentication middleware to protect `/admin` routes.

## Database Tables

The following tables are used (all with RLS enabled):
- `posts` - Blog posts
- `books` - Bookstore products
- `contacts` - Contact form submissions
- `newsletter_subscribers` - Email list
- `orders` - Book purchase orders
- `profiles` - User profiles

## License

MIT
