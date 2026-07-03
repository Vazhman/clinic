# Accessibility System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive accessibility system with WCAG AA structural compliance, an interactive settings panel, and text-to-speech — split into 6 independent parallel workstreams.

**Architecture:** Two-layer system — Layer 1 bakes accessibility into the HTML/CSS (ARIA, semantics, focus, reduced motion). Layer 2 adds an interactive panel with font/contrast/spacing/animation/color-vision controls and a Web Speech API read-aloud feature. All state persisted in localStorage with FOUC prevention.

**Tech Stack:** Next.js 16 App Router, next-intl, Tailwind CSS 4, Web Speech API, CSS custom properties, SVG feColorMatrix filters.

---

## Workstream 1: Foundation (CSS + Types + Settings + Font)

**Files:**
- Create: `src/lib/a11y-settings.ts`
- Create: `src/hooks/useAccessibility.ts`
- Modify: `src/app/globals.css` (append a11y section at end)
- Create: `public/fonts/OpenDyslexic-Regular.woff2` (download)

### Task 1.1: Create the settings type system and localStorage logic

- [ ] **Step 1: Create `src/lib/a11y-settings.ts`**

```typescript
export interface A11ySettings {
  fontSize: "default" | "larger" | "largest" | "smaller";
  contrast: "normal" | "high" | "inverted";
  dyslexiaFont: boolean;
  lineHeight: "default" | "medium" | "large" | "largest";
  letterSpacing: "default" | "medium" | "large" | "largest";
  animations: boolean; // true = animations ON (default), false = paused
  highlightLinks: boolean;
  colorVision: "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "monochromacy";
  speechSpeed: "slow" | "normal" | "fast";
}

export const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: "default",
  contrast: "normal",
  dyslexiaFont: false,
  lineHeight: "default",
  letterSpacing: "default",
  animations: true,
  highlightLinks: false,
  colorVision: "normal",
  speechSpeed: "normal",
};

const STORAGE_KEY = "a11y-settings";

export function loadSettings(): A11ySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: A11ySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

/** CSS variable values mapped from setting choices */
export const FONT_SCALE_MAP: Record<A11ySettings["fontSize"], string> = {
  smaller: "0.9",
  default: "1",
  larger: "1.15",
  largest: "1.35",
};

export const LINE_HEIGHT_MAP: Record<A11ySettings["lineHeight"], string> = {
  default: "normal",
  medium: "1.75",
  large: "2",
  largest: "2.5",
};

export const LETTER_SPACING_MAP: Record<A11ySettings["letterSpacing"], string> = {
  default: "normal",
  medium: "0.05em",
  large: "0.1em",
  largest: "0.15em",
};

export const SPEECH_RATE_MAP: Record<A11ySettings["speechSpeed"], number> = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.4,
};

/**
 * Applies settings to the <html> element as CSS classes and variables.
 * Called on load (from inline script) and on setting change.
 */
export function applySettingsToDOM(settings: A11ySettings): void {
  const html = document.documentElement;

  // Font scale
  html.style.setProperty("--a11y-font-scale", FONT_SCALE_MAP[settings.fontSize]);
  
  // Line height
  html.style.setProperty("--a11y-line-height", LINE_HEIGHT_MAP[settings.lineHeight]);
  
  // Letter spacing
  html.style.setProperty("--a11y-letter-spacing", LETTER_SPACING_MAP[settings.letterSpacing]);

  // Contrast classes
  html.classList.remove("a11y-high-contrast", "a11y-inverted");
  if (settings.contrast === "high") html.classList.add("a11y-high-contrast");
  if (settings.contrast === "inverted") html.classList.add("a11y-inverted");

  // Dyslexia font
  html.classList.toggle("a11y-dyslexia", settings.dyslexiaFont);

  // Animations
  html.classList.toggle("a11y-no-motion", !settings.animations);

  // Link highlighting
  html.classList.toggle("a11y-links", settings.highlightLinks);

  // Color vision — set data attribute for CSS filter targeting
  html.dataset.colorVision = settings.colorVision;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/a11y-settings.ts
git commit -m "feat(a11y): add settings type system and localStorage logic"
```

### Task 1.2: Create the useAccessibility hook

- [ ] **Step 1: Create `src/hooks/useAccessibility.ts`**

```typescript
"use client";

import { useContext } from "react";
import { createContext } from "react";
import type { A11ySettings } from "@/lib/a11y-settings";

export interface A11yContextValue {
  settings: A11ySettings;
  updateSetting: <K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => void;
  resetAll: () => void;
}

export const A11yContext = createContext<A11yContextValue | null>(null);

export function useAccessibility(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAccessibility.ts
git commit -m "feat(a11y): add useAccessibility hook and context"
```

### Task 1.3: Add accessibility CSS to globals.css

- [ ] **Step 1: Append the following to end of `src/app/globals.css`**

