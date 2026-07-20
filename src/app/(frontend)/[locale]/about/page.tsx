import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import StructuredData from "@/components/shared/StructuredData";
import { generateBreadcrumbSchema, generateClinicSchema } from "@/lib/structured-data";
import { buildLocalizedAlternates, type Locale } from "@/lib/seo-helpers";
import { getAboutPage } from "@/lib/payload-data";

// Lexical TextNode format bitmask (matches @payloadcms/richtext-lexical's
// NodeFormat: bold=1, italic=2, strikethrough=4, underline=8, code=16).
type LexicalNode = {
  type?: string;
  text?: string;
  format?: number;
  children?: LexicalNode[];
  fields?: { url?: string; newTab?: boolean };
  url?: string;
  tag?: string;
  listType?: string;
};

// Renders one Lexical inline node (text/link/linebreak) to JSX, preserving
// bold/italic/underline/strikethrough/code/links. Used ONLY for the About
// hero + story-continuation paragraphs below, which have bespoke Tailwind
// typography that doesn't fit LexicalContent's `prose` wrapper — this keeps
// the custom layout while fixing the actual bug (formatting silently
// dropped by the plain-text extractor previously used for these sections).
function renderInlineLexicalNode(node: LexicalNode, key: number): ReactNode {
  if (node.type === "linebreak") return <br key={key} />;
  if (node.type === "text" && typeof node.text === "string") {
    let el: ReactNode = node.text;
    const format = node.format ?? 0;
    if (format & 16) el = <code key={`code-${key}`}>{el}</code>;
    if (format & 1) el = <strong key={`b-${key}`}>{el}</strong>;
    if (format & 2) el = <em key={`i-${key}`}>{el}</em>;
    if (format & 8)
      el = (
        <span key={`u-${key}`} style={{ textDecoration: "underline" }}>
          {el}
        </span>
      );
    if (format & 4)
      el = (
        <span key={`s-${key}`} style={{ textDecoration: "line-through" }}>
          {el}
        </span>
      );
    return <span key={key}>{el}</span>;
  }
  if (node.type === "link" && Array.isArray(node.children)) {
    const url = node.fields?.url ?? node.url ?? "#";
    return (
      <a
        key={key}
        href={url}
        className="underline hover:no-underline"
        target={node.fields?.newTab ? "_blank" : undefined}
        rel={node.fields?.newTab ? "noopener noreferrer" : undefined}
      >
        {node.children.map((c, i) => renderInlineLexicalNode(c, i))}
      </a>
    );
  }
  if (Array.isArray(node.children)) {
    return <span key={key}>{node.children.map((c, i) => renderInlineLexicalNode(c, i))}</span>;
  }
  return null;
}

// "list" blocks need an actual <ol>/<ul><li> structure — falling through to
// the generic children-array branch above would flatten listitem nodes into
// plain concatenated <span>s with no bullets/numbering.
function renderListBlock(node: LexicalNode, key: number): ReactNode {
  const Tag = node.tag === "ol" || node.listType === "number" ? "ol" : "ul";
  const listClass = Tag === "ol" ? "list-decimal list-outside pl-5 space-y-1" : "list-disc list-outside pl-5 space-y-1";
  return (
    <Tag key={key} className={listClass}>
      {(node.children ?? []).map((li, i) => (
        <li key={i}>{(li.children ?? []).map((c, j) => renderInlineLexicalNode(c, j))}</li>
      ))}
    </Tag>
  );
}

// One entry per top-level Lexical block (paragraph/heading/list/etc.) so
// callers can split "first paragraph" (hero lead) from "rest" (story
// continuation) exactly like extractLexicalParagraphs did, but returning
// renderable nodes instead of flattened strings.
//
// `isBlock: true` (list blocks) means the entry is already a complete
// block-level element (e.g. <ol>) — callers must render it directly, NOT
// inside their own <p> wrapper, since nesting <ol>/<ul> inside <p> is
// invalid HTML and triggers a React hydration mismatch.
type LexicalParagraphEntry = { isBlock: boolean; nodes: ReactNode[] };

function extractLexicalParagraphNodes(rt: unknown): LexicalParagraphEntry[] {
  if (!rt || typeof rt !== "object") return [];
  const root = (rt as { root?: { children?: LexicalNode[] } }).root;
  const blocks = Array.isArray(root?.children) ? root!.children : [];
  return blocks
    .map((b): LexicalParagraphEntry => {
      if (b.type === "list") return { isBlock: true, nodes: [renderListBlock(b, 0)] };
      return {
        isBlock: false,
        nodes: Array.isArray(b.children) ? b.children.map((c, i) => renderInlineLexicalNode(c, i)) : [],
      };
    })
    .filter((entry) => entry.nodes.length > 0);
}

