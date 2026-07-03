import type { ComponentConfig } from '@puckeditor/core'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type BuilderLocale } from '../types'

export type QuoteProps = { text: Loc<string>; attribution: Loc<string> }

export const Quote: ComponentConfig<QuoteProps> = {
  label: 'ციტატა (Quote)',
  fields: {
    text: localizedTextField({ label: 'Quote', multiline: true }),
    attribution: localizedTextField({ label: 'Attribution' }),
  },
  defaultProps: { text: {}, attribution: {} },
  render: ({ text, attribution, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    return (
      <blockquote className="pk-quote">
        <p>{pickText(text, locale)}</p>
        {pickText(attribution, locale) && <cite>— {pickText(attribution, locale)}</cite>}
      </blockquote>
    )
  },
}
