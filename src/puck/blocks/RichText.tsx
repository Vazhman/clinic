import type { ComponentConfig } from '@puckeditor/core'
import { localizedRichTextField } from '../fields/LocalizedRichTextField'
import { richTextToHtml, type JSONContent } from '../tiptap'
import { pickLocale, type Loc, type BuilderLocale } from '../types'

export type RichTextProps = { content: Loc<JSONContent> }

export const RichText: ComponentConfig<RichTextProps> = {
  label: 'ტექსტი (Rich text)',
  fields: { content: localizedRichTextField({ label: 'Text' }) },
  defaultProps: { content: {} },
  render: ({ content, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    const html = richTextToHtml(pickLocale(content, locale))
    return <div className="pk-richtext" dangerouslySetInnerHTML={{ __html: html }} />
  },
}
