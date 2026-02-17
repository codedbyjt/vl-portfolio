# 🚀 GitHub Pages Deployment Guide

## Setup Complete! ✅

Your project is now configured for GitHub Pages deployment.

---

## 📋 What Was Configured

1. ✅ **gh-pages package** installed
2. ✅ **Deploy scripts** added to `package.json`
3. ✅ **Base path** set in `vite.config.ts` to `/Retro90szinelandingpagecopy/`

---

## 🎯 How to Deploy

### Step 1: Push to GitHub (if not already done)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for deployment"

# Add your GitHub repo as remote
git remote add origin https://github.com/codedbyjt/Retro90szinelandingpagecopy.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to GitHub Pages

```bash
npm run deploy
```

That's it! 🎉

---

## 🌐 Your Live URL

After deployment, your site will be available at:

**https://codedbyjt.github.io/Retro90szinelandingpagecopy/**

⏱️ *Note: First deployment may take 2-5 minutes to go live*

---

## 🔄 Updating Your Site

Whenever you make changes:

```bash
# 1. Make your changes
# 2. Commit them
git add .
git commit -m "Update site"
git push

# 3. Deploy
npm run deploy
```

---

## ⚙️ GitHub Settings (One-time setup)

After your first `npm run deploy`:

1. Go to your GitHub repo: https://github.com/codedbyjt/Retro90szinelandingpagecopy
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source", select **gh-pages** branch
4. Click **Save**
5. Wait 2-5 minutes, then visit your URL!

---

## 🐛 Troubleshooting

### Site shows 404
- Check that GitHub Pages is enabled in repo settings
- Verify the `gh-pages` branch exists
- Wait a few minutes after deployment

### Images not loading
- Make sure images are in the `/public` folder
- Image paths should start with `/` (e.g., `/hwa-1.webp`)

### CSS not loading
- The `base: '/Retro90szinelandingpagecopy/'` in vite.config.ts handles this
- Make sure you don't have hardcoded absolute paths

---

## 🎨 Custom Domain (Optional)

Want to use your own domain like `viclentaigne.com`?

1. Buy a domain (Namecheap, Google Domains, etc.)
2. In your repo, create a file called `CNAME` in the `public` folder
3. Add your domain to the file: `viclentaigne.com`
4. Configure DNS settings at your domain registrar:
   - Add a `CNAME` record pointing to `codedbyjt.github.io`
5. In GitHub Settings → Pages, add your custom domain
6. Redeploy: `npm run deploy`

---

## 📝 Quick Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Run locally (http://localhost:5173) |
| `npm run build` | Build for production |
| `npm run deploy` | Build + Deploy to GitHub Pages |

---

## 🎉 You're All Set!

Your retro 90s portfolio is ready to share with the world!

**Next steps:**
1. `npm run deploy`
2. Wait 2-5 minutes
3. Visit https://codedbyjt.github.io/Retro90szinelandingpagecopy/
4. Share with clients! 💪
