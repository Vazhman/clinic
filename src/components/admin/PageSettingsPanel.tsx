// src/components/admin/PageSettingsPanel.tsx
'use client'

/**
 * Quick-access panel shown above the Pages list, linking out to the 7
 * globals that configure the site's built-in pages (home/about/services/
 * doctors/contact/booking/policies) — as opposed to the CMS-managed
 * `pages` collection docs listed below it.
 *
 * Payload 3.83's exported useDocumentDrawer/DocumentDrawer only accepts
 * `collectionSlug`, not a global slug, so a true React-rendered drawer
 * isn't available through supported APIs. This opens the real
 * /admin/globals/<slug> edit view — same code, same validation — inside
 * an iframe wrapped in a slide-over panel, instead of forking Payload's
 * unexported internals.
 */

import React, { useEffect, useState } from 'react'
import { colors, spacing, radii, fontSizes, shadows } from './tokens'
import { HomeIcon, PageIcon, ServiceIcon, DoctorIcon, PhoneIcon, CheckIcon, LayoutIcon, ExternalLinkIcon } from './icons'
import type { IconProps } from './tokens'

const PAGE_GLOBALS: { slug: string; label: string; Icon: React.ComponentType<IconProps> }[] = [
  { slug: 'home-page', label: 'მთავარი გვერდი', Icon: HomeIcon },
  { slug: 'about-page', label: 'ჩვენ შესახებ', Icon: PageIcon },
  { slug: 'services-page', label: 'სერვისების გვერდი', Icon: ServiceIcon },
  { slug: 'doctors-page', label: 'ექიმების გვერდი', Icon: DoctorIcon },
  { slug: 'contact-page', label: 'საკონტაქტო გვერდი', Icon: PhoneIcon },
  { slug: 'booking-page', label: 'ჯავშნის გვერდი', Icon: CheckIcon },
  { slug: 'policies', label: 'წესები და პოლიტიკა', Icon: LayoutIcon },
]

export default function PageSettingsPanel() {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const active = PAGE_GLOBALS.find((g) => g.slug === openSlug) ?? null

  useEffect(() => {
    if (!active) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenSlug(null)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [active])

  return (
    <div style={{ background: colors.white, borderBottom: `1px solid ${colors.greyBorder}`, padding: `${spacing.md} ${spacing.lg}` }}>
      <div
        style={{
          fontSize: fontSizes.xs,
          fontWeight: 600,
          color: colors.greyText,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: spacing.sm,
        }}
      >
        საიტის გვერდების პარამეტრები
      </div>
      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
        {PAGE_GLOBALS.map((g) => (
          <button
            key={g.slug}
            type="button"
            className="clinic-focusable"
            onClick={() => setOpenSlug(g.slug)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
              background: colors.pinkSoft,
              color: colors.blackberry,
              border: `1px solid ${colors.pinkBorder}`,
              borderRadius: radii.xl,
              padding: `${spacing.xs} ${spacing.md}`,
              fontSize: fontSizes.sm,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <g.Icon size={14} />
            {g.label}
          </button>
        ))}
      </div>

      {active && (
        <>
          <div
            onClick={() => setOpenSlug(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(20,8,15,0.35)', zIndex: 400 }}
          />
          <div
            role="dialog"
            aria-label={active.label}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(900px, 92vw)',
              background: colors.cream,
              zIndex: 401,
              boxShadow: shadows.lg,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${spacing.md} ${spacing.lg}`,
                borderBottom: `1px solid ${colors.greyBorder}`,
                background: colors.white,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <active.Icon size={18} color={colors.blackberry} />
                <span style={{ fontSize: fontSizes.lg, fontWeight: 600, color: colors.greyDeep }}>{active.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <a
                  href={`/admin/globals/${active.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="clinic-focusable"
                  title="ახალ ჩანართში გახსნა"
                  style={{ display: 'inline-flex', alignItems: 'center', color: colors.greyText }}
                >
                  <ExternalLinkIcon size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => setOpenSlug(null)}
                  className="clinic-focusable"
                  aria-label="დახურვა"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: fontSizes.xl,
                    lineHeight: 1,
                    cursor: 'pointer',
                    color: colors.greyText,
                    padding: 4,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <iframe
              key={active.slug}
              src={`/admin/globals/${active.slug}`}
              title={active.label}
              style={{ flex: 1, border: 'none', width: '100%' }}
            />
          </div>
        </>
      )}
    </div>
  )
}
