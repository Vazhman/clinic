import type { LexicalEditor, NodeKey } from 'lexical'

export type UploadAlignment = 'left' | 'center' | 'right' | 'fullWidth'
export type UploadSize = 'small' | 'medium' | 'large' | 'full'
export type UploadBorder = 'none' | 'pink' | 'blackberry' | 'grey'
export type UploadShadow = 'none' | 'soft' | 'strong'
export type UploadRadius = 'none' | 'lg' | 'full'

export type UploadNodeFields = {
  alignment?: UploadAlignment
  size?: UploadSize
  borderStyle?: UploadBorder
  shadow?: UploadShadow
  radius?: UploadRadius
  widthPercent?: number
  caption?: string
}

export type UploadMediaValue = {
  id: string | number
  url?: string | null
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

export type UploadNodeData = {
  fields: UploadNodeFields
  relationTo: string
  value: UploadMediaValue | string | number
}

export type ResizableUploadComponentProps = {
  nodeKey: NodeKey
  data: UploadNodeData
}

export type FloatingUploadToolbarProps = {
  editor: LexicalEditor
  anchorElem: HTMLElement
}
