# 🚀 Vercel Deployment Guide

## Method 1: Deploy via Vercel Website (Easiest - 2 minutes)

### Step 1: Push to GitHub (Already Done! ✅)
Your code is already on GitHub at:
https://github.com/codedbyjt/Retro90szinelandingpagecopy

### Step 2: Connect to Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### Step 3: Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find **"Retro90szinelandingpagecopy"** in the list
3. Click **"Import"**

### Step 4: Configure & Deploy

Vercel will auto-detect everything! Just click **"Deploy"**

**That's it!** ✅

Your site will be live at:
- `https://retro90szinelandingpagecopy.vercel.app`
- Or a custom URL Vercel assigns

---

## Method 2: Deploy via CLI (Advanced)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy

```bash
# Login
vercel login

# Deploy (from your project folder)
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → (press Enter to accept)
- **Directory?** → `./` (press Enter)
- **Override settings?** → No

**Done!** 🎉

---

## 🔄 How to Update Your Site

### Via Website:
Vercel **automatically redeploys** when you push to GitHub!

```bash
# Make changes, then:
git add .
git commit -m "Update site"
git push

# Vercel deploys automatically! ✨
```

### Via CLI:
```bash
vercel --prod
```

---

## ⚙️ Configuration (No changes needed!)

Vercel auto-detects:
- ✅ Framework: Vite
- ✅ Build Command: `vite build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

**You don't need to configure anything!**

---

## 🌐 Custom Domain (Optional)

Want `viclentaigne.com` instead of `.vercel.app`?

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In Vercel dashboard → **Settings** → **Domains**
3. Click **"Add"** → Enter your domain
4. Follow DNS instructions (add CNAME or A record)
5. Done! Your site is live on your custom domain

---

## 🆚 Vercel vs GitHub Pages

| Feature | Vercel | GitHub Pages |
|---------|--------|--------------|
| Setup Time | 2 minutes | 5 minutes |
| Auto-deploy on push | ✅ Yes | ❌ No (manual) |
| Custom domains | ✅ Easy | ✅ Requires DNS |
| HTTPS | ✅ Automatic | ✅ Automatic |
| Build previews | ✅ Yes | ❌ No |
| Speed | ⚡ Super fast | 🚀 Fast |
| Free tier | ✅ Generous | ✅ Unlimited |

---

## 🎯 Quick Start Commands

```bash
# Deploy to Vercel (one-time)
npm install -g vercel
vercel login
vercel

# Update site (push to GitHub, Vercel auto-deploys)
git add .
git commit -m "Update"
git push
```

---

## 🎉 That's It!

Your retro 90s portfolio will be live on Vercel with:
- ✅ HTTPS automatically
- ✅ Auto-deploys on every Git push
- ✅ Lightning-fast CDN
- ✅ Custom domain support
- ✅ Deploy previews for every commit

**Vercel is the easiest way to deploy React/Vite apps!** 💚
