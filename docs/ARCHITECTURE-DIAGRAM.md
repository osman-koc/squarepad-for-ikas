# Multi-Tenant OAuth Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ikas Developer Portal                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Your App Registration                                        │  │
│  │  ────────────────────────                                     │  │
│  │  App Name: SquarePad                                          │  │
│  │  CLIENT_ID: 7b518558-...                                      │  │
│  │  CLIENT_SECRET: s_PPfz...                                     │  │
│  │  Callback URL: https://your-app.com/api/oauth/callback/ikas  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Single App Credentials
                                  │ (Used for ALL stores)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Your SquarePad Application                        │
│                                                                      │
│  Environment Variables (.env)                                       │
│  ────────────────────────────────────────────────────────────────  │
│  NEXT_PUBLIC_CLIENT_ID=7b518558-...    ◄── Same for ALL stores     │
│  CLIENT_SECRET=s_PPfz...               ◄── Same for ALL stores     │
│  DATABASE_URL=postgresql://...         ◄── Multi-tenant DB         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (Token Storage)                         │  │
│  │  ──────────────────────────────────────────────────────────  │  │
│  │                                                               │  │
│  │  AuthToken Table:                                            │  │
│  │  ┌────────────┬─────────────┬──────────────┬──────────────┐ │  │
│  │  │ authorized │ merchantId  │ accessToken  │ refreshToken │ │  │
│  │  │ AppId      │             │              │              │ │  │
│  │  ├────────────┼─────────────┼──────────────┼──────────────┤ │  │
│  │  │ app-uuid-1 │ merchant-A  │ eyJ...       │ eyJ...       │ │  │
│  │  │ app-uuid-2 │ merchant-B  │ eyJ...       │ eyJ...       │ │  │
│  │  │ app-uuid-3 │ merchant-C  │ eyJ...       │ eyJ...       │ │  │
│  │  │     ...    │     ...     │     ...      │     ...      │ │  │
│  │  └────────────┴─────────────┴──────────────┴──────────────┘ │  │
│  │         ▲                                                     │  │
│  │         │ Each store has unique authorizedAppId              │  │
│  │         │ Tokens isolated per store                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
           ▼                    ▼                    ▼
     ┌─────────┐          ┌─────────┐          ┌─────────┐
     │ Store A │          │ Store B │          │ Store C │
     │         │          │         │          │         │
     │ mystore │          │ fashion │          │ techshop│
     └─────────┘          └─────────┘          └─────────┘

═══════════════════════════════════════════════════════════════════════
OAuth Flow for Each Store (Independent)
═══════════════════════════════════════════════════════════════════════

1. Store Owner visits:
   https://your-app.com/authorize-store
   
2. Enters store name: "mystore"
   
3. Redirected to ikas OAuth:
   https://mystore.myikas.com/admin/oauth/authorize
   ?client_id=7b518558-...        ◄── Your App's CLIENT_ID
   &redirect_uri=https://your-app.com/api/oauth/callback/ikas
   &scope=read_products,write_products
   &state=random_csrf_token
   
4. Store Owner approves permissions
   
5. ikas redirects back:
   https://your-app.com/api/oauth/callback/ikas
   ?code=AUTH_CODE
   &signature=HMAC_SHA256(code, client_secret)
   &state=random_csrf_token
   
6. Your app validates signature and exchanges code:
   POST https://mystore.myikas.com/admin/oauth/token
   {
     code: AUTH_CODE,
     client_id: YOUR_CLIENT_ID,    ◄── Same for all stores
     client_secret: YOUR_SECRET,   ◄── Same for all stores
     redirect_uri: ...
   }
   
7. ikas returns tokens:
   {
     access_token: "eyJ...",
     refresh_token: "eyJ...",
     expires_in: 3600
   }
   
8. Your app saves to database:
   AuthTokenManager.put({
     authorizedAppId: "app-uuid-1",  ◄── Unique per store
     merchantId: "merchant-A",       ◄── Unique per store
     accessToken: "eyJ...",
     refreshToken: "eyJ...",
     expireDate: "2024-12-01..."
   })
   
9. Store redirected to dashboard with JWT

═══════════════════════════════════════════════════════════════════════
API Request Flow (Runtime)
═══════════════════════════════════════════════════════════════════════

Frontend (Store A's iframe):
  │
  │ 1. Get JWT from AppBridge
  │    TokenHelpers.getTokenForIframeApp()
  │    → "eyJ...merchant-A...app-uuid-1..."
  │
  ▼
  │ 2. Call backend with JWT
  │    GET /api/ikas/products
  │    Authorization: JWT eyJ...
  │
  ▼
Backend API Route:
  │
  │ 3. Extract user from JWT
  │    getUserFromRequest(request)
  │    → { merchantId: "merchant-A", authorizedAppId: "app-uuid-1" }
  │
  ▼
  │ 4. Load store's OAuth token from DB
  │    AuthTokenManager.get("app-uuid-1")
  │    → { accessToken: "eyJ...", refreshToken: "eyJ..." }
  │
  ▼
  │ 5. Create ikas client with store's token
  │    getIkas(authToken)
  │    → ikasClient configured for Store A
  │
  ▼
  │ 6. Make GraphQL request
  │    ikasClient.queries.getProducts()
  │    → Calls ikas API with Store A's access token
  │
  ▼
  │ 7. Return data to frontend
  │    NextResponse.json({ data: products })

═══════════════════════════════════════════════════════════════════════
Key Security Points
═══════════════════════════════════════════════════════════════════════

✅ Single CLIENT_ID/SECRET for your app (not per store)
✅ OAuth tokens isolated per authorizedAppId in database
✅ JWT used for browser→server auth (no OAuth tokens in browser)
✅ HMAC-SHA256 signature validation on OAuth callback
✅ Automatic token refresh before expiration
✅ No cross-store data access (token isolation)
✅ Store-specific API calls use store-specific tokens

❌ Don't create multiple apps in Developer Portal
❌ Don't store CLIENT_SECRET in frontend
❌ Don't share tokens between stores
❌ Don't bypass token validation
```
