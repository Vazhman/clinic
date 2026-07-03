'use client'

import * as React from 'react'
import type { CheckupPackage } from '@/types'
import CheckupPackageModal from './CheckupPackageModal'

type Persona = 'woman' | 'man' | 'child'

const LABELS = {
  ge: {
    pick: 'ვის ეძებთ ჩექაფს?', woman: 'ქალი', man: 'კაცი', child: 'ბავშვი',
    viewPackages: 'იხილეთ პაკეტები', pkgWord: 'პაკეტი',
    desc: { woman: 'ქალის ჯანმრთელობაზე მორგებული ჩექაფ პაკეტები', man: 'კაცის ჯანმრთელობაზე მორგებული ჩექაფ პაკეტები', child: 'ბავშვის ჯანმრთელობაზე მორგებული ჩექაფ პაკეტები' },
  },
  en: {
    pick: 'Who is the check-up for?', woman: 'Women', man: 'Men', child: 'Children',
    viewPackages: 'View packages', pkgWord: 'packages',
    desc: { woman: "Check-up packages tailored to women's health", man: "Check-up packages tailored to men's health", child: "Check-up packages for children's health" },
  },
  ru: {
    pick: 'Для кого чек-ап?', woman: 'Женщины', man: 'Мужчины', child: 'Дети',
    viewPackages: 'Смотреть пакеты', pkgWord: 'пакета',
    desc: { woman: 'Чек-ап пакеты для женского здоровья', man: 'Чек-ап пакеты для мужского здоровья', child: 'Чек-ап пакеты для детского здоровья' },
  },
} as const

// Tier enum (CMS) -> badge text shown on cards. The spreadsheets use
// GENERAL / ADVANCED / PREMIUM; the CMS stores them as economy/standard/premium.
const TIER_LABEL: Record<string, string> = { economy: 'GENERAL', standard: 'ADVANCED', premium: 'PREMIUM' }
const TIER_RANK: Record<string, number> = { economy: 0, standard: 1, premium: 2 }

// --- line icons (no emoji) ---------------------------------------------------
const iconProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function WomanIcon() {
  return (<svg {...iconProps} aria-hidden><circle cx="12" cy="6" r="3.1" /><path d="M12 9.2 7.6 19.5h8.8L12 9.2Z" /><path d="M9.6 15h4.8" /></svg>)
}
function ManIcon() {
  return (<svg {...iconProps} aria-hidden><circle cx="12" cy="6" r="3.1" /><path d="M6.8 20v-5.4a5.2 5.2 0 0 1 10.4 0V20" /></svg>)
}
function ChildIcon() {
  return (<svg {...iconProps} aria-hidden><circle cx="12" cy="7.2" r="2.6" /><path d="M8.4 20v-4.4a3.6 3.6 0 0 1 7.2 0V20" /></svg>)
}
const PERSONA_ICON: Record<Persona, React.FC> = { woman: WomanIcon, man: ManIcon, child: ChildIcon }
const PERSONA_INDEX: Record<Persona, string> = { woman: '01', man: '02', child: '03' }

function ArrowRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>)
}

