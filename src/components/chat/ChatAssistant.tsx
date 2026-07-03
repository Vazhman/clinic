"use client";

/**
 * Floating AI chat widget.
 *
 * Sits at bottom-right, stacked above the WhatsApp button. Tapping the
 * launcher opens a panel with a streaming chat to /api/chat.
 *
 * Rendering choices:
 *  - Assistant messages are plain text (system prompt forbids markdown), but
 *    we detect URL-shaped strings on their own line and render them as
 *    branded "Book this slot" buttons. That's why the backend tools return
 *    relative booking URLs and the system prompt is told to put them on
 *    their own line.
 *  - Hidden on /booking — same rule as WhatsAppButton — so the launcher
 *    doesn't sit on top of the wizard's submit button.
 *  - On mobile (<sm) the panel goes near-fullscreen so the keyboard
 *    doesn't compress the message log into nothing.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Link as IntlLink } from "@/i18n/navigation";
import { localizeName } from "@/lib/translit-ka";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

// ── Visual constants ───────────────────────────────────────────────────────

const Z_INDEX_LAUNCHER = 40;
const Z_INDEX_PANEL = 50;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Pull all text out of a UI message's parts. v6 messages are arrays of
 * `{ type: 'text', text }` and tool-call parts; we only render the text
 * parts. Tool calls/results are intentionally not surfaced to the user —
 * the model already mentions doctor names and times in its text reply,
 * so showing the raw tool JSON would be noise.
 */
