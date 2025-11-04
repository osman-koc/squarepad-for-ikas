# Multi-Tenant Deployment Checklist

Use this checklist to ensure your multi-tenant ikas app is properly configured.

## 📋 Pre-Deployment Checklist

### 1. ikas Developer Portal Setup

- [ ] Created account on [ikas Developer Portal](https://developer.myikas.com)
- [ ] Registered new application
- [ ] Set app name and description
- [ ] Configured OAuth callback URL:
  - [ ] Development: `http://localhost:3000/api/oauth/callback/ikas`
  - [ ] Production: `https://your-domain.com/api/oauth/callback/ikas`
- [ ] Selected required OAuth scopes:
  - [ ] `read_products`
  - [ ] `write_products`
  - [ ] `read_files`
  - [ ] `write_files`
  - [ ] (add others as needed)
- [ ] Saved `CLIENT_ID` securely
- [ ] Saved `CLIENT_SECRET` securely
- [ ] **Verified**: Only ONE app registration (not per store)

### 2. Environment Configuration

- [ ] Copied `.env.example` to `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Set `NEXT_PUBLIC_GRAPH_API_URL=https://api.myikas.com/api/v2/admin/graphql`
- [ ] Set `NEXT_PUBLIC_ADMIN_URL=https://{storeName}.myikas.com/admin`
- [ ] Set `NEXT_PUBLIC_DEPLOY_URL` to your public URL
- [ ] Generated secure `SECRET_COOKIE_PASSWORD` (64+ characters)
- [ ] Set `NEXT_PUBLIC_CLIENT_ID` from Developer Portal
- [ ] Set `CLIENT_SECRET` from Developer Portal
- [ ] Set `DATABASE_URL` to PostgreSQL connection string
- [ ] **Verified**: `CLIENT_ID` and `CLIENT_SECRET` are app-wide (not store-specific)

### 3. Database Setup

- [ ] PostgreSQL database created
- [ ] Database accessible from application server
- [ ] Run `pnpm prisma generate`
- [ ] Run `pnpm prisma db push`
- [ ] Verified `AuthToken` table created
- [ ] (Optional) Opened `pnpm prisma studio` to verify schema

### 4. Application Build

- [ ] Dependencies installed: `pnpm install`
- [ ] GraphQL types generated: `pnpm codegen`
- [ ] Linter passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors
- [ ] No console warnings

### 5. Local Testing

- [ ] Started dev server: `pnpm dev`
- [ ] Visited `http://localhost:3000`
- [ ] Tested `/authorize-store` page
- [ ] Entered test store name
- [ ] Completed OAuth authorization
- [ ] Redirected to dashboard successfully
- [ ] Verified token saved in database (Prisma Studio)
- [ ] Tested API endpoints work
- [ ] Tested with second test store
- [ ] Verified both stores have separate tokens

## 🚀 Deployment Checklist

### 6. Production Environment

- [ ] Production domain configured (DNS)
- [ ] SSL/TLS certificate installed (HTTPS)
- [ ] Environment variables set in hosting platform
- [ ] `NEXT_PUBLIC_DEPLOY_URL` matches actual domain
- [ ] Production `DATABASE_URL` configured
- [ ] Database accessible from production server

### 7. OAuth Configuration

- [ ] Updated callback URL in Developer Portal to production URL
- [ ] Verified `CLIENT_ID` matches Developer Portal
- [ ] Verified `CLIENT_SECRET` is secure (not in git)
- [ ] Tested OAuth flow on production
- [ ] Confirmed signature validation works

### 8. Database Migration

- [ ] Production database created
- [ ] Run Prisma migration: `pnpm prisma db push`
- [ ] Verified tables created
- [ ] Set up database backups
- [ ] (Optional) Set up database monitoring

### 9. Security Review

- [ ] `CLIENT_SECRET` not committed to git
- [ ] `.env` not committed to git
- [ ] `.env.example` has placeholder values only
- [ ] HTTPS enabled on production
- [ ] Secure cookie password is random and long
- [ ] Database credentials are secure
- [ ] CORS configured correctly
- [ ] OAuth signature validation enabled

### 10. Production Testing

- [ ] Visited production URL
- [ ] Tested `/authorize-store` page
- [ ] Authorized first production store
- [ ] Verified token saved in production DB
- [ ] Tested dashboard functionality
- [ ] Tested API endpoints
- [ ] Authorized second production store
- [ ] Verified token isolation (store A can't access store B data)
- [ ] Tested token auto-refresh

## 📊 Post-Deployment Checklist

### 11. Monitoring Setup

- [ ] Application logs configured
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Database monitoring enabled
- [ ] Uptime monitoring configured
- [ ] OAuth callback success rate monitored

### 12. Documentation

- [ ] Shared installation URL with test users: `https://your-domain.com/authorize-store`
- [ ] Created internal documentation for team
- [ ] Listed supported OAuth scopes
- [ ] Documented environment variables
- [ ] Created runbook for common issues

### 13. Store Onboarding

- [ ] Created installation guide for store owners
- [ ] Tested installation flow with real store
- [ ] Prepared support documentation
- [ ] Set up support channel (email, chat, etc.)

### 14. Maintenance Plan

- [ ] Scheduled database backups
- [ ] Planned token rotation strategy (if needed)
- [ ] Set up dependency update process
- [ ] Planned monitoring reviews
- [ ] Created incident response plan

## ✅ Launch Checklist

### 15. Final Verification

- [ ] All above items completed
- [ ] Production tested with at least 2 real stores
- [ ] No errors in production logs
- [ ] Performance acceptable (page load times)
- [ ] OAuth flow works smoothly
- [ ] Token isolation verified
- [ ] Auto-refresh working
- [ ] Team trained on troubleshooting

### 16. Go Live

- [ ] Announced app availability
- [ ] Shared installation URL publicly
- [ ] Monitoring active
- [ ] Support team ready
- [ ] First stores successfully onboarded

## 🔍 Verification Commands

```bash
# Check environment
cat .env | grep -E "(CLIENT_ID|CLIENT_SECRET|DATABASE_URL)"

# Verify database connection
pnpm prisma studio

# Check build
pnpm build

# Run tests
pnpm test  # (if tests exist)

# Start production
pnpm start

# Check logs
pm2 logs  # (if using PM2)
docker logs <container>  # (if using Docker)
```

## 📝 Common Verification Queries

```sql
-- Check token count
SELECT COUNT(*) FROM "AuthToken";

-- List all stores
SELECT "authorizedAppId", "merchantId", "expireDate" 
FROM "AuthToken" 
WHERE "deleted" = false;

-- Check expired tokens
SELECT COUNT(*) 
FROM "AuthToken" 
WHERE "expireDate" < NOW() AND "deleted" = false;
```

## 🆘 Troubleshooting

### If OAuth fails:
1. Check `CLIENT_ID` and `CLIENT_SECRET` in `.env`
2. Verify callback URL in Developer Portal
3. Check application logs for errors
4. Verify HTTPS is working

### If token not saved:
1. Check database connection
2. Verify Prisma schema is up to date
3. Check application logs
4. Test database write permissions

### If store isolation fails:
1. Verify `getUserFromRequest` extracts correct `authorizedAppId`
2. Check `AuthTokenManager.get()` uses correct ID
3. Test with two different store sessions
4. Review JWT token contents

## 📞 Support Resources

- **ikas Documentation**: https://ikas.dev/docs
- **Developer Portal**: https://developer.myikas.com
- **Project Documentation**:
  - [QUICKSTART.md](./QUICKSTART.md)
  - [MULTI-TENANT-SETUP.md](./MULTI-TENANT-SETUP.md)
  - [ARCHITECTURE-DIAGRAM.md](./ARCHITECTURE-DIAGRAM.md)

---

## ✨ Success Criteria

Your multi-tenant app is ready when:

- ✅ Multiple stores can authorize independently
- ✅ Each store has unique token in database
- ✅ Tokens are automatically refreshed
- ✅ Stores are completely isolated (no cross-store access)
- ✅ OAuth flow completes without errors
- ✅ Dashboard works for all authorized stores
- ✅ Production monitoring is active

**Congratulations on your multi-tenant deployment! 🎉**