export default function CheckupsExplorer({
  packages, phone, locale, initialPersona = null, title, subtitle,
}: {
  packages: CheckupPackage[]
  phone: string
  locale: 'ge' | 'en' | 'ru'
  // Preselected category from the home-page teaser deep link (?p=) — opens that
  // audience's package modal straight away.
  initialPersona?: Persona | null
  // Folded in from the old standalone page hero so the dark stage owns the H1.
  title: string
  subtitle: string
}) {
  const L = LABELS[locale] ?? LABELS.ge
  const personas: Persona[] = ['woman', 'man', 'child']

  // Bucket packages per audience once (a package with no audience belongs to
  // all), tier-sorted GENERAL → PREMIUM.
  const byPersona = React.useMemo(() => {
    const out: Record<Persona, CheckupPackage[]> = { woman: [], man: [], child: [] }
    for (const p of personas) {
      out[p] = packages
        .filter((pk) => pk.audience === p || !pk.audience)
        .slice()
        .sort((a, b) => (TIER_RANK[a.tier ?? ''] ?? 99) - (TIER_RANK[b.tier ?? ''] ?? 99))
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages])

  // modalPersona = which audience's package list is open. The package list ⇄
  // details drill-in (and body-scroll/Esc handling) now lives in the shared
  // CheckupPackageModal.
  const [modalPersona, setModalPersona] = React.useState<Persona | null>(initialPersona)

  const modalList = modalPersona ? byPersona[modalPersona] : []

  const openPersona = (p: Persona) => { setModalPersona(p) }
  const closeModal = () => { setModalPersona(null) }

  return (
    <>
      {/* ── Immersive gateway — dark blackberry stage, owns the page H1 ── */}
      <section className="relative overflow-hidden bg-blackberry">
        {/* ambient depth: drifting pink washes + a vignette */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[22%] right-[-8%] w-[640px] h-[640px] bg-pink/[0.14] rounded-full blur-[150px] animate-float" />
          <div className="absolute bottom-[-18%] left-[-10%] w-[480px] h-[480px] bg-pink/[0.07] rounded-full blur-[130px] animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute inset-0 opacity-[0.5]" style={{ background: 'radial-gradient(120% 80% at 50% -10%, transparent 55%, rgba(40,12,28,0.55) 100%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 lg:pt-20 pb-14 sm:pb-20">
          <div className="max-w-3xl" style={{ animation: 'fade-up 0.7s 0.02s both' }}>
            <p className="text-pink/75 text-[12px] font-semibold tracking-[0.24em] uppercase mb-4 break-words">{subtitle}</p>
            <h1 className="text-[clamp(2.1rem,5vw,3.9rem)] font-bold text-white tracking-[-0.02em] leading-[1.04] break-words">
              {title}
            </h1>
            <p className="mt-5 inline-flex items-center gap-2.5 text-white/85 text-[clamp(1rem,1.6vw,1.2rem)] font-medium">
              <span aria-hidden className="h-[2px] w-7 bg-pink rounded-full" />
              {L.pick}
            </p>
          </div>

          {/* ── Three clear audience cards ──
              Equal grid (no flex-grow jank). Each card states what it is: icon,
              name, one-line description, the tier levels it contains, and a
              clear CTA. Hover = transform lift + glow (smooth everywhere).
              Click opens the package modal for that audience. */}
          <div className="stagger mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {personas.map((p) => {
              const Icon = PERSONA_ICON[p]
              const items = byPersona[p]
              const tiers = items.map((i) => i.tier).filter(Boolean) as string[]
              const count = items.length
              return (
                <div key={p}>
                  <button
                    type="button"
                    onClick={() => openPersona(p)}
                    aria-haspopup="dialog"
                    style={{
                      background: 'linear-gradient(160deg,#6f2350 0%,#511a39 58%,#3f1530 100%)',
                      boxShadow: '0 22px 50px -28px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(245,230,239,0.08)',
                    }}
                    className="group relative w-full h-full overflow-hidden rounded-[26px] text-left cursor-pointer p-7 sm:p-8 flex flex-col min-h-[300px] sm:min-h-[360px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-blackberry"
                  >
                    {/* index marker */}
                    <span aria-hidden className="absolute top-6 right-7 font-bold tabular-nums text-[14px] text-white/25 group-hover:text-pink-light/80 transition-colors duration-300">{PERSONA_INDEX[p]}</span>

                    {/* ghosted oversized figure — atmosphere, bleeds off bottom-right */}
                    <span aria-hidden className="pointer-events-none absolute -bottom-7 -right-5 w-[160px] h-[160px] text-white opacity-[0.06] group-hover:opacity-[0.11] group-hover:scale-105 transition-all duration-500 ease-out">
                      <Icon />
                    </span>
                    {/* hover glow */}
                    <span aria-hidden className="pointer-events-none absolute -top-14 left-1/2 -translate-x-1/2 w-52 h-52 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(221,100,166,0.4) 0%, rgba(221,100,166,0) 70%)' }} />

                    {/* icon chip */}
                    <span className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl grid place-items-center bg-white/[0.08] ring-1 ring-white/10 group-hover:bg-white/15 group-hover:ring-white/25 transition-colors duration-300">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 text-white"><Icon /></span>
                    </span>

                    {/* name + description */}
                    <div className="relative mt-5">
                      <h2 className="text-white font-bold leading-tight text-[clamp(1.4rem,2.6vw,2rem)] tracking-[-0.01em]">{L[p]}</h2>
                      <p className="mt-2 text-white/65 text-[14px] leading-relaxed break-words">{L.desc[p]}</p>
                    </div>

                    {/* tier levels contained — concrete, not an empty card */}
                    {tiers.length > 0 && (
                      <div className="relative mt-5 flex flex-wrap gap-1.5">
                        {tiers.map((tr, i) => (
                          <span key={i} className="text-[10px] font-bold uppercase tracking-[0.12em] text-pink-light bg-white/[0.06] ring-1 ring-white/10 px-2.5 py-1 rounded-full">
                            {TIER_LABEL[tr] ?? tr}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA — pinned to the bottom */}
                    <div className="relative mt-auto pt-6 flex items-center justify-between">
                      <span className="text-white/55 text-[12px] font-semibold">
                        {count > 0 ? `${count} ${L.pkgWord}` : ' '}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-pink-light font-bold text-[14px] group-hover:gap-2.5 transition-[gap] duration-300">
                        {L.viewPackages}
                        <ArrowRightIcon />
                      </span>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Modal: audience package list ⇄ single package details ── */}
      <CheckupPackageModal
        open={modalPersona !== null}
        onClose={closeModal}
        packages={modalList}
        phone={phone}
        locale={locale}
        heading={modalPersona ? L[modalPersona] : ''}
        ariaLabel={modalPersona ? L[modalPersona] : undefined}
        icon={modalPersona ? React.createElement(PERSONA_ICON[modalPersona]) : undefined}
      />
    </>
  )
}
