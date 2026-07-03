import type { CSSProperties } from 'react'
import type { ComponentConfig, Slot } from '@puckeditor/core'

// Flexible layout primitive: a row split into N equal columns. The single
// slot is rendered AS the grid container (Puck passes style/className/
// collisionAxis straight to the DropZone), so any blocks dropped in become
// columns. This is the general "multiple items in one row" tool — unlike the
// fixed ImageText preset, you choose the column count and drop anything.
export type RowProps = {
  columns: number
  gap: 'sm' | 'md' | 'lg'
  valign: 'top' | 'center'
  content: Slot
}

const gapValue: Record<RowProps['gap'], string> = {
  sm: '0.75rem',
  md: '1.5rem',
  lg: '2rem',
}

export const Row: ComponentConfig<RowProps> = {
  label: 'რიგი / სვეტები (Row)',
  fields: {
    columns: { type: 'number', min: 1, max: 6 },
    gap: {
      type: 'radio',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    valign: {
      type: 'radio',
      options: [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
      ],
    },
    content: { type: 'slot' },
  },
  defaultProps: { columns: 2, gap: 'md', valign: 'top', content: [] },
  render: ({ columns, gap, valign, content: Content }) => {
    const cols = Math.min(6, Math.max(1, Math.round(columns || 2)))
    return (
      <Content
        className="pk-row"
        collisionAxis="x"
        minEmptyHeight={90}
        style={
          {
            '--pk-cols': String(cols),
            '--pk-gap': gapValue[gap],
            alignItems: valign === 'center' ? 'center' : 'start',
          } as CSSProperties
        }
      />
    )
  },
}
