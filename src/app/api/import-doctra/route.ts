/**
 * One-time + on-demand Doctra → Payload import.
 *
 * Pulls every department and doctor from the Doctra API and upserts them into
 * the Payload `services` and `doctors` collections. Idempotent — safe to
 * re-run whenever the clinic adds a new doctor in Doctra.
 *
 * Auth: requires an authenticated Payload admin session (cookie-based, same
 * as the admin UI). Anonymous calls are rejected.
 *
 * Behaviour on conflict:
 *   - NEW (no Payload row with that doctra*Id) → create from Doctra defaults,
 *     but HIDDEN from the public /doctors list (`showOnDoctorsPage:false`).
 *     An editor reviews the un-curated profile and flips the inline visibility
 *     toggle in the admin list to publish it. (Still reachable by direct link
 *     + booking — only the listing is gated.)
 *   - EXISTING → leave editorial fields untouched (admin curates name/photo/
 *     bio/specialty), only refresh `doctraBranchId` (in case the doctor moved
 *     departments). Photos and editorial fields are admin-curated. Visibility
 *     (`showOnDoctorsPage`) is also never touched on existing rows.
 *
 * Returns a per-collection summary.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import {
  getDepartments,
  getDoctors as getDoctraDoctors,
  type DoctraDepartment,
  type DoctraDoctor,
} from "@/lib/doctra-api";

type ServiceCategory =
  | "cardiology"
  | "neurology"
  | "surgery"
  | "pediatric"
  | "diagnostics"
  | "other";

// Best-effort heuristic for the Doctra department → Payload `category` enum.
// Falls back to "other" — admin can fix it in the UI.
function guessCategory(name: string, nameEn: string): ServiceCategory {
  const all = `${name} ${nameEn}`.toLowerCase();
  if (/კარდიო|cardio|cardiac|кардио/.test(all)) return "cardiology";
  if (/ნევრო|ნეირო|neuro|невро|нейро/.test(all)) return "neurology";
  if (/ქირურგ|surgery|surgical|хирург/.test(all)) return "surgery";
  if (/ბავშვ|pediatric|детск/.test(all)) return "pediatric";
  if (/ულტრა|რენტგენ|ტომოგრაფ|endoscop|MRI|CT|ultrasound|радио|компьютерн/i.test(all))
    return "diagnostics";
  return "other";
}

// `services.description` is a required Lexical richText field — Payload
// rejects a plain string. Wrap the Doctra department name in the minimal
// single-paragraph editorState shape it expects.
function plainTextToLexical(text: string) {
  return {
    root: {
      type: "root",
      version: 1,
      format: "",
      indent: 0,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph",
          version: 1,
          format: "",
          indent: 0,
          direction: "ltr" as const,
          children: [
            {
              type: "text",
              text,
              format: 0,
              style: "",
              mode: "normal" as const,
              detail: 0,
              version: 1,
            },
          ],
        },
      ],
    },
  };
}

// URL-safe slug from a romanised name. Doctra's `name_en` is already Latin
// so this is straightforward; if it's empty we fall back to the doctraId.
function slugify(input: string, fallback: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback.toLowerCase().slice(0, 16);
}

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config });

  // Reject if the caller isn't logged into Payload admin
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = {
    services: { created: 0, updated: 0, skipped: 0 },
    doctors: { created: 0, updated: 0, skipped: 0 },
    errors: [] as string[],
  };

  // ── Pull everything from Doctra ──────────────────────────────────────────
  let departments: DoctraDepartment[] = [];
  try {
    departments = await getDepartments();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch Doctra departments: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  // Lookup table: Doctra department id → { ge: name, en: name_en }
  // Used as a fallback when Doctra returns an empty `specialty` per doctor
  // (most doctors). The department name is a much better default than "—"
  // because it represents the practice area (Cardiology, Pediatrics, etc.).
  const deptNameMap = new Map<string, { ge: string; en: string }>();
  for (const dep of departments) {
    deptNameMap.set(dep.id, {
      ge: dep.name || dep.name_en || "",
      en: dep.name_en || dep.name || "",
    });
  }

  // ── Services / departments ───────────────────────────────────────────────
  for (const dep of departments) {
    try {
      const existing = await payload.find({
        collection: "services",
        where: { doctraBranchId: { equals: dep.id } } as never,
        limit: 1,
      });

      if (existing.docs.length === 0) {
        // NEW department — create with raw Doctra data as defaults. Required
        // fields (description, shortDescription, icon) get placeholder values
        // that admin will likely want to fill in afterwards.
        const slug = slugify(dep.name_en || dep.name, dep.id);
        await payload.create({
          collection: "services",
          data: {
            name: dep.name || dep.name_en || slug,
            slug,
            doctraBranchId: dep.id,
            category: guessCategory(dep.name, dep.name_en),
            description: plainTextToLexical(dep.name || dep.name_en || ""),
            shortDescription: dep.name || dep.name_en || "",
            icon: "activity",
          },
          locale: "ge",
        });
        // Mirror the English name into the en locale so the booking page
        // doesn't render Georgian on /en for new auto-imported services.
        if (dep.name_en) {
          const justCreated = await payload.find({
            collection: "services",
            where: { doctraBranchId: { equals: dep.id } } as never,
            limit: 1,
          });
          if (justCreated.docs[0]) {
            await payload.update({
              collection: "services",
              id: justCreated.docs[0].id,
              data: {
                name: dep.name_en,
                description: plainTextToLexical(dep.name_en),
                shortDescription: dep.name_en,
              },
              locale: "en",
            });
          }
        }
        summary.services.created++;
      } else {
        // Existing → don't overwrite editorial fields. Just count it.
        summary.services.skipped++;
      }
    } catch (err) {
      summary.errors.push(`service ${dep.id}: ${(err as Error).message}`);
    }
  }

  // ── Doctors ──────────────────────────────────────────────────────────────
  // Fan out per department to fetch the doctor lists. Doctra is slow but
  // we only run this on-demand — total time isn't user-blocking.
  const allDoctraDoctors: Array<DoctraDoctor & { _depId: string }> = [];
  for (const dep of departments) {
    try {
      const docs = await getDoctraDoctors(dep.id);
      for (const d of docs) {
        allDoctraDoctors.push({ ...d, _depId: dep.id });
      }
    } catch (err) {
      summary.errors.push(
        `doctors fetch for ${dep.id}: ${(err as Error).message}`,
      );
    }
  }

  // Doctra returns the same doctor in multiple departments when they work
  // across specialties. Dedupe on `id` — keep the first occurrence.
  const seen = new Set<string>();
  const uniqueDoctors = allDoctraDoctors.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  for (const d of uniqueDoctors) {
    try {
      const existing = await payload.find({
        collection: "doctors",
        where: { doctraId: { equals: d.id } } as never,
        limit: 1,
      });

      // Build the qualifications array from Doctra's degree, if present.
      // Single-entry array. Admin can extend it from the UI; we only seed
      // when admin hasn't curated qualifications yet (gap-fill, not overwrite).
      const degreeQualifications = d.degree
        ? [{ qualification: d.degree }]
        : undefined;
      const degreeQualificationsEn = d.degree_en
        ? [{ qualification: d.degree_en }]
        : undefined;

      // Specialty fallback chain: Doctra.specialty → department name → "—"
      const deptName = deptNameMap.get(d._depId);
      const specialtyGe = d.specialty || deptName?.ge || "—";
      const specialtyEn = d.specialty_en || deptName?.en || "—";

      if (existing.docs.length === 0) {
        const slug = slugify(d.name_en || d.name, d.id);
        const created = await payload.create({
          collection: "doctors",
          data: {
            name: d.name || d.name_en || slug,
            slug,
            doctraId: d.id,
            doctraBranchId: d._depId,
            specialty: specialtyGe,
            phone: d.phone || undefined,
            email: d.email || undefined,
            qualifications: degreeQualifications,
            inactive: false,
            // New doctors arrive UN-curated (no photo/bio). Keep them OFF the
            // public /doctors list until an editor reviews them and flips the
            // inline visibility toggle in the admin list. They're still
            // reachable by direct link + booking; only the listing is gated.
            showOnDoctorsPage: false,
          } as never,
          locale: "ge",
        });
        // Always mirror to EN locale so /en doesn't render Georgian fields.
        await payload.update({
          collection: "doctors",
          id: created.id,
          data: {
            name: d.name_en || d.name || slug,
            specialty: specialtyEn,
            qualifications: degreeQualificationsEn || degreeQualifications,
          } as never,
          locale: "en",
        });
        // Seed RU locale from EN as a placeholder. Without this, the public
        // /ru/doctors site silently falls back to Georgian via Payload's
        // `localization.fallback: true` — so editors can't tell which doctors
        // still need a Russian translation. By writing EN into RU on create,
        // the public /ru page shows English text until the editor translates
        // (visible signal that something needs attention), and the admin's
        // "Needs RU translation" widget can detect RU === EN as untranslated.
        await payload.update({
          collection: "doctors",
          id: created.id,
          data: {
            name: d.name_en || d.name || slug,
            specialty: specialtyEn,
            qualifications: degreeQualificationsEn || degreeQualifications,
          } as never,
          locale: "ru",
        });
        summary.doctors.created++;
      } else {
        // Existing — refresh the department link if it changed AND gap-fill
        // any of {phone, email, qualifications} that admin hasn't curated yet.
        // Editorial fields (name, specialty, biography, photo, etc.) are
        // never overwritten — once admin touches a row, our import respects it.
        // Specialty is special: if it's still the import placeholder "—",
        // upgrade to the department name (admin hasn't curated yet).
        const row = existing.docs[0] as {
          id: number | string;
          doctraBranchId?: string;
          phone?: string | null;
          email?: string | null;
          specialty?: string | null;
          qualifications?: Array<{ qualification?: string }> | null;
        };
        const updateData: Record<string, unknown> = {};
        if (row.doctraBranchId !== d._depId) updateData.doctraBranchId = d._depId;
        if (!row.phone && d.phone) updateData.phone = d.phone;
        if (!row.email && d.email) updateData.email = d.email;
        if (
          (!row.qualifications || row.qualifications.length === 0) &&
          degreeQualifications
        ) {
          updateData.qualifications = degreeQualifications;
        }
        // Backfill specialty: only replace the literal "—" placeholder, never
        // overwrite a value the admin has typed in.
        const placeholderSpecialty = row.specialty === "—" || !row.specialty;
        if (placeholderSpecialty && specialtyGe && specialtyGe !== "—") {
          updateData.specialty = specialtyGe;
        }
        if (Object.keys(updateData).length > 0) {
          await payload.update({
            collection: "doctors",
            id: row.id,
            data: updateData as never,
            locale: "ge",
          });
          // EN locale parallel update for specialty. If the EN locale row
          // doesn't exist yet (older imports skipped EN when Doctra had no
          // name_en), Payload will create it — and since `name` is required
          // and localized, we must include it.
          if (placeholderSpecialty && specialtyEn && specialtyEn !== "—") {
            await payload.update({
              collection: "doctors",
              id: row.id,
              data: {
                name: d.name_en || d.name || "",
                specialty: specialtyEn,
              } as never,
              locale: "en",
            });
          }
          summary.doctors.updated++;
        } else {
          summary.doctors.skipped++;
        }
      }
    } catch (err) {
      summary.errors.push(`doctor ${d.id}: ${(err as Error).message}`);
    }
  }

  // Persist last-synced timestamp on the SiteSettings global so the admin
  // dashboard can surface it. Best-effort — if this fails we still return the
  // import summary (the import itself succeeded).
  try {
    await payload.updateGlobal({
      slug: "site-settings",
      data: { lastDoctraSync: new Date().toISOString() } as never,
    });
  } catch (err) {
    console.error("Failed to update lastDoctraSync:", err);
  }

  return NextResponse.json({
    ok: true,
    triggeredBy: user.email,
    summary,
  });
}
