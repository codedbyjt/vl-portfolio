# How to Share Your Site with Localtunnel

This guide will help you share your local development site with others using localtunnel.

## Prerequisites

Make sure your Vite dev server is running:
```bash
npm run dev -- --host
```

## Step 1: Start Localtunnel

In a **new terminal window**, run:

```bash
npx localtunnel --port 5173
```

You'll see output like:
```
your url is: https://random-words-here.loca.lt
```

## Step 2: Share the URL

- Copy the URL (e.g., `https://random-words-here.loca.lt`)
- Share it with anyone you want to show the site to
- The first time visitors access it, they'll see a localtunnel page asking them to click "Continue" - this is normal security

## Step 3: Keep It Running

- **Important:** Keep both terminal windows open:
  - Terminal 1: `npm run dev -- --host` (your Vite server)
  - Terminal 2: `npx localtunnel --port 5173` (the tunnel)
- If you close either terminal, the site won't be accessible

## Stopping the Tunnel

To stop the tunnel:
- Press `Ctrl+C` in the localtunnel terminal window

## Troubleshooting

### "This site is not available"
- The tunnel may have disconnected
- Restart localtunnel: `npx localtunnel --port 5173`
- You'll get a new URL each time

### Site not loading
- Make sure Vite dev server is still running on port 5173
- Check that both terminals are still active
- Try restarting both the Vite server and the tunnel

## Alternative Options

If localtunnel is unreliable, consider these alternatives:

### Option 1: ngrok (Recommended)
```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 5173
```

### Option 2: Cloudflare Tunnel (Free)
```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:5173
```

## Network URL (Local WiFi Only)

If you just want to share with someone on the same WiFi network:

Your Vite server already shows a Network URL when you run:
```bash
npm run dev -- --host
```

Look for:
```
➜  Network: http://192.168.x.x:5173/
```

Share this URL with anyone on the same WiFi network!

---

**Current Status:**
- ✅ Vite configured for network access
- ✅ Localtunnel works with `npx localtunnel --port 5173`
- 🌐 Your site will be accessible worldwide through the tunnel URL
