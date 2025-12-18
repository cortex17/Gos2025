# 🚀 Deployment Guide

## Vercel Deployment (Recommended)

### Step 1: Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit: SOSMap Frontend Project"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Environment Variables

In Vercel dashboard, add:
- `VITE_API_BASE_URL` - Your backend URL (or leave for mock API)
- `VITE_USE_FAKE_API` - `true` for mock, `false` for real backend

### Step 4: Deploy

Click "Deploy" - Vercel will automatically build and deploy your app.

## Netlify Deployment

### Step 1: Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Step 2: Environment Variables
Add in Netlify dashboard:
- `VITE_API_BASE_URL`
- `VITE_USE_FAKE_API`

### Step 3: Deploy
Connect GitHub repo and deploy.

## GitHub Pages Deployment

### Step 1: Install gh-pages
```bash
npm install -D gh-pages
```

### Step 2: Update package.json
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/sosmap"
}
```

### Step 3: Deploy
```bash
npm run deploy
```

## Environment Variables for Production

Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-backend-url.com
VITE_USE_FAKE_API=false
```

Or set in deployment platform's environment variables.

## Post-Deployment Checklist

- [ ] Test all routes work
- [ ] Test authentication flow
- [ ] Test CRUD operations
- [ ] Test admin panel (if admin account exists)
- [ ] Test responsive design on mobile
- [ ] Verify API connections
- [ ] Check console for errors
- [ ] Test loading states
- [ ] Test error handling

