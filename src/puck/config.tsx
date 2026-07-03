import type { Config } from '@puckeditor/core'
import { Heading, type HeadingProps } from './blocks/Heading'
import { Quote, type QuoteProps } from './blocks/Quote'
import { Button, type ButtonProps } from './blocks/Button'
import { Divider, type DividerProps } from './blocks/Divider'
import { RichText, type RichTextProps } from './blocks/RichText'
import { Image, type ImageProps } from './blocks/Image'
import { ImageText, type ImageTextProps } from './blocks/ImageText'
import { Gallery, type GalleryProps } from './blocks/Gallery'
import { Callout, type CalloutProps } from './blocks/Callout'
import { Row, type RowProps } from './blocks/Row'
import { Section, type SectionProps } from './blocks/Section'

// Props union for all components.
export type Components = {
  Row: RowProps
  Section: SectionProps
  ImageText: ImageTextProps
  Heading: HeadingProps
  RichText: RichTextProps
  Image: ImageProps
  Gallery: GalleryProps
  Quote: QuoteProps
  Callout: CalloutProps
  Button: ButtonProps
  Divider: DividerProps
}

// Root constrains width + base typography so the editor canvas matches the
// public article column.
export const config: Config<Components> = {
  root: {
    render: ({ children }) => <div className="pk-root">{children}</div>,
  },
  // Group the left-panel palette so the layout tools (Row = drop any blocks
  // into N columns; ImageText = quick image+text preset) are obvious.
  categories: {
    layout: { title: 'განლაგება (Layout)', components: ['Row', 'Section', 'ImageText', 'Divider'] },
    content: {
      title: 'კონტენტი (Content)',
      components: ['Heading', 'RichText', 'Image', 'Gallery', 'Quote', 'Callout', 'Button'],
    },
  },
  components: {
    Row,
    Section,
    ImageText,
    Heading,
    RichText,
    Image,
    Gallery,
    Quote,
    Callout,
    Button,
    Divider,
  },
}
