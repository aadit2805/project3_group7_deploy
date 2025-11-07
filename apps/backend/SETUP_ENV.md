# Setting Up Environment Variables

## Quick Setup

1. **Copy the example file:**
   ```bash
   cd apps/backend
   cp .env.example .env
   ```

2. **Edit the `.env` file and add your values:**
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `DATABASE_URL` - Your PostgreSQL connection string
   - Other values are already set with defaults

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API" (or "Google Identity Services")
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Create OAuth 2.0 Client ID:
   - **Application type:** Web application
   - **Name:** Your app name
   - **Authorized JavaScript origins:** `http://localhost:3001`
   - **Authorized redirect URIs:** `http://localhost:3001/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** to your `.env` file

## Required Variables

- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret  
- `AUTH_URL` - Backend URL (default: `http://localhost:3001`)
- `AUTH_SECRET` - Random secret for sessions (already generated)
- `FRONTEND_URL` - Frontend URL (default: `http://localhost:3000`)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Backend port (default: `3001`)

## After Setting Up

Restart your backend server:
```bash
npm run dev
```

The warnings should disappear once all variables are set!

