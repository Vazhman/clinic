'use client'

import React, { useState } from 'react'
import { HomeIcon, GlobeIcon, ExternalLinkIcon } from './icons'

// Top-of-sidebar buttons: "Dashboard" (back to /admin) and "View site"
// (opens public homepage in a new tab). Lives in the `beforeNavLinks`
// slot so it's always visible regardless of how tall the nav list grows —
// the previous `afterNavLinks` placement fell below the fold once enough
// collections + globals were added, even with margin-top: auto, because
// Payload's sidebar isn't a guaranteed flex column.

const containerStyle: React.CSSProperties = {
  padding: '12px 16px 16px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  marginBottom: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.01em',
  transition: 'background 0.2s ease, border-color 0.2s ease',
}

const secondaryButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '12px',
  transition: 'background 0.2s ease, color 0.2s ease',
}

// Pink-tinted highlight for the primary button — derived from the brand
// pink (#DD64A6 → rgb 221, 100, 166) at rest / hover opacities.
const primaryRest: React.CSSProperties = {
  background: 'rgba(221, 100, 166, 0.18)',
  border: '1px solid rgba(221, 100, 166, 0.35)',
}
const primaryHover: React.CSSProperties = {
  background: 'rgba(221, 100, 166, 0.28)',
  border: '1px solid rgba(221, 100, 166, 0.55)',
}

const secondaryRest: React.CSSProperties = {
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.7)',
}
const secondaryHover: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'rgba(255, 255, 255, 0.95)',
}

export default function BeforeNavLinks() {
  const [primaryHovered, setPrimaryHovered] = useState(false)
  const [secondaryHovered, setSecondaryHovered] = useState(false)

  return (
    <div style={containerStyle}>
      <a
        href="/admin"
        className="clinic-focusable"
        style={{ ...primaryButtonStyle, ...(primaryHovered ? primaryHover : primaryRest) }}
        onMouseEnter={() => setPrimaryHovered(true)}
        onMouseLeave={() => setPrimaryHovered(false)}
      >
        <HomeIcon size={16} />
        <span>მთავარი — Dashboard</span>
      </a>
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="clinic-focusable"
        style={{ ...secondaryButtonStyle, ...(secondaryHovered ? secondaryHover : secondaryRest) }}
        onMouseEnter={() => setSecondaryHovered(true)}
        onMouseLeave={() => setSecondaryHovered(false)}
      >
        <GlobeIcon size={14} />
        <span>საიტის ნახვა</span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
          <ExternalLinkIcon size={12} />
        </span>
      </a>
    </div>
  )
}
