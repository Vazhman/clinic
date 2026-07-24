import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook, CollectionConfig } from 'payload'

import { sanitizeFilename } from '../lib/translit-ka'

// Item 6 fix: sanitize the uploaded filename to a guaranteed ASCII/URL-safe
// name before Payload's own upload pipeline (generateFileData/getSafeFilename,
// neither of which transliterate Unicode) ever sees it. This covers the
// direct/multipart upload path (local disk adapter, API/curl uploads). The
// `clientUploads: true` (Vercel Blob browser-direct-upload) path used in
// production is fixed separately, client-side, via a patch to
// VercelBlobClientUploadHandler.js — a server hook runs too late for that
// path since the browser already PUTs bytes to Blob under the client-chosen
// pathname before this hook ever executes.
//
// Bug found 2026-07-19: for a completed client upload, `req.file.name` is
// NOT a raw browser filename — it's already the FINAL filename the client
// handler computed, including the case-sensitive random suffix Vercel Blob
// assigned to the real stored object (e.g. `...-3AfFRluPBZ...`). This hook
// ran unconditionally and re-ran `sanitizeFilename()` (which lowercases
// everything) on that already-final name, corrupting the suffix's case and
// leaving the DB `filename` pointing at an object that doesn't exist under
// that key — the original 404s everywhere while sized derivatives (a
// separate server-side path that never touches `req.file.name`) stay fine.
// `req.file.clientUploadContext` is only present on a client-upload-complete
// request (see @payloadcms/plugin-cloud-storage's getIncomingFiles.js), so
// use it to skip re-sanitizing a name that's already safe and final.
const sanitizeUploadFilename: CollectionBeforeOperationHook = async ({ req, operation }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file?.name) return
  if (req.file.clientUploadContext) return
  const safeName = sanitizeFilename(req.file.name)
  if (safeName !== req.file.name) {
    req.file.name = safeName
  }
}

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
    beforeOperation: [sanitizeUploadFilename],
    beforeChange: [preventSharedDoctorPhotoReplace],
  },
  upload: {
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    // Raster images only. SVG is intentionally excluded: it can carry inline
    // <script>, and it's served same-origin from /api/media/file/* with no CSP
    // backstop, so a stored SVG would be a persistent XSS vector. Site icons
    // that are genuinely SVG live in /public, not the CMS.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
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
