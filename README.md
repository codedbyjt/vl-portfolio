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
```

Cloudinary is used for uploaded photos, videos, and shop images when
`VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are set.
Supabase still stores the database rows, albums, captions, visibility settings,
shop items, and admin login.

In Cloudinary, create an **unsigned upload preset** for browser uploads. Keep
your Cloudinary API secret out of `.env.local`; frontend `VITE_` variables are
public in the built website.

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
