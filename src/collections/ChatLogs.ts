import type { CollectionConfig } from 'payload'

/**
 * Conversation log for the AI chat assistant.
 *
 * Every completed chat session writes one row here so the clinic can
 * audit what patients are asking, catch bad answers, and harvest FAQs.
 *
 * Privacy notes:
 *  - The chat system prompt forbids the LLM from asking for names,
 *    phone numbers, or medical history in the conversation, so the
 *    stored transcript should not contain PII. If a user types it
 *    anyway, the row IS sensitive — keep the collection admin-only.
 *  - `read` is locked to authenticated users. There is no public
 *    `find` access. Patients cannot enumerate or read past logs.
 */
export const ChatLogs: CollectionConfig = {
  slug: 'chat-logs',
  labels: { singular: 'AI ჩატის ჟურნალი', plural: 'AI ჩატის ჟურნალები' },
  admin: {
    // Hidden from the CMS admin per client request — the AI chat is disabled,
    // so there are no new journals. The table + data are preserved; flip this
    // to false (and re-enable <ChatAssistant />) to bring it back.
    hidden: true,
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'locale', 'escalated', 'turns', 'createdAt'],
    description:
      'AI ასისტენტთან საუბრების ჟურნალი. გამოიყენეთ ხშირი კითხვების გამოსავლენად და ხარისხის შესამოწმებლად.',
    group: 'სისტემა',
  },
  access: {
    // No public creates — anonymous POST /api/chat-logs would let anyone flood
    // the table. The /api/chat route writes logs server-side via the Payload
    // local API (overrideAccess), which bypasses this, so requiring auth here
    // costs nothing and closes the abuse vector.
    create: ({ req }) => !!req.user,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'summary',
      label: 'მოკლე აღწერა',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'პირველი მომხმარებლის შეტყობინების მოკლე ვერსია (ავტომატური).',
      },
    },
    {
      name: 'locale',
      label: 'ენა',
      type: 'select',
      options: [
        { label: 'ქართული', value: 'ge' },
        { label: 'English', value: 'en' },
        { label: 'Русский', value: 'ru' },
      ],
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'turns',
      label: 'შეტყობინებების რაოდენობა',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'escalated',
      label: 'გადაუდებელი (112)',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'მონიშნულია თუ ასისტენტმა ურჩია 112-ზე დარეკვა.',
      },
    },
    {
      name: 'transcript',
      label: 'საუბრის ტექსტი',
      type: 'json',
      admin: {
        readOnly: true,
        description:
          'სრული საუბრის სტენოგრამა. PII არ უნდა იყოს — სისტემური ნუსხა აკრძალავს ექიმის შემოწმების გარეშე პერსონალური მონაცემების შეგროვებას.',
      },
    },
  ],
  timestamps: true,
}
