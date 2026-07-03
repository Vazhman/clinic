import React from 'react'
import type { IconProps } from '../tokens'

export default function TranslateIcon({ size = 16, color = 'currentColor', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5h7" />
      <path d="M7 4c0 4.5-2 7.5-5 9" />
      <path d="M4 9c0 1.5 2.5 4 6 4" />
      <path d="m13 21 4-9 4 9" />
      <path d="M14.5 17h5" />
    </svg>
  )
}
