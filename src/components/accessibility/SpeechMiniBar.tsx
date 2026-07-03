"use client";

import { useTranslations } from "next-intl";
import { useSpeech } from "./SpeechProvider";
import { useAccessibility } from "@/hooks/useAccessibility";

export default function SpeechMiniBar() {
  const t = useTranslations("Accessibility");
  const { isSpeaking, isPaused, pause, resume, stop, error } = useSpeech();
  const { settings } = useAccessibility();

  if (!isSpeaking && !isPaused) return null;

  /* ── Error state: TTS unavailable for this language ── */
  if (error) {
    return (
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997] flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-lg border border-red-200"
        role="alert"
        aria-live="assertive"
      >
        <svg
          className="w-5 h-5 text-red-500 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <span className="text-sm text-red-700 font-medium">
          {t("ttsUnavailable")}
        </span>
        <button
          onClick={stop}
          className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-grey-light hover:text-grey hover:bg-grey-lighter transition-colors"
          aria-label={t("close")}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  /* ── Normal playback state ── */
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997] flex items-center gap-3 px-4 py-2.5 bg-white rounded-full shadow-lg border border-grey-lighter"
      role="status"
      aria-live="polite"
    >
      {/* Animated speaker icon */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            isPaused ? "bg-grey-light" : "bg-pink animate-pulse"
          }`}
        />
        <span className="text-xs font-medium text-grey">
          {isPaused ? t("pause") : t("playing")}
        </span>
      </div>

      {/* Pause / Resume */}
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
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25v13.5m-7.5-13.5v13.5"
            />
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
        {t("speed")}:{" "}
        {t(
          `speed${settings.speechSpeed.charAt(0).toUpperCase() + settings.speechSpeed.slice(1)}` as Parameters<typeof t>[0]
        )}
      </span>
    </div>
  );
}
