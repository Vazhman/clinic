"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { SPEECH_RATE_MAP } from "@/lib/a11y-settings";
import { useAccessibility } from "@/hooks/useAccessibility";

/* ─── Public context ─── */

export interface SpeechContextValue {
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  /** Non-null when TTS failed for the current language */
  error: string | null;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function useSpeech(): SpeechContextValue {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error("useSpeech must be used within SpeechProvider");
  return ctx;
}

/* ─── Language config ─── */

interface LangConfig {
  voiceTags: string[];
  bcp47: string;
  ttsCode: string;
}

const LOCALE_LANG: Record<string, LangConfig> = {
  ge: { voiceTags: ["ka-GE", "ka"], bcp47: "ka-GE", ttsCode: "ka" },
  en: { voiceTags: ["en-US", "en-GB", "en"], bcp47: "en-US", ttsCode: "en" },
  ru: { voiceTags: ["ru-RU", "ru"], bcp47: "ru-RU", ttsCode: "ru" },
};

/* ─── Helpers ─── */

/**
 * Find a voice matching the given language tags ONLY.
 * Returns null if none found — never falls back to a wrong language
 * (an English voice can't read Georgian script).
 */
function findVoice(
  voices: SpeechSynthesisVoice[],
  tags: string[]
): SpeechSynthesisVoice | null {
  for (const tag of tags) {
    const t = tag.toLowerCase();
    const prefix = t.split("-")[0];
    const match = voices.find((v) => {
      const vl = v.lang.toLowerCase();
      return vl === t || vl.startsWith(prefix + "-");
    });
    if (match) return match;
  }
  return null;
}

/** Split text into <=180-char chunks at sentence / word boundaries. */
function splitText(text: string, max = 180): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    if (rest.length <= max) {
      chunks.push(rest);
      break;
    }
    let cut = -1;
    for (const sep of [". ", "! ", "? ", ".\n", "!\n", "?\n"]) {
      const i = rest.lastIndexOf(sep, max);
      if (i > 0) {
        cut = i + sep.length;
        break;
      }
    }
    if (cut <= 0) {
      const comma = rest.lastIndexOf(", ", max);
      if (comma > 0) cut = comma + 2;
    }
    if (cut <= 0) {
      const space = rest.lastIndexOf(" ", max);
      if (space > 0) cut = space + 1;
    }
    if (cut <= 0) cut = max;
    chunks.push(rest.substring(0, cut).trim());
    rest = rest.substring(cut).trim();
  }
  return chunks.filter(Boolean);
}

/** Elements readable in click-to-read mode */
const READABLE_SELECTOR =
  "p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote, figcaption, label, span, div";

/* ─── Provider ─── */

