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
