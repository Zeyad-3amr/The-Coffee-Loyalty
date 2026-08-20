# Rekur — Digital Coffee Loyalty App

> **Product name is Rekur.** The repo/package is still named `coffe` and older docs said "Brew" — rebrand is in progress. Business goal: harden this to **sell / hand off**, so sell-readiness > new features.
>
> **Living docs — keep these current every session:** [`docs/PRD.md`](docs/PRD.md) (canonical, v5, reconciled to code), [`docs/DESIGN-AUDIT.md`](docs/DESIGN-AUDIT.md). Source PRDs live in `~/Downloads` (Rekur_PRD_v4 is the human-authored canonical). When behavior changes, update this file + the PRD.

## Project Overview
A digital coffee loyalty card system for independent coffee shops. Customers scan a QR code at the shop, enter their phone number, and collect stamps. After 10 stamps they get a free coffee (shown as an on-screen reward the cashier honors). No app required for customers. Owners get a dashboard and an optional **Apple Wallet** pass for customers.

## Tech Stack
- **Next.js 14** App Router, TypeScript
- **Supabase PostgreSQL** — direct connection via `pg` library (NOT Prisma at runtime)
- **Supabase Auth** — email/password auth for shop owners
- **Supabase Storage** — shop logos (`shop-logos` bucket)
- **Tailwind CSS 3.4** — single warm **cream** theme, token-driven (see Theming). `class="dark"` is still on `<html>` but the design is light cream, not dark.
- **passkit-generator** + **@parse/node-apn** — Apple Wallet passes + APNs push updates
- **@zxing/browser** — camera scanning of wallet passes (admin)
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
| `app/lib/theme.ts` | Brand-color engine: `deriveBrandRamp()`, `brandCssVars()`, `isValidHex()`, `DEFAULT_BRAND_HEX` |
| `app/components/BrandVars.tsx` | Injects a shop's `--brand-*` vars (server-render accent override) |
| `app/components/Navbar.tsx` | Top nav with auth state (login/logout) |
| `app/components/NavbarWrapper.tsx` | Conditionally hides navbar on owner pages |
| `app/components/ErrorDisplay.tsx` | Reusable error UI component |
| `app/auth/page.tsx` | Login + signup (tabbed, single page) |
| `app/setup/page.tsx` | Create new shop (requires auth) |
| `app/my-shops/page.tsx` | Lists all owner's shops (fetched from DB by userId) |
| `app/admin/[shopId]/page.tsx` | Admin dashboard — stats, manual stamp, Appearance panel (accent + background + text with live preview), and the customer table (segmented stamp meter, smart status badges New/Regular/Building/Almost/Reward-ready, per-row +1 stamp + ⋯ menu, click-row detail drawer, custom sort dropdown) |
| `app/scan/[shopCode]/page.tsx` | Customer-facing stamp collection page |
| `app/print-qr/[shopId]/page.tsx` | Printable A4 QR poster |
| `app/api/setup/route.ts` | POST — create shop (auth required) |
| `app/api/stamp/route.ts` | POST — add stamp with 7-min cooldown |
| `app/api/manual-stamp/route.ts` | POST — add stamp without cooldown (admin use) |
| `app/api/admin/[shopId]/route.ts` | GET — shop stats + customer list |
| `app/api/my-shops/route.ts` | GET — list shops by userId (auth required) |

## Theming (IMPORTANT — read before touching colors)

The app is a single **warm cream** theme with **amber** as the accent. There is an
in-progress consolidation from an old fragile setup. Current state:

### Accent color = CSS variables (per-shop configurable) ✅ DONE
- The accent is driven by `--brand-50 … --brand-950` CSS vars (space-separated RGB
  triples), seeded to Rekur amber in `globals.css :root`.
- In `tailwind.config.ts`, **both `amber` and `brand` color scales map to those vars**
  (`rgb(var(--brand-N) / <alpha-value>)`). So every existing `amber-*` utility IS the
  shop's brand color — alpha modifiers (`bg-amber-500/20`) still work.
