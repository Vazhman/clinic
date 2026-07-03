// src/components/admin/DoctorRowActions.tsx
'use client'

import React from 'react'
import { colors } from './tokens'
import { ExternalLinkIcon } from './icons'

type CellProps = {
  rowData?: { slug?: string; inactive?: boolean }
}

export default function DoctorRowActions({ rowData }: CellProps) {
  const slug = rowData?.slug
  if (!slug) return null
  const disabled = !!rowData?.inactive
  const href = `/ge/doctors/${slug}`
  return (
    <a
      href={disabled ? undefined : href}
      target="_blank"
      rel="noopener noreferrer"
      className={disabled ? undefined : 'clinic-focusable'}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      title={disabled ? 'ექიმი დამალულია — საიტზე ვერ ნახავთ' : 'საიტზე ნახვა'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        color: disabled ? colors.greyLightText : colors.blackberry,
        opacity: disabled ? 0.5 : 1,
        textDecoration: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={(e) => { if (disabled) e.preventDefault() }}
    >
      <ExternalLinkIcon size={14} />
    </a>
  )
}
