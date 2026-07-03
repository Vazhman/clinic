# Icons & Social Image TODOs

## favicon.ico
The current `public/favicon.ico` is a direct copy of `public/images/logo-icon.png`
(PNG bytes inside an `.ico` extension). Browsers tolerate this, but it is not
strictly correct ICO format. ImageMagick was not available on the build host
when this was generated.

**TODO:** Generate a proper multi-size `.ico` (16x16, 32x32, 48x48) once
ImageMagick or an equivalent tool is available. Example:

```bash
magick public/images/logo-icon.png -define icon:auto-resize=16,32,48 public/favicon.ico
```

## icon.png / apple-icon.png
These are also straight copies of `logo-icon.png`. They work, but ideal sizes are:
- `icon.png` — 512x512 (or 192x192 for PWA)
- `apple-icon.png` — 180x180

**TODO:** Resize to exact target dimensions when tooling is available.

## opengraph-image.png / twitter-image.png
These are placeholder copies of `logo-icon.png`. Social platforms expect
proper share images.

**TODO:** Replace with proper 1200x630 social-share images (branded, with
clinic name + tagline). Twitter prefers 1200x600 or 1200x675; 1200x630 is
acceptable for both Open Graph and Twitter cards.
