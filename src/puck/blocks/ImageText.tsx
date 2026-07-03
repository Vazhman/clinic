import type { ComponentConfig, Slot } from '@puckeditor/core'

export type ImageTextProps = {
  image: Slot
  text: Slot
  imageSide: 'left' | 'right'
  layout: 'columns' | 'wrap'
  ratio: '1-1' | '1-2' | '2-1'
}

export const ImageText: ComponentConfig<ImageTextProps> = {
  label: 'სურათი + ტექსტი (Image + Text)',
  fields: {
    image: { type: 'slot' },
    text: { type: 'slot' },
    imageSide: { type: 'radio', options: [ { label: 'Image left', value: 'left' }, { label: 'Image right', value: 'right' } ] },
    layout: { type: 'radio', options: [ { label: 'Side-by-side', value: 'columns' }, { label: 'Text wraps image', value: 'wrap' } ] },
    ratio: { type: 'radio', options: [ { label: '1:1', value: '1-1' }, { label: '1:2', value: '1-2' }, { label: '2:1', value: '2-1' } ] },
  },
  defaultProps: { image: [], text: [], imageSide: 'left', layout: 'columns', ratio: '1-1' },
  render: ({ image: ImageZone, text: TextZone, imageSide, layout, ratio }) => {
    const cls = [
      'pk-imagetext',
      layout === 'wrap' ? 'pk-imagetext--wrap' : 'pk-imagetext--cols',
      `pk-imagetext--img-${imageSide}`,
      layout === 'columns' && ratio !== '1-1' ? `pk-ratio-${ratio}` : '',
    ].filter(Boolean).join(' ')
    return (
      <div className={cls}>
        <div className="pk-imagetext__img"><ImageZone /></div>
        <div className="pk-imagetext__text"><TextZone /></div>
      </div>
    )
  },
}
