"use client";

interface Step {
  label: string;
  icon: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Current step label (mobile only) */}
      <div className="flex sm:hidden items-center justify-between mb-4 px-1">
        <span className="text-[11px] font-semibold text-blackberry/60 tracking-wide uppercase shrink-0">
          {currentStep + 1}/{steps.length}
        </span>
        <span className="text-xs font-semibold text-blackberry text-right break-words min-w-0 pl-3">
          {steps[currentStep]?.label}
        </span>
      </div>

      {/* Step indicator with connecting lines (works on all sizes) */}
      <div className="block">
        <div className="flex items-start justify-between relative">
          {/* Background track */}
          <div className="absolute top-4 sm:top-5 left-0 right-0 h-[2px] mx-[18px] sm:mx-[30px] md:mx-[60px]">
            <div className="w-full h-full bg-grey-lighter rounded-full" />
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #682149 0%, #DD64A6 100%)",
              }}
            />
          </div>

          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={index}
                className="flex flex-col items-center relative z-10 min-w-0"
                style={{ width: `${100 / steps.length}%` }}
              >
                {/* Step node */}
                <div className="relative">
                  {/* Pulse ring for active */}
                  {isActive && (
                    <div
                      className="absolute -inset-1.5 rounded-full border-2 border-pink/30"
                      style={{
                        animation: "booking-pulse 2s ease-in-out infinite",
                      }}
                    />
                  )}

                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 shadow-sm transition-colors duration-[350ms] ease-out"
                    style={{
                      backgroundColor: isCompleted
                        ? "#682149"
                        : isActive
                          ? "#DD64A6"
                          : "#F5F5F5",
                      borderColor: isCompleted
                        ? "#682149"
                        : isActive
                          ? "#DD64A6"
                          : "#E5E5E5",
                    }}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span
                        className={`transition-colors duration-300 ${
                          isActive ? "text-white" : "text-grey-light"
                        }`}
                      >
                        {/* On mobile show step number, on desktop show icon */}
                        <span className="sm:hidden text-xs font-bold">{index + 1}</span>
                        <span className="hidden sm:inline">{step.icon}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Label — hidden on mobile */}
                <span
                  className={`hidden sm:block mt-3 text-[11px] tracking-wide text-center leading-tight max-w-[80px] break-words min-w-0 transition-colors duration-300 ${
                    isPending ? "opacity-50" : "opacity-100"
                  } ${
                    isActive || isCompleted ? "text-blackberry" : "text-grey-light"
                  } ${isActive ? "font-semibold" : "font-normal"}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
