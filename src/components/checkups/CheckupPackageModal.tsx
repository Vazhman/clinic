'use client'

import * as React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import type { CheckupPackage } from '@/types'

type Locale = 'ge' | 'en' | 'ru'

// Shared modal copy — extracted from CheckupsExplorer so both the /checkups
// persona gateway AND the home-page tier teaser open the SAME modal with the
// SAME two-level (package list ⇄ single package details) behaviour.
const LABELS = {
  ge: {
    details: 'დეტალურად', included: 'ჩართული გამოკვლევები', call: 'დაგვირეკეთ',
    none: 'ამ კატეგორიაში პაკეტები ჯერ არ არის.', priceOnRequest: 'ფასი დასაზუსტებით',
    testsWord: 'გამოკვლევა', back: 'უკან', choosePkg: 'აირჩიეთ პაკეტი',
  },
  en: {
    details: 'Details', included: 'Included tests', call: 'Call us',
    none: 'No packages in this category yet.', priceOnRequest: 'Price on request',
    testsWord: 'tests', back: 'Back', choosePkg: 'Choose a package',
  },
  ru: {
    details: 'Подробнее', included: 'Включённые исследования', call: 'Позвоните нам',
    none: 'В этой категории пока нет пакетов.', priceOnRequest: 'Цена по запросу',
    testsWord: 'исслед.', back: 'Назад', choosePkg: 'Выберите пакет',
  },
} as const

// Tier enum (CMS) -> badge text shown on cards / modal. The spreadsheets use
// GENERAL / ADVANCED / PREMIUM; the CMS stores them as economy/standard/premium.
const TIER_LABEL: Record<string, string> = { economy: 'GENERAL', standard: 'ADVANCED', premium: 'PREMIUM' }
const TIER_RANK: Record<string, number> = { economy: 0, standard: 1, premium: 2 }

function PhoneIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>)
}
function CheckIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>)
}
function CloseIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="w-5 h-5"><path d="M6 6l12 12M18 6 6 18" /></svg>)
}
function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>)
}
function ArrowLeftIcon() {
  return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>)
}
// Ascending 1/2/3-bar meter encoding tier depth (General < Advanced < Premium).
function LevelMeter({ level }: { level: number }) {
  return (
    <span className="flex items-end gap-[3px] h-[18px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`w-[5px] rounded-full ${i < level ? 'bg-pink' : 'bg-blackberry/12'}`} style={{ height: `${8 + i * 5}px` }} />
      ))}
    </span>
  )
}

// One audience option in the "choose gender / kid" chooser the home tier cards
// open. `label` + `description` are localized in the caller; `icon` reuses the
// persona icons; `pkg` is the single tier×audience package this option drills
// into (null when that cell has no package, so the option self-disables).
export type AudienceChoice = {
  value: 'woman' | 'man' | 'child'
  label: string
  description: string
  icon: React.ReactNode
  pkg: CheckupPackage | null
}

export type CheckupPackageModalProps = {
  // The set of packages this modal lists; clicking one opens its details. When
  // `open` but the list is empty, the empty-state copy shows.
  packages: CheckupPackage[]
  phone: string
  locale: Locale
  open: boolean
  onClose: () => void
  // Heading + optional icon for the list view (persona name on /checkups, tier
  // name on the home teaser). `subheading` defaults to "Choose a package".
  heading: string
  subheading?: string
  icon?: React.ReactNode
  ariaLabel?: string
  // OPTIONAL audience-chooser mode (home tier cards). When provided, the list
  // level renders a gender/kid persona chooser instead of a package list;
  // picking a persona drills straight into that persona's single package
  // details. `packages` is ignored in this mode.
  audienceChoices?: AudienceChoice[]
  // Localized "pick the person" prompt shown above the chooser.
  audiencePrompt?: string
}

