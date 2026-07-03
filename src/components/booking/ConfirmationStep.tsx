"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BookingFormData, BookingService, BookingOperator } from "@/lib/booking-data";
import type { Locale } from "@/i18n/config";

interface ConfirmationStepProps {
  formData: BookingFormData;
  service: BookingService;
  doctor: BookingOperator;
  onEdit: (step: number) => void;
  submitting: boolean;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function ConfirmationStep({
  formData,
  service,
  doctor,
  onEdit,
  submitting,
  agreed,
  onAgreedChange,
}: ConfirmationStepProps) {
  const t = useTranslations("Booking");
  const locale = useLocale() as Locale;

  const timeDisplay = formData.time
    ? formData.time.split("T")[1]?.substring(0, 5) || formData.time
    : "";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months: Record<string, string[]> = {
      ge: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
    };
    return `${day} ${months[locale]?.[d.getMonth()] || months.en[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="fade-in-content h-full overflow-y-auto custom-scrollbar pr-3">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blackberry to-pink flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blackberry break-words">{t("confirmTitle")}</h2>
          </div>
        </div>
        <p className="text-grey-light text-sm ml-11 break-words">{t("confirmHint")}</p>
      </div>

      {/* Two-column layout: appointment details + personal info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Appointment Details Card */}
        <div className="bg-white rounded-2xl border border-grey-lighter/80 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 bg-cream/50 border-b border-grey-lighter/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blackberry/[0.06] flex items-center justify-center text-blackberry shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-blackberry/70 uppercase tracking-wider break-words min-w-0">
                {t("appointmentDetails")}
              </span>
            </div>
            <button
              onClick={() => onEdit(0)}
              className="flex items-center gap-1 text-xs text-pink hover:text-pink-dark font-semibold transition-colors cursor-pointer group shrink-0 px-2 py-1 -mr-1"
            >
              <svg className="w-3 h-3 group-hover:rotate-12 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
              </svg>
              <span className="break-words">{t("edit")}</span>
            </button>
          </div>

          <div className="px-3 sm:px-5 py-2">
            {/* Service */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 border-b border-grey-lighter/40">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("service")}</span>
              <span className="text-sm font-medium text-grey sm:text-right break-words min-w-0 sm:max-w-[65%]">
                {service.name[locale]}
              </span>
            </div>

            {/* Doctor */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 border-b border-grey-lighter/40">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("doctor")}</span>
              <div className="flex items-center gap-2 sm:ml-auto">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                  style={{ background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)" }}
                >
                  {getInitials(doctor.name)}
                </div>
                <span className="text-sm font-medium text-grey break-words min-w-0">
                  {doctor.name}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 border-b border-grey-lighter/40">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("date")}</span>
              <span className="text-sm font-medium text-grey sm:text-right break-words min-w-0 sm:max-w-[65%]">
                {formData.date ? formatDate(formData.date) : ""}
              </span>
            </div>

            {/* Time */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("time")}</span>
              <span className="text-sm font-medium text-grey sm:text-right break-words min-w-0 sm:max-w-[65%]">
                {timeDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Personal Details Card */}
        <div className="bg-white rounded-2xl border border-grey-lighter/80 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 bg-cream/50 border-b border-grey-lighter/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blackberry/[0.06] flex items-center justify-center text-blackberry shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a4.5 4.5 0 019 0H4.125z" />
                </svg>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-blackberry/70 uppercase tracking-wider break-words min-w-0">
                {t("personalDetails")}
              </span>
            </div>
            <button
              onClick={() => onEdit(2)}
              className="flex items-center gap-1 text-xs text-pink hover:text-pink-dark font-semibold transition-colors cursor-pointer group shrink-0 px-2 py-1 -mr-1"
            >
              <svg className="w-3 h-3 group-hover:rotate-12 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
              </svg>
              <span className="break-words">{t("edit")}</span>
            </button>
          </div>

          <div className="px-3 sm:px-5 py-2">
            {/* Full Name */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 border-b border-grey-lighter/40">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("fullName")}</span>
              <span className="text-sm font-medium text-grey sm:text-right break-words min-w-0 sm:max-w-[65%]">
                {formData.fullName}
              </span>
            </div>

            {/* Phone */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 border-b border-grey-lighter/40">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("phoneNumber")}</span>
              <span className="text-sm font-medium text-grey sm:text-right break-words min-w-0 sm:max-w-[65%]">
                {formData.phone}
              </span>
            </div>

            {/* ID Number */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3">
              <span className="text-xs text-grey-light break-words sm:shrink-0">{t("idNumber")}</span>
              <span className="text-sm font-medium text-grey sm:text-right break-words min-w-0 sm:max-w-[65%]">
                {formData.idNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer / policy notice */}
      <div className="mt-5 sm:mt-6 flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-pink-50 to-cream border border-pink-light/50">
        <div className="w-8 h-8 rounded-lg bg-pink/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
        <p className="text-[13px] text-grey-light leading-relaxed break-words min-w-0">{t("disclaimer")}</p>
      </div>

      {/* Terms & Privacy consent — required before the Confirm button enables */}
      <label className="mt-4 flex items-start gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 border-grey-lighter accent-pink cursor-pointer"
        />
        <span className="text-[13px] text-grey leading-relaxed break-words min-w-0">
          {t.rich("agreeToTerms", {
            terms: (c) => (
              <Link href={{ pathname: "/pages/[slug]", params: { slug: "terms" } }} target="_blank" rel="noopener noreferrer" className="text-pink font-semibold hover:text-pink-dark underline underline-offset-2">{c}</Link>
            ),
            privacy: (c) => (
              <Link href={{ pathname: "/pages/[slug]", params: { slug: "privacy" } }} target="_blank" rel="noopener noreferrer" className="text-pink font-semibold hover:text-pink-dark underline underline-offset-2">{c}</Link>
            ),
          })}
        </span>
      </label>

      {/* Loading overlay for submit */}
      {submitting && (
        <div className="mt-5 sm:mt-6 flex items-center justify-center gap-3 py-5">
          <div className="relative w-6 h-6 shrink-0">
            <div className="absolute inset-0 border-2 border-pink/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-blackberry border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-sm text-grey-light font-medium break-words">{t("submitting")}</span>
        </div>
      )}
    </div>
  );
}
