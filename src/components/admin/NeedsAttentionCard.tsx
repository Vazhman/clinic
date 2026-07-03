'use client'

// src/components/admin/NeedsAttentionCard.tsx
import React from 'react'
import { colors, spacing, radii, fontSizes } from './tokens'
import { PhotoMissingIcon, SpecialtyIcon, HiddenIcon, TranslateIcon, CheckIcon, AlertIcon } from './icons'

export type NeedsAttentionCounts = {
  noPhoto: number
  placeholderSpecialty: number
  hidden: number
  needsRuTranslation: number
}

const tiles: Array<{
  key: keyof NeedsAttentionCounts
  label: string
  Icon: React.ComponentType<{ size?: number; color?: string }>
  href: string
  accent: string
}> = [
  {
    key: 'noPhoto',
    label: 'ფოტო აკლია',
    Icon: PhotoMissingIcon,
    href: '/admin/collections/doctors?where[and][0][photo][exists]=false',
    accent: colors.pink,
  },
  {
    key: 'placeholderSpecialty',
    label: 'სპეციალობა შესავსებია',
    Icon: SpecialtyIcon,
    href: '/admin/collections/doctors?where[and][0][specialty][equals]=—',
    accent: colors.amberWarn,
  },
  {
    key: 'hidden',
    label: 'დამალული ექიმები',
    Icon: HiddenIcon,
    href: '/admin/collections/doctors?where[and][0][inactive][equals]=true',
    accent: colors.greyText,
  },
  {
    key: 'needsRuTranslation',
    // "Doctors needing Russian translation"
    label: 'რუსული თარგმანი აკლია',
    Icon: TranslateIcon,
    // No server-side filter — Payload can't WHERE across locales easily.
    // Editor opens the list, flips the locale picker to Русский, and looks
    // for rows where name/specialty are still in English.
    href: '/admin/collections/doctors',
    accent: colors.accentPurple,
  },
]

export default function NeedsAttentionCard({ counts }: { counts: NeedsAttentionCounts }) {
  const totalIssues = (Object.values(counts) as number[]).reduce((s, n) => s + n, 0)
  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        <h3 style={{ fontSize: fontSizes.md, fontWeight: 600, color: colors.greyLightText, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          საჭიროებს ყურადღებას
        </h3>
        <span style={{ fontSize: fontSizes.xs, color: totalIssues === 0 ? colors.greenSuccess : colors.amberWarn, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}>
          {totalIssues === 0 ? (
            <>
              <CheckIcon size={14} color={colors.greenSuccess} />
              ყველაფერი წესრიგშია — შესასწორებელი არაფერია
            </>
          ) : (
            <>
              <AlertIcon size={14} color={colors.amberWarn} />
              {`${totalIssues} ინფორმაციის დანაკლისი ჯამში — იხილეთ სრული სია`}
            </>
          )}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
        {tiles.map(({ key, label, Icon, href, accent }) => {
          const count = counts[key]
          const isClear = count === 0
          // Differentiate clear vs needs-action with two visually distinct
          // looks so the editor can tell at a glance which tiles are healthy.
          const bgColor = isClear ? colors.greenSuccessSoft : colors.white
          const borderColor = isClear ? colors.greenSuccess : accent
          const valueColor = isClear ? colors.greenSuccess : colors.blackberry
          const statusText = isClear
            ? '✓ წესრიგშია — შესასწორებელი არაა'
            : `${count} შეუვსებელი ინფორმაცია → იხილეთ სია`
          return (
            <a
              key={key}
              href={href}
              className="clinic-lift clinic-focusable"
              style={{
                display: 'block',
                background: bgColor,
                border: `2px solid ${borderColor}`,
                borderRadius: radii.md,
                padding: spacing.lg,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, color: isClear ? colors.greenSuccess : accent }}>
                <Icon size={16} color={isClear ? colors.greenSuccess : accent} />
                <span style={{ fontSize: fontSizes.sm, fontWeight: 600 }}>{label}</span>
              </div>
              <div style={{ fontSize: fontSizes.xxl, fontWeight: 700, marginTop: spacing.sm, color: valueColor }}>
                {isClear ? '✓' : count}
              </div>
              <div style={{ fontSize: fontSizes.xs, color: isClear ? colors.blackberry : colors.greyText, marginTop: spacing.xs, fontWeight: isClear ? 600 : 400 }}>
                {statusText}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
