// src/components/admin/DoctorListFilters.tsx
'use client'

import React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { colors, spacing, radii, fontSizes } from './tokens'

const presets = [
  { key: 'all', label: 'ყველა ექიმი', params: null, explainer: '' },
  { key: 'no-photo', label: 'ფოტო აკლია', params: { 'where[and][0][photo][exists]': 'false' }, explainer: 'ექიმები რომელთაც ფოტო ჯერ არ აქვთ ატვირთული' },
  { key: 'placeholder-specialty', label: 'სპეციალობა შესავსებია', params: { 'where[and][0][specialty][equals]': '—' }, explainer: 'ექიმები რომელთა სპეციალობა Doctra-დან ცარიელია ("—" placeholder-ით)' },
  { key: 'hidden-from-page', label: 'გვერდიდან დამალული', params: { 'where[and][0][showOnDoctorsPage][equals]': 'false' }, explainer: 'ექიმები რომლებიც არ ჩანან ექიმების გვერდზე — მათ შორის Doctra-დან ახლად სინქრონიზებულები. გადართეთ „ჩვენება ექიმების გვერდზე" სვეტის ღილაკით რომ გამოჩნდნენ.' },
  { key: 'hidden', label: 'დამალული (inactive)', params: { 'where[and][0][inactive][equals]': 'true' }, explainer: 'ექიმები რომელთა inactive checkbox მონიშნულია — საიტზე არ ჩანან, ჩაწერა გათიშულია' },
] as const

export default function DoctorListFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function applyPreset(params: Record<string, string> | null) {
    const sp = new URLSearchParams()
    if (params) for (const [k, v] of Object.entries(params)) sp.set(k, v)
    router.push(`${pathname}?${sp.toString()}`)
  }

  function isActive(params: Record<string, string> | null): boolean {
    if (!params) {
      // "All" is active when no `where[and]` keys are set
      for (const k of searchParams.keys()) if (k.startsWith('where[and]')) return false
      return true
    }
    return Object.entries(params).every(([k, v]) => searchParams.get(k) === v)
  }

  const activePreset = presets.find((p) => p.params && isActive(p.params))
  const isFiltered = !!activePreset

  return (
    <div style={{ background: colors.white, borderBottom: `1px solid ${colors.greyBorder}` }}>
      {/* Active-filter banner — only shows when admin landed via a NeedsAttentionCard
          link. Makes the filtered state obvious + offers a one-click way out. */}
      {isFiltered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, padding: `${spacing.md} ${spacing.lg}`, background: colors.pinkSoft, borderBottom: `1px solid ${colors.pinkBorder}`, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: fontSizes.sm, fontWeight: 600, color: colors.blackberry }}>
              აქტიური ფილტრი: {activePreset.label}
            </div>
            {activePreset.explainer && (
              <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginTop: 2 }}>
                {activePreset.explainer}
              </div>
            )}
          </div>
          <button
            className="clinic-focusable"
            onClick={() => applyPreset(null)}
            style={{
              background: colors.white,
              color: colors.blackberry,
              border: `1px solid ${colors.blackberry}`,
              borderRadius: radii.md,
              padding: `${spacing.xs} ${spacing.md}`,
              fontSize: fontSizes.xs,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            ფილტრის გასუფთავება
          </button>
        </div>
      )}
      {/* Preset chips */}
      <div style={{ display: 'flex', gap: spacing.sm, padding: `${spacing.md} ${spacing.lg}`, flexWrap: 'wrap' }}>
        {presets.map((p) => {
          const active = isActive(p.params)
          return (
            <button
              key={p.key}
              className="clinic-focusable"
              onClick={() => applyPreset(p.params)}
              title={p.explainer}
              style={{
                background: active ? colors.blackberry : colors.white,
                color: active ? colors.white : colors.blackberry,
                border: `1px solid ${active ? colors.blackberry : colors.greyBorder}`,
                borderRadius: radii.xl,
                padding: `${spacing.xs} ${spacing.md}`,
                fontSize: fontSizes.sm,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
