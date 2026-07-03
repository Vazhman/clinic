'use client'

import * as React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import type { IndividualCheckup } from '@/lib/individual-checkups'

type Loc = 'ge' | 'en' | 'ru'

const LABELS: Record<Loc, {
  title: string; hint: string; lead: string; tests: string; included: string
  call: string; viewAll: string; priceOnRequest: string; more: string
}> = {
  ge: {
    title: 'ინდივიდუალური ჩექაფები',
    hint: 'ცალკეული მიმართულებები',
    lead: 'მიზნობრივი გამოკვლევები ერთ კონკრეტულ სისტემაზე ან საკითხზე — შეარჩიეთ ის, რაც გჭირდებათ.',
    tests: 'გამოკვლევა',
    included: 'ჩართული გამოკვლევები',
    call: 'დაგვირეკეთ',
    viewAll: 'სრულად ნახვა',
    priceOnRequest: 'ფასი დასაზუსტებით',
    more: 'კიდევ',
  },
  en: {
    title: 'Individual check-ups',
    hint: 'Targeted, single-focus screenings',
    lead: 'Focused work-ups for one specific system or concern — pick exactly what you need.',
    tests: 'tests',
    included: 'Included tests',
    call: 'Call us',
    viewAll: 'View all',
    priceOnRequest: 'Price on request',
    more: 'more',
  },
  ru: {
    title: 'Индивидуальные чек-апы',
    hint: 'Целевые обследования',
    lead: 'Прицельные обследования одной системы или проблемы — выберите именно то, что нужно.',
    tests: 'исслед.',
    included: 'Включённые исследования',
    call: 'Позвоните нам',
    viewAll: 'Смотреть все',
    priceOnRequest: 'Цена по запросу',
    more: 'ещё',
  },
}

// --- icons (single consistent line family, no emoji) -------------------------
const sysProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const SYSTEM_ICON: Record<IndividualCheckup['system'], React.FC> = {
  heart: () => (<svg {...sysProps} aria-hidden><path d="M20.8 8.6c0 4.6-7.3 9.2-8.8 10.1-1.5-.9-8.8-5.5-8.8-10.1A4.1 4.1 0 0 1 12 6a4.1 4.1 0 0 1 8.8 2.6Z" /><path d="M3.5 12h4l1.5-3 2.5 6 1.6-3H20" /></svg>),
  digestive: () => (<svg {...sysProps} aria-hidden><path d="M9 4v3a3 3 0 0 0 3 3h2a3 3 0 0 1 3 3v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4" /><path d="M9 4H6" /></svg>),
  metabolic: () => (<svg {...sysProps} aria-hidden><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>),
  lungs: () => (<svg {...sysProps} aria-hidden><path d="M12 4v8" /><path d="M8 9c0-1.5-1-2.5-2.2-2.5C4.3 6.5 3.5 8 3.5 10v4c0 2 1.5 3 3 3s3-1 3-3V9" /><path d="M16 9c0-1.5 1-2.5 2.2-2.5 1.5 0 2.3 1.5 2.3 3.5v4c0 2-1.5 3-3 3s-3-1-3-3V9" /></svg>),
  blood: () => (<svg {...sysProps} aria-hidden><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" /></svg>),
  urinary: () => (<svg {...sysProps} aria-hidden><path d="M8 3h8" /><path d="M9 3v3.5L6 18a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3L15 6.5V3" /><path d="M7 12h10" /></svg>),
  thyroid: () => (<svg {...sysProps} aria-hidden><path d="M12 6c-2.2 1.8-7 1-7 5a4 4 0 0 0 4.6 4c1.3-.2 2-1.4 2.4-3 .4 1.6 1.1 2.8 2.4 3A4 4 0 0 0 19 11c0-4-4.8-3.2-7-5Z" /></svg>),
  liver: () => (<svg {...sysProps} aria-hidden><path d="M4 7c5 0 9 .5 14 0 2 4-1 11-6 11-4 0-5-2.5-6-4.5C5.5 13 4 10 4 7Z" /><path d="M12 11c1.5 0 2.5-1 3.5-1.5" /></svg>),
  bone: () => (<svg {...sysProps} aria-hidden><path d="M8.5 8.5 15 15" /><path d="M9 6.5A2 2 0 1 0 6.5 9L9 6.5Z" /><path d="M17.5 15A2 2 0 1 0 15 17.5L17.5 15Z" /></svg>),
}

function CheckIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>)
}
function CloseIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="w-5 h-5"><path d="M6 6l12 12M18 6 6 18" /></svg>)
}
function PhoneIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>)
}

