/**
 * Theme / brand-color engine.
 *
 * Rekur ships one honest cream theme. The ACCENT ("brand") color is driven by
 * CSS custom properties `--brand-50 … --brand-950` (space-separated RGB
 * triples so Tailwind alpha modifiers keep working, e.g. `bg-amber-500/20`).
 *
 * Each shop can override its accent with a single hex color. From that one hex
 * we derive the full 50–950 ramp by mixing toward white (tints) and black
 * (shades), then emit the CSS variables that repaint every `amber-*` /
 * `brand-*` utility on that shop's customer-facing pages.
 */

export const DEFAULT_BRAND_HEX = '#f59e0b'; // Rekur amber (amber-500)

// Customer-page background + on-background text ("white or black") are also
// per-shop. Background is any hex; text is a mode that picks a readable ink.
export const DEFAULT_BG_HEX = '#e7d3b8'; // Rekur cream
export type TextMode = 'dark' | 'light';
export const INK_FOR: Record<TextMode, string> = { dark: '#231811', light: '#ffffff' };

export function normalizeTextMode(v?: string | null): TextMode {
  return v === 'light' ? 'light' : 'dark';
}

/** Emit `--page-bg` / `--page-ink` for a shop's customer-facing pages. */
export function pageCssVars(bg?: string | null, textMode?: string | null): string {
  const b = bg && isValidHex(bg) ? bg : DEFAULT_BG_HEX;
  const ink = INK_FOR[normalizeTextMode(textMode)];
  return `--page-bg:${b};--page-ink:${ink};`;
}

const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, '0')).join('');

// Mix a base rgb toward white (255) or black (0) by amount t → hex.
function shift(base: RGB, toward: 0 | 255, t: number): string {
  return toHex(mix(base.r, toward, t), mix(base.g, toward, t), mix(base.b, toward, t));
}

/**
 * Derive a full card surface set from the page background + text mode, so the
 * scan card themes coherently with the page (real light OR dark card).
 * Emits: --card-bg, --card-inset, --card-input, --card-ink, --card-ink-muted, --card-border.
 */
export interface CardColors {
  bg: string; inset: string; input: string;
  ink: string; inkMuted: string; border: string;
}

export function deriveCardColors(bg?: string | null, textMode?: string | null): CardColors {
  const base = (bg && parseHex(bg)) || parseHex(DEFAULT_BG_HEX)!;
  const mode = normalizeTextMode(textMode);
  if (mode === 'light') {
    // Dark theme: lift the surface off a dark page, light ink.
    return {
      bg: shift(base, 255, 0.12),
      inset: shift(base, 0, 0.16),
      input: shift(base, 0, 0.22),
      ink: '#ffffff',
      inkMuted: 'rgba(255,255,255,0.64)',
      border: 'rgba(255,255,255,0.13)',
    };
  }
  // Light theme: a cleaner/lighter surface over a tinted page, espresso ink.
  return {
    bg: shift(base, 255, 0.58),
    inset: shift(base, 255, 0.42),
    input: shift(base, 255, 0.74),
    ink: '#231811',
    inkMuted: 'rgba(35,24,17,0.60)',
    border: 'rgba(35,24,17,0.14)',
  };
}

export function cardCssVars(bg?: string | null, textMode?: string | null): string {
  const c = deriveCardColors(bg, textMode);
  return `--card-bg:${c.bg};--card-inset:${c.inset};--card-input:${c.input};--card-ink:${c.ink};--card-ink-muted:${c.inkMuted};--card-border:${c.border};`;
}

// Rekur's default amber ramp, as "r g b" triples. Seeds :root in globals.css.
export const DEFAULT_BRAND_RAMP: Record<number, string> = {
  50: '255 251 235',
  100: '254 243 199',
  200: '253 230 138',
  300: '252 211 77',
  400: '251 191 36',
  500: '245 158 11',
  600: '217 119 6',
  700: '180 83 9',
  800: '146 64 14',
  900: '120 53 15',
  950: '69 26 3',
};

// How far each step mixes toward white (tints) or black (shades). 500 = base.
const MIX: Record<number, { toward: 'white' | 'black' | 'base'; amount: number }> = {
  50: { toward: 'white', amount: 0.92 },
  100: { toward: 'white', amount: 0.82 },
  200: { toward: 'white', amount: 0.62 },
  300: { toward: 'white', amount: 0.40 },
  400: { toward: 'white', amount: 0.18 },
  500: { toward: 'base', amount: 0 },
  600: { toward: 'black', amount: 0.14 },
  700: { toward: 'black', amount: 0.28 },
  800: { toward: 'black', amount: 0.42 },
  900: { toward: 'black', amount: 0.54 },
  950: { toward: 'black', amount: 0.72 },
};

type RGB = { r: number; g: number; b: number };

/** Parse #rgb / #rrggbb → {r,g,b}. Returns null on anything invalid. */
export function parseHex(hex: string): RGB | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** True if `hex` is a usable color string. */
export function isValidHex(hex: string): boolean {
  return parseHex(hex) !== null;
}

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Derive the full 50–950 ramp (as "r g b" triples) from one base hex. */
export function deriveBrandRamp(baseHex: string): Record<number, string> {
  const base = parseHex(baseHex);
  if (!base) return DEFAULT_BRAND_RAMP;

  const ramp: Record<number, string> = {};
  for (const step of Object.keys(MIX).map(Number)) {
    const { toward, amount } = MIX[step];
    let { r, g, b } = base;
    if (toward === 'white') {
      r = mix(base.r, 255, amount);
      g = mix(base.g, 255, amount);
      b = mix(base.b, 255, amount);
    } else if (toward === 'black') {
      r = mix(base.r, 0, amount);
      g = mix(base.g, 0, amount);
      b = mix(base.b, 0, amount);
    }
    ramp[step] = `${clamp(r)} ${clamp(g)} ${clamp(b)}`;
  }
  return ramp;
}

/** Emit the `--brand-*` CSS declarations for a shop's accent (or default). */
export function brandCssVars(baseHex?: string | null): string {
  const ramp = baseHex && isValidHex(baseHex) ? deriveBrandRamp(baseHex) : DEFAULT_BRAND_RAMP;
  return Object.entries(ramp)
    .map(([step, triple]) => `--brand-${step}:${triple};`)
    .join('');
}
