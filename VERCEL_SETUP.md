# Vercel Environment Variables Setup

Based on your Vercel KV setup, please add these environment variables manually in your Vercel project settings:

## Required Variables:

1. **VITE_KV_REST_API_URL**
   - Value: `https://simple-oyster-31684.upstash.io`
   - Set for: All Environments (Production, Preview, Development)

2. **VITE_KV_REST_API_TOKEN** 
   - Value: `AXvEAAIncDI3YTM4ZGYxNTdlZjc0MDZhOTM0YWY0Nzk1MmQ2YzAwYnAyMzE2ODQ`
   - Set for: All Environments (Production, Preview, Development)

## How to Add:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add both variables above
5. Redeploy your project

## Why This is Needed:

Vite only includes environment variables that start with `VITE_` in the frontend bundle. The automatic KV variable mapping wasn't working, so we need to explicitly set the VITE_ prefixed versions.