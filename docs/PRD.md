# Product Requirements Document
## Rekur — Digital Coffee Loyalty Platform

**Version:** 5.0 · **Author:** Zeyad Amr · **Status:** Shipped — reconciled to code
**Date:** 2026-08-20
**Supersedes:** Rekur_PRD_v4 (Apr 2026), Digital_Loyalty_App_PRD_Final v3 (Mar 2026)

> **What changed vs v4:** v4 described the QR + stamp + dashboard product exactly as built. Since then the code shipped **Apple Wallet passes** (not in any prior PRD) and **dashboard search/sort + per-customer totals**. This version folds those in and flags where docs/schema drifted. Changes are marked **[NEW v5]** or **[DRIFT]**.

| | |
|---|---|
| **Platform** | Mobile Web — Next.js 14, Vercel |
| **Database** | Supabase PostgreSQL (raw `pg`, not Prisma at runtime) |
| **Language** | English |
| **Target market** | Egypt — small single-register coffee shops |
| **Reward rule** | 10 stamps = 1 free coffee (fixed) |

---

## 1. Problem Statement

Coffee shops in Egypt use physical stamp cards. Customers lose them, forget them, or forget to hand them over. Owners get zero data on who their loyal customers are. Rekur replaces the paper card with a QR system: the customer scans a screen at the counter at the moment of purchase — no app download, no cashier involvement — and the owner gets a dashboard with real customer data.

---

## 2. Users

**2.1 Shop owner** — runs a small single-register café in Egypt; uses paper cards or nothing; wants retention data; needs < 5-min non-technical setup; browser on any device.

**2.2 Customer** — regular visitor; won't download an app; smartphone + camera + mobile browser; wants to see how close they are to a free coffee.

---

## 3. How It Works

**3.1 First visit** — order & pay → scan rotating QR on shop screen → browser opens (no app) → enter phone → confirm ("Is this your number? 01XXXXXXXXX", Yes/Edit) → account created + first stamp → progress 1/10.

**3.2 Returning** — scan → phone → confirm → stamp added → progress updated.

