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
  readMode: boolean; // true = click any text to hear it read aloud
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
  readMode: false,
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

  // Font scale — only set when non-default to avoid hydration mismatch
  if (settings.fontSize === "default") {
    html.style.removeProperty("--a11y-font-scale");
  } else {
    html.style.setProperty("--a11y-font-scale", FONT_SCALE_MAP[settings.fontSize]);
  }

  // Line height
  if (settings.lineHeight === "default") {
    html.style.removeProperty("--a11y-line-height");
  } else {
    html.style.setProperty("--a11y-line-height", LINE_HEIGHT_MAP[settings.lineHeight]);
  }

  // Letter spacing
  if (settings.letterSpacing === "default") {
    html.style.removeProperty("--a11y-letter-spacing");
  } else {
    html.style.setProperty("--a11y-letter-spacing", LETTER_SPACING_MAP[settings.letterSpacing]);
  }

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

  // Read mode — adds class for cursor change
  html.classList.toggle("a11y-read-mode", settings.readMode);
}
