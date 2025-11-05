# Manager OAuth - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies (Already Done ✅)
```bash
cd apps/frontend
npm install next-auth@beta
```

### 2. Set Up Google OAuth

**Go to:** https://console.cloud.google.com/apis/credentials

- Click **Create Credentials** → **OAuth client ID**
- Application type: **Web application**
- Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Copy your **Client ID** and **Client Secret**

### 3. Create Environment File

Create `apps/frontend/.env.local`:

```bash
# Generate this with: openssl rand -base64 32
AUTH_SECRET=your-generated-secret-here

# From Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Base URL
AUTH_URL=http://localhost:3000
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Start the Server

```bash
cd apps/frontend
npm run dev
```

### 5. Test It Out

1. Open: http://localhost:3000
2. Click: **Manager Portal**
3. Click: **Sign in with Google**
4. ✨ You're in!

---

## 📁 What Was Created

### Files Added:
- ✅ `auth.ts` - NextAuth configuration
- ✅ `middleware.ts` - Route protection
- ✅ `app/api/auth/[...nextauth]/route.ts` - Auth API
- ✅ `app/manager/login/page.tsx` - Login page
- ✅ `app/manager/dashboard/page.tsx` - Dashboard
- ✅ `OAUTH_SETUP.md` - Detailed documentation

### Features:
- ✅ Google OAuth login
- ✅ Protected manager routes
- ✅ Auto-redirect if not logged in
- ✅ Session management
- ✅ Sign out functionality
- ✅ Beautiful UI

---

## 🎯 Routes

| URL | Description | Protected |
|-----|-------------|-----------|
| `/` | Home page with portal link | No |
| `/manager/login` | Manager login | No |
| `/manager/dashboard` | Manager dashboard | Yes ✅ |

---

## 🔒 How It Works

1. **User visits `/manager/dashboard`**
   - Middleware checks authentication
   - If not logged in → redirect to `/manager/login`

2. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth
   - User approves access
   - Returns with authentication token
   - Redirects to dashboard

3. **User is authenticated**
   - Can access all `/manager/*` routes
   - Session stored as JWT
   - "Sign Out" button available

---

## 🛠️ Customization

### Restrict to Specific Emails

Edit `apps/frontend/auth.ts`:

```typescript
callbacks: {
  signIn: async ({ user }) => {
    const allowedEmails = [
      'manager@example.com',
      'admin@example.com'
    ];
    return allowedEmails.includes(user.email || '');
  },
  // ...
}
```

### Add More Pages

Create any file under `apps/frontend/app/manager/`:
- `app/manager/reports/page.tsx`
- `app/manager/settings/page.tsx`
- `app/manager/inventory/page.tsx`

All automatically protected! 🔐

---

## 🐛 Common Issues

**"redirect_uri_mismatch"**
- Check Google Console redirect URI matches exactly
- Should be: `http://localhost:3000/api/auth/callback/google`

**"Invalid client"**
- Verify credentials in `.env.local`
- No extra spaces or quotes

**Not redirecting after login**
- Clear browser cookies
- Restart dev server
- Check browser console for errors

---

## 📚 Full Documentation

See [OAUTH_SETUP.md](apps/frontend/OAUTH_SETUP.md) for:
- Detailed setup instructions
- Security best practices
- Production deployment guide
- Troubleshooting
- Advanced customization

---

## ✅ Checklist

- [ ] Google OAuth credentials created
- [ ] `.env.local` file created with all variables
- [ ] AUTH_SECRET generated
- [ ] Dev server started
- [ ] Tested login flow
- [ ] Can access manager dashboard
- [ ] Sign out works

---

## 🎉 You're Done!

Your manager portal is ready with secure OAuth authentication.

**Next Steps:**
- Connect to your backend API
- Add real data to dashboard
- Create additional manager pages
- Deploy to production

---

**Need Help?** Check the full documentation in `apps/frontend/OAUTH_SETUP.md`