// Walk a Lexical richText tree and concatenate plain text nodes. Mirrors the
// extractor used for doctor biographies in payload-data.ts. Returns "" when
// the input is empty or unrecognised so the caller can fall back to next-intl.
function extractLexicalText(rt: unknown): string {
  if (typeof rt === "string") return rt;
  if (!rt || typeof rt !== "object") return "";
  const out: string[] = [];
  const walk = (n: unknown): void => {
    if (!n || typeof n !== "object") return;
    const node = n as { text?: unknown; children?: unknown };
    if (typeof node.text === "string") out.push(node.text);
    if (Array.isArray(node.children)) for (const c of node.children) walk(c);
  };
  const root = (rt as { root?: unknown }).root;
  walk(root ?? rt);
  return out.join(" ").replace(/\s+/g, " ").trim();
}

// Split the Lexical description into paragraphs (one string per block-level
// child) so the lead can render real paragraph breaks instead of one run-on.
function extractLexicalParagraphs(rt: unknown): string[] {
  if (typeof rt === "string") return rt ? [rt] : [];
  if (!rt || typeof rt !== "object") return [];
  const root = (rt as { root?: { children?: unknown } }).root;
  const blocks = Array.isArray(root?.children) ? root!.children : [];
  const paras = blocks
    .map((b) => extractLexicalText(b))
    .map((s) => s.trim())
    .filter(Boolean);
  if (paras.length) return paras;
  const t = extractLexicalText(rt);
  return t ? [t] : [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const aboutCms = await getAboutPage(locale as Locale);

  const clinicName: Record<string, string> = {
    ge: "ხოზრევანიძის კლინიკა",
    en: "Khozrevanidze Clinic",
    ru: "Клиника Хозреванидзе",
  };

  // Title/description come from the CMS (single source of truth).
  const metaTitle = aboutCms?.title?.trim() ?? "";
  const metaDesc = extractLexicalText(aboutCms?.description).slice(0, 160);

  return {
    title: `${metaTitle} | ${clinicName[locale] || clinicName.ge}`,
    description: metaDesc,
    alternates: buildLocalizedAlternates(locale as Locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("About");
  const nav = await getTranslations("Navigation");
  const tBook = await getTranslations("Hero");
  const aboutCms = await getAboutPage(locale as Locale);

  // Single source of truth: title / subtitle / description come straight from
  // the CMS (AboutPage global). Empty = blank, by design.
  const title = aboutCms?.title?.trim() ?? "";
  const subtitle = aboutCms?.subtitle?.trim() ?? "";
  const description = extractLexicalText(aboutCms?.description);
  const descParagraphs = extractLexicalParagraphs(aboutCms?.description);
  // Same paragraph split as descParagraphs above, but with inline formatting
  // (bold/italic/underline/links) preserved for actual rendering.
  const descParagraphNodes = extractLexicalParagraphNodes(aboutCms?.description);

  // Facts come entirely from AboutPage.stats (value + label + description), in
  // admin order. No hardcoded facts — what the editor sees is what renders.
  const facts = (aboutCms?.stats ?? [])
    .map((s) => ({
      value: typeof s?.value === "string" ? s.value.trim() : "",
      label: typeof s?.label === "string" ? s.label.trim() : "",
      description: typeof s?.description === "string" ? s.description.trim() : "",
    }))
    .filter((f) => f.value || f.label);

  // CMS heroImage + highlights were editable in admin but never rendered —
  // the admin uploaded a photo and wrote highlight cards and "nothing showed".
  // Both render only when populated, so the page is unchanged for empty CMS.
  const heroImageUrl =
    typeof aboutCms?.heroImage === "object" && aboutCms.heroImage !== null
      ? aboutCms.heroImage.url ?? ""
      : "";
  const highlights = (aboutCms?.highlights ?? [])
    .map((h) => ({ title: h?.title?.trim() ?? "", text: h?.text?.trim() ?? "" }))
    .filter((h) => h.title || h.text);

  const ceo = aboutCms?.ceo;
  const ceoMessage = extractLexicalText(ceo?.message);
  const ceoMessageParagraphNodes = extractLexicalParagraphNodes(ceo?.message);
  const ceoPhoto =
    typeof ceo?.photo === "object" && ceo.photo !== null ? ceo.photo.url ?? "" : "";
  const ceoName = ceo?.name?.trim() || "";
  const ceoRole = ceo?.role?.trim() || "";

  return (
    <>
      <StructuredData data={generateClinicSchema(locale)} />
      <StructuredData
        data={generateBreadcrumbSchema([
          { name: nav("home"), url: `/${locale}` },
          { name: title, url: `/${locale}/about` },
        ])}
      />

      {/* ── Hero — solid blackberry, drifting washes, fine grid, editorial type ── */}
      <section className="relative bg-blackberry overflow-hidden">
        {/* atmospheric washes */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[25%] right-[-12%] w-[680px] h-[680px] bg-pink/[0.12] rounded-full blur-[150px] animate-float" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[460px] h-[460px] bg-pink/[0.06] rounded-full blur-[130px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>
        {/* hairline grid texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)",
          }}
        />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pt-28 sm:pt-32">
          <div className="text-white/55">
            <Breadcrumbs items={[{ label: nav("home"), href: "/" }, { label: title }]} />
          </div>

          <div className={`pb-16 sm:pb-24 lg:pb-28 pt-6 ${heroImageUrl ? "grid md:grid-cols-[1fr_360px] gap-10 lg:gap-20 items-end" : ""}`}>
            <div className={heroImageUrl ? "" : "max-w-4xl"}>
              <div className="flex items-center gap-4 mb-7">
                <span aria-hidden className="h-px w-10 bg-pink/70" />
                <p className="text-pink/80 text-[12px] font-semibold tracking-[0.28em] uppercase">{title}</p>
              </div>
              <h1 className="text-[clamp(2.3rem,5.6vw,4.6rem)] font-bold text-white leading-[1.04] tracking-[-0.025em] mb-8 break-words [text-wrap:balance]">
                {subtitle}
              </h1>
              {description &&
                (descParagraphNodes[0]?.isBlock ? (
                  descParagraphNodes[0].nodes
                ) : (
                  <p className="text-white/70 text-[17px] sm:text-[19px] leading-[1.65] max-w-[58ch] break-words">
                    {descParagraphNodes[0]?.nodes ?? descParagraphs[0] ?? description}
                  </p>
                ))}
            </div>

            {heroImageUrl && (
              <div className="relative w-[240px] sm:w-[290px] md:w-full mx-auto">
                <div aria-hidden className="absolute -inset-3 rounded-[1.6rem] border border-white/10" />
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/15">
                  <Image src={heroImageUrl} alt={title} fill priority sizes="(min-width: 768px) 360px, 290px" className="object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* curved cream join */}
        <div aria-hidden className="relative h-10 sm:h-14">
          <div className="absolute inset-x-0 bottom-0 h-full bg-cream rounded-t-[2.5rem]" />
        </div>
      </section>

      {/* ── Story continuation — remaining description paragraphs as a lead ── */}
      {descParagraphs.length > 1 && (
        <section className="bg-cream pt-2 pb-4">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="space-y-5">
              {descParagraphNodes.slice(1).map((entry, i) =>
                entry.isBlock ? (
                  <div key={i} className="text-[17px] sm:text-[18px] text-grey leading-[1.7] break-words">
                    {entry.nodes}
                  </div>
                ) : (
                  <p key={i} className="text-[17px] sm:text-[18px] text-grey leading-[1.7] break-words">
                    {entry.nodes}
                  </p>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Mission / Vision / Values — numbered editorial cards ── */}
      {highlights.length > 0 && (
        <section className="bg-cream py-16 sm:py-20 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-blackberry/[0.08] rounded-3xl overflow-hidden border border-blackberry/[0.08]">
              {highlights.map((h, i) => (
                <div
                  key={i}
                  className="group relative bg-white p-7 sm:p-8 lg:p-10 transition-colors duration-500 hover:bg-pink-light/30"
                >
                  <div className="mb-6">
                    <span aria-hidden className="block h-px w-full bg-blackberry/10 group-hover:bg-pink/30 transition-colors duration-500" />
                  </div>
                  {h.title && (
                    <p className="text-[19px] sm:text-[21px] font-bold text-blackberry mb-3 break-words tracking-[-0.01em]">
                      {h.title}
                    </p>
                  )}
                  {h.text && (
                    <p className="text-[14.5px] text-grey-light leading-[1.65] break-words">
                      {h.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Facts — large editorial numerals on a refined divider grid ── */}
      {facts.length > 0 && (
        <section className="bg-white py-16 sm:py-20 lg:py-28 border-y border-blackberry/[0.08]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-x-12 lg:gap-x-20">
              {facts.map((fact, i) => (
                <div
                  key={`${fact.label}-${i}`}
                  className="relative md:[&:nth-child(3n+1)]:before:hidden md:before:absolute md:before:left-[-1.5rem] lg:md:before:left-[-2.5rem] md:before:top-1 md:before:bottom-1 md:before:w-px md:before:bg-gradient-to-b md:before:from-transparent md:before:via-blackberry/15 md:before:to-transparent"
                >
                  <p className="text-[clamp(2.8rem,5.8vw,4.4rem)] font-bold tracking-[-0.03em] leading-none text-blackberry tabular-nums mb-4">
                    {fact.value}
                  </p>
                  <span aria-hidden className="block h-[3px] w-9 bg-pink rounded-full mb-4" />
                  <p className="text-[15px] font-bold text-blackberry mb-1.5 break-words leading-tight">
                    {fact.label}
                  </p>
                  {fact.description && (
                    <p className="text-[13px] text-grey-light leading-[1.55] break-words">
                      {fact.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Founder's note — editorial, framed photo + decorative quote ── */}
      {(ceoMessage || ceoPhoto) && (
        <section className="relative bg-cream py-16 sm:py-20 lg:py-28 overflow-hidden">
          <div aria-hidden className="absolute top-0 right-[-6%] w-[420px] h-[420px] bg-pink/[0.05] rounded-full blur-[120px] pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="flex items-center gap-4 mb-10 sm:mb-12">
              <span aria-hidden className="h-px w-10 bg-pink/60" />
              <p className="text-pink text-[11px] font-semibold tracking-[0.24em] uppercase">{t("ceoHeading")}</p>
            </div>

            <div className="grid md:grid-cols-[280px_1fr] gap-10 sm:gap-14 items-start">
              {ceoPhoto && (
                <div className="relative w-[200px] sm:w-[240px] md:w-full mx-auto md:mx-0">
                  <div aria-hidden className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl bg-blackberry/[0.06]" />
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-grey-lighter shadow-xl shadow-blackberry/10 ring-1 ring-blackberry/5">
                    <Image
                      src={ceoPhoto}
                      alt={ceoName || t("ceoHeading")}
                      fill
                      sizes="(min-width: 768px) 280px, 240px"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              )}

              <div className="min-w-0 md:pt-2">
                {ceoMessage && (
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute -top-8 -left-1 sm:-left-3 text-[6rem] leading-none font-serif text-pink/20 select-none"
                    >
                      &ldquo;
                    </span>
                    <div className="relative space-y-4">
                      {ceoMessageParagraphNodes.map((entry, i) =>
                        entry.isBlock ? (
                          <div
                            key={i}
                            className="text-[clamp(1.1rem,1.9vw,1.42rem)] text-blackberry leading-[1.62] font-medium break-words"
                          >
                            {entry.nodes}
                          </div>
                        ) : (
                          <p
                            key={i}
                            className="text-[clamp(1.1rem,1.9vw,1.42rem)] text-blackberry leading-[1.62] font-medium break-words"
                          >
                            {entry.nodes}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {(ceoName || ceoRole) && (
                  <div className="mt-9 flex items-center gap-4">
                    <span aria-hidden className="block h-[3px] w-12 bg-pink rounded-full shrink-0" />
                    <div className="min-w-0">
                      {ceoName && <p className="text-[16px] font-bold text-blackberry break-words leading-tight">{ceoName}</p>}
                      {ceoRole && <p className="text-[13px] text-grey-light mt-1 break-words leading-snug">{ceoRole}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Quality — editorial pull-quote on blackberry ── */}
      <section className="bg-blackberry py-16 sm:py-20 lg:py-28 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-4 mb-7">
            <span aria-hidden className="h-px w-10 bg-pink/60" />
            <p className="text-pink/90 text-[11px] font-semibold tracking-[0.24em] uppercase">{t("quality")}</p>
          </div>
          <p className="text-[clamp(1.25rem,2.2vw,1.6rem)] text-white leading-[1.5] font-medium break-words [text-wrap:balance]">
            {t("qualityText")}
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-cream py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 text-center">
          <Link
            href="/booking"
            className="group inline-flex items-center gap-3 bg-blackberry text-white text-[15px] font-bold px-8 sm:px-10 py-4 rounded-full hover:bg-blackberry-light hover:shadow-xl hover:shadow-blackberry/15 hover:-translate-y-0.5 transition-all duration-400 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
          >
            {tBook("bookVisit")}
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