```css
/* ══════════════════════════════════════════════════════════════
   ACCESSIBILITY SYSTEM
   ══════════════════════════════════════════════════════════════ */

/* ── Reduced Motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Manual animation pause (from panel) */
.a11y-no-motion *, .a11y-no-motion *::before, .a11y-no-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* ── Focus Visible ── */
*:focus-visible {
  outline: 2px solid #DD64A6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* ── Skip Link ── */
.skip-to-content {
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
  z-index: 9999;
}
.skip-to-content:focus {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  height: auto;
  padding: 12px 24px;
  background: #682149;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  text-decoration: none;
  z-index: 99999;
}

/* ── Font Scale ── */
html {
  font-size: calc(16px * var(--a11y-font-scale, 1));
}

/* ── Line Height & Letter Spacing ── */
body {
  line-height: var(--a11y-line-height, normal);
  letter-spacing: var(--a11y-letter-spacing, normal);
}

/* ── High Contrast ── */
.a11y-high-contrast {
  --color-cream: #000000;
  --color-grey-lighter: #1a1a1a;
}
.a11y-high-contrast body {
  background: #000 !important;
  color: #fff !important;
}
.a11y-high-contrast header,
.a11y-high-contrast footer {
  background: #000 !important;
  border-color: #fff !important;
}
.a11y-high-contrast a { color: #ffff00 !important; }
.a11y-high-contrast button { border: 1px solid #fff !important; }
.a11y-high-contrast h1, .a11y-high-contrast h2, .a11y-high-contrast h3,
.a11y-high-contrast h4, .a11y-high-contrast h5, .a11y-high-contrast h6 {
  color: #fff !important;
}
.a11y-high-contrast p, .a11y-high-contrast span, .a11y-high-contrast li,
.a11y-high-contrast label, .a11y-high-contrast td, .a11y-high-contrast th {
  color: #fff !important;
}
.a11y-high-contrast input, .a11y-high-contrast select, .a11y-high-contrast textarea {
  background: #1a1a1a !important;
  color: #fff !important;
  border-color: #fff !important;
}

/* ── Inverted ── */
.a11y-inverted {
  filter: invert(1) hue-rotate(180deg);
}
.a11y-inverted img, .a11y-inverted video, .a11y-inverted canvas, .a11y-inverted svg {
  filter: invert(1) hue-rotate(180deg);
}

/* ── Dyslexia Font ── */
@font-face {
  font-family: "OpenDyslexic";
  src: url("/fonts/OpenDyslexic-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
.a11y-dyslexia body,
.a11y-dyslexia input,
.a11y-dyslexia select,
.a11y-dyslexia textarea,
.a11y-dyslexia button {
  font-family: "OpenDyslexic", sans-serif !important;
}

/* ── Link Highlighting ── */
.a11y-links a {
  text-decoration: underline !important;
  text-decoration-thickness: 2px !important;
  text-underline-offset: 3px !important;
  outline: 2px solid currentColor !important;
  outline-offset: 2px !important;
  border-radius: 2px !important;
}

/* ── Color Vision Filters ── */
html[data-color-vision="protanopia"] {
  filter: url(#a11y-cvd-protanopia);
}
html[data-color-vision="deuteranopia"] {
  filter: url(#a11y-cvd-deuteranopia);
}
html[data-color-vision="tritanopia"] {
  filter: url(#a11y-cvd-tritanopia);
}
html[data-color-vision="monochromacy"] {
  filter: grayscale(1);
}

/* ── Screen Reader Only (utility) ── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ── Speech Highlight ── */
.a11y-speech-highlight {
  background-color: rgba(221, 100, 166, 0.15) !important;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}
```

- [ ] **Step 2: Download OpenDyslexic font**

Download the OpenDyslexic Regular WOFF2 file and save to `public/fonts/OpenDyslexic-Regular.woff2`. Source: https://github.com/antijingoist/opendyslexic/blob/master/compiled/OpenDyslexic-Regular.woff2

If you cannot download it, create a placeholder note. The font can be manually added later.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css public/fonts/OpenDyslexic-Regular.woff2
git commit -m "feat(a11y): add accessibility CSS classes, reduced motion, focus styles, and OpenDyslexic font"
```

---

## Workstream 2: Providers + Layout Integration

**Files:**
- Create: `src/components/accessibility/AccessibilityProvider.tsx`
- Create: `src/components/accessibility/SkipToContent.tsx`
- Create: `src/components/accessibility/a11y-filters.tsx`
- Modify: `src/app/(frontend)/[locale]/layout.tsx`

### Task 2.1: Create AccessibilityProvider

- [ ] **Step 1: Create `src/components/accessibility/AccessibilityProvider.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { A11yContext, type A11yContextValue } from "@/hooks/useAccessibility";
import {
  type A11ySettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  clearSettings,
  applySettingsToDOM,
} from "@/lib/a11y-settings";

