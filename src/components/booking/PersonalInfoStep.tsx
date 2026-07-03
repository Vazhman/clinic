"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { isValidIdNumber, type BookingFormData } from "@/lib/booking-data";

interface PersonalInfoStepProps {
  formData: BookingFormData;
  onUpdate: (data: Partial<BookingFormData>) => void;
  errors: Record<string, string>;
  /** Optional admin-edited labels from the BookingPage global (CMS-or-fallback). */
  cmsLabels?: { fullName?: string | null; phoneNumber?: string | null };
}

export default function PersonalInfoStep({ formData, onUpdate, errors, cmsLabels }: PersonalInfoStepProps) {
  const t = useTranslations("Booking");
  const [focused, setFocused] = useState<string | null>(null);
  const foreignCitizen = formData.citizenship === "True";
  const idValid = isValidIdNumber(formData.idNumber, foreignCitizen);
  const fullNameLabel = cmsLabels?.fullName?.trim() || t("fullName");
  const phoneLabel = cmsLabels?.phoneNumber?.trim() || t("phoneNumber");

  return (
    <div className="fade-in-content h-full overflow-y-auto custom-scrollbar pl-1 pr-3 py-1">
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blackberry to-pink flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a4.5 4.5 0 019 0H4.125z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blackberry break-words">{t("yourInfo")}</h2>
          </div>
        </div>
        <p className="text-grey-light text-sm ml-11 break-words">{t("infoHint")}</p>
      </div>

      <div className="space-y-5 sm:space-y-6">
        {/* Citizenship */}
        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-semibold text-grey mb-3 break-words">
            <svg className="w-4 h-4 text-grey-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
            <span className="break-words min-w-0">{t("citizenship")}</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3" role="radiogroup">
            {[
              { value: "False" as const, label: t("citizenGeorgian"), icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              )},
              { value: "True" as const, label: t("citizenForeign"), icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              )},
            ].map((option) => {
              const isActive = formData.citizenship === option.value;
              return (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => onUpdate({ citizenship: option.value })}
                  className={`relative flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer overflow-hidden min-w-0 ${
                    isActive
                      ? "border-blackberry/20 text-blackberry shadow-sm"
                      : "border-grey-lighter text-grey-light hover:border-pink/30 hover:text-grey"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blackberry/[0.04] to-pink/[0.04]" />
                  )}
                  <span className="relative z-10 flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{option.icon}</span>
                    <span className="break-words min-w-0">{option.label}</span>
                  </span>
                  {isActive && (
                    <div className="relative z-10 w-4 h-4 rounded-full bg-blackberry flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Full name */}
        <div>
          <label htmlFor="booking-fullname" className="flex items-center gap-2 text-sm font-semibold text-grey mb-2.5 break-words">
            <svg className="w-4 h-4 text-grey-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="break-words min-w-0">{fullNameLabel}</span>
          </label>
          <div className="relative">
            <input
              id="booking-fullname"
              type="text"
              value={formData.fullName}
              onChange={(e) => onUpdate({ fullName: e.target.value })}
              onFocus={() => setFocused("fullName")}
              onBlur={() => setFocused(null)}
              placeholder={t("fullNamePlaceholder")}
              aria-required="true"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullname-error" : undefined}
              className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all duration-300 outline-none ${
                errors.fullName
                  ? "border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-300/20"
                  : focused === "fullName"
                    ? "border-blackberry bg-white ring-2 ring-blackberry/8 shadow-sm"
                    : "border-grey-lighter bg-cream/30 hover:border-pink/30 hover:bg-white"
              }`}
            />
            {formData.fullName && !errors.fullName && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {errors.fullName && (
            <p id="fullname-error" role="alert" className="flex items-start gap-1.5 text-red-500 text-[13px] mt-2 break-words">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="break-words min-w-0">{errors.fullName}</span>
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="booking-phone" className="flex items-center gap-2 text-sm font-semibold text-grey mb-2.5 break-words">
            <svg className="w-4 h-4 text-grey-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
            <span className="break-words min-w-0">{phoneLabel}</span>
          </label>
          <div className="relative">
            <input
              id="booking-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              onFocus={() => setFocused("phone")}
              onBlur={() => setFocused(null)}
              placeholder="5XXXXXXXX"
              maxLength={12}
              aria-required="true"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all duration-300 outline-none ${
                errors.phone
                  ? "border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-300/20"
                  : focused === "phone"
                    ? "border-blackberry bg-white ring-2 ring-blackberry/8 shadow-sm"
                    : "border-grey-lighter bg-cream/30 hover:border-pink/30 hover:bg-white"
              }`}
            />
            {formData.phone && formData.phone.length >= 9 && !errors.phone && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {errors.phone && (
            <p id="phone-error" role="alert" className="flex items-start gap-1.5 text-red-500 text-[13px] mt-2 break-words">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="break-words min-w-0">{errors.phone}</span>
            </p>
          )}
        </div>

        {/* Personal ID number */}
        <div>
          <label htmlFor="booking-idnumber" className="flex items-center gap-2 text-sm font-semibold text-grey mb-2.5 break-words">
            <svg className="w-4 h-4 text-grey-light shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a4.5 4.5 0 019 0H4.125z" />
            </svg>
            <span className="break-words min-w-0">{t("idNumber")}</span>
          </label>
          <div className="relative">
            <input
              id="booking-idnumber"
              type="text"
              inputMode="text"
              value={formData.idNumber}
              onChange={(e) => onUpdate({ idNumber: e.target.value })}
              onFocus={() => setFocused("idNumber")}
              onBlur={() => setFocused(null)}
              placeholder={t("idNumberPlaceholder")}
              maxLength={20}
              aria-required="true"
              aria-invalid={!!errors.idNumber}
              aria-describedby={errors.idNumber ? "idnumber-error" : undefined}
              className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all duration-300 outline-none ${
                errors.idNumber
                  ? "border-red-300 bg-red-50/30 focus:ring-2 focus:ring-red-300/20"
                  : focused === "idNumber"
                    ? "border-blackberry bg-white ring-2 ring-blackberry/8 shadow-sm"
                    : "border-grey-lighter bg-cream/30 hover:border-pink/30 hover:bg-white"
              }`}
            />
            {idValid && !errors.idNumber && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {/* Live format hint: matches isValidIdNumber exactly, switches with
              citizenship, and turns red once the user has typed something
              that can't pass. */}
          <p className={`text-[12px] mt-2 break-words ${formData.idNumber && !idValid ? "text-red-500" : "text-grey-light"}`}>
            {foreignCitizen ? t("idHintForeign") : t("idHintGeorgian")}
          </p>
          {errors.idNumber && (
            <p id="idnumber-error" role="alert" className="flex items-start gap-1.5 text-red-500 text-[13px] mt-2 break-words">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span className="break-words min-w-0">{errors.idNumber}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
