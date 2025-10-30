Production deployment notes

This project was converted to use PostgreSQL in production. Follow these steps to deploy correctly.

Environment variables (required in production)

- DATABASE_URL: postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
- NEXT_PUBLIC_GRAPH_API_URL: https://... (ikas graph API)
- NEXT_PUBLIC_CLIENT_ID
- CLIENT_SECRET
- NEXT_PUBLIC_DEPLOY_URL
- SECRET_COOKIE_PASSWORD

Build & deploy with Docker

1. Build the image (locally):

```bash
docker build -t squarepad-app .
```

2. Run (example):

```bash
docker run --rm -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" -e NEXT_PUBLIC_GRAPH_API_URL="https://..." -p 3000:3000 squarepad-app
```

3. The container entrypoint runs `npx prisma migrate deploy` automatically when `DATABASE_URL` is set. Ensure your database is reachable and the credentials are correct.

If you prefer to run migrations yourself before starting the container:

```bash
# On a machine with prisma CLI and access to the database
pnpm prisma migrate deploy --preview-feature
```

Notes & recommendations

- SQLite (`dev.db`) is for local development only. Do not use SQLite in production.
- Use a managed Postgres instance for production (Heroku Postgres, AWS RDS, Supabase, Neon, etc.).
- Ensure the `DATABASE_URL` has the correct `schema` parameter (Prisma uses `public` by default).

If you want, I can also add a small `.env.example` file and a CI step to run `pnpm prisma migrate deploy` in your deploy pipeline.
