import React from 'react'
import { colors, fontSizes } from './tokens'

export default function Icon() {
  return (
    <span
      style={{
        color: colors.white,
        fontSize: fontSizes.md,
        fontWeight: 600,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
      }}
    >
      მთავარი
    </span>
  )
}
