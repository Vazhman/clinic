-- Stale NOT NULL fix: home_page_hero_slides.image_id
--
-- The hero-slide `image` field is OPTIONAL in code (HomePage.ts heroSlides has
-- no `required:true`, and HeroSection falls back to a default image when a slide
-- has none). But the column kept its old NOT NULL constraint, so ADDING a hero
-- slide WITHOUT an image 500s ("Something went wrong") — the client couldn't add
-- text-only carousel slides. Dropping NOT NULL matches the code.
--
-- Additive/idempotent (DROP NOT NULL on a nullable column is a no-op).
ALTER TABLE "home_page_hero_slides" ALTER COLUMN "image_id" DROP NOT NULL;
