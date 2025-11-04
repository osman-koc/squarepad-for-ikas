# Multi-Tenant Setup Guide / Çok Mağazalı Kurulum Rehberi

## 🎯 Overview / Genel Bakış

Bu uygulama **multi-tenant (çok mağazalı)** bir yapıda çalışır. Her ikas mağazası kendi OAuth token'ları ile bağımsız olarak çalışır.

**EN:** This app is designed as a **multi-tenant** system. Each ikas store operates independently with its own OAuth tokens.

---

## 🏗️ Architecture / Mimari

### OAuth 2.0 Flow

```
1. Mağaza → /authorize-store sayfasına gider
   Store → Goes to /authorize-store page

2. Uygulama → ikas OAuth'a yönlendirir (CLIENT_ID ile)
   App → Redirects to ikas OAuth (with CLIENT_ID)

3. Mağaza Sahibi → İzinleri onaylar
   Store Owner → Approves permissions

4. ikas → Callback URL'e döner (authorization code ile)
   ikas → Returns to callback URL (with authorization code)

5. Uygulama → Token exchange yapar (CLIENT_SECRET ile)
   App → Exchanges code for tokens (with CLIENT_SECRET)

6. Uygulama → Token'ı veritabanına kaydeder
   App → Saves token to database

7. Mağaza → Dashboard'a yönlendirilir
   Store → Redirected to dashboard
```

### Token Storage / Token Saklama

Her mağaza için ayrı token kaydedilir:

**EN:** Each store has its own token record:

```typescript
{
  id: "unique-id",
  merchantId: "merchant-uuid",
  authorizedAppId: "app-uuid",  // Unique per store
  accessToken: "eyJ...",
  refreshToken: "eyJ...",
  expireDate: "2024-12-01T10:00:00Z",
  // ... other fields
}
```

**Önemli:** `authorizedAppId` her mağaza için benzersizdir ve token'ları ayırt etmek için kullanılır.

**Important:** `authorizedAppId` is unique per store and used to identify tokens.

---

## 📝 Setup Steps / Kurulum Adımları

### 1. ikas Developer Portal'da Uygulama Kaydı

