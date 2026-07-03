import type { ComponentConfig } from '@puckeditor/core'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type BuilderLocale } from '../types'

export type HeadingProps = { level: 'h2' | 'h3'; text: Loc<string> }

export const Heading: ComponentConfig<HeadingProps> = {
  label: 'სათაური (Heading)',
  fields: {
    level: { type: 'radio', options: [ { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' } ] },
    text: localizedTextField({ label: 'Heading text' }),
  },
  defaultProps: { level: 'h2', text: {} },
  render: ({ level, text, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    const Tag = level
    return <Tag className={`pk-heading pk-heading--${level}`}>{pickText(text, locale)}</Tag>
  },
}