**3.3 Reward** — at 10 stamps an animated reward screen appears (can't be faked by screenshot) → customer shows the live screen to cashier → free coffee → reward expires after 7 min, count resets to 0.
> **DECISION:** No redeem button. Reward auto-resets after 7 min. Removes cashier from the flow; the live screen proves it's real; 7 min is enough to be seen without enabling reuse.

**3.4 Owner setup** — sign up (email + password) → create shop (name + optional logo) → system generates unique QR → open `/display-qr/[shopId]` on a counter tablet/screen (live rotating QR) → bookmark `/admin/[shopId]` dashboard.
> **DECISION:** Cashier fully removed from the digital stamp process — customer self-serves at the counter; QR + crypto verify physical presence.

**3.5 Apple Wallet — [NEW v5]** — after a stamp, the success screen offers **Add to Apple Wallet**. The pass shows live stamp progress and updates via push (APNs) as stamps are added. Owners with `walletEnabled` shops can also **scan a customer's wallet pass with the dashboard camera** to add a stamp (`/api/wallet-stamp`). Gives repeat customers a card that lives in their phone without an app.

---

## 4. Security System

**Core challenge:** stop a customer saving the scan URL and stamping from home. Three layers:

**Layer 1 — Rotating signed QR.** The counter QR refreshes every **20 s**. Each URL carries `t` (generation timestamp) and `s` (HMAC-SHA256 signature). On submit the server rejects if the QR is **> 120 s old** ("QR Code Expired…") or the signature is invalid ("Invalid security signature…").
> QR rotates on screen every 20 s but the API allows 120 s to type the number — enough time, small abuse window.

**Layer 2 — 7-minute cooldown.** One stamp per phone per 7 min. Client: `localStorage` device check blocks re-scan before the phone input even loads (across *any* number). Server: `lastScannedAt` check → HTTP 429.
> **DECISION:** 7 min safely exceeds worst-case rush service (30–90 s between customers) without frustrating a real customer.

**Layer 3 — Human fallback.** Cashier is present and can spot obvious abuse.

**Attack vectors:** saved/bookmarked URL → *blocked* (120 s expiry); crafted URL → *blocked* (HMAC); screenshot of QR → *blocked* (20 s rotation); shared number back-to-back → *blocked* (cooldown); friends sharing a number on different days → *accepted* (same as paper cards).

---

## 5. Shop Owner Dashboard `/admin/[shopId]`

Accessed by bookmarked URL. **No login — the `shopId` is the access key.**
> **DECISION (owner intent):** bookmark access, no login. **⚠️ Sell-readiness flag:** this exposes all customer phone numbers to anyone holding the shopId. Fine for a pilot; revisit before charging owners who care about data privacy. See §10 R1.

**5.1 Stats** — Total Customers · Total Stamps (all-time, never resets) · Free Coffees Given · Active Rewards (live pulse).

**5.2 Customer table** — phone · current stamp progress (bar, colored by proximity to reward) · total scans (all-time) · total free coffees per customer · reward status · last visit. **[NEW v5]** search by phone, sort (recent / stamps / scans / rewards), refresh without full reload.

**5.3 Manual stamp** — owner types any phone → adds a stamp, bypassing QR + cooldown. For when the customer can't scan.

**5.4 Shop logo** — upload PNG/JPG/SVG ≤ 2 MB (Supabase Storage `shop-logos`); shown on dashboard, scan page, live QR display, and as the stamp mark.
> **[DRIFT]** v3 PRD said "no branding for MVP." Logo/white-label shipped anyway. v5 adopts it as in-scope.

**5.5 Live QR display** — `/display-qr/[shopId]`, QR auto-refreshes every 20 s, shows shop name + logo. The screen customers scan.

**5.6 Print QR poster** — `/print-qr/[shopId]`, static A4. **No `t`/`s`** → scanning it does NOT stamp. Wayfinding only; stamping requires the live display.

**5.7 Apple Wallet scanner — [NEW v5]** — when `walletEnabled`, a dashboard camera (`@zxing/browser`) scans a customer's wallet pass and adds a stamp.

---

## 6. Error States

| Scenario | Cause | User sees |
|---|---|---|
| Invalid link | URL missing `t`/`s` | "Invalid Link" on client, no API call |
| Expired QR | timestamp > 120 s | "QR Code Expired. Please scan the refreshing code…" |
| Invalid signature | tampered URL | "Invalid security signature. Please rescan." |
| Cooldown (device) | same device < 7 min | Cooldown screen before phone input, no API call |
| Cooldown (server) | same phone < 7 min | HTTP 429 → cooldown screen |
| Invalid phone | not `01X`+9 digits | Validation error before submit (client + server) |
| Shop not found | bad shopCode/shopId | HTTP 404 → error screen |
| Server error | unhandled exception | HTTP 500 → friendly screen + Try Again |

---

## 7. Data Model

`Shop`, `Customer`, `Stamp` — all `TEXT` PKs via `nanoid()`, set explicitly on INSERT. Postgres via `pg` Pool.

**[DRIFT] — reconcile `CLAUDE.md` schema.** Columns in use but missing from the documented schema: `Shop.logoUrl`, `Shop.walletEnabled`, `Stamp.totalScans`, `Stamp.totalRewards`. Wallet passes also imply per-pass serial + device push-token storage — confirm where APNs registration state lives.

---

## 8. Scope

**In scope (shipped):** per-shop QR · mobile web · phone entry + confirm · stamp counter · rotating signed QR + 7-min cooldown · animated reward + auto-reset · live QR display · print poster · dashboard (stats, customer table w/ search+sort, manual stamp) · shop logo · friendly error screens · **Apple Wallet passes + wallet scan [NEW v5]** · fixed 10-stamp rule.

**Out of scope (post-MVP):** OTP · native app · configurable reward rules · multi-register / multi-branch · Google Wallet · Arabic · payment integration · account management (edit/delete shop) · advanced analytics · push marketing.

---

## 9. Success Metrics

Owner activation (setup done + live QR at counter) · Customer adoption (10+ unique phones in 2 weeks at pilot) · Full loop (≥1 customer hits 10 + shows reward) · Retention (50%+ return for a 2nd scan within 2 weeks) · Security (zero stamps from expired/invalid QR) · Manual-stamp rate < 10% · Zero stamp data loss. **[NEW v5]** Wallet adoption (% of stampers who add the pass).

---

## 10. Known Risks & Debt (sell-readiness)

| ID | Risk | Sev | Note |
|---|---|---|---|
| **R1** | Public admin exposes all customer phones | High | Owner *decision* (§5), but a privacy liability before charging. Add optional owner-auth gate. |
| **R2** | Secrets in repo — DB password in `.env`, `.env.local`, plaintext in `CLAUDE.md` | High | Rotate + purge from git history before any handover/sale. |
| **R3** | Three fighting color systems (see `DESIGN-AUDIT.md`) | High | Fragile theme; consolidate to tokens. |
| **R4** | Egypt-only phone rule blocks other markets | Med | Externalize to per-shop country config. |
| **R5** | Reward has no redeem token — same live screen could be shown twice within 7 min | Med | Accepted per §3.3; add one-time token if fraud appears. |
| **R6** | Branding split: package `coffe`, `CLAUDE.md` says "Brew" + dead dark theme | Low | Finish Rekur rebrand; reconcile docs. |
| **R7** | Wallet/APNs infra (certs, push tokens) undocumented | Med | Document cert + token lifecycle for maintainability. |

---

## 11. Open Questions

1. Pricing — flat monthly per shop, or free + paid tiers?
2. Does admin stay bookmark-only for paying owners, or add login day one (R1)?
3. Which market ships first — must phone validation generalize before launch (R4)?
4. Google Wallet parity needed for Android-heavy Egypt market?

---
*v5.0 — reconciles shipped code (Apple Wallet, dashboard search/sort) with PRD v4. `[NEW v5]` = shipped since v4; `[DRIFT]` = code/docs out of sync.*
</content>
