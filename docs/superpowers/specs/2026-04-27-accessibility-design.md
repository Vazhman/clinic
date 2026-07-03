# Accessibility System Design — Khozrevanidze Clinic

## Overview

Comprehensive accessibility system for the clinic website covering all disability types. Two-layer architecture: invisible structural WCAG AA compliance + an interactive accessibility enhancement panel with built-in text-to-speech.

**Goal:** Make the clinic website usable by everyone — blind, low vision, color blind, dyslexic, motor impaired, cognitive, elderly — without changing the visual design for typical users.

---

## Layer 1 — Structural Accessibility (Invisible)

All changes are code-only with zero visual impact on the existing design.

### Skip Navigation

- Hidden link at top of page: "Skip to main content" (translated per locale)
- Visible only on keyboard Tab press (uses `sr-only` + `:focus` override)
- Links to `#main-content` on the `<main>` element

### Semantic HTML Fixes

- Blog posts and news items wrapped in `<article>`
- Doctor cards wrapped in `<article>`
- Service listings use proper heading hierarchy (h1 > h2 > h3, no skips)
- Breadcrumbs get `aria-current="page"` on active item

### ARIA for Dynamic Components

| Component | ARIA additions |
|-----------|---------------|
| Accordion/FAQ | `aria-expanded`, `aria-controls`, `role="region"`, unique `id` on panels |
| Booking wizard | `aria-live="polite"` region announcing step changes |
| HeroSlider | `role="region"`, `aria-roledescription="carousel"`, `aria-label` per slide |
| Doctors filter | `aria-live="polite"` announcing result count changes |

### Form Accessibility

- All inputs get `id` + matching `htmlFor` on labels
- Required fields: `aria-required="true"`
- Error states: `aria-invalid="true"` + `aria-describedby` pointing to error message element
- Citizenship radio group: wrapped in `<fieldset>` + `<legend>`

### Focus Management

