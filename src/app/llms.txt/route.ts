import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'
import { getSiteSettings } from '@/lib/payload-data'

function defaultLlmsTxt(): string {
  return `# Khozrevanidze Clinic / ხოზრევანიძის კლინიკა

> Multi-profile medical clinic in Batumi, Georgia. Serves patients in Georgian, English, and Russian.

- Website: ${SITE_URL}
- Services: ${SITE_URL}/ge/servisebi
- Doctors: ${SITE_URL}/ge/eqimebi
- Booking: ${SITE_URL}/ge/chawera
- Contact: ${SITE_URL}/ge/kontaqti
`
}

export async function GET() {
  const settings = await getSiteSettings('ge')

  if (settings?.enableLlmsTxt === false) {
    return new NextResponse('Not found', { status: 404 })
  }

  const content = settings?.llmsTxtContent?.trim() || defaultLlmsTxt()

  return new NextResponse(content + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
