"""
Apply EN + RU translations to every localized row in Payload.

Loads the 10 JSON files produced by the translation subagents and PATCHes
the EN and RU locales of Payload via REST API:

  - doctors        → name, specialty, biography, qualifications, specializations
  - services       → name, description, shortDescription
  - reviews        → text
  - checkup-packages → name, description, includedServices[].service
  - media          → alt

Run after the demo seeder (fill-doctors-demo.py). Idempotent — re-running
overwrites EN/RU with the same translations; doesn't touch GE.

Usage: python scripts/apply-translations.py [prod|local]
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import requests

TARGET = (sys.argv[1] if len(sys.argv) > 1 else "prod").lower()
BASE = (
    "https://clinic-one-blush.vercel.app"
    if TARGET == "prod"
    else "http://localhost:3000"
)
EMAIL = "admin@admin.ge"
PASSWORD = "111111"
TR = Path(__file__).resolve().parent.parent / "translations"

print(f"target: {BASE}")

# ── Load all translation files ───────────────────────────────────────────────
def load_json(name: str):
    with open(TR / name, encoding="utf-8") as f:
        return json.load(f)

specialties = load_json("specialties.json")
qualifications = load_json("qualifications.json")
specializations = load_json("specializations.json")
services_tr = load_json("services.json")
checkups_tr = load_json("checkup-packages.json")
checkup_svcs_tr = load_json("checkup-services.json")
misc = load_json("misc.json")
names = {}
for batch in ("names-1.json", "names-2.json", "names-3.json"):
    names.update(load_json(batch))

# Fold legacy seed doctors (ids 1-54) into the same lookup tables. Their
# data file uses a different shape: {id: {ge: {name, specialty}, en: {...}, ru: {...}}}
# Flatten name to {id: {ge, en, ru}} and add specialty entries keyed by
# the GE-locale value so the existing translation pipeline picks them up.
try:
    legacy = load_json("legacy-doctors.json")
    for doc_id, row in legacy.items():
        names[doc_id] = {
            "ge": row["ge"]["name"],
            "en": row["en"]["name"],
            "ru": row["ru"]["name"],
        }
        ge_spec = row["ge"]["specialty"]
        if ge_spec and ge_spec not in specialties:
            specialties[ge_spec] = {"en": row["en"]["specialty"], "ru": row["ru"]["specialty"]}
except FileNotFoundError:
    pass

bio_template_en = misc["biography_template"]["en"]
bio_template_ru = misc["biography_template"]["ru"]

print(f"loaded: {len(names)} doctor names, {len(specialties)} specialties, "
      f"{len(qualifications)} qualifications, {len(services_tr)} services")

# ── Login ────────────────────────────────────────────────────────────────────
r = requests.post(
    f"{BASE}/api/users/login",
    json={"email": EMAIL, "password": PASSWORD},
    timeout=30,
)
r.raise_for_status()
token = r.json()["token"]
auth = {"Authorization": f"JWT {token}"}
print("[ok] logged in")


def lexical_text(text: str) -> dict:
    """Wrap a plain-text string in Lexical root JSON, single paragraph."""
    return {
        "root": {
            "children": [
                {
                    "children": [
                        {
                            "detail": 0,
                            "format": 0,
                            "mode": "normal",
                            "style": "",
                            "text": text,
                            "type": "text",
                            "version": 1,
                        }
                    ],
                    "direction": "ltr",
                    "format": "",
                    "indent": 0,
                    "type": "paragraph",
                    "version": 1,
                    "textFormat": 0,
                }
            ],
            "direction": "ltr",
            "format": "",
            "indent": 0,
            "type": "root",
            "version": 1,
        }
    }


def patch(path: str, data: dict, locale: str) -> tuple[bool, str]:
    r = requests.patch(
        f"{BASE}{path}?locale={locale}",
        headers={**auth, "Content-Type": "application/json"},
        json=data,
        timeout=60,
    )
    if r.status_code == 200:
        return True, ""
    return False, f"HTTP {r.status_code}: {r.text[:200]}"


# ── Doctors ──────────────────────────────────────────────────────────────────
print("\n[doctors] fetching all rows…")
all_doctors = []
page = 1
while True:
    r = requests.get(
        f"{BASE}/api/doctors",
        headers=auth,
        params={"limit": 100, "page": page, "depth": 0, "locale": "ge"},
        timeout=60,
    )
    r.raise_for_status()
    body = r.json()
    all_doctors.extend(body["docs"])
    if not body.get("hasNextPage"):
        break
    page += 1
print(f"[doctors] {len(all_doctors)} total rows")

d_ok = 0
d_fail = 0
for i, doc in enumerate(all_doctors, 1):
    doc_id = doc["id"]
    ge_name = doc.get("name", "")
    ge_specialty = doc.get("specialty", "")

    name_tr = names.get(str(doc_id))
    spec_tr = specialties.get(ge_specialty)

    # Skip if we have NO translation for either name or specialty (legacy
    # seed doctors without doctra_id may not be in our names dict).
    if not name_tr and not spec_tr:
        d_fail += 1
        continue

    # Localized array fields (qualifications, specializations) need their
    # existing array-entry IDs preserved across the locale patches — without
    # the id, Payload treats it as a "replace the whole array" and the GE-
    # locale text gets dropped for items that don't yet have an EN/RU row.
    # We carry the id forward and only update the localized text per call.
    ge_quals = doc.get("qualifications") or []
    en_quals = []
    ru_quals = []
    for q in ge_quals:
        if not q:
            continue
        qid = q.get("id")
        ge_q = q.get("qualification", "")
        if not ge_q or not qid:
            continue
        t = qualifications.get(ge_q)
        if t:
            en_quals.append({"id": qid, "qualification": t["en"]})
            ru_quals.append({"id": qid, "qualification": t["ru"]})
        else:
            en_quals.append({"id": qid, "qualification": ge_q})
            ru_quals.append({"id": qid, "qualification": ge_q})

    ge_specs = doc.get("specializations") or []
    en_specs = []
    ru_specs = []
    for s in ge_specs:
        if not s:
            continue
        sid = s.get("id")
        ge_s = s.get("specialization", "")
        if not ge_s or not sid:
            continue
        t = specializations.get(ge_s)
        if t:
            en_specs.append({"id": sid, "specialization": t["en"]})
            ru_specs.append({"id": sid, "specialization": t["ru"]})
        else:
            en_specs.append({"id": sid, "specialization": ge_s})
            ru_specs.append({"id": sid, "specialization": ge_s})

    # Biography: substitute translated name + specialty into the template
    name_en = (name_tr or {}).get("en") or ge_name
    name_ru = (name_tr or {}).get("ru") or ge_name
    spec_en = (spec_tr or {}).get("en") or ge_specialty
    spec_ru = (spec_tr or {}).get("ru") or ge_specialty

    bio_en = bio_template_en.replace("{NAME}", name_en).replace("{SPECIALTY}", spec_en)
    bio_ru = bio_template_ru.replace("{NAME}", name_ru).replace("{SPECIALTY}", spec_ru)

    en_data: dict = {
        "name": name_en,
        "specialty": spec_en,
        "biography": lexical_text(bio_en),
    }
    ru_data: dict = {
        "name": name_ru,
        "specialty": spec_ru,
        "biography": lexical_text(bio_ru),
    }
    # Only include array keys when we have entries — sending an empty array
    # replaces the existing structure and wipes the other locales' text rows.
    if en_quals:
        en_data["qualifications"] = en_quals
        ru_data["qualifications"] = ru_quals
    if en_specs:
        en_data["specializations"] = en_specs
        ru_data["specializations"] = ru_specs

    ok_en, err_en = patch(f"/api/doctors/{doc_id}", en_data, "en")
    ok_ru, err_ru = patch(f"/api/doctors/{doc_id}", ru_data, "ru")
    if ok_en and ok_ru:
        d_ok += 1
    else:
        d_fail += 1
        print(f"  [fail] doctor {doc_id}: en={err_en} ru={err_ru}")

    if i % 25 == 0:
        print(f"  [{i}/{len(all_doctors)}] ok={d_ok} fail={d_fail}")

print(f"[doctors] {d_ok} translated, {d_fail} skipped/failed")


# ── Services ─────────────────────────────────────────────────────────────────
print("\n[services] translating…")
s_ok = 0
s_fail = 0
for svc_id, tr in services_tr.items():
    en = {
        "name": tr["name"]["en"],
        "description": tr["description"]["en"],
        "shortDescription": tr["shortDescription"]["en"],
    }
    ru = {
        "name": tr["name"]["ru"],
        "description": tr["description"]["ru"],
        "shortDescription": tr["shortDescription"]["ru"],
    }
    ok_en, err_en = patch(f"/api/services/{svc_id}", en, "en")
    ok_ru, err_ru = patch(f"/api/services/{svc_id}", ru, "ru")
    if ok_en and ok_ru:
        s_ok += 1
    else:
        s_fail += 1
        print(f"  [fail] service {svc_id}: en={err_en} ru={err_ru}")
print(f"[services] {s_ok} translated, {s_fail} failed")


# ── Reviews ──────────────────────────────────────────────────────────────────
print("\n[reviews] translating…")
r_ok = 0
r_fail = 0
for rev_id, tr in misc["reviews"].items():
    # All reviews get EN. Russian-origin reviews skip RU patch (already correct).
    if "en" in tr:
        ok, err = patch(f"/api/reviews/{rev_id}", {"text": tr["en"]}, "en")
        if not ok:
            r_fail += 1
            print(f"  [fail] review {rev_id} en: {err}")
            continue
    if "ru" in tr:
        ok, err = patch(f"/api/reviews/{rev_id}", {"text": tr["ru"]}, "ru")
        if not ok:
            r_fail += 1
            print(f"  [fail] review {rev_id} ru: {err}")
            continue
    # If review came in Russian originally, also patch GE
    if "ge" in tr:
        ok, err = patch(f"/api/reviews/{rev_id}", {"text": tr["ge"]}, "ge")
        if not ok:
            r_fail += 1
            print(f"  [fail] review {rev_id} ge: {err}")
            continue
    r_ok += 1
print(f"[reviews] {r_ok} translated, {r_fail} failed")


# ── Checkup packages ─────────────────────────────────────────────────────────
print("\n[checkups] translating…")
# Need to fetch existing rows so we can preserve their includedServices structure
# and only translate the `service` text field per entry.
r = requests.get(
    f"{BASE}/api/checkup-packages",
    headers=auth,
    params={"limit": 100, "depth": 0, "locale": "ge"},
    timeout=30,
)
r.raise_for_status()
chk_docs = r.json()["docs"]

c_ok = 0
c_fail = 0
for doc in chk_docs:
    cid = str(doc["id"])
    tr = checkups_tr.get(cid)
    if not tr:
        c_fail += 1
        continue
    ge_included = doc.get("includedServices") or []

    def build_items(lang: str):
        # Preserve each entry's id so Payload merges per-locale text into the
        # existing array structure instead of replacing (which would wipe GE).
        items = []
        for item in ge_included:
            if not item:
                continue
            iid = item.get("id")
            ge_text = item.get("service", "")
            if not iid:
                continue
            tr = checkup_svcs_tr.get(ge_text, {})
            items.append({
                "id": iid,
                "service": tr.get(lang, ge_text),
            })
        return items

    # `duration` is required on the collection; PATCH validates the merged
    # document so we must echo it back from the existing GE row.
    duration = doc.get("duration")
    en_items = build_items("en")
    ru_items = build_items("ru")
    en: dict = {
        "name": tr["name"]["en"],
        "description": tr["description"]["en"],
        "duration": duration,
    }
    ru: dict = {
        "name": tr["name"]["ru"],
        "description": tr["description"]["ru"],
        "duration": duration,
    }
    # Same defensive guard as doctors: only include the array key when we
    # actually have entries with ids to update.
    if en_items:
        en["includedServices"] = en_items
        ru["includedServices"] = ru_items
    ok_en, err_en = patch(f"/api/checkup-packages/{cid}", en, "en")
    ok_ru, err_ru = patch(f"/api/checkup-packages/{cid}", ru, "ru")
    if ok_en and ok_ru:
        c_ok += 1
    else:
        c_fail += 1
        print(f"  [fail] checkup {cid}: en={err_en} ru={err_ru}")
print(f"[checkups] {c_ok} translated, {c_fail} failed")


# ── Media ────────────────────────────────────────────────────────────────────
print("\n[media] translating alt text…")
m_ok = 0
m_fail = 0
for mid, tr in misc["media"].items():
    ok_en, err_en = patch(f"/api/media/{mid}", {"alt": tr["en"]}, "en")
    ok_ru, err_ru = patch(f"/api/media/{mid}", {"alt": tr["ru"]}, "ru")
    if ok_en and ok_ru:
        m_ok += 1
    else:
        m_fail += 1
        print(f"  [fail] media {mid}: en={err_en} ru={err_ru}")
print(f"[media] {m_ok} translated, {m_fail} failed")


print(f"""
─────────────────────────────────────
DONE
  doctors:  {d_ok} ok, {d_fail} skipped
  services: {s_ok} ok, {s_fail} failed
  reviews:  {r_ok} ok, {r_fail} failed
  checkups: {c_ok} ok, {c_fail} failed
  media:    {m_ok} ok, {m_fail} failed
─────────────────────────────────────
""")
