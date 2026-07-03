'use client'

import React from 'react'
import { useLocale } from '@payloadcms/ui'
import { colors, spacing, radii, fontSizes } from './tokens'

/**
 * Renders above the field set on any edit form. Reads Payload's current
 * admin locale and shows the editor which language version they're editing
 * — so an empty `name` doesn't get read as "broken data" when really it
 * just hasn't been translated to that locale yet.
 */
export default function LocaleHintBanner() {
  const locale = useLocale()
  const code = locale?.code ?? 'ge'
  const label = locale?.label ?? code

  const palette: Record<string, { tint: string; deep: string; flag: string }> = {
    ge: { tint: '#FAF0E6', deep: '#682149', flag: '🇬🇪' },
    en: { tint: '#E6F0FA', deep: '#1E3A8A', flag: '🇬🇧' },
    ru: { tint: '#FAE6E6', deep: '#7F1D1D', flag: '🇷🇺' },
  }
  const c = palette[code] ?? palette.ge

  return (
    <div
      role="note"
      style={{
        margin: `0 0 ${spacing.lg} 0`,
        background: c.tint,
        border: `1px solid ${c.deep}33`,
        borderLeft: `4px solid ${c.deep}`,
        borderRadius: radii.md,
        padding: `${spacing.md} ${spacing.lg}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
        fontSize: fontSizes.sm,
        color: colors.greyDeep,
        lineHeight: 1.55,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: fontSizes.xl, lineHeight: 1 }}>{c.flag}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: c.deep }}>
          ამჟამად რედაქტირებთ: <span style={{ textDecoration: 'underline' }}>{String(label)}</span>
        </div>
        <div style={{ marginTop: 4, color: colors.greyText }}>
          ცარიელი ველი ნიშნავს, რომ ეს ჩანაწერი <strong>ამ ენაზე ჯერ არ ითარგმნა</strong>. სხვა ენაში გადასასვლელად — ზედა მარჯვენა "Locale" გადამრთველი.
        </div>
      </div>
    </div>
  )
}
