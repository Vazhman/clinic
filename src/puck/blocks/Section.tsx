import type { CSSProperties } from 'react'
import type { ComponentConfig, Slot } from '@puckeditor/core'

// A colored band you drop content into. Gives editors one-click "switch the
// color" at the section level (white / cream / pink / blackberry). On the
// dark blackberry background, text + secondary buttons flip to light via CSS.
export type SectionProps = {
  background: 'none' | 'cream' | 'pink' | 'blackberry'
  align: 'left' | 'center'
  content: Slot
}

export const Section: ComponentConfig<SectionProps> = {
  label: 'სექცია / ფონი (Section)',
  fields: {
    background: {
      type: 'radio',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Cream', value: 'cream' },
        { label: 'Pink', value: 'pink' },
        { label: 'Blackberry', value: 'blackberry' },
      ],
    },
    align: {
      type: 'radio',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
      ],
    },
    content: { type: 'slot' },
  },
  defaultProps: { background: 'cream', align: 'left', content: [] },
  render: ({ background, align, content: Content }) => (
    <Content
      className={`pk-section pk-section--${background} pk-section--${align}`}
      minEmptyHeight={90}
      style={{ textAlign: align === 'center' ? 'center' : 'left' } as CSSProperties}
    />
  ),
}
