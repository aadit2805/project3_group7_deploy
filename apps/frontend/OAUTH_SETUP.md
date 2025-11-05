# OAuth Setup Guide - Manager Portal

This guide will help you set up Google OAuth authentication for the manager portal.

## Prerequisites

- Google Cloud Platform account
- Node.js installed
- Next.js project running

## Step 1: Set Up Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - App name: Your POS System Name
   - User support email: Your email
   - Developer contact: Your email
6. Select **Web application** as the application type
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production URL (when deploying)
8. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-url.com/api/auth/callback/google` (for production)
9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env.local` file in the `apps/frontend` directory:

```bash
# Generate a random secret for AUTH_SECRET
# Run this command in terminal: openssl rand -base64 32
AUTH_SECRET=your-generated-secret-here

# Google OAuth credentials from Step 1
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Base URL (update for production)
AUTH_URL=http://localhost:3000
```

### Generating AUTH_SECRET

Run this command in your terminal to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as the value for `AUTH_SECRET`.

## Step 3: Environment Variables Template

Here's the complete `.env.local` template:

```
AUTH_SECRET=<paste-your-generated-secret>
GOOGLE_CLIENT_ID=<paste-your-google-client-id>
GOOGLE_CLIENT_SECRET=<paste-your-google-client-secret>
AUTH_URL=http://localhost:3000
```

## Step 4: Start the Development Server

```bash
cd apps/frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 5: Test the OAuth Flow

1. Navigate to `http://localhost:3000`
2. Click on **Manager Portal** button
3. Click **Sign in with Google**
4. Select your Google account
5. Grant permissions
6. You should be redirected to the Manager Dashboard

## Project Structure

```
apps/frontend/
├── auth.ts                          # NextAuth configuration
├── middleware.ts                     # Route protection middleware
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts         # Auth API routes
│   └── manager/
│       ├── login/
│       │   └── page.tsx             # Login page
│       └── dashboard/
│           └── page.tsx             # Protected dashboard
```

## Features Implemented

✅ Google OAuth authentication  
✅ Protected manager routes  
✅ Automatic redirect to login if not authenticated  
✅ Session management  
✅ Beautiful login UI  
✅ Manager dashboard with user info  
✅ Sign out functionality

## Security Features

- **JWT-based sessions** - Stateless and secure
- **Server-side authentication** - Auth checks on the server
- **Middleware protection** - All `/manager/*` routes are protected
- **Automatic redirects** - Unauthenticated users redirected to login
- **Secure callbacks** - OAuth callbacks properly validated

## Routes

| Route                | Description        | Protected |
| -------------------- | ------------------ | --------- |
| `/`                  | Home page          | ❌        |
| `/manager/login`     | Manager login page | ❌        |
| `/manager/dashboard` | Manager dashboard  | ✅        |

## Customization

### Adding More OAuth Providers

Edit `apps/frontend/auth.ts` and add more providers:

```typescript
import GitHub from 'next-auth/providers/github';

providers: [
  Google({
    /* ... */
  }),
  GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
];
```

### Restricting Access to Specific Emails

Edit `apps/frontend/auth.ts`:

```typescript
callbacks: {
  signIn: async ({ user }) => {
    const allowedEmails = ['manager@example.com'];
    return allowedEmails.includes(user.email || '');
  },
  authorized: async ({ auth }) => {
    return !!auth;
  },
}
```

### Storing User Data in Database

You can integrate with Prisma to store user sessions:

1. Add NextAuth adapter:

```bash
npm install @auth/prisma-adapter
```

2. Update `auth.ts`:

```typescript
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // ... rest of config
});
```

## Troubleshooting

### "redirect_uri_mismatch" Error

- Ensure the redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes or typos

### "Invalid client" Error

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces in `.env.local`

### Authentication Not Working

- Restart the development server after adding `.env.local`
- Clear browser cookies and cache
- Check that `AUTH_SECRET` is set

### Cannot Access Dashboard

- Make sure you're logged in
- Check browser console for errors
- Verify middleware.ts is in the correct location

## Production Deployment

When deploying to production:

1. Update `AUTH_URL` in environment variables to your production domain
2. Add production redirect URI to Google Cloud Console
3. Use secure, unique values for `AUTH_SECRET`
4. Consider adding email restrictions for manager access
5. Enable HTTPS only

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js 15 Documentation](https://nextjs.org/docs)

## Support

For issues or questions, contact your development team.
