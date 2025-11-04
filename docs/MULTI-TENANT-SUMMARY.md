# Multi-Tenant Setup Summary

## ✅ Your App is Already Multi-Tenant!

Good news! Your SquarePad application is **already built with multi-tenant architecture**. No major code changes are needed.

## 🎯 What This Means

### ❌ WRONG Understanding:
- "I need different CLIENT_ID/SECRET for each store"
- "I need to modify code to add new stores"
- "Each store needs separate app registration"

### ✅ CORRECT Understanding:
- **One app registration** serves all stores
- **One CLIENT_ID/SECRET** for your entire app
- **OAuth tokens per store** stored in PostgreSQL
- **Zero code changes** to add new stores
- **Store self-service** installation via `/authorize-store`

## 📊 How It Works

```
1 App Registration (Developer Portal)
    │
    ├─ CLIENT_ID: 7b518558-... (same for all)
    └─ CLIENT_SECRET: s_PPfz... (same for all)
    
                    ↓
                    
1 PostgreSQL Database
    │
    ├─ Store A Token (authorizedAppId: uuid-1)
    ├─ Store B Token (authorizedAppId: uuid-2)
    ├─ Store C Token (authorizedAppId: uuid-3)
    └─ ... unlimited stores
```

## 🚀 What You Need To Do

### 1. Register Your App (One Time)

Go to [ikas Developer Portal](https://developer.myikas.com) and register **ONE** app:

- **App Name**: SquarePad
- **Callback URL**: `https://your-domain.com/api/oauth/callback/ikas`
- **Scopes**: `read_products`, `write_products`, `read_files`, `write_files`

You'll get:
- `CLIENT_ID`: Use this in `NEXT_PUBLIC_CLIENT_ID`
- `CLIENT_SECRET`: Use this in `CLIENT_SECRET`

### 2. Configure Environment

Update `.env`:

```bash
# Your app's credentials (same for ALL stores)
NEXT_PUBLIC_CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# PostgreSQL for token storage
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Your app's public URL
NEXT_PUBLIC_DEPLOY_URL=https://your-domain.com
```

### 3. Deploy Your App

```bash
pnpm prisma generate
pnpm prisma db push
pnpm build
pnpm start
```

### 4. Share Installation URL

Give this URL to store owners:

```
https://your-domain.com/authorize-store
```

Each store owner:
1. Visits the URL
2. Enters their store name
3. Clicks "Authorize"
4. Done! ✅

## 🔐 Security Architecture

### Token Isolation

```typescript
// Each API call:
1. Browser sends JWT with merchantId + authorizedAppId
2. Backend extracts user info from JWT
3. Backend loads THAT STORE'S token from DB
4. Backend makes ikas API call with THAT STORE'S token

// Result: Complete isolation between stores
```

### Database Schema

```sql
AuthToken {
  id              uuid PRIMARY KEY
  authorizedAppId uuid UNIQUE    -- Key isolation point
  merchantId      uuid
  accessToken     text
  refreshToken    text
  expireDate      timestamp
}
```

## 📝 Your Current Code Already Does This

### ✅ OAuth Authorization
```typescript
// src/app/api/oauth/authorize/ikas/route.ts
// Uses config.oauth.clientId (same for all stores)
```

### ✅ Token Storage
```typescript
// src/models/auth-token/manager.ts
// Stores per authorizedAppId (isolated)
```

### ✅ Token Retrieval
```typescript
// src/helpers/api-helpers.ts
export function getUserFromRequest(request) {
  // Extracts authorizedAppId from JWT
}

// src/models/auth-token/manager.ts
AuthTokenManager.get(authorizedAppId)
// Returns THAT STORE'S token
```

### ✅ Auto Token Refresh
```typescript
// src/helpers/api-helpers.ts
export function getIkas(token: AuthToken) {
  // onCheckToken callback auto-refreshes
}
```

## 🎓 Understanding the Flow

### Store Installation Flow

```
Store Owner → /authorize-store
           ↓
      Enters store name
           ↓
      OAuth authorization
           ↓
      Approves permissions
           ↓
      Redirected back with code
           ↓
      Your app exchanges code for tokens
           ↓
      Tokens saved to DB (unique authorizedAppId)
           ↓
      Store ready to use! ✅
```

### Runtime API Flow

```
Store A's Dashboard
        ↓
   JWT with authorizedAppId=uuid-A
        ↓
   GET /api/ikas/products
        ↓
   Backend: AuthTokenManager.get(uuid-A)
        ↓
   Store A's access token
        ↓
   ikas API call with Store A's token
        ↓
   Returns Store A's products only
```

## 📚 Documentation Files

We've created comprehensive documentation:

1. **[QUICKSTART.md](./QUICKSTART.md)**
   - Step-by-step setup guide
   - Prerequisites and requirements
   - Common issues and solutions

2. **[MULTI-TENANT-SETUP.md](./MULTI-TENANT-SETUP.md)**
   - Detailed architecture explanation
   - Security considerations
   - FAQ section (TR + EN)

3. **[ARCHITECTURE-DIAGRAM.md](./ARCHITECTURE-DIAGRAM.md)**
   - Visual ASCII diagrams
   - OAuth flow breakdown
   - API request flow

4. **[AGENTS.md](./AGENTS.md)** (Updated)
   - Multi-tenant rules added
   - Development guidelines

5. **[README.md](./README.md)** (Updated)
   - Multi-tenant highlights
   - Database schema details

6. **[README-tr.md](./README-tr.md)** (Updated)
   - Turkish version with multi-tenant info

## ❓ Common Questions

### Q: Do I need to create multiple apps in Developer Portal?
**A**: NO! Create only ONE app. It serves all stores.

### Q: Are CLIENT_ID and CLIENT_SECRET store-specific?
**A**: NO! They are YOUR app's credentials, same for all stores.

### Q: How do I add a new store?
**A**: Just share the `/authorize-store` URL. Store owner installs themselves.

### Q: How are tokens kept separate?
**A**: Each token has unique `authorizedAppId`. Backend loads correct token per request.

### Q: What if a store uninstalls?
**A**: Token marked as deleted in DB. No cross-store impact.

### Q: Can I test with multiple stores locally?
**A**: YES! Just authorize different stores to `http://localhost:3000`

## ✨ Summary

Your app is **already multi-tenant**! You just need to:

1. ✅ Register ONE app on Developer Portal
2. ✅ Configure `.env` with YOUR app's credentials
3. ✅ Deploy with PostgreSQL database
4. ✅ Share `/authorize-store` URL with stores

That's it! No code changes needed. 🎉

## 📞 Next Steps

1. Read [QUICKSTART.md](./QUICKSTART.md) for setup steps
2. Register your app at [ikas Developer Portal](https://developer.myikas.com)
3. Configure environment variables
4. Deploy and test with your first store
5. Share installation URL with other stores

---

**Questions?** Check [MULTI-TENANT-SETUP.md](./MULTI-TENANT-SETUP.md) for FAQ and troubleshooting.
