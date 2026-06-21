# Deployment & Production Build Guide

This document outlines the steps to build, optimize, and deploy **Solstice Arcade: Festival of Light** to Vercel, Netlify, or any static hosting provider.

## 1. Production Build & Optimization

This project uses **Vite** for the build pipeline. Vite automatically handles:
- Code minification
- Dead code elimination (Tree Shaking)
- Asset bundling

**To test the production build locally:**
```bash
npm run build
npm run preview
```
This will compile your TypeScript and React code into the `dist/` directory and spin up a local server to serve the optimized files.

## 2. Environment Variables

Before deploying, ensure you have your Firebase and Github Actions configuration ready. 
In your deployment dashboard (e.g., Vercel or Netlify), you must set the following environment variables (from your `.env` file):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

*(Do NOT commit your `.env` or `.env.local` files to source control).*

## 3. Deploying to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
3. Import your GitHub repository.
4. In the configuration settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add all your `VITE_...` keys.
6. Click **Deploy**. Vercel will automatically build and distribute the app via an edge CDN.

## 4. Deploying to Netlify

1. Log in to [Netlify](https://www.netlify.com/) and click **Add new site** > **Import an existing project**.
2. Connect your GitHub account and select the repository.
3. In the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Click **Show advanced** to add your Environment Variables (`VITE_FIREBASE_...`).
5. Click **Deploy site**.

## 5. Security Checklist Before Going Live

- **Firebase Firestore Rules**: Ensure your production Firestore rules are locked down, only allowing authenticated users to read/write their own documents. Verify that `admin/` collections are properly secured.
- **Client Anti-Tamper**: Ensure `src/utils/antiTamper.ts` is imported in `App.tsx` and active. Wait till `DEV_ENV` checks are removed if needed.
- **Leaderboard Cron**: Ensure GitHub Actions secrets (`FIREBASE_SERVICE_ACCOUNT`) are correctly set in your repository's settings to allow the leaderboard scheduled updates to succeed.
