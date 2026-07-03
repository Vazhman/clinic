type GalleryFields = {
  columns: '2' | '3' | '4'
  images: Array<{
    image: { url?: string | null; alt?: string | null } | number | string
    caption?: string
  }>
}

const colsClass: Record<GalleryFields['columns'], string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-2 sm:grid-cols-3',
  '4': 'grid-cols-2 sm:grid-cols-4',
}

export function GalleryRenderer({ fields }: { fields: GalleryFields }) {
  return (
    // `clear-both` is load-bearing: when the gallery follows an image with
    // alignment=left/right (which uses CSS float), the gallery would otherwise
    // wrap up alongside the floated image. Editors place gallery BELOW the
    // image in the Lexical editor and expect it there on the page too — the
    // clear restores WYSIWYG. Same fix is in CalloutRenderer.
    <div className={`clear-both my-8 sm:my-10 grid gap-3 sm:gap-4 ${colsClass[fields.columns]}`}>
      {fields.images.map((item, i) => {
        const url = typeof item.image === 'object' && item.image ? item.image.url ?? '' : ''
        const alt = typeof item.image === 'object' && item.image ? item.image.alt ?? '' : ''
        if (!url) return null
        return (
          <figure key={i} className="overflow-hidden rounded-xl shadow-sm shadow-blackberry/10">
            <img src={url} alt={alt} loading="lazy" className="w-full h-full object-cover aspect-square" />
            {item.caption && (
              <figcaption className="text-[12px] text-grey-light text-center mt-2 italic break-words px-1">
                {item.caption}
              </figcaption>
            )}
          </figure>
        )
      })}
    </div>
  )
}