export default function IndividualCheckups({
  checkups, phone, locale,
}: {
  checkups: IndividualCheckup[]
  phone: string
  locale: Loc
}) {
  const L = LABELS[locale] ?? LABELS.ge
  const [active, setActive] = React.useState<IndividualCheckup | null>(null)
  const telHref = `tel:${(phone || '').replace(/[^\d+]/g, '')}`

  React.useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  return (
    <section className="relative bg-cream py-16 sm:py-24">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14" style={{ animation: 'fade-up 0.6s 0.02s both' }}>
          <span className="text-pink/70 text-[12px] font-semibold tracking-[0.22em] uppercase">{L.hint}</span>
          <h2 className="mt-3 text-blackberry font-bold text-[clamp(1.5rem,3.4vw,2.4rem)] tracking-[-0.02em] break-words">{L.title}</h2>
          <p className="mt-4 text-grey-light text-[15px] leading-relaxed max-w-2xl mx-auto break-words">{L.lead}</p>
        </div>

        <div className="stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {checkups.map((c) => {
            const Icon = SYSTEM_ICON[c.system]
            const preview = c.tests.slice(0, 3)
            const rest = c.tests.length - preview.length
            return (
              <div key={c.id}>
                <button
                  type="button"
                  onClick={() => setActive(c)}
                  className="group text-left w-full h-full bg-white rounded-3xl p-7 flex flex-col cursor-pointer border border-grey-lighter/80 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-pink/40 active:translate-y-0"
                  style={{ boxShadow: '0 14px 36px -24px rgba(104,33,73,0.3)' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-2xl grid place-items-center bg-pink-light/60 text-blackberry group-hover:bg-pink/15 transition-colors duration-300">
                      <span className="w-6 h-6"><Icon /></span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-pink bg-pink-light/60 px-2.5 py-1 rounded-full tabular-nums">
                      {c.tests.length} {L.tests}
                    </span>
                  </div>

                  <h3 className="font-bold text-blackberry text-[18px] leading-snug mb-1.5 break-words">{c.name[locale]}</h3>
                  <p className="text-grey-light text-[13px] leading-relaxed mb-5 break-words">{c.blurb[locale]}</p>

                  <ul className="space-y-2 mb-5 flex-1">
                    {preview.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-grey text-[13px] leading-snug break-words">
                        <span className="mt-[3px] text-pink"><CheckIcon /></span>
                        <span>{t}</span>
                      </li>
                    ))}
                    {rest > 0 && (
                      <li className="text-grey-light text-[13px] font-medium pl-[22px]">+ {rest} {L.more}</li>
                    )}
                  </ul>

                  <span className="mt-auto text-pink font-bold text-[14px] inline-flex items-center gap-1 group-hover:gap-2 transition-[gap]">
                    {L.viewAll}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* detail modal — same visual language as CheckupsExplorer */}
      <AnimatePresence>
        {active && (
          <m.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setActive(null)}
            style={{ background: 'rgba(40,12,28,0.45)', backdropFilter: 'blur(4px)' }}
          >
            <m.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-[28px] max-w-lg w-full max-h-[86vh] overflow-auto"
              style={{ boxShadow: '0 40px 80px -30px rgba(104,33,73,0.5)' }}
            >
              <div className="h-1.5 w-full rounded-t-[28px]" style={{ background: 'linear-gradient(90deg,#682149,#DD64A6)' }} />
              <div className="p-7 sm:p-9">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink">{active.tests.length} {L.tests}</span>
                    <h3 className="font-bold text-blackberry text-[24px] leading-tight break-words">{active.name[locale]}</h3>
                  </div>
                  <button type="button" onClick={() => setActive(null)} aria-label="Close" className="shrink-0 w-9 h-9 grid place-items-center rounded-full text-grey-light hover:text-blackberry hover:bg-grey-lighter transition-colors cursor-pointer">
                    <CloseIcon />
                  </button>
                </div>

                <p className="text-grey-light font-semibold text-[16px] mb-5">{L.priceOnRequest}</p>
                <p className="text-grey leading-relaxed mb-6 break-words">{active.blurb[locale]}</p>

                <div className="mb-7">
                  <p className="font-bold text-blackberry text-[13px] uppercase tracking-[0.1em] mb-3">{L.included}</p>
                  <ul className="space-y-2.5 fade-in-content">
                    {active.tests.map((t, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-grey text-[15px] leading-snug break-words">
                        <span className="mt-1 text-pink"><CheckIcon /></span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {phone && (
                  <a
                    href={telHref}
                    className="flex items-center justify-center gap-2.5 bg-blackberry text-white font-bold text-[16px] px-6 py-4 rounded-full no-underline transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-blackberry-light active:translate-y-0"
                  >
                    <span className="w-5 h-5"><PhoneIcon /></span>
                    {L.call}: {phone}
                  </a>
                )}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  )
}
