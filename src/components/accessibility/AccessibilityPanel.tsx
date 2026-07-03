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

  // Focus trap + Escape key + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
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
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-[fadeIn_0.2s_ease]"
        aria-hidden="true"
      />

      {/* Modal — clicking the wrapper outside the panel closes the dialog,
          which is what users expect from a modal. The previous implementation
          had click-to-close on the backdrop, but the wrapper above it was
          intercepting every click. */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={t("title")}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-[modalIn_0.25s_cubic-bezier(0.16,1,0.3,1)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-grey-lighter shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-blackberry flex items-center gap-2.5">
              <svg className="w-6 h-6 text-blackberry" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="4" r="2" />
                <path d="M12 7c-1.5 0-4.5.5-5.5 1L8 11l-2 6h2.5l1-4h1V21h3v-8h1v8h3v-8.5l1 4.5H21l-2-6 1.5-3c-1-.5-4-1-5.5-1H12z" />
              </svg>
              {t("title")}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-grey-lighter transition-colors"
              aria-label={t("close")}
            >
              <svg className="w-5 h-5 text-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="overflow-y-auto flex-1 px-5 sm:px-7 py-5 sm:py-6 space-y-5">
            {/* Read Mode — click any text to hear it */}
            <SettingSection label={t("readAloud")} icon={<SpeakerIcon />}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-grey-light">{t("readModeHint")}</span>
                  <Toggle
                    checked={settings.readMode}
                    onChange={(v) => updateSetting("readMode", v)}
                  />
                </div>
                {settings.readMode && (
                  <SegmentedControl
                    options={[
                      { value: "slow", label: t("speedSlow") },
                      { value: "normal", label: t("speedNormal") },
                      { value: "fast", label: t("speedFast") },
                    ]}
                    value={settings.speechSpeed}
                    onChange={(v) => updateSetting("speechSpeed", v as A11ySettings["speechSpeed"])}
                  />
                )}
              </div>
            </SettingSection>

            {/* Font Size */}
            <SettingSection label={t("fontSize")} icon={<FontIcon />}>
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
            <SettingSection label={t("contrast")} icon={<ContrastIcon />}>
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
            <SettingSection label={t("dyslexiaFont")} icon={<BookIcon />}>
              <Toggle
                checked={settings.dyslexiaFont}
                onChange={(v) => updateSetting("dyslexiaFont", v)}
              />
            </SettingSection>

            {/* Content Spacing */}
            <SettingSection label={t("contentSpacing")} icon={<SpacingIcon />}>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-grey-light mb-1 block">{t("lineHeight")}</span>
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
                  <span className="text-xs text-grey-light mb-1 block">{t("letterSpacing")}</span>
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
            <SettingSection label={t("animationsPause")} icon={<AnimationIcon />}>
              <Toggle
                checked={!settings.animations}
                onChange={(v) => updateSetting("animations", !v)}
              />
            </SettingSection>

            {/* Highlight Links */}
            <SettingSection label={t("highlightLinks")} icon={<LinkIcon />}>
              <Toggle
                checked={settings.highlightLinks}
                onChange={(v) => updateSetting("highlightLinks", v)}
              />
            </SettingSection>

            {/* Color Vision */}
            <SettingSection label={t("colorVision")} icon={<EyeIcon />}>
              <select
                value={settings.colorVision}
                onChange={(e) => updateSetting("colorVision", e.target.value as A11ySettings["colorVision"])}
                className="w-full px-3 py-2.5 rounded-xl border border-grey-lighter text-sm bg-white focus:border-blackberry focus:ring-2 focus:ring-blackberry/10 outline-none transition-all"
              >
                <option value="normal">{t("colorNormal")}</option>
                <option value="protanopia">{t("colorProtanopia")}</option>
                <option value="deuteranopia">{t("colorDeuteranopia")}</option>
                <option value="tritanopia">{t("colorTritanopia")}</option>
                <option value="monochromacy">{t("colorMonochromacy")}</option>
              </select>
            </SettingSection>
          </div>

          {/* Footer — Reset button */}
          <div className="px-5 sm:px-7 py-4 border-t border-grey-lighter shrink-0">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-grey-light hover:text-grey hover:bg-grey-lighter/50 transition-colors border border-grey-lighter"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {t("resetAll")}
            </button>
            {showResetConfirm && (
              <p className="text-center text-xs text-green-600 mt-2 font-medium" role="status" aria-live="polite">
                ✓ {t("resetConfirm")}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function SettingSection({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-pink-light/60 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-grey block mb-2">{label}</span>
        {children}
      </div>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex rounded-xl border border-grey-lighter overflow-hidden" role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2.5 px-2 text-xs font-medium transition-all duration-200 ${
            value === opt.value
              ? "bg-blackberry text-white shadow-sm"
              : "bg-white text-grey hover:bg-pink-light/30"
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
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
        checked ? "bg-blackberry" : "bg-grey-lighter"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── Icons ── */
function SpeakerIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>;
}
function FontIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h6m6 0h6M9 21V3m6 18V3M9 3h6" /></svg>;
}
function ContrastIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0-18a9 9 0 019 9 9 9 0 01-9 9" /><path fill="currentColor" d="M12 3a9 9 0 000 18V3z" /></svg>;
}
function BookIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
}
function SpacingIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>;
}
function AnimationIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>;
}
function LinkIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.136-1.065a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364l1.757 1.757" /></svg>;
}
function EyeIcon() {
  return <svg className="w-4 h-4 text-blackberry" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