export default function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
    applySettingsToDOM(stored);
    setMounted(true);
  }, []);

  const updateSetting = useCallback(<K extends keyof A11ySettings>(
    key: K,
    value: A11ySettings[K]
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      applySettingsToDOM(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    clearSettings();
    setSettings(DEFAULT_SETTINGS);
    applySettingsToDOM(DEFAULT_SETTINGS);
  }, []);

  const contextValue: A11yContextValue = {
    settings,
    updateSetting,
    resetAll,
  };

  // Apply settings immediately via inline script is handled in layout
  // This provider manages the React state after hydration
  return (
    <A11yContext.Provider value={contextValue}>
      {children}
    </A11yContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/AccessibilityProvider.tsx
git commit -m "feat(a11y): add AccessibilityProvider context component"
```

### Task 2.2: Create SkipToContent component

- [ ] **Step 1: Create `src/components/accessibility/SkipToContent.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function SkipToContent() {
  const t = useTranslations("Accessibility");

  return (
    <a href="#main-content" className="skip-to-content">
      {t("skipToContent")}
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/SkipToContent.tsx
git commit -m "feat(a11y): add SkipToContent component"
```

### Task 2.3: Create SVG color blindness filters

- [ ] **Step 1: Create `src/components/accessibility/a11y-filters.tsx`**

```tsx
"use client";

/**
 * SVG filters for simulating/correcting color vision deficiencies.
 * These are injected into the page and referenced via CSS filter: url(#id).
 */
export default function A11yColorFilters() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Protanopia (no red perception) */}
        <filter id="a11y-cvd-protanopia">
          <feColorMatrix
            type="matrix"
            values="0.567, 0.433, 0,     0, 0
                    0.558, 0.442, 0,     0, 0
                    0,     0.242, 0.758, 0, 0
                    0,     0,     0,     1, 0"
          />
        </filter>
        {/* Deuteranopia (no green perception) */}
        <filter id="a11y-cvd-deuteranopia">
          <feColorMatrix
            type="matrix"
            values="0.625, 0.375, 0,   0, 0
                    0.7,   0.3,   0,   0, 0
                    0,     0.3,   0.7, 0, 0
                    0,     0,     0,   1, 0"
          />
        </filter>
        {/* Tritanopia (no blue perception) */}
        <filter id="a11y-cvd-tritanopia">
          <feColorMatrix
            type="matrix"
            values="0.95, 0.05,  0,     0, 0
                    0,    0.433, 0.567, 0, 0
                    0,    0.475, 0.525, 0, 0
                    0,    0,     0,     1, 0"
          />
        </filter>
      </defs>
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/a11y-filters.tsx
git commit -m "feat(a11y): add SVG color vision deficiency filters"
```

### Task 2.4: Integrate providers into layout.tsx

- [ ] **Step 1: Modify `src/app/(frontend)/[locale]/layout.tsx`**

The current layout is:
```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import "@/app/globals.css";
```

Add imports for:
```tsx
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import SkipToContent from "@/components/accessibility/SkipToContent";
import A11yColorFilters from "@/components/accessibility/a11y-filters";
import Script from "next/script";
```

Change `<main>{children}</main>` to `<main id="main-content">{children}</main>`.

Wrap the `NextIntlClientProvider` children with `AccessibilityProvider`.

Add `<SkipToContent />` as the first child inside the body after the providers.

Add `<A11yColorFilters />` at the end of body.

Add a `<Script strategy="beforeInteractive">` in `<head>` area (or beginning of body) with inline script to apply settings before paint:

```tsx
<Script
  id="a11y-init"
  strategy="beforeInteractive"
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var s=JSON.parse(localStorage.getItem('a11y-settings')||'{}');var h=document.documentElement;if(s.fontSize){var m={smaller:'0.9',default:'1',larger:'1.15',largest:'1.35'};h.style.setProperty('--a11y-font-scale',m[s.fontSize]||'1')}if(s.lineHeight){var l={default:'normal',medium:'1.75',large:'2',largest:'2.5'};h.style.setProperty('--a11y-line-height',l[s.lineHeight]||'normal')}if(s.letterSpacing){var ls={default:'normal',medium:'0.05em',large:'0.1em',largest:'0.15em'};h.style.setProperty('--a11y-letter-spacing',ls[s.letterSpacing]||'normal')}if(s.contrast==='high')h.classList.add('a11y-high-contrast');if(s.contrast==='inverted')h.classList.add('a11y-inverted');if(s.dyslexiaFont)h.classList.add('a11y-dyslexia');if(s.animations===false)h.classList.add('a11y-no-motion');if(s.highlightLinks)h.classList.add('a11y-links');if(s.colorVision&&s.colorVision!=='normal')h.dataset.colorVision=s.colorVision}catch(e){}})()`,
  }}
/>
```

