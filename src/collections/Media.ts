import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

// Doctor photos are 1:1 portraits, not shared assets — replacing the file on a
// Media doc still referenced by >1 doctor would silently change every other
// doctor's photo too (this happened in production). Block that specific case;
// intentionally-shared assets (logos, banners) are untouched since this only
// fires when the `doctors` collection has more than one reference.
const preventSharedDoctorPhotoReplace: CollectionBeforeChangeHook = async ({ req, originalDoc, operation }) => {
  if (operation !== 'update' || !req.file || !originalDoc?.id) return

  const { totalDocs } = await req.payload.find({
    collection: 'doctors',
    where: { photo: { equals: originalDoc.id } },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  if (totalDocs > 1) {
    throw new Error(
      `ეს ფოტო გამოყენებულია ${totalDocs} ექიმის პროფილზე — ფაილის ჩანაცვლება ყველას შეუცვლის ფოტოს. ატვირთეთ ახალი სურათი ცალკე ველზე.`,
    )
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'მედია', plural: 'მედია' },
  admin: {
    useAsTitle: 'filename',
    group: 'კონტენტი',
    description: 'მედია-ბიბლიოთეკა — სურათები, რომლებიც გამოიყენება სერვისებზე, ექიმების პროფილებზე, სიახლეებსა და გვერდებზე. ერთხელ ატვირთული ფაილი შეიძლება რამდენიმე ადგილზე იქნას გამოყენებული.',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: { read: () => true },
  hooks: {
    beforeChange: [preventSharedDoctorPhotoReplace],
  },
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1400, height: undefined, position: 'centre' },
    ],
    crop: true,
    focalPoint: true,
  },
  fields: [
    { name: 'alt', label: 'ალტერნატიული ტექსტი', type: 'text', required: true, localized: true },
  ],
}
