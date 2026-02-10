# Smirkle - DevOps Hackathon Quick Deploy Guide

## 🚀 Quick Deployment Options

### Option 1: Deploy to Vercel (Recommended for Judges)

Vercel provides **free HTTPS automatically** - perfect for camera testing on mobile devices.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
npx vercel --prod
```

**After Deployment:**
1. Go to https://vercel.com/dashboard
2. Select your project → Settings → Environment Variables
3. Add these keys:
   - `VITE_YOUTUBE_API_KEY` - YouTube Data API key
   - `VITE_FIREBASE_API_KEY` - Firebase API key
   - `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
4. Redeploy to apply changes

**✅ Your app is now live at HTTPS URL with camera support!**

---

### Option 2: Local HTTPS with ngrok (For Demo)

If judges need to test locally, use ngrok to create an HTTPS tunnel:

```bash
# Install ngrok
npm install -g ngrok

# Create HTTPS tunnel to your local dev server
ngrok http 5173
```

**Result:** ngrok provides an HTTPS URL you can share with judges. Camera will work because it's HTTPS!

---

### Option 3: Deploy to Railway

```bash
# Connect GitHub repo to Railway
# Add environment variables in Railway dashboard
# Auto-deploys on push to main branch
```

---

## 🔧 Camera Permission Issue - Explained

**Problem:** Browsers block camera access on HTTP (except localhost).

**Why judges need HTTPS:**
- Chrome/Android require HTTPS for camera access
- HTTP URLs cannot access the camera
- Localhost is exempt from this rule

**Solution:** Deploy to any HTTPS-enabled platform (Vercel, Railway, Netlify, etc.)

---

## 📱 Testing on Mobile

### For Android/iOS Testing:
1. **Production Deploy:** Use your Vercel/Railway HTTPS URL
2. **Local Testing:** Use ngrok HTTPS URL
3. Open browser → Allow camera permission → Enjoy!

### Common Issues:
- ❌ `http://192.168.x.x:5173` - Camera BLOCKED (not HTTPS)
- ✅ `https://your-app.vercel.app` - Camera WORKS
- ✅ `https://random.ngrok.io` - Camera WORKS (ngrok)

---

## 🛠️ Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_YOUTUBE_API_KEY` | YouTube Data API v3 key | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase web API key | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project identifier | Yes |

---

## 📞 Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Vercel
npx vercel --prod

# Create ngrok HTTPS tunnel
ngrok http 5173
```

---

## 🎯 Judges Checklist

- [ ] App deployed to HTTPS URL (Vercel/Railway/Netlify)
- [ ] Environment variables configured
- [ ] Camera permission works on mobile
- [ ] All features functional
- [ ] URL shared with judges

---

## 📖 Full Documentation

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.
