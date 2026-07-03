import { getPayload } from 'payload'
import config from '@payload-config'
import { services, doctors, checkupPackages, reviews, stats } from './lib/data'

async function seed() {
  const payload = await getPayload({ config })

  console.log('Seeding database...')

  // Check if already seeded
  const existingServices = await payload.find({ collection: 'services', limit: 1 })
  if (existingServices.totalDocs > 0) {
    console.log('Database already seeded. Skipping.')
    process.exit(0)
  }

  // Seed services
  console.log('Seeding services...')
  for (const service of services) {
    await payload.create({
      collection: 'services',
      data: {
        name: service.name,
        slug: service.slug,
        description: service.description,
        shortDescription: service.shortDescription,
        icon: service.icon as 'heart' | 'brain' | 'baby' | 'brain-circuit' | 'flask' | 'ear' | 'scissors' | 'activity',
      },
      locale: 'ge',
    })
  }
  console.log(`  Seeded ${services.length} services`)

  // Seed doctors
  console.log('Seeding doctors...')
  for (const doctor of doctors) {
    await payload.create({
      collection: 'doctors',
      data: {
        name: doctor.name,
        slug: doctor.slug,
        specialty: doctor.specialty,
        biography: undefined,
        experienceYears: doctor.experienceYears,
        isDepartmentHead: doctor.isDepartmentHead,
        qualifications: doctor.qualifications.map((q) => ({ qualification: q })),
        specializations: doctor.specializations.map((s) => ({ specialization: s })),
        languagesSpoken: doctor.languagesSpoken.map((l) => ({ language: l })),
      },
      locale: 'ge',
    })
  }
  console.log(`  Seeded ${doctors.length} doctors`)

  // Seed checkup packages
  console.log('Seeding checkup packages...')
  for (const pkg of checkupPackages) {
    await payload.create({
      collection: 'checkup-packages',
      data: {
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        currency: pkg.currency,
        includedServices: pkg.includedServices.map((s) => ({ service: s })),
        isFeatured: pkg.isFeatured,
      },
      locale: 'ge',
    })
  }
  console.log(`  Seeded ${checkupPackages.length} checkup packages`)

  // Seed reviews
  console.log('Seeding reviews...')
  for (const review of reviews) {
    await payload.create({
      collection: 'reviews',
      data: {
        author: review.author,
        rating: review.rating,
        text: review.text,
        date: review.date,
        source: review.source as 'google' | 'internal',
      },
      locale: 'ge',
    })
  }
  console.log(`  Seeded ${reviews.length} reviews`)

  // Seed site settings
  console.log('Seeding site settings...')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      stats: {
        patients: stats.patients,
        doctors: stats.doctors,
        operations: stats.operations,
        experience: stats.experience,
      },
    },
  })
  console.log('  Seeded site settings')

  // Create admin user if none exists
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })
  if (existingUsers.totalDocs === 0) {
    console.log('Creating admin user...')
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@khozrevanidze.ge',
        password: 'ChangeMe123!',
        role: 'admin',
        name: 'Admin',
      },
    })
    console.log('  Admin user created: admin@khozrevanidze.ge / ChangeMe123!')
  }

  console.log('\nSeeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})
