"use client";

import { useTranslations } from "next-intl";
import AnimateIn from "@/components/shared/AnimateIn";
import type { ContactPageCms } from "@/lib/payload-data";

export default function ContactMap({ contact }: { contact?: ContactPageCms } = {}) {
  const t = useTranslations("Contact");

  // CMS-only resolution. Empty strings count as missing.
  const addressLabel = contact?.address?.label?.trim() ?? "";
  const addressValue = contact?.address?.value?.trim() ?? "";
  const phoneLabel = contact?.phone?.label?.trim() ?? "";
  const phoneValue = contact?.phone?.display?.trim() || contact?.phone?.value?.trim() || "";
  const phoneTel = (contact?.phone?.value?.trim() ?? "").replace(/[^+\d]/g, "");
  // Extra numbers from ContactPage.phones (admin-managed array) — rendered as
  // additional tel links inside the same phone card.
  const extraPhones = (contact?.phones ?? [])
    .map((p) => ({
      label: p?.label?.trim() || "",
      value: p?.display?.trim() || p?.value?.trim() || "",
      tel: (p?.value?.trim() || "").replace(/[^+\d]/g, ""),
    }))
    .filter((p) => p.value && p.tel);
  const emailLabel = contact?.email?.label?.trim() ?? "";
  const emailValue = contact?.email?.value?.trim() ?? "";
  const emailHref = contact?.email?.value?.trim() ?? "";
  const hoursLabel = contact?.workingHours?.label?.trim() ?? "";
  const weekdays = contact?.workingHours?.weekdays?.trim() ?? "";
  const weekends = contact?.workingHours?.weekends?.trim() ?? "";

  const lat = contact?.address?.mapLatitude;
  const lng = contact?.address?.mapLongitude;
  // Coords are admin-managed; guard the map so it only renders when both exist.
  const hasCoords = lat != null && lng != null;
  // Compose the Maps embed URL from coords so admin can move the pin.
  const mapSrc = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&ll=${lat},${lng}&z=18&hl=en&output=embed`
    : "";

  const items = [
    { icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z", label: addressLabel, value: addressValue },
    { icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z", label: phoneLabel, value: phoneValue, href: `tel:${phoneTel}`, extras: extraPhones },
    { icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75", label: emailLabel, value: emailValue, href: `mailto:${emailHref}` },
    { icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", label: hoursLabel, value: `${weekdays}\n${weekends}` },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-blackberry">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        <AnimateIn className="mb-8 sm:mb-12 lg:mb-14">
          <h2 className="text-[clamp(1.5rem,3.5vw,2.8rem)] font-bold tracking-tight text-pink break-words">{t("title")}</h2>
        </AnimateIn>
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, i) => (
              <AnimateIn key={i} delay={i * 70}
                className="bg-white/[0.06] rounded-2xl p-4 sm:p-5 border border-white/[0.06] hover:bg-white/[0.1] transition-all duration-400">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 bg-pink/15 rounded-xl flex items-center justify-center text-pink shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-pink/50 font-semibold tracking-[0.1em] uppercase mb-1 break-words">{item.label}</p>
                    {item.href ? <a href={item.href} className="text-[14px] text-white/80 font-medium hover:text-pink transition-colors break-words block">{item.value}</a>
                      : <p className="text-[14px] text-white/80 font-medium whitespace-pre-line break-words">{item.value}</p>}
                    {"extras" in item && item.extras?.map((p, j) => (
                      <a key={j} href={`tel:${p.tel}`} className="text-[14px] text-white/80 font-medium hover:text-pink transition-colors break-words block mt-1">
                        {p.label ? `${p.label}: ${p.value}` : p.value}
                      </a>
                    ))}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
          {hasCoords && (
            <AnimateIn delay={200} className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden border border-white/[0.06] h-full min-h-[320px] sm:min-h-[380px]">
                <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0, minHeight: 320 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={t("mapTitle")} />
              </div>
            </AnimateIn>
          )}
        </div>
      </div>
    </section>
  );
}