The final layout should look like:
```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import AccessibilityProvider from "@/components/accessibility/AccessibilityProvider";
import SkipToContent from "@/components/accessibility/SkipToContent";
import A11yColorFilters from "@/components/accessibility/a11y-filters";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.khozrevanidze.ge"),
  icons: { icon: "/favicon.ico" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        <Script
          id="a11y-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('a11y-settings')||'{}');var h=document.documentElement;if(s.fontSize){var m={smaller:'0.9',default:'1',larger:'1.15',largest:'1.35'};h.style.setProperty('--a11y-font-scale',m[s.fontSize]||'1')}if(s.lineHeight){var l={default:'normal',medium:'1.75',large:'2',largest:'2.5'};h.style.setProperty('--a11y-line-height',l[s.lineHeight]||'normal')}if(s.letterSpacing){var ls={default:'normal',medium:'0.05em',large:'0.1em',largest:'0.15em'};h.style.setProperty('--a11y-letter-spacing',ls[s.letterSpacing]||'normal')}if(s.contrast==='high')h.classList.add('a11y-high-contrast');if(s.contrast==='inverted')h.classList.add('a11y-inverted');if(s.dyslexiaFont)h.classList.add('a11y-dyslexia');if(s.animations===false)h.classList.add('a11y-no-motion');if(s.highlightLinks)h.classList.add('a11y-links');if(s.colorVision&&s.colorVision!=='normal')h.dataset.colorVision=s.colorVision}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-white text-grey">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AccessibilityProvider>
            <SkipToContent />
            <Header />
            <main id="main-content">{children}</main>
            <Footer />
            <WhatsAppButton />
            <A11yColorFilters />
          </AccessibilityProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(frontend)/[locale]/layout.tsx
git commit -m "feat(a11y): integrate accessibility providers, skip link, and filters into layout"
```

---

## Workstream 3: Panel UI + Button + Header + Translations

**Files:**
- Create: `src/components/accessibility/AccessibilityPanel.tsx`
- Create: `src/components/accessibility/AccessibilityButton.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/messages/en.json`, `src/messages/ge.json`, `src/messages/ru.json`

### Task 3.1: Add Accessibility translations to all 3 locale files

- [ ] **Step 1: Add `Accessibility` namespace to `src/messages/en.json`**

Add this object at the end (before the closing `}`):
```json
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
  "skipToContent": "Skip to main content",
  "playing": "Playing",
  "speed": "Speed"
}
```

- [ ] **Step 2: Add `Accessibility` namespace to `src/messages/ge.json`**

```json
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
  "skipToContent": "გადასვლა მთავარ შინაარსზე",
  "playing": "უკრავს",
  "speed": "სიჩქარე"
}
```

- [ ] **Step 3: Add `Accessibility` namespace to `src/messages/ru.json`**

