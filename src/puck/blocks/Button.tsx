import type { ComponentConfig } from '@puckeditor/core'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type BuilderLocale } from '../types'

export type ButtonProps = {
  label: Loc<string>
  href: string
  variant: 'primary' | 'pink' | 'white' | 'secondary'
}

export const Button: ComponentConfig<ButtonProps> = {
  label: 'ღილაკი (Button)',
  fields: {
    label: localizedTextField({ label: 'Button label' }),
    href: { type: 'text' },
    // Color options — White is for buttons placed on dark (blackberry) bands,
    // where a blackberry button would be invisible.
    variant: {
      type: 'radio',
      options: [
        { label: 'Blackberry', value: 'primary' },
        { label: 'Pink', value: 'pink' },
        { label: 'White', value: 'white' },
        { label: 'Outline', value: 'secondary' },
      ],
    },
  },
  defaultProps: { label: {}, href: '#', variant: 'primary' },
  render: ({ label, href, variant, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    return (
      <a href={href} className={`pk-button pk-button--${variant}`}>
        {pickText(label, locale)}
      </a>
    )
  },
}
