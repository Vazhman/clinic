// src/components/admin/BeforeLogin.tsx
import React from 'react'
import { colors, spacing, fontSizes } from './tokens'

export default function BeforeLogin() {
  return (
    <>
      {/* Login background gradient injected via style tag — Payload's login
          shell wraps everything we render here. Targeting the form container
          via the `.payload__login` class structure that Payload renders. */}
      <style>{`
        body.template-default--login,
        .payload-login,
        section.template-default--login {
          background: linear-gradient(135deg, ${colors.cream} 0%, ${colors.pinkSoft} 100%) !important;
        }
      `}</style>
      <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
        <h1 style={{ margin: `0 0 ${spacing.xs} 0`, fontSize: fontSizes.xl, color: colors.blackberry, fontWeight: 700, letterSpacing: '-0.5px' }}>
          ხოზრევანიძის კლინიკა
        </h1>
        <p style={{ fontSize: fontSizes.sm, color: colors.greyText, margin: 0 }}>
          ადმინისტრაციული პანელი
        </p>
      </div>
    </>
  )
}
