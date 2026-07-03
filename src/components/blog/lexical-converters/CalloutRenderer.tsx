type CalloutFields = {
  variant: 'info' | 'tip' | 'warning' | 'important'
  title?: string
  body: string
}

// Variants map to fixed Tailwind classes — editors pick from a select; they
// cannot inject classes. Extending this set requires updating CalloutBlock.ts
// (the field's options array) so the renderer and the form stay in sync.
const variantClass: Record<CalloutFields['variant'], { box: string; title: string }> = {
  info: {
    box: 'border-l-4 border-blue-400 bg-blue-50 text-blue-900',
    title: 'text-blue-900',
  },
  tip: {
    box: 'border-l-4 border-pink bg-pink-light/40 text-blackberry',
    title: 'text-pink',
  },
  warning: {
    box: 'border-l-4 border-yellow-400 bg-yellow-50 text-yellow-900',
    title: 'text-yellow-900',
  },
  important: {
    box: 'border-l-4 border-blackberry bg-blackberry/5 text-blackberry',
    title: 'text-blackberry',
  },
}

export function CalloutRenderer({ fields }: { fields: CalloutFields }) {
  const v = variantClass[fields.variant] ?? variantClass.info
  return (
    <aside className={`clear-both my-8 sm:my-10 px-5 py-4 rounded-r-xl sm:rounded-r-2xl ${v.box}`}>
      {fields.title && (
        <p className={`font-semibold mb-2 break-words ${v.title}`}>{fields.title}</p>
      )}
      <p className="text-[15px] sm:text-[16px] leading-relaxed break-words whitespace-pre-line">
        {fields.body}
      </p>
    </aside>
  )
}
