# Vercel Deployment Guide for MalishaEdu Frontend

## Prerequisites
- GitHub repository with your frontend code
- Vercel account (sign up at https://vercel.com)
- Backend API deployed and accessible (e.g., on Railway, Render, or another service)

## Deployment Steps

### 1. Push Code to GitHub
Make sure your frontend code is pushed to a GitHub repository.

### 2. Connect to Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

### 3. Configure Build Settings
Vercel should auto-detect these settings:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not auto-detected, manually set:
- Root Directory: `frontend` (if your frontend is in a subdirectory)

### 4. Set Environment Variables
In Vercel project settings, add the following environment variable:

**Required:**
- `VITE_API_BASE_URL`: Your backend API URL
  - **Format**: `https://your-backend-api.railway.app/api` or `https://api.yourdomain.com/api`
  - **Important**: 
    - Must include `https://` protocol
    - Must include `/api` at the end if your backend serves API routes under `/api`
    - Example for Railway: `https://malishaedu-ai-agent-backend-production-160d.up.railway.app/api`
  - Leave empty for local development (uses relative path `/api`)

**Optional (if needed):**
- Any other environment variables your app might need

### 5. Deploy
Click "Deploy" and Vercel will:
1. Install dependencies
2. Build your app
3. Deploy to a production URL

## Important Notes

### API Base URL Configuration
- The frontend uses `VITE_API_BASE_URL` environment variable
- If not set, it defaults to `/api` (relative path) for local development
- For production, you **must** set this to your backend API URL

### CORS Configuration
Make sure your backend allows requests from your Vercel domain:
- Add your Vercel URL to CORS allowed origins in your backend
- Example: `https://your-app.vercel.app`

### Backend Deployment
Your backend should be deployed separately. Common options:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### Environment Variables in Vercel
1. Go to your project in Vercel dashboard
2. Click "Settings" → "Environment Variables"
3. Add `VITE_API_BASE_URL` with your backend URL
4. Redeploy for changes to take effect

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is compatible (Vercel uses Node 18+ by default)

### API Calls Fail
- Verify `VITE_API_BASE_URL` is set correctly
- Check CORS settings on your backend
- Check browser console for errors

### 404 Errors on Routes
- The `vercel.json` includes rewrites to handle client-side routing
- All routes should redirect to `index.html`

## Example Environment Variables

```
VITE_API_BASE_URL=https://malishaedu-ai-agent-backend-production-160d.up.railway.app/api
```

Or if using a custom domain:
```
VITE_API_BASE_URL=https://api.malishaedu.com/api
```

