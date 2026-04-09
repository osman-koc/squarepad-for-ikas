# Squarepad for Ikas - Mağaza Yetkilendirme ve Login Yapısı

## 📋 Genel Bakış

Bu proje **multi-tenant** mimarisi kullanarak birden fazla ikas mağazasını bağımsız olarak yönetir. Her mağaza kendi OAuth 2.0 tokenleri ve yetkilendirilmiş app ID'si ile izole bir şekilde çalışır.

---

## 🔐 OAuth 2.0 Yetkilendirme Akışı

### 1. **İlk Bağlantı (Initial Connection)**

Kullanıcı admin paneline girdiğinde:

```
1. Kullanıcı → Admin UI
   ↓
2. Admin UI → "/authorize-store" yönlendir
   ↓
3. "/authorize-store" → ikas OAuth sunucusuna yönlendir
   ↓
4. ikas OAuth → İzin ekranı göster
   ↓
5. Kullanıcı "İzin Ver" tıkla
   ↓
6. ikas OAuth → /api/oauth/callback/ikas?code=XXX&signature=YYY
```

### 2. **Callback ve Token Alışverişi** (`src/app/api/oauth/callback/ikas/route.ts`)

Callback endpoint aşağıdaki işlemleri yapar:

```typescript
// 1️⃣ İstek parametrelerini valide et
const { code, state, signature } = validateRequest(callbackSchema, params);

// 2️⃣ İmza doğrulaması (Signature Validation)
TokenHelpers.validateCodeSignature(code, signature, clientSecret)
// Bu, ikas tarafından gönderilen authorization code'un
// gerçekten ikas'tan geldiğini doğrular (HMAC-SHA256)

// 3️⃣ Authorization code'unu access token ile değiştir
const tokenResponse = await OAuthAPI.getTokenWithAuthorizationCode({
  code,
  client_id: config.oauth.clientId,
  client_secret: config.oauth.clientSecret,
  redirect_uri: getRedirectUri(host)
});

// 4️⃣ Mağaza ve App bilgilerini ikas'tan çek
const merchantResponse = await ikas.queries.getMerchant();
const authorizedAppResponse = await ikas.queries.getAuthorizedApp();

// 5️⃣ Token'ı veritabanında sakla
await AuthTokenManager.put({
  accessToken: tokenResponse.access_token,
  refreshToken: tokenResponse.refresh_token,
  authorizedAppId: authorizedAppResponse.id,
  merchantId: merchantResponse.id,
  expireDate: moment().add(expiresIn, 'seconds').toISOString(),
  // ... diğer alanlar
});

// 6️⃣ Oturumu güncelle ve JWT oluştur
await setSession(session);
const jwtToken = JwtHelpers.createToken(merchantId, authorizedAppId);

// 7️⃣ Admin paneline yönlendir
return redirect(`/callback?token=${jwtToken}&redirectUrl=${adminUrl}`);
```

---

## 📊 Multi-Tenant Mimarisi

### Temel Konseptler

```
┌─────────────────────────────────────────┐
│   Global Uygulama Kimliği                │
│   (Application-wide Credentials)         │
├─────────────────────────────────────────┤
│ CLIENT_ID: xyz123                       │
│ CLIENT_SECRET: secret456                │
│ (ikas Developer Portal'dan)             │
└─────────────────────────────────────────┘
              ↓
    ┌────────────────────────┐
    │   PostgreSQL DB        │
    ├────────────────────────┤
    │ AuthTokens Tablosu     │
    │                        │
    │ Mağaza 1:              │
    │ - authorizedAppId: A1  │
    │ - accessToken: ...     │
    │ - refreshToken: ...    │
    │ - merchantId: M1       │
    │                        │
    │ Mağaza 2:              │
    │ - authorizedAppId: A2  │
    │ - accessToken: ...     │
    │ - refreshToken: ...    │
    │ - merchantId: M2       │
    └────────────────────────┘
              ↑
    (AuthTokenManager ile yönetilir)
```

### Anahtarlar

| Terim | Açıklama | Saklama Yeri |
|-------|----------|-------------|
| **CLIENT_ID / CLIENT_SECRET** | Uygulamanın tüm mağazalarda kullandığı global credentials | `.env` dosyası |
| **authorizedAppId** | Mağaza başına benzersiz app yetkilendirmesi ID'si | PostgreSQL (AuthToken) |
| **merchantId** | ikas'taki mağaza ID'si | PostgreSQL (AuthToken) |
| **accessToken** | Mağaza başına OAuth erişim tokeni (kısa ömürlü) | PostgreSQL (AuthToken), şifrelenmiş |
| **refreshToken** | Mağaza başına OAuth yenileme tokeni (uzun ömürlü) | PostgreSQL (AuthToken), şifrelenmiş |

---

## 🏪 Yeni Mağaza Ekleme Süreci

### Adım 1: Kullanıcı Yetkilendirme Sayfasına Yönlendirilir

```bash
GET /authorize-store
  ↓
  Oturum başlatılır (state oluşturulur - CSRF koruması için)
  ↓
  ikas OAuth sunucusuna yönlendir:
  https://ikas.com/oauth/authorize?
    client_id=YOUR_CLIENT_ID
    &redirect_uri=https://yourapp.com/api/oauth/callback/ikas
    &state=random_csrf_token
    &response_type=code
    &scope=admin:write
```

### Adım 2: Kullanıcı ikas'da İzin Verir

```
ikas'ın OAuth sayfasında:
┌──────────────────────────────┐
│ App XYZ erişim istedi        │
│                              │
│ [✓] Ürün yönetimi            │
│ [✓] Siparişleri görüntüle    │
│ [✓] Ayarları düzenle         │
│                              │
│  [ İzin Ver ]  [ Reddet ]    │
└──────────────────────────────┘

Kullanıcı "İzin Ver" tıkla
```

