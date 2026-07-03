import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'მომხმარებელი', plural: 'მომხმარებლები' },
  auth: {
    tokenExpiration: 7200,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000,
    // Payload 3.83+ enables session tracking by default, which requires a
    // users_sessions table. Opt out — this project uses stateless JWT tokens
    // and doesn't need per-session revocation. (The auth option is `useSessions`
    // in Payload 3.83; `sessions` is not a valid key and fails the type check.)
    useSessions: false,
  },
  admin: {
    useAsTitle: 'email',
    group: 'ადმინი',
    description: 'საიტის მომართველი მომხმარებლები. „ადმინისტრატორი" — სრული წვდომა ყველა პარამეტრზე. „რედაქტორი" — შინაარსის რედაქტირება (სერვისები, ექიმები, სიახლეები) გასაღების პარამეტრების გარეშე.',
    defaultColumns: ['email', 'name', 'role'],
  },
  // Only logged-in users may read the user list — without this, anonymous
  // GET /api/users would leak admin/editor emails, names and roles.
  access: { read: ({ req }) => !!req.user },
  fields: [
    {
      name: 'role',
      label: 'როლი',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'ადმინისტრატორი', value: 'admin' },
        { label: 'რედაქტორი', value: 'editor' },
      ],
    },
    { name: 'name', label: 'სახელი', type: 'text' },
  ],
}
