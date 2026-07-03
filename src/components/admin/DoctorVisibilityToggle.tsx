// src/components/admin/DoctorVisibilityToggle.tsx
'use client'

// List-view Cell for the `showOnDoctorsPage` column. Renders an interactive
// switch so an editor can show/hide a doctor on the public /doctors list with
// ONE click — no need to open the doctor. Used to publish newly-synced doctors
// (which arrive hidden, see /api/import-doctra) without round-tripping through
// the edit form. Flips the value via the Payload REST API (cookie auth).
import React, { useState } from 'react'
import { colors } from './tokens'

type CellProps = {
  // The value of `showOnDoctorsPage` for this row.
  cellData?: boolean | null
  rowData?: { id?: number | string }
}

export default function DoctorVisibilityToggle({ cellData, rowData }: CellProps) {
  const id = rowData?.id
  // Unset (null/undefined) means visible — mirrors the public getDoctors filter
  // (`not_equals: false` keeps rows where the field is false/unset).
  const [visible, setVisible] = useState<boolean>(cellData !== false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  if (id == null) return null

  async function toggle() {
    if (saving) return
    const next = !visible
    setSaving(true)
    setError(false)
    setVisible(next) // optimistic
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ showOnDoctorsPage: next }),
      })
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      setVisible(!next) // revert on failure
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      className="clinic-focusable"
      onClick={toggle}
      disabled={saving}
      title={
        visible
          ? 'ჩანს ექიმების გვერდზე — დასამალად დააჭირეთ'
          : 'დამალულია ექიმების გვერდიდან — გამოსაჩენად დააჭირეთ'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: saving ? 'wait' : 'pointer',
        background: 'transparent',
        border: 'none',
        padding: 0,
        font: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'relative',
          width: 34,
          height: 20,
          borderRadius: 999,
          background: error ? colors.redError : visible ? colors.blackberry : colors.greyBorder,
          transition: 'background 0.15s ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: visible ? 16 : 2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: colors.white,
            transition: 'left 0.15s ease',
          }}
        />
      </span>
      <span
        role="status"
        aria-live="polite"
        style={{ fontSize: 12, color: colors.greyText, whiteSpace: 'nowrap' }}
      >
        {error ? 'შეცდომა' : visible ? 'ჩანს' : 'დამალულია'}
      </span>
    </button>
  )
}
