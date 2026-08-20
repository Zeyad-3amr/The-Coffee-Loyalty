# Rekur — Product Design Audit

**Reviewer:** acting product designer
**Date:** 2026-08-20
**Scope:** front-end of every user-facing surface + the design system underneath it.

**Verdict:** The *visual* design is genuinely good — warm, premium, coherent brand feel. The **system** underneath it is broken in a way that will bite every future change. Fix the foundation before adding screens.

---

## 1. The core problem — three color systems fighting

The app is cream/latte on screen, but that look is produced by **three stacked, contradictory layers**:

1. **`tailwind.config.ts`** remaps the whole `stone` palette to *espresso darks* — `stone-950 = #150e09`, `stone-100 = #f3ece3`. So markup written as "dark" (`bg-stone-950`, `text-stone-100`) already means espresso-on-cream.
2. **`globals.css` "V2" block** then *re-overrides* those same classes with `!important` attribute selectors (`[class*="bg-stone-9"] → #f1e6d3`, `[class*="text-stone-1"] → #3a2616`, etc.), forcing cream a second time.
3. **Newer screens** (admin dashboard, reward + cooldown states) ignore both and hardcode hex: `#fbf3e7`, `#e7d3b8`, `#fffaf2`, `#1c1410`.

**Why it's bad:**
- Any new `stone-800` div gets silently repainted by a wildcard `[class*="bg-stone-8"]` rule — you can't trust a class to do what it says.
- `<html class="dark">` is still set, and `CLAUDE.md` documents a "dark glass-morphism" theme that **no longer exists**. New contributors will build for the wrong theme.
- `.glass-card` is defined twice — once as dark frosted glass, then overridden to opaque cream. The "glass" is gone; the name lies.
- Two source-of-truth for the same cream (`#fbf3e7` hex vs. the `stone` remap) drift apart over time.

**Fix (one theme, tokens, no `!important`):**
- Pick cream as *the* theme. Define semantic tokens in `tailwind.config` — `bg`, `surface`, `surface-raised`, `text`, `text-muted`, `border`, `accent` — mapped to the real hex once.
- Delete the entire `globals.css` V2 override block and the `stone` remap.
- Rewrite markup to semantic classes (`bg-surface`, `text-muted`) instead of `stone-*`.
- Drop `class="dark"`. Update `CLAUDE.md` design section.
- Result: a class means what it says; a redesign is a token edit, not a selector war.

---

## 2. Surface-by-surface notes

### Landing `/` — **strong**
- Hero, feature grid, "how it works", CTA band, footer — good rhythm and hierarchy. Sellable as-is.
- Nits: still uses dark-gradient text (`from-stone-100 via-stone-300 to-stone-600`) neutralized by an override — brittle. Emoji feature icons (🎯📱📈) read cheaper than the rest of the premium styling; swap for the line-icon set already used in the dashboard.
- Copy is benefit-led and clean. Good.

### Auth `/auth` — **good, minor gaps**
- Clean tabbed login/signup. Solid.
- Missing: no "forgot password", no inline password rules, no show/password toggle. Signup asks to "check email" but there's no resend path. Add before onboarding real owners.

### Setup `/setup` — good pattern (create → QR display). Confirm the QR-display state gives clear "print / open live display / go to dashboard" next steps.

### Customer scan `/scan/[shopCode]` — **the money screen, mixed**
- Reward + cooldown states (explicit-hex cream, line-art coffee, countdown) are the **best-designed screens in the app** — calm, premium, confident. This is the bar.
- Input + confirm + success states are still written dark (`bg-stone-950/80`, `text-stone-100`, glass-card) and only look right *because* of the override hack. They read visually busier than the reward screen — heavy glows, `drop-shadow` amber text, `bg-clip-text` gradients. Bring them down to the reward screen's restraint.
- Success stamp grid is nice (logo fills the stamp). Keep.
- **Consistency gap:** two design languages in one flow — legacy-dark-overridden (input/confirm/success) vs. clean-hex (reward/cooldown). Unify on the latter.

### Dashboard `/admin/[shopId]` — **excellent**
- This is a designer's dashboard: semantic stat tints, progress bars colored by proximity to reward, live pulse on active rewards, empty states, search/sort/refresh, sticky header. Genuinely good product work.
- Nits: 6-column table will crowd on small screens (has `overflow-x-auto` — acceptable). Consider a per-customer detail drawer later.
- This screen proves the team *can* build the clean system — it just hasn't been back-ported to the rest.

---

## 3. Consistency scorecard

| Dimension | State |
|---|---|
| Brand palette (warm cream + amber) | ✅ consistent look |
| **Implementation of that palette** | ❌ 3 conflicting systems |
| Iconography | ⚠️ line-icons (dashboard) vs. emoji (landing/scan) |
| Component reuse | ⚠️ `glass-card` semantics broken; buttons re-styled per screen |
| Screen-to-screen polish | ⚠️ reward/dashboard >> input/confirm/success |
| Mobile-first | ✅ scan flow; ✅ dashboard scrolls |
| Accessibility | ⚠️ amber-on-cream contrast of muted text (`#9a8160`) is borderline; verify AA |

---

## 4. Prioritized design work

**P0 — before selling**
1. Collapse to one token-based theme; delete override hack + stone remap (§1).
2. Back-port reward-screen restraint to scan input/confirm/success.
3. Update `CLAUDE.md` design section to match reality.

**P1**
4. Replace emoji icons with the line-icon set for one visual language.
5. Standardize buttons/inputs into shared components (`Button`, `Input`, `Card`, `StatCard`).
6. Auth: forgot-password + password toggle.

**P2**
7. Contrast pass for AA on muted text.
8. Dashboard per-customer detail view.
9. Motion consistency (one easing/duration scale).

---

## 5. Bottom line

The product **looks** like something you can sell — the dashboard and reward screen are legitimately premium. What's not sellable yet is the **code behind the paint**: a theme held together by `!important` wildcards over a palette that was inverted twice. A buyer's engineer will open `globals.css` and lose confidence. Two focused days consolidating the theme and unifying the scan flow raise both the polish *and* the perceived engineering quality.
</content>
