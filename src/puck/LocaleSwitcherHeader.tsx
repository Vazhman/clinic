'use client'

import * as React from 'react'
import { BUILDER_LOCALES, type BuilderLocale } from './types'

// Returns a Puck `overrides.header` render that adds a GE/EN/RU switch
// alongside the default actions. The selected locale is lifted to the
// parent (PuckBuilderField) so it can drive metadata + the edit context.
export function makeLocaleHeader(locale: BuilderLocale, setLocale: (l: BuilderLocale) => void) {
  return function Header({ actions }: { actions: React.ReactNode }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #eee', background: '#fff' }}>
        <strong style={{ color: '#682149' }}>ბილდერი</strong>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div role="group" aria-label="Edit language" style={{ display: 'flex', gap: 4 }}>
            {BUILDER_LOCALES.map((l) => (
              <button key={l} type="button" onClick={() => setLocale(l)}
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer',
                  background: l === locale ? '#DD64A6' : '#fff', color: l === locale ? '#fff' : '#3D3D3D', fontWeight: 600 }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div>{actions}</div>
        </div>
      </div>
    )
  }
}
