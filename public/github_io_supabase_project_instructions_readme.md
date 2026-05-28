# Project Instructions

## Project Overview

This is a React + TypeScript portfolio/gallery website deployed through GitHub Pages. It uses Supabase as the backend for storing and managing:

- Albums
- Photos
- Visibility settings
- Shared/portfolio-only links
- Public gallery content

The site can display either live Supabase content or fallback local images if no Supabase photos are available.

---

# Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Supabase
- GitHub Pages
- React Router

---

# Supabase Setup Required

The project expects these Supabase tables:

## `albums`

Required fields:

```ts
id: string
title: string
description: string
cover_url: string
sort_order: number
visible: boolean
album_type: string
```

`album_type` can be:

```txt
gallery
portfolio
```

---

## `photos`

Required fields:

```ts
id: string
url: string
caption: string
sort_order: number
album_id: string | null
visible: boolean
visibility: string
```

`visibility` can be:

```txt
public
portfolio_only
hidden
```

---

# Visibility Rules

## Public gallery page

Only shows:

```txt
visibility = public
```

and albums where:

```txt
visible = true
album_type = gallery
```

---

## Shared portfolio link

A shared link can show portfolio-only images.

Example:

```txt
/photography?ref=shared&album=ALBUM_ID
```

This allows:

```txt
public
portfolio_only
```

but hides:

```txt
hidden
```

---

# Environment Variables

Create a `.env` file locally:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For GitHub Pages deployment, these also need to be added as GitHub repository secrets or build variables depending on the deployment setup.

---

# Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# GitHub Pages Deployment Notes

Because this project is deployed on GitHub Pages, the Vite base path must match the repo name.

In `vite.config.ts`, check:

```ts
base: "/your-repo-name/"
```

Example:

```ts
base: "/Retro90szinelandingpagecopy/"
```

Images in the `public` folder should be referenced using the project’s base URL, which this project already handles with:

```ts
import.meta.env.BASE_URL
```

---

# Current Photography Page Behaviour

The photography page:

- Loads albums and photos from Supabase
- Orders albums/photos by `sort_order`
- Falls back to local images if no photos exist
- Groups photos by album
- Supports standalone photos with no album
- Opens photos in a lightbox
- Supports keyboard navigation:
  - Right arrow = next photo
  - Left arrow = previous photo
  - Escape = close lightbox
- Hides broken images automatically

---

# Important Deployment Checks

Before pushing live:

```txt
Supabase URL is correct
Supabase anon key is available
GitHub Pages base path is correct
All image URLs are public or signed correctly
Albums have visible = true
Photos have visibility = public or portfolio_only
sort_order values are set
No broken image URLs exist
```

---

# Git Commands

```bash
git add .
git commit -m "Update photography gallery"
git push
```

Then GitHub Pages should rebuild and deploy the latest version.