- Visible focus ring (2px solid brand pink) on `:focus-visible` only (keyboard users see it, mouse users don't)
- Focus trapped inside mobile menu when open
- Focus trapped inside accessibility panel when open
- Focus restored to trigger element when panel/menu closes

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Applied in `globals.css`. Framer Motion components also check `prefers-reduced-motion` and skip animations.

---

## Layer 2 — Accessibility Enhancement Panel

### Trigger Button

- Small ♿ icon button in the header, positioned between language switcher and mobile menu toggle
- Matches existing header button styling (same size, hover behavior)
- Tooltip: "Accessibility Settings" (translated per locale)
- `aria-label` and `aria-expanded` attributes

### Panel Behavior

- Slides out from the right side (drawer pattern), overlays the page
- ~320px wide on desktop, full-width on mobile
- Backdrop dimming behind (click outside or Esc to close)
- Focus trapped inside panel while open
- Respects `prefers-reduced-motion` for open/close animation
- Fully keyboard navigable

### Panel Contents

```
┌─────────────────────────────────────┐
│  ♿ Accessibility Settings     ✕    │
├─────────────────────────────────────┤
│                                     │
│  🔊 Read Aloud                      │
│  Speed: [ Slow | Normal | Fast ]    │
│                                     │
│  🔤 Font Size                       │
│  [ A- ]  [ A ]  [ A+ ]  [ A++ ]    │
│                                     │
│  🌗 Contrast                        │
│  [ Normal ] [ High ] [ Inverted ]   │
│                                     │
│  📖 Dyslexia-Friendly Font          │
│  [ toggle ]                         │
│                                     │
│  ↕️ Content Spacing                  │
│  Line height: [ slider ]            │
│  Letter spacing: [ slider ]         │
│                                     │
│  🎬 Animations                      │
│  [ toggle ] Pause all               │
│                                     │
│  🔗 Highlight Links                 │
│  [ toggle ]                         │
│                                     │
│  👁️ Color Vision                    │
│  [ dropdown ]                       │
│    Normal / Protanopia (no red) /   │
│    Deuteranopia (no green) /        │
│    Tritanopia (no blue) /           │
│    Monochromacy                     │
│                                     │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│  [ 🔄 Reset All Settings ]          │
│                                     │
└─────────────────────────────────────┘
```

### Technical Implementation of Each Setting

| Setting | Mechanism | Details |
|---------|-----------|---------|
| Font size | CSS variable `--a11y-font-scale` on `<html>` | Values: 1.0 / 1.15 / 1.3 / 1.5. All `rem` units scale automatically |
| High contrast | Class `.a11y-high-contrast` on `<html>` | Overrides backgrounds to black/white, text to full opacity |
| Inverted | CSS `filter: invert(1) hue-rotate(180deg)` on `<html>` | Images get `filter: invert(1) hue-rotate(180deg)` to cancel out |
| Dyslexia font | Class `.a11y-dyslexia` on `<html>` | Swaps `font-family` to OpenDyslexic. Font loaded on demand (~100KB WOFF2) |
| Line spacing | CSS variable `--a11y-line-height` | Values: 1.5 / 1.75 / 2.0 / 2.5 |
| Letter spacing | CSS variable `--a11y-letter-spacing` | Values: normal / 0.05em / 0.1em / 0.15em |
| Animations off | Class `.a11y-no-motion` on `<html>` | Kills all animations/transitions. Framer Motion checks for this class |
| Link highlighting | Class `.a11y-links` on `<html>` | All `<a>` get underline + 2px outline + high contrast color |
| Color vision | SVG `<feColorMatrix>` filter | Injected into `<body>`, applied via `filter: url(#a11y-cvd-filter)` on `<html>` |

### Persistence

- All settings saved to `localStorage` key `a11y-settings` as JSON object
- On page load: a synchronous `<script>` in `<head>` reads localStorage and applies classes/variables before first paint (prevents FOUC)
- "Reset All" button: clears localStorage, removes all classes/variables, shows brief confirmation toast

---

## Layer 3 — Read Aloud / Text-to-Speech

### Per-Section Listen Buttons

| Page | Placement |
|------|-----------|
| Health Library | Next to each condition/article heading |
| Doctor profiles | Next to biography section |
| Service detail pages | Next to service description |
| Blog/News articles | At top of article content |
| Checkup packages | Next to package description/includes |
| About page | Next to clinic description |

### Button Design

- Small, subtle: speaker icon + "Listen" text (translated)
- Muted grey style, matching existing UI patterns
- Playing state: icon changes to pause, button gets subtle pink highlight
- Completed state: returns to default

### Reading Behavior

- Uses `window.speechSynthesis` (Web Speech API)
- Voice selected by current locale: Georgian for `/ge/`, English for `/en/`, Russian for `/ru/`
- Reads text content of that specific section only
- Speed controlled by panel setting: slow = 0.7 rate, normal = 1.0, fast = 1.4
- **Text highlighting:** Currently-spoken sentence gets soft pink background highlight

### Playback Controls

- Click button again: Pause
- Click paused button: Resume
- Navigate away or click another section's button: Stop current, start new
- Floating mini-bar at bottom during playback: `[Pause] [Stop] [Speed: Normal]`

### Edge Cases

- Browser doesn't support Speech API: button disabled with tooltip
- No voice for locale on device: fallback voice + warning note
- Mobile (iOS Safari, Android Chrome): both supported

### Architecture

- `SpeechProvider` context wrapping the app
- Exposes: `speak(text, locale)`, `pause()`, `resume()`, `stop()`, `isSpeaking`, `currentSection`
- Per-section buttons call `speak(sectionRef.textContent, locale)`

---

## File Structure

### New Files

```
src/components/accessibility/
├── AccessibilityProvider.tsx    # Context — applies settings from localStorage
├── AccessibilityPanel.tsx       # Slide-out panel UI
├── AccessibilityButton.tsx      # ♿ button in header
├── ReadAloudButton.tsx          # Per-section 🔊 button (reusable)
├── SpeechProvider.tsx           # Web Speech API context
├── SpeechMiniBar.tsx            # Floating playback controls
├── SkipToContent.tsx            # Skip navigation link
└── a11y-filters.tsx             # SVG color blindness filters

src/hooks/
└── useAccessibility.ts          # Hook to read/write a11y settings

src/lib/
└── a11y-settings.ts             # Types, defaults, localStorage logic

public/fonts/
└── OpenDyslexic-Regular.woff2   # Dyslexia font (loaded on demand)
```

### Modified Files

| File | Change |
|------|--------|
| `src/app/(frontend)/[locale]/layout.tsx` | Wrap with providers, add SkipToContent, add `id="main-content"` to `<main>` |
| `src/components/layout/Header.tsx` | Add AccessibilityButton next to language switcher |
| `src/app/globals.css` | Add `prefers-reduced-motion`, `.a11y-*` classes, `:focus-visible` styles |
| `src/components/shared/Accordion.tsx` | Add `aria-expanded`, `aria-controls`, `id`s |
| `src/components/pages/FAQBlockRenderer.tsx` | Same ARIA fixes as Accordion |
| `src/components/booking/PersonalInfoStep.tsx` | `htmlFor`, `aria-required`, `aria-invalid`, `aria-describedby`, `fieldset`/`legend` |
| `src/components/booking/BookingWizard.tsx` | `aria-live` region for step announcements |
| `src/components/home/HeroSlider.tsx` | Carousel ARIA roles |
| `src/components/doctors/DoctorsListClient.tsx` | `aria-live` for filter results |
| `src/messages/{ge,en,ru}.json` | New `Accessibility` namespace |

### New Dependency

- OpenDyslexic font: self-hosted WOFF2 in `public/fonts/`, `@font-face` defined but only loaded when `.a11y-dyslexia` class is active

### Dev Tooling

- `eslint-plugin-jsx-a11y` added to devDependencies, integrated with existing flat ESLint config

---

## Translations

New `Accessibility` namespace added to all 3 locale files:

**English (src/messages/en.json):**
```json
{
  "Accessibility": {
    "title": "Accessibility Settings",
    "openPanel": "Accessibility",
    "close": "Close",
    "resetAll": "Reset All Settings",
    "resetConfirm": "Settings reset to defaults",
    "readAloud": "Read Aloud",
    "listen": "Listen",
    "pause": "Pause",
    "resume": "Resume",
    "stop": "Stop",
    "speedSlow": "Slow",
    "speedNormal": "Normal",
    "speedFast": "Fast",
    "fontSize": "Font Size",
    "fontSizeSmaller": "Smaller",
    "fontSizeDefault": "Default",
    "fontSizeLarger": "Larger",
    "fontSizeLargest": "Largest",
    "contrast": "Contrast",
    "contrastNormal": "Normal",
    "contrastHigh": "High",
    "contrastInverted": "Inverted",
    "dyslexiaFont": "Dyslexia-Friendly Font",
    "contentSpacing": "Content Spacing",
    "lineHeight": "Line Height",
    "letterSpacing": "Letter Spacing",
    "animations": "Animations",
    "animationsPause": "Pause All Animations",
    "highlightLinks": "Highlight Links",
    "colorVision": "Color Vision",
    "colorNormal": "Normal Vision",
    "colorProtanopia": "Protanopia (no red)",
    "colorDeuteranopia": "Deuteranopia (no green)",
    "colorTritanopia": "Tritanopia (no blue)",
    "colorMonochromacy": "Monochromacy",
    "speechNotSupported": "Text-to-speech not supported in this browser",
    "speechVoiceWarning": "Voice may not match selected language",
    "skipToContent": "Skip to main content"
  }
}
```

**Georgian (src/messages/ge.json):**
```json
{
  "Accessibility": {
    "title": "ხელმისაწვდომობის პარამეტრები",
    "openPanel": "ხელმისაწვდომობა",
    "close": "დახურვა",
    "resetAll": "ყველა პარამეტრის გასუფთავება",
    "resetConfirm": "პარამეტრები აღდგენილია",
    "readAloud": "ხმამაღლა წაკითხვა",
    "listen": "მოსმენა",
    "pause": "პაუზა",
    "resume": "გაგრძელება",
    "stop": "გაჩერება",
    "speedSlow": "ნელი",
    "speedNormal": "ნორმალური",
    "speedFast": "სწრაფი",
    "fontSize": "შრიფტის ზომა",
    "fontSizeSmaller": "პატარა",
    "fontSizeDefault": "სტანდარტული",
    "fontSizeLarger": "დიდი",
    "fontSizeLargest": "ძალიან დიდი",
    "contrast": "კონტრასტი",
    "contrastNormal": "ნორმალური",
    "contrastHigh": "მაღალი",
    "contrastInverted": "ინვერსიული",
    "dyslexiaFont": "დისლექსიისთვის შრიფტი",
    "contentSpacing": "ტექსტის დაშორება",
    "lineHeight": "სტრიქონის სიმაღლე",
    "letterSpacing": "ასოების დაშორება",
    "animations": "ანიმაციები",
    "animationsPause": "ყველა ანიმაციის გაჩერება",
    "highlightLinks": "ბმულების გამოყოფა",
    "colorVision": "ფერის აღქმა",
    "colorNormal": "ნორმალური მხედველობა",
    "colorProtanopia": "პროტანოპია (წითელი არ ჩანს)",
    "colorDeuteranopia": "დეიტერანოპია (მწვანე არ ჩანს)",
    "colorTritanopia": "ტრიტანოპია (ლურჯი არ ჩანს)",
    "colorMonochromacy": "მონოქრომატია",
    "speechNotSupported": "ტექსტის ხმოვანი წაკითხვა ამ ბრაუზერში არ არის მხარდაჭერილი",
    "speechVoiceWarning": "ხმა შეიძლება არ ემთხვეოდეს არჩეულ ენას",
    "skipToContent": "გადასვლა მთავარ შინაარსზე"
  }
}
```

**Russian (src/messages/ru.json):**
```json
{
  "Accessibility": {
    "title": "Настройки доступности",
    "openPanel": "Доступность",
    "close": "Закрыть",
    "resetAll": "Сбросить все настройки",
    "resetConfirm": "Настройки сброшены",
    "readAloud": "Чтение вслух",
    "listen": "Слушать",
    "pause": "Пауза",
    "resume": "Продолжить",
    "stop": "Остановить",
    "speedSlow": "Медленно",
    "speedNormal": "Нормально",
    "speedFast": "Быстро",
    "fontSize": "Размер шрифта",
    "fontSizeSmaller": "Меньше",
    "fontSizeDefault": "Стандартный",
    "fontSizeLarger": "Больше",
    "fontSizeLargest": "Крупный",
    "contrast": "Контраст",
    "contrastNormal": "Нормальный",
    "contrastHigh": "Высокий",
    "contrastInverted": "Инвертированный",
    "dyslexiaFont": "Шрифт для дислексии",
    "contentSpacing": "Интервалы текста",
    "lineHeight": "Высота строки",
    "letterSpacing": "Расстояние между буквами",
    "animations": "Анимации",
    "animationsPause": "Остановить все анимации",
    "highlightLinks": "Выделить ссылки",
    "colorVision": "Цветовое зрение",
    "colorNormal": "Нормальное зрение",
    "colorProtanopia": "Протанопия (нет красного)",
    "colorDeuteranopia": "Дейтеранопия (нет зелёного)",
    "colorTritanopia": "Тританопия (нет синего)",
    "colorMonochromacy": "Монохромазия",
    "speechNotSupported": "Озвучивание текста не поддерживается в этом браузере",
    "speechVoiceWarning": "Голос может не соответствовать выбранному языку",
    "skipToContent": "Перейти к основному содержанию"
  }
}
```

---

## Performance Considerations

- Accessibility panel is lazy-loaded via `next/dynamic` — not in initial bundle
- OpenDyslexic font only fetched when user enables it (no cost otherwise)
- SVG color filters are ~1KB inline
- Web Speech API is browser-native, zero bundle cost
- CSS variables + classes = no JS re-renders when settings change
- Settings applied before paint via `<Script strategy="beforeInteractive">` in layout (Next.js App Router pattern for FOUC prevention)
- No external overlay libraries (UserWay, AccessiBe, etc.) — they're bloated and screen reader users hate them

---

## Testing Strategy (Manual)

| What | How to Verify |
|------|---------------|
| Screen reader | NVDA (Windows) — navigate all pages, confirm announcements are meaningful |
| Keyboard-only | Unplug mouse, Tab through site — every element reachable, focus visible |
| Panel settings | Toggle each setting, refresh — settings persist and apply |
| Read Aloud | Test each locale — correct voice, highlighting follows speech |
| Color filters | Enable each, verify content readable |
| Reduced motion | Enable in OS settings, confirm no animations |
| Mobile | VoiceOver (iOS) + TalkBack (Android) |
| Zoom | Browser zoom to 200% — no overflow or overlap |

### Dev Tooling

- `eslint-plugin-jsx-a11y` added to devDependencies
- Integrated with existing flat ESLint config
- Catches missing alt, invalid ARIA, label issues at lint time

---

## What Does NOT Change Visually

- Page layouts remain identical
- Brand colors (blackberry, pink, cream) unchanged
- Typography and spacing unchanged for default settings
- Animations unchanged for users without reduced-motion preference
- All visual changes are opt-in through the panel or only visible to keyboard/AT users
