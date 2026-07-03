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
