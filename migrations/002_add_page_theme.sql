-- Per-shop customer-page theming: background color (hex) + text mode ('dark'|'light').
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "bgColor" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "textColor" TEXT;
