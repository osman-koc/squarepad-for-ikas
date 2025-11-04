# Quick Start Guide - Multi-Tenant Setup

This guide will help you quickly set up your ikas app to serve multiple stores.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database (or use a cloud provider like Supabase, Neon, etc.)
- [ ] pnpm installed (`npm install -g pnpm`)

## Step 1: Register Your App on ikas Developer Portal

1. Go to [ikas Developer Portal](https://developer.myikas.com)
2. Login with your ikas account
3. Click **"Create New App"**
4. Fill in the details:
   ```
   App Name: SquarePad (or your app name)
   Description: Product image square converter for ikas stores
   Developer Name: Your Name/Company
   ```
5. Set **OAuth Callback URL**:
   ```
   Production: https://your-domain.com/api/oauth/callback/ikas
   Development: http://localhost:3000/api/oauth/callback/ikas
   ```
6. Select required **Scopes**:
   ```
   ✓ read_products
   ✓ write_products
   ✓ read_files
   ✓ write_files
   (add more as needed)
   ```
7. Click **"Create App"**
8. **Save your credentials** (you'll need these):
   ```
   CLIENT_ID: 7b518558-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   CLIENT_SECRET: s_XXXxxxXXXxxx...
   ```

⚠️ **Important**: Keep your `CLIENT_SECRET` secure! Never commit it to public repositories.

## Step 2: Clone and Setup Project

```bash
# Clone the repository
git clone <your-repo-url>
cd squarepad-for-ikas

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

## Step 3: Configure Environment Variables

Edit `.env` file with your credentials:

```bash
# Node Environment
NODE_ENV=production

# ikas API Configuration
NEXT_PUBLIC_GRAPH_API_URL=https://api.myikas.com/api/v2/admin/graphql
NEXT_PUBLIC_ADMIN_URL=https://{storeName}.myikas.com/admin

# Your App's Public URL
# Development:
NEXT_PUBLIC_DEPLOY_URL=http://localhost:3000
# Production:
# NEXT_PUBLIC_DEPLOY_URL=https://your-domain.com

# Session Security (generate a random string, 64+ characters)
SECRET_COOKIE_PASSWORD=generate_a_long_random_string_here_at_least_64_characters_long

# OAuth Credentials from ikas Developer Portal
# ⚠️ THESE ARE YOUR APP'S CREDENTIALS - SAME FOR ALL STORES
NEXT_PUBLIC_CLIENT_ID=your_client_id_from_step_1
CLIENT_SECRET=your_client_secret_from_step_1

# Database (PostgreSQL for multi-tenant token storage)
# Examples:
# Local: postgresql://user:password@localhost:5432/squarepad
# Supabase: postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
# Neon: postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Image Processing
ALLOWED_IMG_HOSTS=cdn.myikas.com,static.myikas.com
SQUARE_DEFAULT_SIZE=1024
SQUARE_MAX_SIZE=2048
SQUARE_MAX_INPUT_MB=15
```

### Generate Secure Cookie Password

```bash
# Option 1: Using openssl
openssl rand -base64 64

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Step 4: Setup Database

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm prisma db push

# (Optional) Open Prisma Studio to verify
pnpm prisma studio
```

## Step 5: Generate GraphQL Types

```bash
# Generate TypeScript types from GraphQL schema
pnpm codegen
```

## Step 6: Start Development Server

```bash
# Start Next.js development server
pnpm dev
```

Your app will be available at: `http://localhost:3000`

## Step 7: Test Store Authorization

1. Open browser and go to: `http://localhost:3000/authorize-store`

2. Enter a test store name (e.g., your ikas store name without domain)

3. You'll be redirected to ikas OAuth authorization page

4. Click **"Authorize"** to grant permissions

5. You'll be redirected back to your app's dashboard

6. Check database to verify token was saved:
   ```bash
   pnpm prisma studio
   ```
   
   You should see a record in `AuthToken` table with:
   - `authorizedAppId`: unique ID for this store
   - `merchantId`: store's merchant ID
   - `accessToken`: OAuth access token
   - `refreshToken`: OAuth refresh token

## Step 8: Add More Stores

To add another store, simply:

1. Go to `http://localhost:3000/authorize-store`
2. Enter different store name
3. Authorize
4. Done! ✅

Each store will have its own record in the database with unique `authorizedAppId`.

**No code changes needed!** 🎉

## Step 9: Deploy to Production

### Update Environment Variables

1. Update `NEXT_PUBLIC_DEPLOY_URL` to your production domain
2. Update `DATABASE_URL` to your production database
3. Update OAuth callback URL in ikas Developer Portal to production URL

### Build and Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or deploy to your preferred platform:
# - Vercel: vercel deploy
# - Railway: railway up
# - Docker: docker build -t squarepad .
```

### Verify Production Deployment

1. Visit: `https://your-domain.com/authorize-store`
2. Test authorization flow with a real store
3. Verify tokens are saved in production database

## Architecture Overview

```
┌─────────────────┐
│ ikas Developer  │
│    Portal       │──┐
└─────────────────┘  │ CLIENT_ID + CLIENT_SECRET
                     │ (Same for ALL stores)
                     ▼
              ┌──────────────┐
              │  Your App    │
              │  (SquarePad) │
              └──────────────┘
                     │
                     │ Stores tokens in PostgreSQL
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
  ┌────────┐   ┌────────┐   ┌────────┐
  │Store A │   │Store B │   │Store C │
  │Token   │   │Token   │   │Token   │
  └────────┘   └────────┘   └────────┘
  Isolated     Isolated     Isolated
```

## Common Issues and Solutions

### Issue: "Invalid CLIENT_ID"

**Solution**: Double-check your `NEXT_PUBLIC_CLIENT_ID` in `.env` matches the one from Developer Portal.

### Issue: "Invalid signature"

**Solution**: Verify `CLIENT_SECRET` is correct and not exposed in frontend code.

### Issue: Database connection error

**Solution**: 
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### Issue: Token not found after authorization

**Solution**:
- Check if database migration ran successfully: `pnpm prisma db push`
- Verify Prisma client is generated: `pnpm prisma generate`
- Check database records: `pnpm prisma studio`

### Issue: CORS error in production

**Solution**: Ensure `NEXT_PUBLIC_DEPLOY_URL` matches your actual domain (no trailing slash).

## Next Steps

- ✅ Read [MULTI-TENANT-SETUP.md](./MULTI-TENANT-SETUP.md) for architecture details
- ✅ Read [ARCHITECTURE-DIAGRAM.md](./ARCHITECTURE-DIAGRAM.md) for visual overview
- ✅ Check [AGENTS.md](./AGENTS.md) for development rules
- ✅ Review [README.md](./README.md) for full documentation

## Support

- **Documentation**: https://ikas.dev/docs
- **Developer Portal**: https://developer.myikas.com
- **Issues**: Create an issue in this repository

---

**Congratulations! 🎉**

Your multi-tenant ikas app is now ready to serve multiple stores!
