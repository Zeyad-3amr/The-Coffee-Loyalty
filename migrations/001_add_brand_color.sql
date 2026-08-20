-- Per-shop configurable accent color (hex, nullable → defaults to Rekur amber).
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "brandColor" TEXT;