**TR:**
1. [ikas Developer Portal](https://developer.myikas.com) adresine gidin
2. Yeni bir uygulama oluşturun
3. **Uygulama Bilgileri:**
   - İsim: Squarepad (veya tercih ettiğiniz isim)
   - Açıklama: Ürün görsellerini kare formata dönüştürür
4. **OAuth Callback URL:**
   ```
   https://your-domain.com/api/oauth/callback/ikas
   ```
   (Production için gerçek domain'inizi kullanın)
   (Geliştirme için `http://localhost:3000/api/oauth/callback/ikas`)
5. **Client ID** ve **Client Secret** alın
6. Bu bilgileri `.env` dosyanıza kaydedin

**EN:**
1. Go to [ikas Developer Portal](https://developer.myikas.com)
2. Create a new application
3. **Application Details:**
   - Name: Squarepad (or your preferred name)
   - Description: Converts product images to square format
4. **OAuth Callback URL:**
   ```
   https://your-domain.com/api/oauth/callback/ikas
   ```
   (Use your real domain for production)
   (Use `http://localhost:3000/api/oauth/callback/ikas` for development)
5. Get your **Client ID** and **Client Secret**
6. Save these to your `.env` file

### 2. Environment Variables

`.env` dosyanızı düzenleyin:

**Edit your `.env` file:**

```bash
# OAuth Credentials (from ikas Developer Portal)
# TEK BİR UYGULAMA İÇİN - BÜTÜN MAĞAZALAR İÇİN AYNI
# SINGLE APP CREDENTIALS - SAME FOR ALL STORES
NEXT_PUBLIC_CLIENT_ID=your_client_id_from_developer_portal
CLIENT_SECRET=your_client_secret_from_developer_portal

# Deployment URL (your app's public URL)
NEXT_PUBLIC_DEPLOY_URL=https://your-domain.com

# Database (PostgreSQL for token storage)
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

### 3. Database Setup

Veritabanı migration'ını çalıştırın:

**Run database migration:**

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Application Deployment

Uygulamayı deploy edin:

**Deploy the application:**

```bash
pnpm build
pnpm start
```

---

## 🔐 Security / Güvenlik

### Environment Variables

**❌ YANLIŞ / WRONG:**
```bash
# Her mağaza için farklı CLIENT_ID/SECRET kullanmak
# Using different CLIENT_ID/SECRET per store
CLIENT_ID_STORE_1=...
CLIENT_ID_STORE_2=...
```

**✅ DOĞRU / CORRECT:**
```bash
# Tek bir CLIENT_ID/SECRET (sizin uygulamanızın)
# Single CLIENT_ID/SECRET (your app's credentials)
NEXT_PUBLIC_CLIENT_ID=your_app_client_id
CLIENT_SECRET=your_app_client_secret
```

### Token Management

- ✅ Token'lar PostgreSQL'de saklanır
- ✅ Her mağaza için `authorizedAppId` unique'dir
- ✅ Token'lar otomatik yenilenir (refresh token)
- ✅ Expired token'lar `onCheckToken` callback ile yenilenir

**EN:**
- ✅ Tokens are stored in PostgreSQL
- ✅ Each store has a unique `authorizedAppId`
- ✅ Tokens auto-refresh using refresh token
- ✅ Expired tokens refreshed via `onCheckToken` callback

---

## 🚀 Adding New Stores / Yeni Mağaza Ekleme

### Mağaza Sahipleri İçin / For Store Owners

1. Uygulamanın install URL'ine gidin:
   ```
   https://your-domain.com/authorize-store
   ```

2. Mağaza adınızı girin (örn: `mystore`)

3. ikas izin ekranında "İzin Ver" butonuna tıklayın

4. Yönlendirildikten sonra uygulama kullanıma hazır!

**EN:**
1. Go to the app's install URL:
   ```
   https://your-domain.com/authorize-store
   ```

2. Enter your store name (e.g., `mystore`)

3. Click "Authorize" on the ikas permission screen

4. After redirect, the app is ready to use!

---

## 🔧 Technical Details / Teknik Detaylar

### Code Flow

```typescript
// 1. User visits authorization page
GET /authorize-store

// 2. User submits store name
GET /api/oauth/authorize/ikas?storeName=mystore

// 3. Redirect to ikas OAuth
→ https://mystore.myikas.com/admin/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://your-domain.com/api/oauth/callback/ikas
  &scope=read_products,write_products
  &state=random_string

// 4. User approves, ikas redirects back
GET /api/oauth/callback/ikas?code=AUTH_CODE&state=...

// 5. Exchange code for token
POST https://mystore.myikas.com/admin/oauth/token
  {
    code: AUTH_CODE,
    client_id: YOUR_CLIENT_ID,
    client_secret: YOUR_CLIENT_SECRET,
    redirect_uri: ...
  }

// 6. Save token to database
AuthTokenManager.put({
  authorizedAppId: "app-uuid",
  merchantId: "merchant-uuid",
  accessToken: "eyJ...",
  refreshToken: "eyJ...",
  ...
})

// 7. Redirect to dashboard
→ /dashboard
```

### Token Retrieval

API route'larında token kullanımı:

**Token usage in API routes:**

```typescript
import { getUserFromRequest } from '@/helpers/api-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { getIkas } from '@/helpers/api-helpers';

export async function GET(request: NextRequest) {
  // Get user from JWT
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get store-specific token
  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) return NextResponse.json({ error: 'Token not found' }, { status: 404 });

  // Create ikas client with store's token
  const ikasClient = getIkas(authToken);
  
  // Make API calls
  const products = await ikasClient.queries.getProducts();
  
  return NextResponse.json({ data: products });
}
```

---

## 📚 Resources / Kaynaklar

- [ikas Developer Documentation](https://ikas.dev/docs/intro)
- [ikas Admin API](https://ikas.dev/docs/api/admin-api/products)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [ikas Developer Portal](https://developer.myikas.com)

---

## ❓ FAQ / Sıkça Sorulan Sorular

### Q: CLIENT_ID ve CLIENT_SECRET her mağaza için farklı mı?
**A:** HAYIR! Bu bilgiler **sizin uygulamanıza** aittir, tüm mağazalar için aynıdır.

**EN:** NO! These credentials belong to **your application**, same for all stores.

---

### Q: Yeni bir mağaza eklendiğinde ne yapmalıyım?
**A:** Hiçbir şey! Mağaza sahibi `/authorize-store` sayfasına giderek kendi başına kurulum yapabilir.

**EN:** Nothing! Store owner can install via `/authorize-store` page themselves.

---

### Q: Token'lar ne zaman yenilenir?
**A:** Token expire olmadan önce otomatik olarak yenilenir (`onCheckToken` callback).

**EN:** Tokens auto-refresh before expiration via `onCheckToken` callback.

---

### Q: Veritabanını değiştirmek istersem?
**A:** `prisma/schema.prisma` dosyasını düzenleyin ve `pnpm prisma db push` komutunu çalıştırın.

**EN:** Edit `prisma/schema.prisma` and run `pnpm prisma db push`.

---

## 🐛 Troubleshooting / Sorun Giderme

### "Unauthorized" hatası alıyorum

1. JWT token'ın doğru gönderildiğinden emin olun
2. Token'ın expire olmadığını kontrol edin
3. `authorizedAppId` veritabanında var mı kontrol edin

### OAuth callback hata veriyor

1. Developer Portal'da callback URL'in doğru olduğunu kontrol edin
2. `CLIENT_ID` ve `CLIENT_SECRET` doğru mu kontrol edin
3. HTTPS kullanıyorsanız SSL sertifikanızın geçerli olduğundan emin olun

### Token refresh çalışmıyor

1. `refreshToken` veritabanında mevcut mu kontrol edin
2. `getIkas` fonksiyonunda `onCheckToken` callback'inin doğru implement edildiğini kontrol edin
3. Console log'ları kontrol edin

---

## 📞 Support / Destek

Sorun yaşarsanız:
- GitHub Issues: [Your Repo Issues]
- Documentation: [ikas.dev/docs](https://ikas.dev/docs)

**EN:** If you need help:
- GitHub Issues: [Your Repo Issues]
- Documentation: [ikas.dev/docs](https://ikas.dev/docs)
