import { brandCssVars } from '@/app/lib/theme';

/**
 * Repaints the accent color for a shop's customer-facing page.
 *
 * Renders a <style> that overrides the `--brand-*` CSS variables on :root,
 * so every `amber-*` / `brand-*` utility on the page becomes the shop's
 * chosen color. Renders nothing when the shop has no custom color (the
 * default Rekur amber from globals.css applies).
 *
 * Usage: <BrandVars color={shop.brandColor} /> near the top of the page.
 */
export function BrandVars({ color }: { color?: string | null }) {
  if (!color) return null;
  return (
    <style
      // Scoped to :root; these pages are single-shop, full-page branded.
      dangerouslySetInnerHTML={{ __html: `:root{${brandCssVars(color)}}` }}
    />
  );
}
