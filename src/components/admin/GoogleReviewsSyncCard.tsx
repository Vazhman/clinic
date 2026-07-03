'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { colors, spacing, radii, fontSizes } from './tokens'
import { StarIcon, CheckIcon, AlertIcon } from './icons'

type Summary = {
  fetched: number
  created: number
  updated: number
  skipped: number
  errors?: string[]
  message?: string
}

type State =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'success'; summary: Summary }
  | { status: 'error'; message: string }

export default function GoogleReviewsSyncCard() {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: 'idle' })

  async function runSync() {
    setState({ status: 'running' })
    try {
      const res = await fetch('/api/sync-google-reviews', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setState({ status: 'error', message: data.error || `HTTP ${res.status}` })
        return
      }
      setState({ status: 'success', summary: data.summary })
      router.refresh()
    } catch (err) {
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
            <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md }}>
              Google-დან შეფასებების მოპოვება…
            </div>
            <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 2 }}>
              ~5 წამი
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'success') {
    const s = state.summary
    // Nothing new landed — Google only ever returns its 5 "most relevant"
    // reviews, so a repeat sync usually finds everything already in the DB.
    // Say so plainly instead of a bare "+0", and point the editor at manual add.
    const nothingNew = s.created === 0 && s.updated === 0
    // Primary, human-readable headline of what actually happened this run.
    const primaryLine =
      s.created > 0
        ? `+${s.created} ახალი შეფასება დაემატა${s.updated > 0 ? ` · ${s.updated} განახლდა` : ''}`
        : s.updated > 0
          ? `${s.updated} შეფასება განახლდა · ახალი არ მოსულა`
          : 'ახალი შეფასება არ მოსულა'
    // When all that came back already exists, tint the card neutral (amber)
    // rather than celebratory green — nothing changed on the site.
    const accent = nothingNew && s.fetched > 0 ? colors.amberWarn : colors.greenSuccess
    const accentSoft = nothingNew && s.fetched > 0 ? colors.amberWarnSoft : colors.greenSuccessSoft
    return (
      <div style={{ ...cardBase, borderColor: accent, background: accentSoft }}>
        <div style={{ flex: 1 }} role="status" aria-live="polite">
          <div style={{ fontWeight: 600, color: colors.blackberry, fontSize: fontSizes.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <CheckIcon size={16} />
            Google შეფასებების სინქრონიზაცია დასრულდა
          </div>
          <div style={{ fontWeight: 600, fontSize: fontSizes.sm, color: accent, marginTop: 4 }}>
            {primaryLine}
          </div>
          <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginTop: 2 }}>
            მოპოვებული: {s.fetched} · ახალი: +{s.created} · განახლებული: {s.updated} · გამოტოვებული: {s.skipped}
          </div>
          {s.message && (
            <div style={{ fontSize: fontSizes.xs, color: colors.amberWarn, marginTop: spacing.sm }}>
              {s.message}
            </div>
          )}
          {nothingNew && s.fetched > 0 && (
            <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginTop: spacing.sm, lineHeight: 1.55 }}>
              Google ჩამოაქვს მხოლოდ 5 ყველაზე რელევანტურ შეფასებას — ისინი უკვე ბაზაშია. ახალი შეფასების დასამატებლად{' '}
              <a href="/admin/collections/reviews/create" style={{ color: colors.pink, fontWeight: 600 }}>
                დაამატე ხელით
              </a>{' '}
              (დააკოპირე ავტორი და ტექსტი Google Maps-დან).
            </div>
          )}
          {s.created > 0 && (
            <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginTop: spacing.sm }}>
              ⚠ ახალი შეფასებები <b>გამოუქვეყნებელია</b>. გადით{' '}
              <a href="/admin/collections/reviews?where[and][0][published][equals]=false" style={{ color: colors.pink, fontWeight: 600 }}>
                შეფასებების სია
              </a>{' '}
              და მონიშნე "გამოქვეყნებული" იმათ ვინც გნებავთ ჩვენება.
            </div>
          )}
        </div>
        <button
          className="clinic-focusable"
          onClick={() => setState({ status: 'idle' })}
          style={{
            background: 'transparent',
            border: `1px solid ${colors.greyBorder}`,
            borderRadius: radii.md,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: fontSizes.sm,
            cursor: 'pointer',
            color: colors.greyText,
          }}
        >
          დახურვა
        </button>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div style={{ ...cardBase, borderColor: colors.redError, background: colors.redErrorSoft }}>
        <div style={{ flex: 1 }} role="status" aria-live="polite">
          <div style={{ fontWeight: 600, color: colors.redError, fontSize: fontSizes.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <AlertIcon size={16} />
            Google შეფასებების სინქრონიზაცია ვერ მოხერხდა
          </div>
          <div style={{ fontSize: fontSizes.sm, color: colors.greyText, marginTop: 4, fontFamily: 'monospace' }}>
            {state.message}
          </div>
          <div style={{ fontSize: fontSizes.xs, color: colors.greyLightText, marginTop: spacing.sm }}>
            შეამოწმე Vercel-ის env ცვლადები: <code>GOOGLE_PLACES_API_KEY</code> + <code>GOOGLE_PLACE_ID</code>. დაყენების ინსტრუქცია: <code>docs/HANDOVER.md → Google Reviews setup</code>.
          </div>
        </div>
        <button
          className="clinic-focusable"
          onClick={runSync}
          style={{
            background: colors.redError,
            color: colors.white,
            border: 'none',
            borderRadius: radii.md,
            padding: `${spacing.sm} ${spacing.lg}`,
            fontSize: fontSizes.sm,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          თავიდან ცდა
        </button>
      </div>
    )
  }

  // idle
  return (
    <div style={cardBase}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div
          style={{
            fontWeight: 600,
            color: colors.blackberry,
            fontSize: fontSizes.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <StarIcon size={16} />
          Google შეფასებების სინქრონიზაცია
        </div>
        <div style={{ fontSize: fontSizes.xs, color: colors.greyText, marginTop: spacing.sm, lineHeight: 1.55, maxWidth: 560 }}>
          <b>რას აკეთებს:</b> Google Places API-დან ჩამოვა კლინიკის შესახებ დაწერილი შეფასებები (5 ყველაზე რელევანტური). ჩაიწერება Payload-ში.
          <br />
          <b>გამოუქვეყნებელია:</b> ახალი შეფასებები ჯერ არ გამოჩნდება საიტზე — შენ უნდა გადახედო და "გამოქვეყნებული" ჩექბოქსი მონიშნო.
          <br />
          <b>დაყენება:</b> საჭიროა Vercel env ცვლადები — <code>GOOGLE_PLACES_API_KEY</code> + <code>GOOGLE_PLACE_ID</code>. ინსტრუქცია: <code>docs/HANDOVER.md</code>.
        </div>
      </div>
      <button
        className="clinic-focusable"
        onClick={runSync}
        aria-busy={false}
        style={{
          background: colors.pink,
          color: colors.white,
          border: 'none',
          borderRadius: radii.md,
          padding: `${spacing.md} ${spacing.lg}`,
          fontSize: fontSizes.md,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing.sm,
          alignSelf: 'flex-start',
        }}
      >
        <StarIcon size={16} />
        სინქი ახლა
      </button>
    </div>
  )
}