```json
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
  "skipToContent": "Перейти к основному содержанию",
  "playing": "Воспроизведение",
  "speed": "Скорость"
}
```

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/ge.json src/messages/ru.json
git commit -m "feat(a11y): add Accessibility translations for all 3 locales"
```

### Task 3.2: Create AccessibilityPanel component

- [ ] **Step 1: Create `src/components/accessibility/AccessibilityPanel.tsx`**

This is the slide-out drawer panel with all settings. It must be a `"use client"` component that uses `useTranslations("Accessibility")` and `useAccessibility()` hook.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAccessibility } from "@/hooks/useAccessibility";
import type { A11ySettings } from "@/lib/a11y-settings";

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const t = useTranslations("Accessibility");
  const { settings, updateSetting, resetAll } = useAccessibility();
  const panelRef = useRef<HTMLDivElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Focus the panel on open
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset confirmation auto-hide
  useEffect(() => {
    if (showResetConfirm) {
      const timer = setTimeout(() => setShowResetConfirm(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showResetConfirm]);

  const handleReset = () => {
    resetAll();
    setShowResetConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[9998] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[340px] bg-white z-[9999] shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-grey-lighter px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-blackberry flex items-center gap-2">
            <span aria-hidden="true">&#9855;</span>
            {t("title")}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-grey-lighter transition-colors"
            aria-label={t("close")}
          >
            <svg className="w-5 h-5 text-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {/* Read Aloud Speed */}
          <SettingSection label={t("readAloud")} icon="&#128266;">
            <SegmentedControl
              options={[
                { value: "slow", label: t("speedSlow") },
                { value: "normal", label: t("speedNormal") },
                { value: "fast", label: t("speedFast") },
              ]}
              value={settings.speechSpeed}
              onChange={(v) => updateSetting("speechSpeed", v as A11ySettings["speechSpeed"])}
            />
          </SettingSection>

          {/* Font Size */}
          <SettingSection label={t("fontSize")} icon="&#128292;">
            <SegmentedControl
              options={[
                { value: "smaller", label: "A-" },
                { value: "default", label: "A" },
                { value: "larger", label: "A+" },
                { value: "largest", label: "A++" },
              ]}
              value={settings.fontSize}
              onChange={(v) => updateSetting("fontSize", v as A11ySettings["fontSize"])}
            />
          </SettingSection>

          {/* Contrast */}
          <SettingSection label={t("contrast")} icon="&#127763;">
            <SegmentedControl
              options={[
                { value: "normal", label: t("contrastNormal") },
                { value: "high", label: t("contrastHigh") },
                { value: "inverted", label: t("contrastInverted") },
              ]}
              value={settings.contrast}
              onChange={(v) => updateSetting("contrast", v as A11ySettings["contrast"])}
            />
          </SettingSection>

          {/* Dyslexia Font */}
          <SettingSection label={t("dyslexiaFont")} icon="&#128214;">
            <Toggle
              checked={settings.dyslexiaFont}
              onChange={(v) => updateSetting("dyslexiaFont", v)}
            />
          </SettingSection>

          {/* Content Spacing */}
          <SettingSection label={t("contentSpacing")} icon="&#8597;&#65039;">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-grey-light">{t("lineHeight")}</span>
                <SegmentedControl
                  options={[
                    { value: "default", label: "1x" },
                    { value: "medium", label: "1.5x" },
                    { value: "large", label: "2x" },
                    { value: "largest", label: "2.5x" },
                  ]}
                  value={settings.lineHeight}
                  onChange={(v) => updateSetting("lineHeight", v as A11ySettings["lineHeight"])}
                />
              </div>
              <div>
                <span className="text-xs text-grey-light">{t("letterSpacing")}</span>
                <SegmentedControl
                  options={[
                    { value: "default", label: "0" },
                    { value: "medium", label: "+" },
                    { value: "large", label: "++" },
                    { value: "largest", label: "+++" },
                  ]}
                  value={settings.letterSpacing}
                  onChange={(v) => updateSetting("letterSpacing", v as A11ySettings["letterSpacing"])}
                />
              </div>
            </div>
          </SettingSection>

          {/* Animations */}
          <SettingSection label={t("animationsPause")} icon="&#127916;">
            <Toggle
              checked={!settings.animations}
              onChange={(v) => updateSetting("animations", !v)}
            />
          </SettingSection>

          {/* Highlight Links */}
          <SettingSection label={t("highlightLinks")} icon="&#128279;">
            <Toggle
              checked={settings.highlightLinks}
              onChange={(v) => updateSetting("highlightLinks", v)}
            />
          </SettingSection>

          {/* Color Vision */}
          <SettingSection label={t("colorVision")} icon="&#128065;&#65039;">
            <select
              value={settings.colorVision}
              onChange={(e) => updateSetting("colorVision", e.target.value as A11ySettings["colorVision"])}
              className="w-full px-3 py-2.5 rounded-lg border border-grey-lighter text-sm bg-white focus:border-blackberry focus:ring-1 focus:ring-blackberry/20 outline-none"
            >
              <option value="normal">{t("colorNormal")}</option>
              <option value="protanopia">{t("colorProtanopia")}</option>
              <option value="deuteranopia">{t("colorDeuteranopia")}</option>
              <option value="tritanopia">{t("colorTritanopia")}</option>
              <option value="monochromacy">{t("colorMonochromacy")}</option>
            </select>
          </SettingSection>

          {/* Reset */}
          <div className="pt-4 border-t border-grey-lighter">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-grey-lighter text-sm font-medium text-grey hover:bg-grey-lighter/50 transition-colors"
            >
              <span aria-hidden="true">&#128260;</span>
              {t("resetAll")}
            </button>
            {showResetConfirm && (
              <p className="text-center text-xs text-green-600 mt-2" role="status" aria-live="polite">
                {t("resetConfirm")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function SettingSection({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span aria-hidden="true" className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-grey">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-grey-lighter overflow-hidden" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 px-2 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-blackberry text-white"
              : "bg-white text-grey hover:bg-grey-lighter/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? "bg-blackberry" : "bg-grey-lighter"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/AccessibilityPanel.tsx
git commit -m "feat(a11y): add AccessibilityPanel drawer component with all settings"
```

### Task 3.3: Create AccessibilityButton and add to Header

- [ ] **Step 1: Create `src/components/accessibility/AccessibilityButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const AccessibilityPanel = dynamic(
  () => import("./AccessibilityPanel"),
  { ssr: false }
);

export default function AccessibilityButton() {
  const t = useTranslations("Accessibility");
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setPanelOpen(true)}
        className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-blackberry/20 hover:border-blackberry text-blackberry hover:text-pink transition-colors duration-200"
        aria-label={t("openPanel")}
        aria-expanded={panelOpen}
        title={t("openPanel")}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="4.5" r="2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 0l-3 5m3-5l3 5m-8-5h10" />
        </svg>
      </button>
      <AccessibilityPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Modify `src/components/layout/Header.tsx`**

Add import at top:
```tsx
import AccessibilityButton from "@/components/accessibility/AccessibilityButton";
```

Insert `<AccessibilityButton />` in the header actions area — specifically between the `<LanguageSwitcher />` div and the patient room link. Find this line:

```tsx
<div className="hidden lg:block"><LanguageSwitcher /></div>
```

Add right after it:
```tsx
<div className="hidden lg:block"><AccessibilityButton /></div>
```

Also add in the mobile menu area (after the LanguageSwitcher at the bottom):
```tsx
<div className="pt-3 flex justify-center"><AccessibilityButton /></div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/accessibility/AccessibilityButton.tsx src/components/layout/Header.tsx
git commit -m "feat(a11y): add accessibility button to header with lazy-loaded panel"
```

---

## Workstream 4: Speech System (Text-to-Speech)

**Files:**
- Create: `src/components/accessibility/SpeechProvider.tsx`
- Create: `src/components/accessibility/ReadAloudButton.tsx`
- Create: `src/components/accessibility/SpeechMiniBar.tsx`

### Task 4.1: Create SpeechProvider

- [ ] **Step 1: Create `src/components/accessibility/SpeechProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { SPEECH_RATE_MAP } from "@/lib/a11y-settings";
import { useAccessibility } from "@/hooks/useAccessibility";

