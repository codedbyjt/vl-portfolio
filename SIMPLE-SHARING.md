# 🚀 Simple Sharing Instructions

## How to share your site with anyone:

### Step 1: Start your dev server
```bash
npm run dev
```
Keep this terminal running.

### Step 2: Open a NEW terminal and start the tunnel
```bash
npm run tunnel
```

That's it! 🎉

The tunnel command will give you a URL like:
```
https://abc-123-xyz.ngrok-free.app
```

**Share that URL with anyone** and they can see your site!

---

## To stop:
- Press `Ctrl+C` in both terminal windows

## Troubleshooting:

**If port 5175 is already in use:**
- Stop the dev server (`Ctrl+C`)
- Run `npm run dev` again

**If ngrok shows a warning page:**
- Just click "Visit Site" on the ngrok warning page
- This is normal for free ngrok accounts

---

That's literally it! No complicated configuration needed. ✨
