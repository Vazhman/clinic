import React from 'react'

export default function PhotoMissingIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-3.86-3.86a2 2 0 0 0-2.83 0L6 20" />
      <line x1="3" y1="3" x2="21" y2="21" stroke={color} strokeWidth={strokeWidth} />
    </svg>
  )
}
