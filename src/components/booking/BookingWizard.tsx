"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import StepIndicator from "./StepIndicator";
import CombinedSelectionStep from "./CombinedSelectionStep";
import DateTimeStep from "./DateTimeStep";
import PersonalInfoStep from "./PersonalInfoStep";
import ConfirmationStep from "./ConfirmationStep";
import { type BookingService, type BookingOperator, type BookingFormData, isValidIdNumber } from "@/lib/booking-data";
import type { BookingPageCms } from "@/lib/payload-data";

const TOTAL_STEPS = 4;
const AUTO_ADVANCE_DELAY = 300;
const PERSONAL_INFO_AUTO_ADVANCE_DELAY = 600;

interface BookingWizardProps {
  initialServices?: BookingService[];
  initialDoctors?: { serviceId: string; operator: BookingOperator }[];
  bookingCms?: BookingPageCms;
}

export default function BookingWizard({
  initialServices = [],
  initialDoctors = [],
  bookingCms,
}: BookingWizardProps) {
  const t = useTranslations("Booking");
  // CMS-or-fallback. Only the labels that exist in the BookingPage global —
  // wizard step indicator labels (stepServiceDoctor / stepDateTime / etc.)
  // intentionally stay on next-intl because the CMS schema doesn't model the
  // 4-step structure (it has 6 generic step names that don't map cleanly).
  const confirmLabel = bookingCms?.form?.confirmButton?.trim() || bookingCms?.steps?.confirm?.trim() || t("confirm");
  const successMessage = bookingCms?.form?.successMessage?.trim() || t("successMessage");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const prefilledRef = useRef(false);
  // Reset each time the user enters step 2 so we only auto-advance once per visit.
  const personalInfoAutoAdvancedRef = useRef(false);
  // Track whether the user has actually typed/edited in step 2 during this visit.
  // We only auto-advance after a real edit — otherwise clicking Edit on the
  // confirmation step would land on a fully-valid form and instantly bounce
  // back, defeating the point of "Edit".
  const personalInfoTouchedRef = useRef(false);
  // Start true to avoid flashing empty wizard; the effect below sets false if no URL params
  const [prefilling, setPrefilling] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Terms & Privacy consent — gates the final Confirm button.
  const [agreed, setAgreed] = useState(false);
  // No setter: with auto-advance + no Next button there's no point at which we
  // need to surface field-level errors. PersonalInfoStep keeps the prop in case
  // we add inline validation later.
  const errors: Record<string, string> = {};

  // Wizard state
  const [selectedService, setSelectedService] = useState<BookingService | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<BookingOperator | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState<BookingFormData>({
    citizenship: "False",
    fullName: "",
    phone: "",
    idNumber: "",
    serviceId: "",
    serviceName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
  });

  // Services + doctors come pre-loaded from the SSR page (Payload query, no
  // Doctra round-trip). Snapshotted in state so component-internal logic has
  // a single source of truth even if the parent re-renders with new props.
  const [services] = useState<BookingService[]>(initialServices);
  const [allDoctorsRows] = useState(initialDoctors);

  // Step labels: CMS-or-fallback. The BookingPage global's six generic step
  // names map onto the wizard's four steps as: selectService → step 1
  // (service+doctor), selectDate → step 2 (date+time), yourInfo → step 3,
  // confirm → step 4. Editing them in the admin now actually shows up here.
  const steps = [
    { label: bookingCms?.steps?.selectService?.trim() || t("stepServiceDoctor"), icon: <StepIcon type="doctor" /> },
    { label: bookingCms?.steps?.selectDate?.trim() || t("stepDateTime"), icon: <StepIcon type="calendar" /> },
    { label: bookingCms?.steps?.yourInfo?.trim() || t("stepInfo"), icon: <StepIcon type="info" /> },
    { label: bookingCms?.steps?.confirm?.trim() || t("stepConfirm"), icon: <StepIcon type="confirm" /> },
  ];

  // Pre-fill from URL query (e.g. when coming from doctor profile mini-booking widget)
  useEffect(() => {
    if (prefilledRef.current) return;

    const branchId = searchParams.get("branch");
    const operatorId = searchParams.get("operator");
    const date = searchParams.get("date");
    const timeParam = searchParams.get("time");

    if (!branchId || !operatorId) {
      // No URL prefill — wizard is interactive immediately.
      setPrefilling(false);
      return;
    }

    prefilledRef.current = true;

    // Reconstruct full ISO time from date + short time (e.g. "11:15" -> "2026-04-29T11:15:00")
    const fullTime = (date && timeParam && !timeParam.includes("T"))
      ? `${date}T${timeParam}:00`
      : timeParam;

    const service = services.find((s) => s.id === branchId);
    if (!service) {
      setPrefilling(false);
      return;
    }

    const match = allDoctorsRows.find(
      (r) => r.serviceId === branchId && r.operator.id === operatorId,
    );
    const doctor = match?.operator ?? null;

    // Set everything in one batch -- no intermediate flicker
    setSelectedService(service);
    if (date) setSelectedDate(date);
    if (fullTime) setSelectedTime(fullTime);
    if (doctor) {
      setSelectedDoctor(doctor);
      setFormData((prev) => ({
        ...prev,
        serviceId: service.id,
        serviceName: service.name[locale as "ge" | "en" | "ru"] ?? service.name.ge,
        doctorId: doctor.id,
        doctorName: doctor.name,
        date: date ?? "",
        time: fullTime ?? "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        serviceId: service.id,
        serviceName: service.name[locale as "ge" | "en" | "ru"] ?? service.name.ge,
      }));
    }

    // Jump ahead -- if we have everything, skip to personal info (step 2)
    if (date && fullTime && doctor) {
      setCurrentStep(2);
    } else if (doctor) {
      setCurrentStep(1);
    }

    setPrefilling(false);
  }, [searchParams, locale, services, allDoctorsRows]);

  // Check validity without side-effects (safe to call during render)
  const isPersonalInfoValid = useCallback(() => {
    if (!formData.fullName.trim()) return false;
    if (!formData.phone.trim() || formData.phone.trim().length < 9) return false;
    if (!isValidIdNumber(formData.idNumber, formData.citizenship === "True")) return false;
    return true;
  }, [formData]);

  // Reset the per-visit auto-advance + touched guards whenever the user
  // (re-)enters step 2. Touched only flips on real user input below.
  useEffect(() => {
    if (currentStep === 2) {
      personalInfoAutoAdvancedRef.current = false;
      personalInfoTouchedRef.current = false;
    }
  }, [currentStep]);

  // Auto-advance from step 2 → step 3 once personal info is fully valid AND
  // the user has actually edited something in this visit. The touched guard
  // means clicking Edit from step 3 lands on a stable form instead of
  // instantly bouncing back.
  useEffect(() => {
    if (currentStep !== 2) return;
    if (personalInfoAutoAdvancedRef.current) return;
    if (!personalInfoTouchedRef.current) return;
    if (!isPersonalInfoValid()) return;

    const timer = setTimeout(() => {
      // Re-check the guards inside the timeout — if user already advanced
      // (or navigated away) we silently bail out.
      if (personalInfoAutoAdvancedRef.current) return;
      personalInfoAutoAdvancedRef.current = true;
      setCurrentStep(3);
    }, PERSONAL_INFO_AUTO_ADVANCE_DELAY);

    return () => clearTimeout(timer);
  }, [currentStep, formData, isPersonalInfoValid]);

  // Wrapped formData updater for PersonalInfoStep — flips the touched guard
  // so auto-advance can fire once user actually edits a field.
  const updatePersonalInfo = useCallback((partial: Partial<BookingFormData>) => {
    if (currentStep === 2) {
      personalInfoTouchedRef.current = true;
    }
    setFormData((prev) => ({ ...prev, ...partial }));
  }, [currentStep]);

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const goToStep = (step: number) => setCurrentStep(step);

  // Combined-step: service picked, doctor cleared. No auto-advance — user picks a doctor next on the same screen.
  const handleServiceSelect = (service: BookingService) => {
    setSelectedService(service);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedTime("");
    setFormData((prev) => ({ ...prev, serviceId: service.id, serviceName: service.name[locale as "ge" | "en" | "ru"] ?? service.name.ge, doctorId: "", doctorName: "" }));
  };

  // Combined-step: doctor picked. Sets both service+doctor and auto-advances to date/time.
  const handleDoctorSelect = (service: BookingService, doctor: BookingOperator) => {
    setSelectedService(service);
    setSelectedDoctor(doctor);
    setSelectedDate("");
    setSelectedTime("");
    setFormData((prev) => ({
      ...prev,
      serviceId: service.id,
      serviceName: service.name[locale as "ge" | "en" | "ru"] ?? service.name.ge,
      doctorId: doctor.id,
      doctorName: doctor.name,
    }));
    setTimeout(() => setCurrentStep(1), AUTO_ADVANCE_DELAY);
  };

  // Switch to a colleague doctor (stays on date/time step)
  const handleSwitchDoctor = (newDoctor: BookingOperator) => {
    setSelectedDoctor(newDoctor);
    setSelectedTime(""); // Reset time, keep date so user can see the new doctor's slots
    setFormData((prev) => ({ ...prev, doctorId: newDoctor.id, doctorName: newDoctor.name }));
  };

  // Auto-advance: time selected -> personal info step.
  // IMPORTANT: only advance for a real time pick. DateTimeStep also calls
  // onSelectTime("") to clear the time when the user picks a new date —
  // advancing in that case would skip the user past the time-slot picker.
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (!time) return;
    setTimeout(() => setCurrentStep(2), AUTO_ADVANCE_DELAY);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedDoctor) return;
    setSubmitting(true);

    const finalData: BookingFormData = {
      ...formData,
      serviceId: selectedService.id,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      date: selectedDate,
      time: selectedTime,
    };

    try {
      const res = await fetch("/api/booking/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        // Show error but don't crash
        setSubmitting(false);
      }
    } catch {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className="fade-in-content relative text-center py-12 md:py-16 overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-pink/5 to-blackberry/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-pink/8 to-blackberry/8" />
        </div>

        <div className="relative w-20 h-20 mx-auto mb-8">
          <div
            className="w-full h-full rounded-2xl flex items-center justify-center shadow-xl"
            style={{
              background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)",
            }}
          >
            <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Sparkle decorations */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-pink/20" />
          <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-blackberry/15" />
          <div className="absolute top-0 -left-4 w-2 h-2 rounded-full bg-pink/30" />
        </div>

        <h2 className="relative text-xl sm:text-2xl md:text-3xl font-bold text-blackberry mb-3 px-4 break-words">
          {t("success")}
        </h2>
        <p className="relative text-grey-light text-sm max-w-sm mx-auto mb-8 sm:mb-10 px-4 leading-relaxed break-words">
          {successMessage}
        </p>
        <a
          href="/"
          className="relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 text-white px-8 py-4 text-base shadow-xl shadow-blackberry/15 hover:shadow-2xl hover:shadow-blackberry/20 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #682149 0%, #DD64A6 100%)",
          }}
        >
          {t("backToHome")}
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </a>
      </div>
    );
  }

  // While prefilling from URL params, show a skeleton instead of flashing through empty steps
  if (prefilling) {
    return (
      <div className="flex flex-col h-auto min-h-[520px] md:h-[calc(100vh-220px)] md:max-h-[760px] items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blackberry/10 to-pink/10 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-pink border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-3 w-40 bg-grey-lighter/60 rounded-full mx-auto animate-pulse" />
          <div className="h-2 w-28 bg-grey-lighter/40 rounded-full mx-auto animate-pulse" style={{ animationDelay: "0.1s" }} />
        </div>
      </div>
    );
  }

  return (
    /* Flex column -- on mobile use auto height, on desktop fixed-height card */
    <div className="flex flex-col h-auto min-h-[520px] md:h-[calc(100vh-220px)] md:max-h-[760px]">
      {/* Screen-reader step announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {steps[currentStep].label} - Step {currentStep + 1} of {TOTAL_STEPS}
      </div>

      {/* Step indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Step content -- flex-1, fills remaining space. Each step manages its own internal scroll. */}
      <div className="flex-1 min-h-0 mt-4 sm:mt-6">
        <div key={currentStep} className="fade-in-content h-full">
          {currentStep === 0 && (
            <CombinedSelectionStep
              services={services}
              allDoctorsRows={allDoctorsRows}
              loading={false}
              selectedService={selectedService}
              selectedDoctor={selectedDoctor}
              onSelectService={handleServiceSelect}
              onSelectDoctor={handleDoctorSelect}
            />
          )}
          {currentStep === 1 && selectedService && selectedDoctor && (
            <DateTimeStep
              service={selectedService}
              doctor={selectedDoctor}
              allDoctorsRows={allDoctorsRows}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSelectDate={(d) => setSelectedDate(d)}
              onSelectTime={handleTimeSelect}
              onSwitchDoctor={handleSwitchDoctor}
            />
          )}
          {currentStep === 2 && (
            <PersonalInfoStep
              formData={formData}
              onUpdate={updatePersonalInfo}
              errors={errors}
              cmsLabels={{
                fullName: bookingCms?.form?.fullName ?? null,
                phoneNumber: bookingCms?.form?.phoneNumber ?? null,
              }}
            />
          )}
          {currentStep === 3 && selectedService && selectedDoctor && (
            <ConfirmationStep
              formData={{ ...formData, date: selectedDate, time: selectedTime }}
              service={selectedService}
              doctor={selectedDoctor}
              onEdit={goToStep}
              submitting={submitting}
              agreed={agreed}
              onAgreedChange={setAgreed}
            />
          )}
        </div>
      </div>

      {/* Navigation — Back on the left, Confirm only on final step. No Next button:
          steps 0 → 1 → 2 auto-advance on the user's own action; step 2 → 3 auto-
          advances once personal info validates (debounced). */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-grey-lighter/60 shrink-0">
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-grey-light hover:text-blackberry hover:bg-cream transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none cursor-pointer group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span className="break-words">{t("back")}</span>
        </button>

        {currentStep === TOTAL_STEPS - 1 && (
          <button
            onClick={handleSubmit}
            disabled={submitting || !agreed}
            className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-pink/20 transition-all duration-300 disabled:opacity-50 cursor-pointer hover:shadow-xl hover:shadow-pink/25 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg, #DD64A6 0%, #C44D8F 100%)",
            }}
          >
            {submitting ? (
              <>
                <div className="relative w-4 h-4 shrink-0">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                  <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <span className="break-words">{t("submitting")}</span>
              </>
            ) : (
              <>
                <span className="break-words">{confirmLabel}</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// -- Small step icons --

function StepIcon({ type }: { type: "service" | "doctor" | "calendar" | "info" | "confirm" }) {
  const cls = "w-5 h-5";
  switch (type) {
    case "service":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      );
    case "doctor":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case "info":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm-3.375 6.166a4.5 4.5 0 019 0H4.125z" />
        </svg>
      );
    case "confirm":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}
