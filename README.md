# Portfolio Website

A modern, retro-inspired portfolio website built with React, TypeScript, and Vite.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local `.env.local` file:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
VITE_CLOUDINARY_FOLDER=vl-portfolio
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Cloudinary is used for uploaded photos, videos, and shop images when
`VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are set.

For live production media usage, store these as **Supabase Edge Function
secrets**, not browser `VITE_` variables:

```bash
supabase secrets set CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
supabase secrets set CLOUDINARY_API_KEY=your_cloudinary_api_key
supabase secrets set CLOUDINARY_API_SECRET=your_cloudinary_api_secret
supabase functions deploy cloudinary-usage
```

The admin Storage tab calls the `cloudinary-usage` Edge Function first. If that
fails, it falls back to the deployed `public/media-usage.json` snapshot.
Supabase still stores the database rows, albums, captions, visibility settings,
shop items, and admin login.

In Cloudinary, create an **unsigned upload preset** for browser uploads. Keep
your Cloudinary API secret out of frontend code; frontend `VITE_` variables are
public in the built website. The non-`VITE_` Cloudinary API key and secret are
only used by the local dev server to refresh `public/media-usage.json` from the
admin storage tab.

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Author

**codedbyjt**

---

© 2026 codedbyjt. All rights reserved.
