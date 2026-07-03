'use client'

import React from 'react'
import { useField, useFormFields, useLocale } from '@payloadcms/ui'
import { colors, spacing, radii, fontSizes } from './tokens'

/**
 * Custom field for `seo.metaTitle` and `seo.metaDescription` that surfaces the
 * auto-generated fallback (used by `generateMetadata` on the public site) as
 * the input's placeholder. Empty value => greyed-out preview of what Google
 * will actually see. Typing overrides the fallback.
 *
 * The factory in `src/fields/seo.ts` passes `clientProps` describing which
 * sibling fields drive the preview (e.g. Services use `name` and
 * `shortDescription`; Doctors use `name` + `specialty`).
 */

type Kind = 'title' | 'description'

type Props = {
  path: string
  kind: Kind
  titleSource: string
  titleSecondarySource: string | null
  descriptionSource: string
}

const CLINIC_NAME: Record<string, string> = {
  ge: 'ხოზრევანიძის კლინიკა',
  en: 'Khozrevanidze Clinic',
  ru: 'Клиника Хозреванидзе',
}

const MAX = { title: 60, description: 160 } as const

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export default function SeoPlaceholderField(props: Props) {
  const { path, kind, titleSource, titleSecondarySource, descriptionSource } = props
  const { value, setValue } = useField<string>({ path })

  // Pull sibling values from the form. The selector returns a tuple so
  // useFormFields' use-context-selector layer only re-renders when these
  // specific fields actually change.
  const [primary, secondary, description] = useFormFields(([fields]) => [
    asString(fields[titleSource]?.value),
    titleSecondarySource ? asString(fields[titleSecondarySource]?.value) : '',
    asString(fields[descriptionSource]?.value),
  ])

  const locale = useLocale()
  const localeCode = (typeof locale === 'object' && locale && 'code' in locale ? String(locale.code) : 'ge')
  const clinicName = CLINIC_NAME[localeCode] || CLINIC_NAME.ge

  const titleFallback = (() => {
    const head = secondary ? `${primary} — ${secondary}` : primary
    if (!head) return ''
    return `${head} | ${clinicName}`
  })()

  const placeholder = kind === 'title' ? titleFallback : description
  const current = asString(value)
  const usingFallback = current.length === 0 && placeholder.length > 0

  const charLimit = MAX[kind]
  const charCount = current.length
  const charNearLimit = charCount > Math.floor(charLimit * 0.85)

  const labelText = kind === 'title' ? 'Meta Title' : 'Meta Description'
  const hintText =
    kind === 'title'
      ? `ცარიელია → ავტომატური. მაქს. ${charLimit} სიმბოლო. გადააწერეთ მხოლოდ თუ Google-ში სხვა ტექსტი გინდათ.`
      : `ცარიელია → "${descriptionSource}" ველი. მაქს. ${charLimit} სიმბოლო.`

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    background: colors.white,
    border: `1px solid ${colors.greyBorder}`,
    borderRadius: radii.sm,
    fontSize: fontSizes.md,
    color: colors.blackberry,
    fontFamily: 'inherit',
    lineHeight: 1.5,
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div className="field-type" style={{ marginBottom: spacing.lg }}>
      <label
        htmlFor={path}
        style={{
          display: 'block',
          fontSize: fontSizes.sm,
          fontWeight: 600,
          color: colors.blackberry,
          marginBottom: spacing.xs,
        }}
      >
        {labelText}
      </label>

      {kind === 'title' ? (
        <input
          id={path}
          className="clinic-focusable"
          type="text"
          value={current}
          maxLength={charLimit}
          placeholder={placeholder || `მაგ: ${labelText}`}
          aria-describedby={`${path}-hint ${path}-count`}
          onChange={(e) => setValue(e.target.value)}
          style={inputStyle}
        />
      ) : (
        <textarea
          id={path}
          className="clinic-focusable"
          value={current}
          maxLength={charLimit}
          placeholder={placeholder || `მაგ: ${labelText}`}
          rows={3}
          aria-describedby={`${path}-hint ${path}-count`}
          onChange={(e) => setValue(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
        />
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: spacing.md,
          marginTop: spacing.xs,
          fontSize: fontSizes.xs,
          color: colors.greyText,
        }}
      >
        <span id={`${path}-hint`} style={{ flex: 1 }}>{hintText}</span>
        <span
          id={`${path}-count`}
          style={{
            color: charNearLimit ? colors.amberWarn : colors.greyLightText,
            fontWeight: charNearLimit ? 600 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {charCount}/{charLimit}
        </span>
      </div>

      {usingFallback && (
        <div
          aria-live="polite"
          style={{
            marginTop: spacing.sm,
            padding: `${spacing.sm} ${spacing.md}`,
            background: colors.pinkSoft,
            border: `1px dashed ${colors.pinkBorder}`,
            borderRadius: radii.sm,
            fontSize: fontSizes.xs,
            color: colors.greyDeep,
            lineHeight: 1.5,
          }}
        >
          <b style={{ color: colors.blackberry }}>ავტო-პრევიუ ({localeCode}):</b>{' '}
          <span style={{ fontStyle: 'italic' }}>{placeholder}</span>
        </div>
      )}
    </div>
  )
}
