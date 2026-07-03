import type { ComponentConfig } from '@puckeditor/core'
import { mediaPickerField } from '../fields/MediaPickerField'
import type { MediaRef } from '../types'

export type GalleryProps = { images: { media: MediaRef | null }[]; columns: 2 | 3 | 4 }

export const Gallery: ComponentConfig<GalleryProps> = {
  label: 'გალერეა (Gallery)',
  fields: {
    images: { type: 'array', arrayFields: { media: mediaPickerField({ label: 'სურათი' }) }, getItemSummary: (_, i) => `Image ${(i ?? 0) + 1}` },
    columns: { type: 'radio', options: [ { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 } ] },
  },
  defaultProps: { images: [], columns: 3 },
  render: ({ images, columns }) => (
    <div className={`pk-gallery pk-gallery--${columns}`}>
      {images.filter((it) => it.media?.url).map((it, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={it.media!.url} alt={it.media!.alt ?? ''} />
      ))}
    </div>
  ),
}