// The exact modal extracted from CheckupsExplorer: a two-level dialog that lists
// the supplied packages, and drills into one package's full details. Body-scroll
// lock + Esc handling (Esc steps back from details to the list, then closes).
export default function CheckupPackageModal({
  packages, phone, locale, open, onClose, heading, subheading, icon, ariaLabel,
  audienceChoices, audiencePrompt,
}: CheckupPackageModalProps) {
  const L = LABELS[locale] ?? LABELS.ge
  const [active, setActive] = React.useState<CheckupPackage | null>(null)

  // A package's own phone (CMS field) wins over the site-wide number passed
  // in via `phone`, so each package can point callers to its own line.
  const activePhone = active?.phone || phone
  const telHref = `tel:${(activePhone || '').replace(/[^\d+]/g, '')}`

  // Reset the drill-in whenever the modal (re)opens or its list changes.
  React.useEffect(() => {
    if (!open) setActive(null)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (active) setActive(null)
      else onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, active, onClose])

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          style={{ background: 'rgba(40,12,28,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel ?? heading}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-[28px] max-w-3xl w-full max-h-[88vh] overflow-auto"
            style={{ boxShadow: '0 40px 80px -30px rgba(104,33,73,0.5)' }}
          >
            <div className="h-1.5 w-full rounded-t-[28px]" style={{ background: 'linear-gradient(90deg,#682149,#DD64A6)' }} />

            {active ? (
              /* ---- single package details ---- */
              <div className="p-7 sm:p-9 fade-in-content">
                <button type="button" onClick={() => setActive(null)} className="inline-flex items-center gap-1.5 text-grey-light hover:text-blackberry font-semibold text-[14px] mb-5 cursor-pointer transition-colors">
                  <ArrowLeftIcon />
                  {L.back}
                </button>

                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    {active.tier && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink">{TIER_LABEL[active.tier] ?? active.tier}</span>}
                    <h3 className="font-bold text-blackberry text-[24px] leading-tight break-words">{active.name}</h3>
                  </div>
                  <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 grid place-items-center rounded-full text-grey-light hover:text-blackberry hover:bg-grey-lighter transition-colors cursor-pointer">
                    <CloseIcon />
                  </button>
                </div>

                {active.price > 0 ? (
                  <p className="text-blackberry font-bold text-[28px] tabular-nums mb-5">{active.price}<span className="text-[15px] text-grey-light font-semibold ml-1.5">{active.currency}</span></p>
                ) : (
                  <p className="text-grey-light font-semibold text-[16px] mb-5">{L.priceOnRequest}</p>
                )}

                {active.description && <p className="text-grey leading-relaxed mb-6 break-words">{active.description}</p>}

                {(() => {
                  const tests = (active.includedTests && active.includedTests.length > 0) ? active.includedTests : active.includedServices
                  return tests && tests.length > 0 ? (
                    <div className="mb-7">
                      <p className="font-bold text-blackberry text-[13px] uppercase tracking-[0.1em] mb-3">{L.included}</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                        {tests.map((t, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-grey text-[15px] leading-snug break-words">
                            <span className="mt-1 text-pink"><CheckIcon /></span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                })()}

                {activePhone && (
                  <a
                    href={telHref}
                    className="flex items-center justify-center gap-2.5 bg-blackberry text-white font-bold text-[16px] px-6 py-4 rounded-full no-underline transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-blackberry-light active:translate-y-0"
                  >
                    <span className="w-5 h-5"><PhoneIcon /></span>
                    {L.call}: {activePhone}
                  </a>
                )}
              </div>
            ) : audienceChoices ? (
              /* ---- audience chooser (home tier cards: pick gender / kid) ---- */
              <div className="p-7 sm:p-9 fade-in-content">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3.5">
                    {icon && (
                      <span className="w-12 h-12 rounded-2xl grid place-items-center bg-pink-light text-blackberry shrink-0">
                        <span className="w-6 h-6">{icon}</span>
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold text-blackberry text-[22px] leading-tight">{heading}</h3>
                      <p className="text-grey-light text-[13px] font-semibold uppercase tracking-[0.1em] mt-0.5">{audiencePrompt ?? subheading ?? L.choosePkg}</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 grid place-items-center rounded-full text-grey-light hover:text-blackberry hover:bg-grey-lighter transition-colors cursor-pointer">
                    <CloseIcon />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {audienceChoices.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      disabled={!choice.pkg}
                      onClick={() => choice.pkg && setActive(choice.pkg)}
                      className="group text-left bg-white rounded-2xl p-5 flex flex-col items-start gap-3 cursor-pointer border border-grey-lighter/80 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-pink/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:border-grey-lighter/80"
                      style={{ boxShadow: '0 10px 28px -22px rgba(104,33,73,0.35)' }}
                    >
                      <span className="w-12 h-12 rounded-2xl grid place-items-center bg-pink-light text-blackberry shrink-0">
                        <span className="w-6 h-6">{choice.icon}</span>
                      </span>
                      <span className="font-bold text-blackberry text-[17px] leading-snug">{choice.label}</span>
                      <span className="text-grey-light text-[13px] leading-relaxed break-words">{choice.description}</span>
                      {choice.pkg && (
                        <span className="mt-1 inline-flex items-center gap-1 text-pink font-bold text-[13px] group-hover:gap-2 transition-[gap]">
                          {L.details}
                          <ArrowRightIcon />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ---- package list ---- */
              <div className="p-7 sm:p-9 fade-in-content">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3.5">
                    {icon && (
                      <span className="w-12 h-12 rounded-2xl grid place-items-center bg-pink-light text-blackberry shrink-0">
                        <span className="w-6 h-6">{icon}</span>
                      </span>
                    )}
                    <div>
                      <h3 className="font-bold text-blackberry text-[22px] leading-tight">{heading}</h3>
                      <p className="text-grey-light text-[13px] font-semibold uppercase tracking-[0.1em] mt-0.5">{subheading ?? L.choosePkg}</p>
                    </div>
                  </div>
                  <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 grid place-items-center rounded-full text-grey-light hover:text-blackberry hover:bg-grey-lighter transition-colors cursor-pointer">
                    <CloseIcon />
                  </button>
                </div>

                {packages.length > 0 ? (
                  <div className="grid gap-3.5">
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setActive(pkg)}
                        className="group text-left w-full bg-white rounded-2xl p-5 sm:p-6 flex items-center gap-4 cursor-pointer border border-grey-lighter/80 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-pink/40"
                        style={{ boxShadow: '0 10px 28px -22px rgba(104,33,73,0.35)' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            {pkg.tier && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink bg-pink-light/60 px-2.5 py-1 rounded-full">{TIER_LABEL[pkg.tier] ?? pkg.tier}</span>}
                            {pkg.tier && <LevelMeter level={(TIER_RANK[pkg.tier] ?? 0) + 1} />}
                          </div>
                          <h4 className="font-bold text-blackberry text-[17px] leading-snug break-words">{pkg.name}</h4>
                          {pkg.description && <p className="text-grey-light text-[13px] leading-relaxed mt-1 break-words line-clamp-2">{pkg.description}</p>}
                          <div className="flex items-center gap-3 mt-2.5">
                            {pkg.price > 0 ? (
                              <span className="text-blackberry font-bold text-[18px] tabular-nums">{pkg.price}<span className="text-[12px] text-grey-light font-semibold ml-1">{pkg.currency}</span></span>
                            ) : (
                              <span className="text-grey-light font-semibold text-[13px]">{L.priceOnRequest}</span>
                            )}
                            {pkg.includedTests && pkg.includedTests.length > 0 && (
                              <span className="text-grey-light text-[13px] font-semibold inline-flex items-center gap-1.5">
                                <span className="text-pink"><CheckIcon /></span>
                                {pkg.includedTests.length} {L.testsWord}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-pink font-bold text-[13px] inline-flex items-center gap-1 group-hover:gap-2 transition-[gap]">
                          {L.details}
                          <ArrowRightIcon />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-grey-light py-10">{L.none}</p>
                )}
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
