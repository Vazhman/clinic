// src/components/admin/DoctraSyncCard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { colors, spacing, radii, fontSizes } from './tokens'
import { SyncIcon, CheckIcon, AlertIcon } from './icons'
import { formatLongDate } from '@/lib/format-date'

type ImportSummary = {
  services: { created: number; updated: number; skipped: number }
  doctors: { created: number; updated: number; skipped: number }
  errors: string[]
}

type State =
  | { status: 'idle' }
  | { status: 'running'; step: string }
  | { status: 'success'; summary: ImportSummary }
  | { status: 'error'; message: string }

function formatRelative(iso: string | null): string {
  if (!iso) return 'ჯერ არ არის სინქრონიზებული'
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'ახლახანს'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} წუთის წინ`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} საათის წინ`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} დღის წინ`
  return formatLongDate(iso, 'ge')
}

export default function DoctraSyncCard({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: 'idle' })
  const [showErrors, setShowErrors] = useState(false)
  // Re-render every 30s so the relative timestamp updates without a refresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  async function runSync() {
    setState({ status: 'running', step: 'ვითხოვ Doctra-ს განყოფილებებს...' })
    const t1 = setTimeout(() => setState((s) => (s.status === 'running' ? { status: 'running', step: 'ვიღებ ექიმებს...' } : s)), 2000)
    const t2 = setTimeout(() => setState((s) => (s.status === 'running' ? { status: 'running', step: 'ვწერ Payload-ში...' } : s)), 8000)
    try {
      const res = await fetch('/api/import-doctra', { method: 'POST', credentials: 'include' })
      clearTimeout(t1)
      clearTimeout(t2)
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setState({ status: 'error', message: data.error || `HTTP ${res.status}` })
        return
      }
      setState({ status: 'success', summary: data.summary })
      router.refresh()
    } catch (err) {
      clearTimeout(t1)
      clearTimeout(t2)
      setState({ status: 'error', message: (err as Error).message || 'ქსელის პრობლემა' })
    }
  }

  const cardBase: React.CSSProperties = {
    background: colors.white,
    border: `1px solid ${colors.greyBorder}`,
    borderRadius: radii.lg,
    padding: `${spacing.lg} ${spacing.xl}`,
    marginBottom: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
  }

  if (state.status === 'running') {
    return (
      <div style={{ ...cardBase, borderColor: colors.pinkBorder, background: colors.pinkSoft }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }} role="status" aria-live="polite">
          <span className="clinic-spinner" style={{ width: 18, height: 18 }} aria-hidden="true" />
          <div>
            <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md }}>{state.step}</div>
            <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 2 }}>5–15 წამი</div>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'success') {
    const s = state.summary
    const total = s.doctors.created + s.doctors.updated + s.services.created + s.services.updated
    const hasErrors = s.errors.length > 0
    return (
      <div style={{ ...cardBase, borderColor: hasErrors ? colors.amberWarn : colors.greenSuccess, background: hasErrors ? colors.amberWarnSoft : colors.greenSuccessSoft }}>
        <div style={{ flex: 1 }} role="status" aria-live="polite">
          <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {hasErrors
              ? <AlertIcon size={16} color={colors.amberWarn} />
              : <CheckIcon size={16} color={colors.greenSuccess} />}
            სინქრონიზაცია დასრულდა
          </div>
          <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4 }}>
            ექიმები: +{s.doctors.created} ახალი, {s.doctors.updated} განახლებული, {s.doctors.skipped} გამოტოვებული
            {' · '}
            სერვისები: +{s.services.created} ახალი, {s.services.updated} განახლებული
            {hasErrors && ` · ${s.errors.length} შეცდომა`}
          </div>
          {hasErrors && (
            <button className="clinic-focusable" onClick={() => setShowErrors((v) => !v)} style={{ marginTop: spacing.sm, background: 'transparent', border: 'none', color: colors.amberWarn, fontSize: fontSizes.sm, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              {showErrors ? 'დამალე შეცდომები' : `იხილე ${s.errors.length} შეცდომა`}
            </button>
          )}
          {showErrors && (
            <ul style={{ marginTop: spacing.sm, paddingLeft: spacing.lg, fontSize: fontSizes.xs, color: colors.greyText, maxHeight: 200, overflowY: 'auto' }}>
              {s.errors.map((e, i) => (<li key={i}>{e}</li>))}
            </ul>
          )}
        </div>
        <button className="clinic-focusable" onClick={() => setState({ status: 'idle' })} style={{ background: 'transparent', border: `1px solid ${colors.greyBorder}`, borderRadius: radii.md, padding: `${spacing.sm} ${spacing.md}`, fontSize: fontSizes.sm, cursor: 'pointer', color: colors.greyText }}>დახურვა</button>
        <div style={{ width: '100%', textAlign: 'right', fontSize: fontSizes.xs, color: total === 0 ? colors.greyLightText : colors.greenSuccess }}>
          {total === 0 && 'ბაზა უკვე განახლებული იყო'}
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div style={{ ...cardBase, borderColor: colors.redError, background: colors.redErrorSoft }}>
        <div style={{ flex: 1 }} role="status" aria-live="polite">
          <div style={{ fontWeight: 600, color: colors.redError, fontSize: fontSizes.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <AlertIcon size={16} color={colors.redError} />
            სინქრონიზაცია ვერ მოხერხდა
          </div>
          <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4, fontFamily: 'monospace' }}>{state.message}</div>
        </div>
        <button className="clinic-focusable" onClick={runSync} style={{ background: colors.redError, color: colors.white, border: 'none', borderRadius: radii.md, padding: `${spacing.sm} ${spacing.lg}`, fontSize: fontSizes.sm, fontWeight: 600, cursor: 'pointer' }}>თავიდან ცდა</button>
      </div>
    )
  }

  // idle
  return (
    <div style={cardBase}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <SyncIcon size={18} color={colors.blackberry} />
          Doctra სინქრონიზაცია
        </div>
        <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4 }}>
          ბოლო სინქრონი: {formatRelative(lastSyncedAt)}
        </div>
        {/* Plain-language description so an editor knows exactly what
            happens when they click — and what won't be touched. */}
        <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginTop: spacing.sm, lineHeight: 1.55, maxWidth: 560 }}>
          <b>რას აკეთებს:</b> წამოიღებს Doctra-ს API დან ექიმების და სერვისების სიას, ჩაიწერება CMS-ში.
          <br/>
          <b>რას არ ცვლის:</b> უკვე რედაქტირებული ექიმის სახელი / სპეციალობა / ბიოგრაფია / ფოტო. შენი ცვლილებები დაცულია.
          <br/>
          <b>დრო:</b> ~5–15 წამი (Doctra-ს სიჩქარის მიხედვით).
        </div>
      </div>
      <button className="clinic-focusable" onClick={runSync} style={{ background: colors.pink, color: colors.white, border: 'none', borderRadius: radii.md, padding: `${spacing.md} ${spacing.lg}`, fontSize: fontSizes.md, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' }}>
        <SyncIcon size={16} color={colors.white} />
        სინქრონიზაცია ახლა
      </button>
    </div>
  )
}
