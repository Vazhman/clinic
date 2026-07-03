"""
One-shot demo seeder: upload a single placeholder photo to Payload Media,
then fill every Doctor row with plausible example data so the demo /admin
and public site don't show blank biographies / 0 experience / no photo.

Editorial fields touched (per doctor):
  - photo            → the uploaded placeholder media ID
  - biography        → generic Georgian rich-text bio
  - specializations  → 2 generic items
  - experienceYears  → random 5–25
  - languagesSpoken  → Georgian + English
  - lastUpdated      → today

Specialty / name / phone / email / qualifications / inactive are LEFT alone
(those came from Doctra and are already correct).

Re-running is idempotent in the sense that it overwrites the same fields
with new placeholder values — it doesn't create new rows. Admin should
replace this content per-doctor as time allows.

Usage:
    python scripts/fill-doctors-demo.py [prod|local]
Default: prod.
"""
from __future__ import annotations

import json
import os
import random
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
IMAGE_PATH = Path(r"C:\Users\nika.fartenadze.LCIBATUMI\Downloads\images.jpg")
TODAY_ISO = "2026-05-10T00:00:00.000Z"

print(f"target: {BASE}")
print(f"image:  {IMAGE_PATH} ({IMAGE_PATH.stat().st_size} bytes)")

# ── 1. Login ───────────────────────────────────────────────────────────────
r = requests.post(
    f"{BASE}/api/users/login",
    json={"email": EMAIL, "password": PASSWORD},
    timeout=30,
)
r.raise_for_status()
token = r.json()["token"]
auth = {"Authorization": f"JWT {token}"}
print("[ok] logged in")

# ── 2. Upload placeholder image to Media collection ───────────────────────
import time
unique_name = f"doctor-placeholder-{int(time.time())}.jpg"
with open(IMAGE_PATH, "rb") as f:
    # Payload's REST upload expects metadata as a JSON string under `_payload`.
    # Filename includes a timestamp because Vercel Blob refuses to overwrite
    # an existing key by default.
    r = requests.post(
        f"{BASE}/api/media",
        headers=auth,
        files={"file": (unique_name, f, "image/jpeg")},
        data={"_payload": json.dumps({"alt": "ექიმის ფოტო (placeholder)"})},
        timeout=60,
    )
if r.status_code not in (200, 201):
    print(f"upload failed: {r.status_code} {r.text[:500]}")
    sys.exit(1)
media_id = r.json()["doc"]["id"]
print(f"[ok] uploaded placeholder image, media id: {media_id}")

# ── 3. Build a generic Lexical-format biography ───────────────────────────
def make_bio(name: str, specialty: str) -> dict:
    text = (
        f"{name} — გამოცდილი {specialty}, ხოზრევანიძის კლინიკის გუნდის წევრი. "
        "სპეციალიზდება დიაგნოსტიკასა და მკურნალობაზე, ზრუნავს თითოეული "
        "პაციენტის ჯანმრთელობასა და კომფორტზე. რეგულარულად მონაწილეობს "
        "საერთაშორისო ტრენინგებსა და კონფერენციებში, რათა სამედიცინო "
        "მომსახურება მუდმივად განახლებული და თანამედროვე იყოს."
    )
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


# ── 4. Fetch all doctors (paginated) ──────────────────────────────────────
all_doctors: list[dict] = []
page = 1
while True:
    r = requests.get(
        f"{BASE}/api/doctors",
        headers=auth,
        params={"limit": 100, "page": page, "depth": 0},
        timeout=60,
    )
    r.raise_for_status()
    body = r.json()
    all_doctors.extend(body["docs"])
    if not body.get("hasNextPage"):
        break
    page += 1
print(f"[ok] fetched {len(all_doctors)} doctors")

# ── 5. Patch each doctor with example data ────────────────────────────────
SPECIALIZATION_OPTIONS = [
    "ზოგადი დიაგნოსტიკა",
    "კონსულტაცია",
    "პრევენციული მედიცინა",
    "გადაუდებელი დახმარება",
    "კვლევა და მკურნალობა",
]

LANGUAGES_GE = [
    [{"language": "ka"}, {"language": "en"}],
    [{"language": "ka"}, {"language": "en"}, {"language": "ru"}],
    [{"language": "ka"}, {"language": "ru"}],
]

ok = 0
fail = 0
for i, doc in enumerate(all_doctors, 1):
    name = doc.get("name") or "ექიმი"
    specialty = doc.get("specialty") or "ექიმი"
    update = {
        "photo": media_id,
        "biography": make_bio(name, specialty),
        "specializations": [
            {"specialization": s} for s in random.sample(SPECIALIZATION_OPTIONS, 2)
        ],
        "experienceYears": random.randint(5, 25),
        "languagesSpoken": random.choice(LANGUAGES_GE),
        "lastUpdated": TODAY_ISO,
    }
    r = requests.patch(
        f"{BASE}/api/doctors/{doc['id']}",
        headers={**auth, "Content-Type": "application/json"},
        json=update,
        timeout=60,
    )
    if r.status_code == 200:
        ok += 1
        if i % 25 == 0:
            print(f"  [{i}/{len(all_doctors)}] ok={ok} fail={fail}")
    else:
        fail += 1
        print(f"  [fail] {doc['id']} ({name[:30]}): {r.status_code} {r.text[:200]}")

print()
print(f"DONE — {ok} updated, {fail} failed of {len(all_doctors)} doctors.")
