'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import { colors, spacing, radii, fontSizes } from './tokens'
import { CheckIcon } from './icons'

/**
 * Visual icon picker for the Services collection's `icon` field. Renders
 * a grid of all eight icons (heart / brain / baby / brain-circuit / flask /
 * ear / scissors / activity) and highlights the selected one. Backed by
 * Payload's `useField` so the underlying value is still the same string
 * the frontend already consumes via ServiceIcon.tsx.
 *
 * The path here is the field's name (e.g. "icon"). The hook returns the
 * current string value and a setter.
 */

type IconKey =
  | 'heart'
  | 'brain'
  | 'baby'
  | 'brain-circuit'
  | 'flask'
  | 'ear'
  | 'scissors'
  | 'activity'

const ICONS: { key: IconKey; emoji: string; label: string; path: React.ReactNode }[] = [
  {
    key: 'heart',
    emoji: '❤️',
    label: 'გული — კარდიოლოგია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
  },
  {
    key: 'brain',
    emoji: '🧠',
    label: 'ტვინი — ნევროლოგია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />,
  },
  {
    key: 'baby',
    emoji: '👶',
    label: 'ბავშვი — პედიატრია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />,
  },
  {
    key: 'brain-circuit',
    emoji: '⚡',
    label: 'ენერგია — ნეიროქირურგია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
  },
  {
    key: 'flask',
    emoji: '🧪',
    label: 'კოლბა — ლაბორატორია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5m14.8.8l-1.57-.393A9.065 9.065 0 0012 15a9.065 9.065 0 00-6.23.693L5 14.5" />,
  },
  {
    key: 'ear',
    emoji: '👂',
    label: 'ყური — ოტოლარინგოლოგია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />,
  },
  {
    key: 'scissors',
    emoji: '✂️',
    label: 'მაკრატელი — ქირურგია',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664" />,
  },
  {
    key: 'activity',
    emoji: '📈',
    label: 'აქტივობა — ზოგადი დიაგნოსტიკა',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3-9 4 18 3-9h4" />,
  },
]

export default function IconPicker({ path }: { path: string }) {
  // `useField` is Payload's generic field-state hook; for select fields the
  // value is a string. We coerce undefined → '' so the comparison below
  // doesn't get tricked by `null === undefined`.
  const { value, setValue } = useField<string>({ path })
  const selected = typeof value === 'string' ? value : ''

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <label style={{ display: 'block', fontSize: fontSizes.sm, fontWeight: 600, color: colors.blackberry, marginBottom: spacing.sm }}>
        ხატულა (Icon) <span style={{ color: colors.redError }}>*</span>
      </label>
      <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginBottom: spacing.sm }}>
        აირჩიე ერთი 8 მზა ხატულიდან. გამოჩნდება სერვისის ბარათზე საიტზე.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: spacing.sm,
        }}
      >
        {ICONS.map((icon) => {
          const isSelected = selected === icon.key
          return (
            <button
              key={icon.key}
              type="button"
              className="clinic-focusable"
              onClick={() => setValue(icon.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                padding: spacing.md,
                background: isSelected ? colors.pinkSoft : colors.white,
                border: `2px solid ${isSelected ? colors.pink : colors.greyBorder}`,
                borderRadius: radii.md,
                cursor: 'pointer',
                color: isSelected ? colors.blackberry : colors.greyText,
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = colors.pink
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = colors.greyBorder
              }}
              aria-pressed={isSelected}
              aria-label={`${icon.label}${isSelected ? ' (არჩეული)' : ''}`}
            >
              <svg
                width={32}
                height={32}
                fill="none"
                viewBox="0 0 24 24"
                stroke={isSelected ? colors.pink : colors.blackberry}
                strokeWidth={1.5}
              >
                {icon.path}
              </svg>
              <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">
                {icon.emoji}
              </span>
              {isSelected && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 10,
                    color: colors.pink,
                    fontWeight: 700,
                  }}
                >
                  <CheckIcon size={12} color={colors.pink} /> არჩეული
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Help note: explain whether the editor can upload their own icon. */}

    </div>
  )
}
