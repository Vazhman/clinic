import type { ComponentConfig } from '@puckeditor/core'
import { mediaPickerField } from '../fields/MediaPickerField'
import { localizedTextField } from '../fields/LocalizedTextField'
import { pickText, type Loc, type MediaRef, type BuilderLocale } from '../types'

export type ImageProps = {
  media: MediaRef | null
  align: 'left' | 'center' | 'right' | 'full'
  width: number
  caption: Loc<string>
  radius: 'none' | 'lg' | 'full'
  shadow: 'none' | 'soft' | 'strong'
}

export const Image: ComponentConfig<ImageProps> = {
  label: 'სურათი (Image)',
  fields: {
    media: mediaPickerField({ label: 'სურათი' }),
    align: { type: 'radio', options: [
      { label: '◀ Left', value: 'left' }, { label: 'Center', value: 'center' },
      { label: 'Right ▶', value: 'right' }, { label: 'Full width', value: 'full' },
    ] },
    width: { type: 'number', min: 10, max: 100 },
    caption: localizedTextField({ label: 'Caption' }),
    radius: { type: 'radio', options: [ { label: 'Sharp', value: 'none' }, { label: 'Rounded', value: 'lg' }, { label: 'Circle', value: 'full' } ] },
    shadow: { type: 'radio', options: [ { label: 'None', value: 'none' }, { label: 'Soft', value: 'soft' }, { label: 'Strong', value: 'strong' } ] },
  },
  defaultProps: { media: null, align: 'center', width: 75, caption: {}, radius: 'lg', shadow: 'none' },
  render: ({ media, align, width, caption, radius, shadow, puck }) => {
    const locale = (puck?.metadata?.locale as BuilderLocale) ?? 'ge'
    if (!media?.url) {
      return <div className="pk-placeholder">აირჩიეთ სურათი</div>
    }
    const cls = [
      'pk-image',
      `pk-image--${align}`,
      radius !== 'none' ? `pk-image--radius-${radius}` : '',
      shadow !== 'none' ? `pk-image--shadow-${shadow}` : '',
    ].filter(Boolean).join(' ')
    const style = align === 'full' ? undefined : { width: `${width}%` }
    return (
      <figure className={cls} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={media.alt ?? pickText(caption, locale)} />
        {pickText(caption, locale) && <figcaption>{pickText(caption, locale)}</figcaption>}
      </figure>
    )
  },
}
