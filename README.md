# Punyalink API

Backend API for **Punyalink**: multi-tenant short links per store (subdomain), store-user authentication, link analytics (views / clicks), and temporary **link collections** (shareable bundles with expiry).

This repository is **open source**. You are welcome to **fork** the project, open **issues** for bugs or ideas, and submit pull requests.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Runtime | Node.js |
| Framework | [NestJS](https://nestjs.com/) 11 |
| HTTP | [Fastify](https://fastify.dev/) (via `@nestjs/platform-fastify`) |
| Database | PostgreSQL |
| ORM | [TypeORM](https://typeorm.io/) (migrations, `synchronize: false`) |
| Auth | JWT ([`@nestjs/jwt`](https://docs.nestjs.com/security/authentication)), Passport strategies for store users |

---

## Prerequisites

- **Node.js** (LTS recommended, e.g. 20+)
- **PostgreSQL** 14+ (with `uuid-ossp` or equivalent if your migrations expect `uuid_generate_v4()` — ensure extensions match your DB setup)
- **npm** (or `pnpm` / `yarn` if you prefer; scripts below use `npm`)

---

## Quick start

### 1. Clone the repository

```bash
git clone git@github.com:waggyman/punyalink-api.git
cd punyalink-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Create a `.env` file in the project root. Minimum variables used by the app and migrations:

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes* | PostgreSQL host |
| `DB_PORT` | No | Default `5432` |
| `DB_USER` | Yes* | Database user |
| `DB_PASSWORD` | Yes* | Database password |
| `DB_NAME` | Yes* | Database name |
| `JWT_SECRET` | Yes | Secret for **admin** access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for **admin** refresh tokens |
| `JWT_USER_SECRET` | Yes | Secret for **store user** JWTs |
| `JWT_EXPIRES_IN` | No | Admin access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Admin refresh TTL (e.g. `30d`) |
| `JWT_USER_EXPIRES_IN` | No | Store user access TTL (e.g. `24h`) |
| `PORT` | No | HTTP port; default `3000` (set `8000` if your frontend points there) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (e.g. `http://localhost:5173`). Default includes common local dev URLs. Use `*` to allow any origin (not for production). |
| `MAX_COLLECTIONS_PER_STORE` | No | Max temporary collections per store (default `15`) |
| `OTP_EXPOSE_IN_RESPONSE` | No | Set `true` in dev to return OTP value in JSON (no email provider) |
| `PUBLIC_API_PROTOCOL` | No | Image URL base protocol (default `http`) |
| `PUBLIC_API_HOST` | No | Image URL base host (default `localhost`) |
| `MEMBERSHIP_BANK_ACCOUNT_NUMBER` | No* | Bank account for Plus transfer payments |
| `MEMBERSHIP_BANK_ACCOUNT_NAME` | No* | Bank account holder name for Plus payments |
| `TENANT_SUBDOMAIN_HEADER` | No | Override tenant header name (default `x-tenant-subdomain`) |

\*Required for TypeORM to connect at runtime and for `npm run migration:*` via `src/database/data-source.ts`.

PostgreSQL must provide **`uuid_generate_v4()`** (for example enable the **`uuid-ossp`** extension on the database before running migrations, unless you use Postgres 13+ and have migrated defaults to `gen_random_uuid()` separately).

### 4. Database migrations

Create the database, then run migrations:

```bash
npm run migration:run
```

To revert the last migration:

```bash
npm run migration:revert
```

### 5. Run the API

```bash
# development (watch)
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

The server listens on `http://localhost:3000` unless `PORT` is set.

---

## How tenancy works

Most store-scoped routes expect a **tenant subdomain** so the API knows which store the request targets:

- By default, send header **`x-tenant-subdomain`**: the store’s subdomain (e.g. `acme` for `acme.yourdomain.com` in production).
- `TenantMiddleware` runs globally and syncs tenant context on the request.

Store-user protected routes also use **`StoreUserJwtAuthGuard`** + **`TenantMatchesUserJwtGuard`** so the JWT’s `storeId` matches the resolved store for that subdomain.

---

## Main API areas (high level)

| Area | Path prefix (typical) | Notes |
|------|------------------------|--------|
| Users | `/users` | Register, login (tenant-aware) |
| Stores | `/stores` | Subdomain availability check |
| Links | `/links` | CRUD for store users; public resolve / visit by `accessLink` |
| Link collections | `/link-collections` | Temporary bundles (TTL), share via `accessLink` |
| OTP | `/otp` | Email OTP confirm / resend (registration flow) |
| Admin | `/admin` | Admin login / refresh |

For request body validation, controllers use a shared **`RequestValidationPipe`** (whitelist, class-validator).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Dev server with reload |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app |
| `npm run lint` | ESLint with `--fix` |
| `npm run format` | Prettier on `src/` and `test/` |
| `npm run test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run migration:run` | Apply TypeORM migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:create` | Create empty migration (see `scripts/`) |

---

## Project layout (short)

```
src/
  admins/           # Admin JWT auth
  users/            # Registration + store user login
  stores/           # Store entity helpers
  links/            # Links + public access / visit counters
  link-collections/ # Temporary collections + memberships
  otp/              # OTP for email verification
  store-users/      # Passport JWT for store dashboard
  tenant/           # Subdomain resolution + guards + middleware
  database/         # TypeORM data source + migrations
```

---

## Contributing

1. **Fork** this repository.
2. Create a branch for your change.
3. Run **`npm run lint`** and **`npm run format`** before opening a PR.
4. Open a **pull request** with a short description of what changed and why.

**Issues** are the right place for bug reports, feature requests, or questions about intended behavior. Please search existing issues before opening a new one.

---

## License

See **`package.json`** → `license` field for this repository’s license. If you fork for your own product, ensure compliance with that license and update attribution as required.

---

## Acknowledgements

Built with [NestJS](https://nestjs.com/). Thank you to the NestJS team and community for the framework and documentation.
