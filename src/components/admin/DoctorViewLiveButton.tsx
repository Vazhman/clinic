// src/components/admin/DoctorViewLiveButton.tsx
'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { colors, spacing, radii, fontSizes } from './tokens'
import { ExternalLinkIcon } from './icons'

export default function DoctorViewLiveButton() {
  const info = useDocumentInfo() as { savedDocumentData?: { slug?: string; inactive?: boolean } }
  const slug = info?.savedDocumentData?.slug
  const inactive = info?.savedDocumentData?.inactive
  if (!slug) return null
  const href = `/ge/doctors/${slug}`
  const label = inactive ? 'ექიმი დამალულია — საიტზე ვერ ნახავთ' : 'ექიმის გვერდი ახალ ფანჯარაში'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="clinic-focusable"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.md}`,
        background: 'transparent',
        border: `1px solid ${colors.greyBorder}`,
        borderRadius: radii.md,
        color: inactive ? colors.greyLightText : colors.blackberry,
        textDecoration: 'none',
        fontSize: fontSizes.sm,
        fontWeight: 500,
        opacity: inactive ? 0.6 : 1,
      }}
      title={label}
    >
      <ExternalLinkIcon size={14} />
      საიტზე ნახვა
    </a>
  )
}
