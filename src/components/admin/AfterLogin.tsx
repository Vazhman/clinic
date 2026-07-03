// src/components/admin/AfterLogin.tsx
import React from 'react'
import { colors, spacing, fontSizes } from './tokens'
import { PhoneIcon, GlobeIcon, ExternalLinkIcon } from './icons'

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  textDecoration: 'none',
  fontSize: fontSizes.sm,
  fontWeight: 500,
}

export default function AfterLogin() {
  return (
    <div style={{ marginTop: spacing.xl, paddingTop: spacing.lg, borderTop: `1px solid ${colors.greyBorder}`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <a href="tel:+995422227171" className="clinic-focusable" style={{ ...linkStyle, color: colors.greyText }}>
        <PhoneIcon size={14} />
        (+995) 422 22 71 71
      </a>
      <a href="https://khozrevanidze.ge" target="_blank" rel="noopener noreferrer" className="clinic-focusable" style={{ ...linkStyle, color: colors.pink }}>
        <GlobeIcon size={14} />
        khozrevanidze.ge
        <ExternalLinkIcon size={12} />
      </a>
    </div>
  )
}
