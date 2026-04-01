# Brew — Digital Coffee Loyalty App

## Project Overview
A digital coffee loyalty card system for independent coffee shops. Customers scan a QR code at the shop, enter their phone number, and collect stamps. After 10 stamps they get a free coffee (shown as an animation). No app required for customers.

## Tech Stack
- **Next.js 14** App Router, TypeScript
- **Supabase PostgreSQL** — direct connection via `pg` library (NOT Prisma at runtime)
- **Supabase Auth** — email/password auth for shop owners
- **Tailwind CSS 3.4** — dark mode (`class="dark"` on html), glass-morphism design
- **nanoid** — ID generation
- **qrcode.react** — QR code rendering (`QRCodeSVG` named export, not default)
- **html-to-image** — QR download

## Environment Variables
Required in `.env.local` and Vercel:
```
DATABASE_URL=postgresql://postgres:TheCoffeeLoyaltyProgram@db.emiewbjigecpdvkrften.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://emiewbjigecpdvkrften.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase Dashboard → Settings → API>
```

## Database Schema (PostgreSQL via Supabase)

```sql
-- Shop owners' shops
CREATE TABLE "Shop" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "qrCode" TEXT NOT NULL UNIQUE,
  "userId" TEXT,           -- Supabase auth user ID (nullable for old records)
  "createdAt" TIMESTAMP NOT NULL
);

-- Customers identified by phone number
CREATE TABLE "Customer" (
  id TEXT PRIMARY KEY,     -- nanoid generated, must be included in INSERT
  "phoneNumber" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL
);

-- Stamp records (one per customer per shop)
CREATE TABLE "Stamp" (
  id TEXT PRIMARY KEY,     -- nanoid generated
  "shopId" TEXT NOT NULL REFERENCES "Shop"(id),
  "customerId" TEXT NOT NULL REFERENCES "Customer"(id),
  "stampCount" INTEGER NOT NULL DEFAULT 0,
  "lastScannedAt" TIMESTAMP,
  "rewardActive" BOOLEAN DEFAULT false,
  "rewardExpiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL
);
```

**CRITICAL**: All tables use `TEXT` primary keys generated with `nanoid()`. The `id` field must always be explicitly included in INSERT statements — it does NOT auto-generate in the DB.

## Business Logic
- **Egypt phone validation**: must match `/^01[0-9]{9}$/` (01 + 9 digits, 11 total)
- **Stamp cooldown**: 7 minutes between scans per customer per shop
- **Reward**: at 10 stamps → reward activated, expires in 7 minutes → shown as animation only (no DB redemption tracking needed)
- **Admin access**: via bookmarked URL `/admin/[shopId]` — no auth required to view dashboard
- **Shop ownership**: tied to Supabase Auth user ID stored in `Shop.userId`

## Architecture Notes

### DB Connection
Uses `pg` Pool directly (not Prisma) for serverless compatibility on Vercel. See `app/lib/db.ts`. The `prisma` package is in devDependencies only (legacy, not used at runtime). The build script still runs `prisma generate` — this is harmless but could be removed.

### Auth Flow
1. Owner signs up/logs in at `/auth` using Supabase email/password auth
2. Client gets a session with `access_token`
3. Protected API routes (`/api/setup`, `/api/my-shops`) require `Authorization: Bearer <token>` header
4. Server verifies token via `supabase.auth.getUser(token)` in `app/lib/auth-helpers.ts`
5. Admin dashboard (`/admin/[shopId]`) is intentionally unprotected — accessed via bookmark

### Navbar Visibility
`NavbarWrapper` (client component) hides the navbar on `/admin/*` and `/print-qr/*` routes. These pages have their own minimal headers. The `h-20` spacer is inside `NavbarWrapper` so admin pages have no extra top padding.

## Key Files

| File | Purpose |
|------|---------|
| `app/lib/db.ts` | pg Pool, `query()` and `getClient()` helpers |
| `app/lib/auth-helpers.ts` | `getUserIdFromRequest()` — verifies Bearer token server-side |
| `app/lib/supabase-client.ts` | Client-side Supabase instance (auth) |
| `app/lib/utils.ts` | `validateEgyptPhoneNumber()`, `formatPhoneNumber()` |
| `app/components/Navbar.tsx` | Top nav with auth state (login/logout) |
| `app/components/NavbarWrapper.tsx` | Conditionally hides navbar on owner pages |
| `app/components/ErrorDisplay.tsx` | Reusable error UI component |
| `app/auth/page.tsx` | Login + signup (tabbed, single page) |
| `app/setup/page.tsx` | Create new shop (requires auth) |
| `app/my-shops/page.tsx` | Lists all owner's shops (fetched from DB by userId) |
| `app/admin/[shopId]/page.tsx` | Admin dashboard — stats, manual stamp, customer table |
| `app/scan/[shopCode]/page.tsx` | Customer-facing stamp collection page |
| `app/print-qr/[shopId]/page.tsx` | Printable A4 QR poster |
| `app/api/setup/route.ts` | POST — create shop (auth required) |
| `app/api/stamp/route.ts` | POST — add stamp with 7-min cooldown |
| `app/api/manual-stamp/route.ts` | POST — add stamp without cooldown (admin use) |
| `app/api/admin/[shopId]/route.ts` | GET — shop stats + customer list |
| `app/api/my-shops/route.ts` | GET — list shops by userId (auth required) |

## UI Design System
- **Theme**: Dark, premium glass-morphism. `html` has `class="dark"`.
- **Base color**: `stone-950` background
- **Accent**: `amber-500` / `amber-400`
- **Custom classes** (in `globals.css`):
  - `glass-card` — frosted glass card base
  - `glass-card-hover` — adds hover effects to glass-card
  - `btn-amber` — primary amber gradient button
  - `btn-amber-outlined` — outlined variant
  - `animate-fadeUp` + `stagger-delay-1..5` — entrance animations

## Pages & Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing page | Public |
| `/auth` | Login / Sign up | Public (redirects if already logged in) |
| `/setup` | Create new shop | Required → redirects to /auth |
| `/my-shops` | Owner's shop list | Required → redirects to /auth |
| `/admin/[shopId]` | Shop dashboard | None (bookmark access) |
| `/scan/[shopCode]` | Customer stamp page | None |
| `/print-qr/[shopId]` | Printable QR poster | None |
| `/scan` | Info page for customers | None |

## Known Issues / Past Bugs Fixed
1. **`dark` in @apply** — `@apply dark` is invalid Tailwind; dark mode is set via `class="dark"` on `<html>` in layout.tsx
2. **Customer INSERT missing id** — `Customer` table requires explicit `id` in INSERT (nanoid); missing it caused null constraint violation
3. **Prisma serverless** — switched to raw `pg` library; Prisma is only in devDeps for schema tooling
4. **QRCode import** — use `import { QRCodeSVG } from 'qrcode.react'` (named export, not default)

## Pending / Not Yet Done
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables (user needs to do this manually from Supabase Dashboard)
- Run DB migration: `ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "userId" TEXT;`
- Existing shops in DB (created before auth) have `userId = NULL` and won't appear in My Shops