interface SpeechContextValue {
  speak: (text: string, sectionId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  currentSection: string | null;
  isSupported: boolean;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function useSpeech(): SpeechContextValue {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within SpeechProvider");
  return ctx;
}

const LOCALE_LANG_MAP: Record<string, string> = {
  ge: "ka-GE",
  en: "en-US",
  ru: "ru-RU",
};

export default function SpeechProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const { settings } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const speak = useCallback((text: string, sectionId: string) => {
    if (!isSupported) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LOCALE_LANG_MAP[locale] || "en-US";
    utterance.rate = SPEECH_RATE_MAP[settings.speechSpeed];

    // Try to find a voice matching the locale
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = utterance.lang.split("-")[0];
    const matchingVoice = voices.find((v) => v.lang.startsWith(langPrefix));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentSection(sectionId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSection(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSection(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, locale, settings.speechSpeed]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentSection(null);
  }, [isSupported]);

  return (
    <SpeechContext.Provider value={{ speak, pause, resume, stop, isSpeaking, isPaused, currentSection, isSupported }}>
      {children}
    </SpeechContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/SpeechProvider.tsx
git commit -m "feat(a11y): add SpeechProvider with Web Speech API integration"
```

### Task 4.2: Create ReadAloudButton

- [ ] **Step 1: Create `src/components/accessibility/ReadAloudButton.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useSpeech } from "./SpeechProvider";

interface ReadAloudButtonProps {
  /** A unique ID for this section (e.g. "doctor-bio", "service-desc") */
  sectionId: string;
  /** Ref to the DOM element whose textContent will be read */
  targetRef: React.RefObject<HTMLElement | null>;
  /** Optional className override */
  className?: string;
}

export default function ReadAloudButton({ sectionId, targetRef, className }: ReadAloudButtonProps) {
  const t = useTranslations("Accessibility");
  const { speak, pause, resume, stop, isSpeaking, isPaused, currentSection, isSupported } = useSpeech();

  if (!isSupported) return null;

  const isActive = currentSection === sectionId;
  const isThisPaused = isActive && isPaused;
  const isThisPlaying = isActive && isSpeaking && !isPaused;

  const handleClick = () => {
    if (isThisPlaying) {
      pause();
    } else if (isThisPaused) {
      resume();
    } else {
      const text = targetRef.current?.textContent || "";
      if (text.trim()) {
        speak(text, sectionId);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
        isThisPlaying
          ? "bg-pink/10 text-pink border border-pink/30"
          : "bg-grey-lighter/50 text-grey-light hover:bg-grey-lighter hover:text-grey border border-transparent"
      } ${className || ""}`}
      aria-label={isThisPlaying ? t("pause") : isThisPaused ? t("resume") : t("listen")}
      title={isThisPlaying ? t("pause") : isThisPaused ? t("resume") : t("listen")}
    >
      {isThisPlaying ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
      )}
      <span>{isThisPlaying ? t("pause") : isThisPaused ? t("resume") : t("listen")}</span>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/ReadAloudButton.tsx
git commit -m "feat(a11y): add ReadAloudButton component for per-section TTS"
```

### Task 4.3: Create SpeechMiniBar

- [ ] **Step 1: Create `src/components/accessibility/SpeechMiniBar.tsx`**

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useSpeech } from "./SpeechProvider";
import { useAccessibility } from "@/hooks/useAccessibility";

export default function SpeechMiniBar() {
  const t = useTranslations("Accessibility");
  const { isSpeaking, isPaused, pause, resume, stop } = useSpeech();
  const { settings } = useAccessibility();

  if (!isSpeaking && !isPaused) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997] flex items-center gap-3 px-4 py-2.5 bg-white rounded-full shadow-lg border border-grey-lighter"
      role="status"
      aria-live="polite"
    >
      {/* Animated speaker icon */}
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isPaused ? "bg-grey-light" : "bg-pink animate-pulse"}`} />
        <span className="text-xs font-medium text-grey">
          {isPaused ? t("pause") : t("playing")}
        </span>
      </div>

      {/* Pause/Resume */}
      <button
        onClick={isPaused ? resume : pause}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-blackberry text-white hover:bg-blackberry-light transition-colors"
        aria-label={isPaused ? t("resume") : t("pause")}
      >
        {isPaused ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-grey-lighter text-grey hover:bg-grey-lighter/80 transition-colors"
        aria-label={t("stop")}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1" />
        </svg>
      </button>

      {/* Speed indicator */}
      <span className="text-[10px] text-grey-light font-medium px-2 py-0.5 bg-grey-lighter rounded-full">
        {t("speed")}: {t(`speed${settings.speechSpeed.charAt(0).toUpperCase() + settings.speechSpeed.slice(1)}` as any)}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/accessibility/SpeechMiniBar.tsx
git commit -m "feat(a11y): add SpeechMiniBar floating playback controls"
```

---

## Workstream 5: Structural ARIA Fixes

**Files:**
- Modify: `src/components/shared/Accordion.tsx`
- Modify: `src/components/pages/FAQBlockRenderer.tsx`
- Modify: `src/components/home/HeroSlider.tsx`
- Modify: `src/components/doctors/DoctorsListClient.tsx`
- Modify: `src/components/booking/BookingWizard.tsx`

### Task 5.1: Fix Accordion component accessibility

- [ ] **Step 1: Modify `src/components/shared/Accordion.tsx`**

Replace the entire component with this accessible version:

```tsx
"use client";

import { useState, useId } from "react";

interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className = "" }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-btn-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div
            key={index}
            className="border border-grey-lighter rounded-xl overflow-hidden"
          >
            <button
              id={buttonId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left font-medium text-grey hover:bg-pink-light/30 transition-colors cursor-pointer"
            >
              <span className="break-words min-w-0 flex-1">{item.title}</span>
              <svg
                className={`w-5 h-5 text-blackberry transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={`transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
            >
              <div className="p-4 sm:p-5 pt-0 text-grey-light leading-relaxed break-words">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/Accordion.tsx
git commit -m "fix(a11y): add aria-expanded, aria-controls, and region roles to Accordion"
```

### Task 5.2: Fix FAQBlockRenderer accessibility

- [ ] **Step 1: Read `src/components/pages/FAQBlockRenderer.tsx` and apply the same pattern**

Add `useId` import, generate unique IDs for each FAQ item, add `aria-expanded`, `aria-controls`, `role="region"`, and `aria-labelledby` — same pattern as Accordion above. Also add `aria-hidden="true"` to decorative SVG icons.

- [ ] **Step 2: Commit**

```bash
git add src/components/pages/FAQBlockRenderer.tsx
git commit -m "fix(a11y): add aria-expanded and region roles to FAQ block"
```

### Task 5.3: Fix HeroSlider carousel accessibility

- [ ] **Step 1: Read `src/components/home/HeroSlider.tsx` and add carousel ARIA**

Wrap the slider container with:
```tsx
role="region"
aria-roledescription="carousel"
aria-label="Clinic photo gallery"
```

Add to each slide:
```tsx
role="group"
aria-roledescription="slide"
aria-label={`Slide ${index + 1} of ${total}`}
```

Add `aria-label` to navigation dots/buttons (if any). Add `aria-hidden="true"` to decorative elements.

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HeroSlider.tsx
git commit -m "fix(a11y): add carousel ARIA roles to HeroSlider"
```

### Task 5.4: Fix DoctorsListClient filter results announcement

- [ ] **Step 1: Read `src/components/doctors/DoctorsListClient.tsx`**

Find the results count display and wrap it (or add nearby):
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {filteredDoctors.length} {t("doctorsFound")}
</div>
```

This announces to screen readers when the filter changes the result count.

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/DoctorsListClient.tsx
git commit -m "fix(a11y): add aria-live region for doctor filter results"
```

### Task 5.5: Fix BookingWizard step announcements

- [ ] **Step 1: Read `src/components/booking/BookingWizard.tsx`**

Add an `aria-live="polite"` region that announces the current step:
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {t(`step${currentStepName}`)} - Step {currentStep + 1} of {totalSteps}
</div>
```

Place this inside the wizard, updating when `currentStep` changes.

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/BookingWizard.tsx
git commit -m "fix(a11y): add aria-live step announcements to BookingWizard"
```

---

## Workstream 6: Form Accessibility + ReadAloud on Pages + SpeechProvider in Layout

**Files:**
- Modify: `src/components/booking/PersonalInfoStep.tsx`
- Modify: `src/app/(frontend)/[locale]/layout.tsx` (add SpeechProvider + SpeechMiniBar)
- Modify: `src/app/(frontend)/[locale]/about/page.tsx`
- Modify: `src/app/(frontend)/[locale]/doctors/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/services/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/health-library/page.tsx`
- Modify: `src/app/(frontend)/[locale]/blog/[slug]/page.tsx`
- Modify: `src/app/(frontend)/[locale]/checkups/page.tsx`

### Task 6.1: Fix PersonalInfoStep form accessibility

- [ ] **Step 1: Modify `src/components/booking/PersonalInfoStep.tsx`**

Key changes:
1. Wrap the citizenship buttons in `<fieldset>` and `<legend>`:
```tsx
<fieldset>
  <legend className="flex items-center gap-2 text-sm font-semibold text-grey mb-3 break-words">
    {/* svg icon */}
    <span className="break-words min-w-0">{t("citizenship")}</span>
  </legend>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
    {/* buttons become role="radio" with aria-checked */}
  </div>
</fieldset>
```

2. Add `id` to each input and `htmlFor` to each label:
```tsx
<label htmlFor="booking-fullname" className="...">
<input id="booking-fullname" aria-required="true" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? "fullname-error" : undefined} ... />
{errors.fullName && <p id="fullname-error" role="alert">...</p>}
```

3. Same pattern for phone and idNumber inputs:
```tsx
<label htmlFor="booking-phone" ...>
<input id="booking-phone" aria-required="true" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} ... />
{errors.phone && <p id="phone-error" role="alert">...</p>}

<label htmlFor="booking-idnumber" ...>
<input id="booking-idnumber" aria-required="true" aria-invalid={!!errors.idNumber} aria-describedby={errors.idNumber ? "idnumber-error" : undefined} ... />
{errors.idNumber && <p id="idnumber-error" role="alert">...</p>}
```

4. Citizenship buttons get `role="radio"` and `aria-checked`:
```tsx
<button role="radio" aria-checked={isActive} ...>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/booking/PersonalInfoStep.tsx
git commit -m "fix(a11y): add form accessibility - htmlFor, aria-required, aria-invalid, fieldset/legend"
```

### Task 6.2: Add SpeechProvider and SpeechMiniBar to layout

- [ ] **Step 1: Modify `src/app/(frontend)/[locale]/layout.tsx`**

Add imports:
```tsx
import SpeechProvider from "@/components/accessibility/SpeechProvider";
import SpeechMiniBar from "@/components/accessibility/SpeechMiniBar";
```

Wrap children with SpeechProvider inside AccessibilityProvider:
```tsx
<AccessibilityProvider>
  <SpeechProvider>
    <SkipToContent />
    <Header />
    <main id="main-content">{children}</main>
    <Footer />
    <WhatsAppButton />
    <SpeechMiniBar />
    <A11yColorFilters />
  </SpeechProvider>
</AccessibilityProvider>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(frontend)/[locale]/layout.tsx
git commit -m "feat(a11y): add SpeechProvider and SpeechMiniBar to layout"
```

### Task 6.3: Add ReadAloudButton to content pages

- [ ] **Step 1: Add to About page (`src/app/(frontend)/[locale]/about/page.tsx`)**

Since this is a server component, create a small client wrapper. The pattern is:
1. Wrap the description text in a div with a ref
2. Add a ReadAloudButton next to the heading that targets that ref

For server components, you'll need to extract the relevant section into a client component or create a simple client wrapper like:

```tsx
"use client";
import { useRef } from "react";
import ReadAloudButton from "@/components/accessibility/ReadAloudButton";

export function ReadableSection({ children, sectionId }: { children: React.ReactNode; sectionId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ReadAloudButton sectionId={sectionId} targetRef={ref} />
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
}
```

Create this as `src/components/accessibility/ReadableSection.tsx` and use it to wrap text content on:
- About page (clinic description)
- Doctor profile pages (biography section)
- Service detail pages (service description)
- Health library page (condition descriptions)
- Blog article pages (article content)
- Checkups page (package descriptions)

Each page imports `ReadableSection` and wraps the relevant content block.

- [ ] **Step 2: Commit each page modification**

```bash
git add src/components/accessibility/ReadableSection.tsx
git add src/app/(frontend)/[locale]/about/page.tsx
git add src/app/(frontend)/[locale]/doctors/[slug]/page.tsx
git add src/app/(frontend)/[locale]/services/[slug]/page.tsx
git add src/app/(frontend)/[locale]/health-library/page.tsx
git add src/app/(frontend)/[locale]/blog/[slug]/page.tsx
git add src/app/(frontend)/[locale]/checkups/page.tsx
git commit -m "feat(a11y): add ReadAloudButton to content pages via ReadableSection wrapper"
```

---

## Final Integration Notes

After all 6 workstreams complete:

1. **Verify build:** Run `npm run build` — should pass with no errors.
2. **Verify translations:** Check that all 3 JSON files have the `Accessibility` key and are valid JSON.
3. **Manual test:** Start dev server, open the site, click the ♿ button, test each setting, test read-aloud on content pages.
4. **Keyboard test:** Tab through the site — skip link should appear, focus rings should be visible, panel should trap focus.

---

## Dependency Order Between Workstreams

```
Workstream 1 (Foundation)  ─┐
                            ├── Workstream 2 (Providers + Layout) ──┐
Workstream 3 (Panel + UI)  ─┤                                      ├── Final Integration
Workstream 4 (Speech)      ─┤                                      │
Workstream 5 (ARIA fixes)  ─┘── (fully independent)               │
Workstream 6 (Forms + ReadAloud on pages) ─────────────────────────┘
```

**For parallel execution:** All 6 can start simultaneously because:
- Workstreams 1, 3, 4, 5 create/modify different files
- Workstream 2 and 6 both touch `layout.tsx` — Agent 6 should add SpeechProvider AFTER Agent 2 finishes. If running truly in parallel, Agent 6 should read layout.tsx fresh before modifying it.
- Potential conflict: Workstream 2 and 6 on `layout.tsx`. Solution: Workstream 2 creates the base layout integration (AccessibilityProvider, SkipToContent, A11yColorFilters). Workstream 6 adds SpeechProvider + SpeechMiniBar on top. If they conflict, the later agent simply reads the updated file and adds its parts.
