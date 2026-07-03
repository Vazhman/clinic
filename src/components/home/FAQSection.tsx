import { getTranslations } from "next-intl/server";

type Faq = { question: string; answer: string };

/**
 * Homepage FAQ accordion. Server-rendered with native <details>/<summary> so
 * the content is in the initial HTML (crawlable + AI-citable) and needs zero
 * client JS. The matching FAQPage JSON-LD is emitted separately on the home
 * page via generateFAQSchema — healthcare sites are eligible for FAQ rich
 * results, and the Q&A also feeds AI Overviews / ChatGPT / Perplexity.
 */
export default async function FAQSection({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  const t = await getTranslations("FAQ");

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-bold text-blackberry tracking-tight break-words">
            {t("title")}
          </h2>
          <p className="mt-3 text-grey-light break-words">{t("subtitle")}</p>
        </div>

        <div className="divide-y divide-grey-lighter rounded-2xl border border-grey-lighter bg-white overflow-hidden">
          {faqs.map((faq, i) => (
            <details key={i} className="faq-item group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 sm:px-7 py-5 font-semibold text-blackberry hover:text-pink transition-colors">
                <span className="break-words">{faq.question}</span>
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0 text-pink transition-transform duration-300 group-open:rotate-45"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </summary>
              <div className="px-5 sm:px-7 pb-5 -mt-1 text-grey-light leading-relaxed whitespace-pre-line break-words">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