- **Per-shop override:** each `Shop` has a `brandColor` hex. `app/lib/theme.ts`
  (`deriveBrandRamp`) derives the full 50–950 ramp from that one hex. Customer pages
  (`scan/[shopCode]`, `display-qr/[shopId]`) and the admin dashboard apply it by setting
  the `--brand-*` vars (via a `useEffect`, or `<BrandVars>` for server render). Default =
  Rekur amber when `brandColor` is null.
### Customer-page background + text + CARD theming (per-shop) ✅ DONE
- `Shop.bgColor` (hex) + `Shop.textColor` ('dark'|'light') drive `--page-bg` / `--page-ink`
  and a derived **card** surface set (`--card-bg/-inset/-input/-ink/-ink-muted/-border`).
- `deriveCardColors()` / `cardCssVars()` in `theme.ts` mix the bg toward white/black by text mode
  → coherent light OR dark card. Applied on scan (+ display) via `useEffect`.
- globals.css: `.scan-cream` paints `--page-bg`; `.on-page` uses `--page-ink`; a scoped
  `.scan-cream` block maps `.glass-card` + `stone-*` classes + inputs to the `--card-*` vars
  (higher specificity than the legacy V2 cream overrides).
- NOTE: verified in a real browser, not the in-app preview pane (that pane mis-resolves `var()`
  in some grouped `!important` rules and can't screenshot).

### Owner controls
- Dashboard **Appearance** section: accent + background pickers (native + hex + presets) and a
  Dark/Light text toggle, with a **live preview** of the customer scan page. Saves all three via
  `PATCH /api/shop/[shopId]`.

### Neutrals = semantic tokens (migration IN PROGRESS ⚠️)
- Target tokens (in `globals.css :root`, exposed in tailwind): `bg`, `surface`,
  `surface-2`, `surface-input`, `ink`, `ink-muted`, `ink-subtle`, `line`.
  **Prefer these** (`bg-surface`, `text-ink`, `border-line/10`) in new/migrated code.
- **LEGACY still present:** `tailwind.config.ts` remaps the `stone` scale to warm
  espresso, AND `globals.css` has a big `!important` "V2" override block that recolors
  `stone-*`/`white-*` classes to cream. These make legacy screens (landing, auth, scan
  input/confirm/success, my-shops, setup, navbar, sidebar) render cream. **They are being
  migrated to the semantic tokens screen-by-screen; once every screen is migrated, delete
  the override block and the stone remap.** Until then, `stone-*` means opposite things in
  different files — do not trust it; migrate the screen you touch.
- Migration checklist lives in `docs/DESIGN-AUDIT.md`.

### Custom classes (`globals.css`)
- `glass-card` / `glass-card-hover` — despite the name, now **opaque cream** cards (the
  original glass look was overridden). Consider renaming to `card` on migration.
- `btn-amber` / `btn-amber-outlined` — primary amber (now brand) buttons.
- `animate-fadeUp` + `stagger-delay-1..5` — entrance animations.

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

## Migrations
Raw SQL in `migrations/` (no ORM). Run them in the **Supabase SQL editor** (this dev
machine's network can't reach the DB — corporate DNS captive-resolves Supabase hosts).
- `001_add_brand_color.sql` — `Shop.brandColor` (accent hex). **✅ Applied in prod 2026-08-20.**
- `002_add_page_theme.sql` — `Shop.bgColor` (page background hex) + `Shop.textColor` ('dark'|'light').
  **✅ Applied in prod 2026-08-20.**
- GET routes catch PG error `42703` and fall back if a column is missing, so the app never breaks pre-migration.

## Schema drift to reconcile
The schema block above predates several shipped columns. Actually in use:
`Shop.logoUrl`, `Shop.walletEnabled`, `Shop.brandColor`, `Stamp.totalScans`, `Stamp.totalRewards`.
Update the schema block when convenient.

## Pending / Not Yet Done
- Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables (manual, from Supabase Dashboard).
- Run legacy migration: `ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "userId" TEXT;`
- Existing shops created before auth have `userId = NULL` and won't appear in My Shops.
- **Theme migration:** move legacy screens off `stone-*` to semantic tokens, then delete the `globals.css` V2 override block + `stone` remap (see Theming).
- **Sell blockers** (see `docs/PRD.md` §10): gate `/admin/[shopId]` behind owner auth; rotate + purge committed secrets.