export default function SpeechProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const { settings } = useAccessibility();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const utteranceIdRef = useRef(0);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentElementRef = useRef<HTMLElement | null>(null);
  const modeRef = useRef<"speech" | "audio" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasSpeechAPI =
    typeof window !== "undefined" && "speechSynthesis" in window;

  /* ── Load Web Speech voices ── */
  useEffect(() => {
    if (!hasSpeechAPI) return;
    const load = () => {
      const v = speechSynthesis.getVoices();
      if (v.length > 0) voicesRef.current = v;
    };
    load();
    speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", load);
      speechSynthesis.cancel();
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, [hasSpeechAPI]);

  /* ── Cleanup helpers ── */
  const clearHighlight = useCallback(() => {
    if (currentElementRef.current) {
      currentElementRef.current.classList.remove("a11y-reading");
      currentElementRef.current = null;
    }
  }, []);

  const finalize = useCallback(
    (id: number) => {
      if (utteranceIdRef.current !== id) return;
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      clearHighlight();
      modeRef.current = null;
      audioRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
    },
    [clearHighlight]
  );

  /** Show a temporary error for 4 seconds, then clear everything. */
  const showError = useCallback(
    (id: number) => {
      if (utteranceIdRef.current !== id) return;
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      clearHighlight();
      modeRef.current = null;
      audioRef.current = null;
      setIsPaused(false);
      // Keep isSpeaking true so MiniBar stays visible — it'll show error
      setError("ttsUnavailable");
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        setIsSpeaking(false);
        setError(null);
      }, 4000);
    },
    [clearHighlight]
  );

  /* ── Audio fallback: play chunks from /api/tts ── */
  const playAudioChunks = useCallback(
    (chunks: string[], lang: string, id: number, index = 0) => {
      if (utteranceIdRef.current !== id || index >= chunks.length) {
        finalize(id);
        return;
      }
      modeRef.current = "audio";

      const url = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(chunks[index])}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.playbackRate = SPEECH_RATE_MAP[settings.speechSpeed];

      audio.onended = () => {
        if (utteranceIdRef.current !== id) return;
        playAudioChunks(chunks, lang, id, index + 1);
      };

      audio.onerror = () => {
        // Audio failed — TTS not available for this language
        showError(id);
      };

      audio.play().catch(() => {
        showError(id);
      });
    },
    [settings.speechSpeed, finalize, showError]
  );

  /* ── Main speak ── */
  const speak = useCallback(
    (text: string, element?: HTMLElement) => {
      if (!text?.trim()) return;

      // Cancel any previous playback
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (hasSpeechAPI) speechSynthesis.cancel();
      clearHighlight();
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      setError(null);

      const thisId = ++utteranceIdRef.current;
      const langCfg = LOCALE_LANG[locale] || LOCALE_LANG.en;
      const cleanText = text.trim();

      // Highlight
      if (element) {
        element.classList.add("a11y-reading");
        currentElementRef.current = element;
      }

      setIsSpeaking(true);
      setIsPaused(false);

      /* ── Try Web Speech API ── */
      if (hasSpeechAPI) {
        const voices =
          voicesRef.current.length > 0
            ? voicesRef.current
            : speechSynthesis.getVoices();
        if (voices.length > 0) voicesRef.current = voices;

        // Only use a voice that MATCHES the target language
        const voice = findVoice(voices, langCfg.voiceTags);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = langCfg.bcp47;
        if (voice) utterance.voice = voice;
        utterance.rate = SPEECH_RATE_MAP[settings.speechSpeed];
        utterance.pitch = 1;
        utterance.volume = 1;

        const t0 = Date.now();

        /** Fall through to /api/tts audio */
        const tryAudioFallback = () => {
          if (utteranceIdRef.current !== thisId) return;
          if (keepAliveRef.current) clearInterval(keepAliveRef.current);
          const chunks = splitText(cleanText);
          playAudioChunks(chunks, langCfg.ttsCode, thisId);
        };

        utterance.onend = () => {
          if (utteranceIdRef.current !== thisId) return;
          const elapsed = Date.now() - t0;
          // If it finished in under 800 ms for non-trivial text, the voice
          // couldn't handle the script (e.g. no ka-GE voice at all).
          if (elapsed < 800 && cleanText.length > 15) {
            tryAudioFallback();
            return;
          }
          finalize(thisId);
        };

        utterance.onerror = (e) => {
          if (utteranceIdRef.current !== thisId) return;
          if (e.error === "interrupted" || e.error === "canceled") return;
          tryAudioFallback();
        };

        // MUST be synchronous inside click handler (user gesture for Chrome)
        speechSynthesis.resume();
        speechSynthesis.speak(utterance);

        // Chrome 15-second timeout workaround
        keepAliveRef.current = setInterval(() => {
          if (!speechSynthesis.speaking) {
            if (keepAliveRef.current) clearInterval(keepAliveRef.current);
            return;
          }
          speechSynthesis.pause();
          speechSynthesis.resume();
        }, 10_000);

        modeRef.current = "speech";
        return;
      }

      /* ── No Web Speech API — straight to audio ── */
      const chunks = splitText(cleanText);
      playAudioChunks(chunks, langCfg.ttsCode, thisId);
    },
    [
      hasSpeechAPI,
      locale,
      settings.speechSpeed,
      clearHighlight,
      finalize,
      playAudioChunks,
    ]
  );

  /* ── Controls ── */
  const pause = useCallback(() => {
    if (modeRef.current === "audio" && audioRef.current) {
      audioRef.current.pause();
    } else if (hasSpeechAPI) {
      speechSynthesis.pause();
    }
    setIsPaused(true);
  }, [hasSpeechAPI]);

  const resume = useCallback(() => {
    if (modeRef.current === "audio" && audioRef.current) {
      audioRef.current.play().catch(() => {});
    } else if (hasSpeechAPI) {
      speechSynthesis.resume();
    }
    setIsPaused(false);
  }, [hasSpeechAPI]);

  const stop = useCallback(() => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (hasSpeechAPI) speechSynthesis.cancel();
    clearHighlight();
    utteranceIdRef.current++;
    modeRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
    setError(null);
  }, [hasSpeechAPI, clearHighlight]);

  /* ── Global click-to-read ── */
  useEffect(() => {
    if (!settings.readMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "button, a, input, select, textarea, [role='dialog'], .skip-to-content, nav"
        )
      )
        return;

      const readable = target.closest(READABLE_SELECTOR) as HTMLElement | null;
      if (!readable) return;

      const txt = readable.textContent || "";
      if (!txt.trim()) return;

      e.preventDefault();
      e.stopPropagation();
      speak(txt, readable);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [settings.readMode, speak]);

  // Stop when readMode toggled off
  useEffect(() => {
    if (!settings.readMode && isSpeaking) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.readMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  /* ── Context ── */
  const contextValue: SpeechContextValue = {
    speak: (text: string) => speak(text),
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported: true,
    error,
  };

  return (
    <SpeechContext.Provider value={contextValue}>
      {children}
    </SpeechContext.Provider>
  );
}
