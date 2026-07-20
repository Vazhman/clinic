"use client";

/**
 * Full-page AI experience at /ai-assistant — same backend (/api/chat) and
 * message rendering as the floating <ChatAssistant /> widget (shared via
 * ./chat-ui), just laid out as a large standalone panel instead of a
 * collapsible launcher. Meant to be linked to directly (QR code, SMS,
 * social bio link, etc.), not just discovered via the widget.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { messageText, renderLine, ChatIcon } from "./chat-ui";

export default function AiAssistantFullPage() {
  const t = useTranslations("ChatAssistant");
  const locale = useLocale();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { locale },
    }),
  });

  const busy = status === "submitted" || status === "streaming";
  const lastMsg = messages[messages.length - 1];
  const lastAssistantText = lastMsg && lastMsg.role === "assistant" ? messageText(lastMsg).trim() : "";
  const showTyping = busy && lastAssistantText === "";

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

  const suggestions = [t("suggestion1"), t("suggestion2"), t("suggestion3")];

  return (
    <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-blackberry/10 border border-grey-lighter flex flex-col overflow-hidden h-[75vh] min-h-[480px] max-h-[860px]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <ChatIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight truncate">{t("headerTitle")}</p>
          <p className="text-[12px] text-white/70 leading-tight truncate">{t("headerSubtitle")}</p>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-3 bg-cream/30">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-grey-lighter max-w-[88%]">
              <p className="text-[14px] text-grey leading-relaxed whitespace-pre-line">{t("welcome")}</p>
            </div>
            <div className="space-y-1.5 pt-1 max-w-sm">
              <p className="text-[10px] font-bold text-grey-light tracking-[0.15em] uppercase pl-1">
                {t("suggestionsLabel")}
              </p>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubmit(s)}
                  disabled={busy}
                  className="block w-full text-left text-[14px] text-blackberry bg-white hover:bg-pink-light disabled:opacity-50 disabled:cursor-not-allowed border border-pink/20 hover:border-pink rounded-xl px-4 py-3 transition-colors"
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
            <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  isUser
                    ? "max-w-[80%] bg-blackberry text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-[14px] leading-relaxed shadow-sm"
                    : "max-w-[88%] bg-white text-grey rounded-2xl rounded-tl-md px-4 py-3 text-[14px] leading-relaxed shadow-sm border border-grey-lighter"
                }
              >
                {text.split("\n").map((line, i) => renderLine(line, locale, t("bookCta"), `${m.id}-${i}`))}
              </div>
            </div>
          );
        })}

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
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-[13px] max-w-[88%]">
            {t("errorGeneric")}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-5 pt-2 pb-1 bg-cream/30 shrink-0">
        <p className="text-[11px] text-grey-light/70 leading-relaxed text-center">{t("disclaimer")}</p>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(input);
        }}
        className="border-t border-grey-lighter px-4 py-3 flex items-center gap-2.5 bg-white shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("inputPlaceholder")}
          disabled={busy}
          className="flex-1 min-w-0 px-4 py-3 text-[14px] text-grey bg-grey-lighter/40 focus:bg-white rounded-full outline-none focus:ring-2 focus:ring-pink/40 placeholder:text-grey-light/60 transition-colors disabled:opacity-60"
          autoComplete="off"
          aria-label={t("inputLabel")}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="w-11 h-11 rounded-full bg-pink hover:bg-pink/90 disabled:bg-grey-lighter disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 transition-colors"
          aria-label={t("sendLabel")}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
