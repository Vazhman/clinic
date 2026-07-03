import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { services, doctors, checkupPackages, reviews, stats } from '@/lib/data'

// data.ts stores spoken languages as Georgian words, but the Doctors collection
// `language` field is an ISO-code select. Map them so the seed validates.
// Unmapped values are dropped rather than failing the whole seed.
const LANG_CODE: Record<string, string> = {
  ქართული: 'ka',
  რუსული: 'ru',
  ინგლისური: 'en',
  თურქული: 'tr',
  გერმანული: 'de',
  ფრანგული: 'fr',
  ესპანური: 'es',
  იტალიური: 'it',
  ებრაული: 'he',
  არაბული: 'ar',
  აზერბაიჯანული: 'az',
  სომხური: 'hy',
  უკრაინული: 'uk',
}

export async function POST() {
  // Only allow seeding in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seeding is disabled in production' }, { status: 403 })
  }

  try {
    const payload = await getPayload({ config })

    // Check if already seeded
    const existingServices = await payload.find({ collection: 'services', limit: 1 })
    if (existingServices.totalDocs > 0) {
      return NextResponse.json({ message: 'Database already seeded. Skipping.' })
    }

    // Seed services
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

    // Seed doctors
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
          languagesSpoken: doctor.languagesSpoken
            .map((l) => LANG_CODE[l])
            .filter((code): code is string => Boolean(code))
            .map((language) => ({ language })),
        },
        locale: 'ge',
      })
    }

    // Seed checkup packages
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

    // Seed reviews
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

    // Seed site settings
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

    // Create admin user if none exists
    const existingUsers = await payload.find({ collection: 'users', limit: 1 })
    if (existingUsers.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: 'admin@admin.ge',
          password: '111111',
          role: 'admin',
          name: 'Admin',
        },
      })
    }

    return NextResponse.json({
      message: 'Seeding complete!',
      seeded: {
        services: services.length,
        doctors: doctors.length,
        checkupPackages: checkupPackages.length,
        reviews: reviews.length,
        siteSettings: true,
        adminUser: true,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
