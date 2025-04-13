# Deployment Guide

## Setup Production Environment

### 1. Clerk Authentication Setup

To remove the warning message `Clerk has been loaded with development keys`, you need to use production API keys:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application or create a new one
3. Click on the "Production" switch to enable production mode
4. Copy your production API keys:
   - Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - Copy `CLERK_SECRET_KEY` (starts with `sk_live_`)
5. Update `.env.production` with these keys

### 2. Environment Variables Setup

When deploying to production, make sure to set the following environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Build and Deploy

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### 4. Vercel/Netlify/Other Hosting Providers

If you're using a hosting provider like Vercel or Netlify, add the production environment variables in their dashboard.

## Development vs Production

- `.env.development` - Contains test API keys for development
- `.env.production` - Contains production API keys for deployment

**Important**: Never commit your production API keys to version control. Keep them secure in your deployment environment.
