import type { ComponentConfig } from '@puckeditor/core'
import { localizedRichTextField } from '../fields/LocalizedRichTextField'
import { richTextToHtml, type JSONContent } from '../tiptap'
import { pickLocale, type Loc, type BuilderLocale } from '../types'

export type CalloutProps = { variant: 'note' | 'warning' | 'tip'; content: Loc<JSONContent> }

export const Callout: ComponentConfig<CalloutProps> = {
  label: 'შენიშვნა (Callout)',
  fields: {
    variant: { type: 'radio', options: [ { label: 'Note', value: 'note' }, { label: 'Warning', value: 'warning' }, { label: 'Tip', value: 'tip' } ] },
    content: localizedRichTextField({ label: 'Callout text' }),
  },
  defaultProps: { variant: 'note', content: {} },
  render: ({ variant, content, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    return (
      <div
        className={`pk-callout pk-callout--${variant}`}
        dangerouslySetInnerHTML={{ __html: richTextToHtml(pickLocale(content, locale)) }}
      />
    )
  },
}
