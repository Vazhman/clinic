import { NextRequest, NextResponse } from "next/server";

/**
 * TTS proxy — tries multiple backends in order:
 *
 * 1. Google Translate TTS (free, no auth — works for en, ru but NOT Georgian)
 * 2. Google Cloud TTS (needs GOOGLE_TTS_API_KEY env var — works for all including ka-GE)
 *
 * GET /api/tts?text=...&lang=ka
 */

const CLOUD_TTS_LANG_MAP: Record<string, string> = {
  ka: "ka-GE",
  en: "en-US",
  ru: "ru-RU",
};

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text");
  const lang = req.nextUrl.searchParams.get("lang") || "ka";

  if (!text?.trim()) {
    return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
  }

  const clamped = text.trim();

  /* ── 1. Google Translate TTS (free, unauthenticated) ── */
  try {
    const translateUrl = new URL("https://translate.google.com/translate_tts");
    translateUrl.searchParams.set("ie", "UTF-8");
    translateUrl.searchParams.set("tl", lang);
    translateUrl.searchParams.set("client", "tw-ob");
    translateUrl.searchParams.set("q", clamped.substring(0, 200));

    const res = await fetch(translateUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 0) {
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }
  } catch {
    // Swallow — try next backend
  }

  /* ── 2. Google Cloud TTS (needs API key, supports Georgian) ── */
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (apiKey) {
    try {
      const languageCode = CLOUD_TTS_LANG_MAP[lang] || `${lang}-${lang.toUpperCase()}`;
      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: clamped.substring(0, 5000) },
            voice: { languageCode },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as { audioContent?: string };
        if (data.audioContent) {
          const audioBuffer = Buffer.from(data.audioContent, "base64");
          return new NextResponse(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      }
    } catch {
      // Swallow
    }
  }

  /* ── All backends failed ── */
  return NextResponse.json(
    { error: "TTS not available for this language" },
    { status: 501 }
  );
}
