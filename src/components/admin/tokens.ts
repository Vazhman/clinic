/**
 * Shared design tokens for all custom admin components.
 *
 * Payload admin doesn't load Tailwind, so admin custom components rely on
 * inline styles. Centralizing tokens here keeps the blackberry/pink palette
 * consistent across components and aligned with the public-site Tailwind
 * tokens (`tailwind.config.ts` blackberry: #682149, pink: #DD64A6).
 */

export const colors = {
  blackberry: '#682149',
  blackberryDark: '#4A1735',
  pink: '#DD64A6',
  pinkSoft: '#FDF4F9',
  pinkBorder: '#F7D6E7',
  cream: '#FAFAF8',
  white: '#FFFFFF',
  greyBorder: '#E4E4E4',
  greyText: '#6E6E6E',
  greyLightText: '#9CA3AF',
  greySubtle: '#F3F4F6',
  greenSuccess: '#2F9E6B',
  greenSuccessSoft: '#E5F7EE',
  amberWarn: '#C58A23',
  amberWarnSoft: '#FFF6E5',
  redError: '#C84444',
  redErrorSoft: '#FCE7E7',
  // Accent colors used by specific dashboard stat tiles (news/pages).
  // Not part of the brand palette but tokenized so palette changes are findable.
  accentPurple: '#8B5CF6',
  accentBlue: '#3B82F6',
  // Neutral greys borrowed from Tailwind's palette for inline labels.
  greyDeep: '#374151',
  greyChevron: '#D1D5DB',
} as const

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
} as const

export const fontSizes = {
  xs: '11px',
  sm: '12px',
  md: '13px',
  lg: '15px',
  xl: '18px',
  xxl: '22px',
} as const

export const lineHeights = {
  tight: 1.25,
  snug: 1.4,
  normal: 1.55,
  relaxed: 1.7,
} as const

export const letterSpacing = {
  normal: '0',
  wide: '0.05em',
  wider: '0.08em',
} as const

// Elevation scale — consistent shadows so cards/tiles/overlays share one
// vocabulary instead of bespoke rgba values per component (UI rule:
// elevation-consistent). `focus` is the keyboard focus ring used everywhere.
export const shadows = {
  sm: '0 1px 2px rgba(40, 12, 30, 0.06)',
  md: '0 4px 12px rgba(40, 12, 30, 0.08)',
  lg: '0 12px 32px rgba(40, 12, 30, 0.12)',
  // Soft brand-tinted lift used on interactive tiles when hovered.
  hover: '0 8px 20px rgba(104, 33, 73, 0.12)',
} as const

// Keyboard focus ring. Apply as `outline` + `outlineOffset` on every
// interactive element so keyboard users always see where they are
// (accessibility rule: focus-states, 2–4px visible ring).
export const focusRing = {
  outline: `2px solid ${colors.pink}`,
  outlineOffset: '2px',
} as const

export const transitions = {
  fast: '120ms ease',
  base: '180ms ease',
} as const

// Reusable icon-prop type so every SVG icon component shares one contract
// instead of redeclaring the same inline shape.
export type IconProps = {
  size?: number
  color?: string
  strokeWidth?: number
}
