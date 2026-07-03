import type { ComponentConfig } from '@puckeditor/core'

export type DividerProps = Record<string, never>

export const Divider: ComponentConfig<DividerProps> = {
  label: 'გამყოფი ხაზი (Divider)',
  fields: {},
  render: () => <hr className="pk-divider" />,
}
