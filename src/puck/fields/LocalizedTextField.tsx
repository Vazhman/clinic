'use client'

import * as React from 'react'
import { FieldLabel } from '@puckeditor/core'
import { useBuilderLocale } from '../locale-context'
import type { Loc } from '../types'

function LocalizedTextInput({
  value, onChange, label, multiline,
}: {
  value?: Loc<string>
  onChange: (v: Loc<string>) => void
  label: string
  multiline?: boolean
}) {
  const locale = useBuilderLocale()
  const current = value?.[locale] ?? ''
  const set = (next: string) => onChange({ ...(value ?? {}), [locale]: next })
  return (
    <FieldLabel label={`${label} (${locale.toUpperCase()})`}>
      {multiline ? (
        <textarea value={current} onChange={(e) => set(e.currentTarget.value)} rows={3}
          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
      ) : (
        <input value={current} onChange={(e) => set(e.currentTarget.value)}
          style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
      )}
    </FieldLabel>
  )
}

export function localizedTextField(opts: { label: string; multiline?: boolean }) {
  return {
    type: 'custom' as const,
    render: ({ value, onChange }: { value?: Loc<string>; onChange: (v: Loc<string>) => void }) => (
      <LocalizedTextInput value={value} onChange={onChange} label={opts.label} multiline={opts.multiline} />
    ),
  }
}