function messageText(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * Render a single line of assistant text. If the line looks like a
 * relative booking URL (/[locale]/booking?...), render it as a primary
 * action button. Anything else → plain text.
 *
 * We intentionally only accept paths that start with /ge/booking,
 * /en/booking, or /ru/booking so the model can't trick us into rendering
 * arbitrary external links as styled buttons.
 */
/**
 * Doctor card — rendered when the assistant emits a /[locale]/doctors/[slug]
 * line. Fetches the real doctor record by slug (photo/name come from the CMS,
 * not model output) and links to the localized profile.
 */
function DoctorCard({ slug, locale }: { slug: string; locale: string }) {
  const [doc, setDoc] = useState<{ name: string; specialty?: string; photo?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/doctors?where[slug][equals]=${encodeURIComponent(slug)}&depth=1&limit=1&locale=${locale}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((j: { docs?: Array<{ name?: string; specialty?: string; photo?: { url?: string } | null }> }) => {
        const d = j.docs?.[0];
        if (!d || cancelled) return;
        setDoc({
          name: localizeName(String(d.name ?? ""), locale),
          specialty: d.specialty ? localizeName(String(d.specialty), locale) : undefined,
          photo: typeof d.photo === "object" && d.photo ? d.photo.url ?? undefined : undefined,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  if (!doc) return null;

  return (
    <IntlLink
      href={{ pathname: "/doctors/[slug]", params: { slug } }}
      className="my-1.5 flex items-center gap-3 bg-white border border-pink/20 hover:border-pink rounded-2xl p-2.5 transition-colors no-underline shadow-sm"
    >
      {doc.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={doc.photo} alt={doc.name} className="w-12 h-12 rounded-xl object-cover object-top shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-pink-light shrink-0" />
      )}
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-blackberry truncate">{doc.name}</p>
        {doc.specialty && <p className="text-[11px] text-pink font-medium truncate">{doc.specialty}</p>}
      </div>
      <svg className="w-4 h-4 text-grey-light ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </IntlLink>
  );
}

function renderLine(line: string, locale: string, bookCta: string, key: string) {
  const trimmed = line.trim();
  const safe = new RegExp(`^/(ge|en|ru)/booking($|\\?)`).test(trimmed);
  if (safe) {
    return (
      <Link
        key={key}
        href={trimmed}
        className="my-1 inline-flex items-center gap-1.5 bg-pink hover:bg-pink/90 text-white text-[13px] font-bold px-4 py-2 rounded-full transition-colors shadow-sm"
      >
        {bookCta}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    );
  }
  const doctorMatch = trimmed.match(/^\/(?:ge|en|ru)\/doctors\/([\w-]+)(?:\?.*)?$/);
  if (doctorMatch) {
    return <DoctorCard key={key} slug={doctorMatch[1]} locale={locale} />;
  }
  return (
    <span key={key} className="block">
      {line || " "}
    </span>
  );
}

// ── Icon ───────────────────────────────────────────────────────────────────

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ChatAssistant() {
  const t = useTranslations("ChatAssistant");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { locale },
    }),
  });

  const busy = status === "submitted" || status === "streaming";
  // Show the "thinking" dots whenever we're waiting AND no assistant text is
  // streaming yet. This covers the multi-tool phase (status:'streaming' with
  // only tool-call parts and no text), which previously showed nothing and
  // looked frozen while the model chained list_services → list_doctors →
  // availability.
  const lastMsg = messages[messages.length - 1];
  const lastAssistantText =
    lastMsg && lastMsg.role === "assistant" ? messageText(lastMsg).trim() : "";
  const showTyping = busy && lastAssistantText === "";

  // Auto-scroll to bottom on new messages or streaming chunks.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
  ];

  return (
    <>
      {/* Launcher button — stacked above WhatsApp (bottom-4 → ~64px gap) */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: open ? 0 : 1, scale: open ? 0.8 : 1, y: open ? 20 : 0 }}
        transition={{ delay: 1.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-[68px] right-4 sm:bottom-[80px] sm:right-6 lg:bottom-[88px] lg:right-7 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-2xl sm:rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-blackberry/30 hover:shadow-2xl hover:shadow-blackberry/40 transition-shadow duration-300"
        style={{
          zIndex: Z_INDEX_LAUNCHER,
          background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)",
          pointerEvents: open ? "none" : "auto",
        }}
        aria-label={t("openLabel")}
      >
        <ChatIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        {/* Tiny "AI" badge */}
        <span className="absolute -top-1.5 -right-1.5 bg-white text-blackberry text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow ring-1 ring-blackberry/10">
          AI
        </span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 bottom-3 top-3 sm:inset-auto sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6 sm:top-auto sm:w-[380px] sm:h-[600px] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden border border-grey-lighter"
            style={{ zIndex: Z_INDEX_PANEL }}
            role="dialog"
            aria-label={t("panelLabel")}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 text-white"
              style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ChatIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold leading-tight truncate">{t("headerTitle")}</p>
                  <p className="text-[11px] text-white/70 leading-tight truncate">{t("headerSubtitle")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center transition-colors shrink-0"
                aria-label={t("closeLabel")}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Message list */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cream/30">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-grey-lighter">
                    <p className="text-[13px] text-grey leading-relaxed whitespace-pre-line">
                      {t("welcome")}
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-grey-light tracking-[0.15em] uppercase pl-1">
                      {t("suggestionsLabel")}
                    </p>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSubmit(s)}
                        disabled={busy}
                        className="block w-full text-left text-[13px] text-blackberry bg-white hover:bg-pink-light disabled:opacity-50 disabled:cursor-not-allowed border border-pink/20 hover:border-pink rounded-xl px-3.5 py-2.5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                const text = messageText(m);
                if (!text) return null;
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={
                        isUser
                          ? "max-w-[80%] bg-blackberry text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-[13px] leading-relaxed shadow-sm"
                          : "max-w-[88%] bg-white text-grey rounded-2xl rounded-tl-md px-4 py-3 text-[13px] leading-relaxed shadow-sm border border-grey-lighter"
                      }
                    >
                      {text.split("\n").map((line, i) =>
                        renderLine(line, locale, t("bookCta"), `${m.id}-${i}`),
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator — visible through the whole thinking phase
                  (submitted + tool-call streaming), until text starts. */}
              {showTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-grey-lighter rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-pink animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-[12px]">
                  {t("errorGeneric")}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="px-4 pt-2 pb-1 bg-cream/30">
              <p className="text-[10px] text-grey-light/70 leading-relaxed text-center">
                {t("disclaimer")}
              </p>
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(input);
              }}
              className="border-t border-grey-lighter px-3 py-2.5 flex items-center gap-2 bg-white"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputPlaceholder")}
                disabled={busy}
                className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] text-grey bg-grey-lighter/40 focus:bg-white rounded-full outline-none focus:ring-2 focus:ring-pink/40 placeholder:text-grey-light/60 transition-colors disabled:opacity-60"
                autoComplete="off"
                aria-label={t("inputLabel")}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="w-10 h-10 rounded-full bg-pink hover:bg-pink/90 disabled:bg-grey-lighter disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors"
                aria-label={t("sendLabel")}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