### Adım 3: Callback ve Token Depolanması

```
ikas → POST /api/oauth/callback/ikas?
         code=auth_code_xyz
         &signature=hmac_sha256_signature
         &state=csrf_token

↓ (Validasyon)

1. İmza kontrol et (ikas'tan gelip gelmediğini doğrula)
2. State kontrol et (CSRF koruması)
3. Authorization code'unu access token ile değiştir
4. Mağaza info'sunu ikas'tan çek (merchantId, storeName)
5. AuthTokenManager.put() ile veritabanına sakla

↓ (Oturum Güncelleme)

session.merchantId = merchant.id
session.authorizedAppId = authorizedApp.id
session.expiresAt = 1 saat sonra

↓ (JWT Oluştur)

jwtToken = JwtHelpers.createToken(merchantId, authorizedAppId)

↓ (Admin Paneline Yönlendir)

/callback?
  token=jwt_token
  &redirectUrl=/admin/{storeName}/authorized-app/{authorizedAppId}
```

### Adım 4: Callback Sayfası ve Yönlendirme

```typescript
// /callback sayfası:
1. URL'den token ve redirectUrl oku
2. Token'ı sessionStorage'a sakla
3. Kullanıcıyı redirectUrl'e yönlendir (admin paneli)
```

---

## 🔑 Token Yönetimi

### AuthTokenManager Sınıfı

```typescript
interface AuthToken {
  id: string;              // authorizedAppId
  authorizedAppId: string; // Multi-tenant key
  merchantId: string;      // ikas mağaza ID'si
  accessToken: string;     // Kısa ömürlü (genelde 1 saat)
  refreshToken: string;    // Uzun ömürlü (genelde 30 gün)
  tokenType: string;       // Genelde "Bearer"
  expiresIn: number;       // Saniye cinsinden (örn: 3600)
  expireDate: string;      // ISO8601 formatında
  scope: string;           // Hangi yetkilerin verildiği
  salesChannelId: string | null;
}
```

### Token Depolama ve Güncelleme

```typescript
// Token kaydet
await AuthTokenManager.put(token);
// → PostgreSQL auth_tokens tablosuna şifrelenmiş olarak depo

// Token al
const token = await AuthTokenManager.get(authorizedAppId);
// → authorizedAppId'ye göre veritabanından oku

// Token sil (mağaza bağlantısını kes)
await AuthTokenManager.delete(authorizedAppId);
```

---

## 🛡️ Güvenlik Mekanizmaları

### 1. **İmza Doğrulaması (Signature Validation)**

```typescript
TokenHelpers.validateCodeSignature(code, signature, clientSecret)
// HMAC-SHA256 kullanarak doğrular
// İmza = HMAC-SHA256(code, clientSecret)
// Amacı: ikas'tan gelen code'un sahte olmadığını doğrula
```

### 2. **State Parametresi (CSRF Koruması)**

```typescript
// İlk istek
session.state = generateRandomString();

// Callback'te
if (session.state !== callbackState) {
  return error("Invalid state");
}
// Amacı: İstemci tarafından başlatılmayan callback'leri reddet
```

### 3. **Token Şifreleme**

```typescript
// PostgreSQL'de saklanan tokenler şifrelidir
// AuthTokenManager.put() sırasında otomatik olarak şifrelenir
// AuthTokenManager.get() sırasında otomatik olarak çözülür
```

### 4. **Token Yenileme**

```typescript
// Callback'te otomatik:
onCheckToken: async (token) => {
  if (isExpired(token)) {
    const newToken = await refreshToken(token.refreshToken);
    return newToken; // Token otomatik yenilenir
  }
}
```

---

## 🌐 İframe'deki Kimlik Doğrulama

Admin paneli ikas içindeki bir iframe'de çalıştığında:

```typescript
// 1. İframe'de JWT token al
const token = await TokenHelpers.getTokenForIframeApp();

// 2. Token'ı API isteklerine ekle
const response = await ApiRequests.ikas.getData(token);

// 3. Backend'de JWT doğrula ve authorizedAppId çıkar
const user = getUserFromRequest(request);
const { authorizedAppId, merchantId } = user;

// 4. authorizedAppId'ye göre OAuth token al
const authToken = await AuthTokenManager.get(authorizedAppId);

// 5. OAuth token ile ikas API'sini çağır
const ikasClient = getIkas(authToken);
const data = await ikasClient.queries.someQuery();
```

---

## 📝 Özet: Yetkilendirme Akışı

```
YENI MAĞAZA BAĞLAMA:

Kullanıcı
  ↓
"/authorize-store" → ikas OAuth
  ↓
İzin verme ekranı
  ↓
"/api/oauth/callback/ikas" (authorization code)
  ↓
[İmza doğrula] → [State kontrol et] → [Code → Token değiş]
  ↓
[Mağaza info çek] → [AuthTokenManager'a sakla]
  ↓
[JWT oluştur] → [Callback sayfasına yönlendir]
  ↓
Admin Paneli (iframe)
  ↓
[JWT ile API istekleri] → [authorizedAppId ile token al] → [ikas API]
```

---

## 📌 Önemli Noktalar

✅ **Her mağaza için ayrı token depolanır** - `authorizedAppId` ile izole  
✅ **Tokenleri güvenli şekilde şifrelenmiş veritabanında sakla**  
✅ **Tokenleri asla cevap veya log'a yazmayın**  
✅ **İframe'deki istekleri asla doğrudan ikas API'ye yapma**  
✅ **Her zaman backend API route'ları kullan**  
✅ **Token yenileme otomatik olur (`onCheckToken` callback'i)**
