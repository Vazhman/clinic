"""
Three fixes in one pass:

  1. id=54 — Strip the "MD, PHD" suffix off the doctor's NAME (it was
     misplaced there from the original import). Add MD + PHD as proper
     qualifications-array entries in all 3 locales.

  2. Create ლადო ბაზიაშვილი — listed on khozrevanidze.ge/team.php but
     not returned by Doctra's get_doctors API. Add the row, attach the
     photo from the WeTransfer batch, set MD + PHD qualifications,
     translate to EN + RU.

  3. Create ვიკტორია ბაბენკო — same situation but no photo provided.
     Row only. Admin can upload a photo later.
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
import time
from pathlib import Path

import requests
from PIL import Image

TARGET = (sys.argv[1] if len(sys.argv) > 1 else "prod").lower()
BASE = "https://clinic-one-blush.vercel.app" if TARGET == "prod" else "http://localhost:3000"
EMAIL = "admin@admin.ge"
PASSWORD = "111111"
IMG_DIR = Path(r"C:\Users\nika.fartenadze.LCIBATUMI\Downloads\wetransfer_jpg_2026-05-12_0953")
LADO_PHOTO = IMG_DIR / "ლადო ბაზიაშვილი.jpg"

# Translations / data
TR_LADO = {
    "ge": {"name": "ლადო ბაზიაშვილი", "specialty": "—"},
    "en": {"name": "Lado Baziashvili", "specialty": "—"},
    "ru": {"name": "Ладо Базиашвили", "specialty": "—"},
}

TR_VIKTORIA = {
    "ge": {"name": "ვიკტორია ბაბენკო", "specialty": "—"},
    "en": {"name": "Viktoria Babenko", "specialty": "—"},
    "ru": {"name": "Виктория Бабенко", "specialty": "—"},
}

# Credentials stay literal in all locales — "MD" and "PHD" are international
QUALS_MD_PHD = [{"qualification": "MD"}, {"qualification": "PhD"}]


def lexical_text(text: str) -> dict:
    return {"root": {"children": [{"children": [{"detail":0,"format":0,"mode":"normal","style":"","text":text,"type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1,"textFormat":0}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}


def main() -> int:
    print(f"target: {BASE}")
    r = requests.post(f"{BASE}/api/users/login", json={"email":EMAIL,"password":PASSWORD}, timeout=30)
    r.raise_for_status()
    auth = {"Authorization": f"JWT {r.json()['token']}"}
    print("[ok] logged in")

    # ──────────────────────────────────────────────────────────────────
    # 1. Fix id=54 — strip "MD, PHD" from name, set qualifications
    # ──────────────────────────────────────────────────────────────────
    print("\n[1/3] Fixing id=54 (Mikheil Metreveli) — credentials in name → qualifications")
    fixes_54 = {
        "ge": {"name": "მიხეილ მეტრეველი"},
        "en": {"name": "Mikheil Metreveli"},
        "ru": {"name": "Михеил Метревели"},
    }
    for locale, data in fixes_54.items():
        # First update name only
        r = requests.patch(
            f"{BASE}/api/doctors/54?locale={locale}",
            headers={**auth, "Content-Type": "application/json"},
            json={**data, "qualifications": QUALS_MD_PHD},
            timeout=60,
        )
        print(f"  id=54 {locale}: HTTP {r.status_code}" + ("" if r.status_code == 200 else f" — {r.text[:150]}"))

    # ──────────────────────────────────────────────────────────────────
    # 2. Create Lado Baziashvili + upload photo + assign
    # ──────────────────────────────────────────────────────────────────
    print("\n[2/3] Creating Lado Baziashvili + uploading photo")

    # Resize the photo same way upload-doctor-photos.py does
    with Image.open(LADO_PHOTO) as im:
        im = im.convert("RGB")
        if max(im.size) > 1600:
            im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=85, optimize=True)
        buf.seek(0)

    upload_name = f"lado-baziashvili-{int(time.time())}.jpg"
    r = requests.post(
        f"{BASE}/api/media",
        headers=auth,
        files={"file": (upload_name, buf, "image/jpeg")},
        data={"_payload": json.dumps({"alt": "ლადო ბაზიაშვილი"})},
        timeout=120,
    )
    if r.status_code not in (200, 201):
        print(f"  photo upload failed: HTTP {r.status_code} — {r.text[:200]}")
        return 1
    media_id = r.json()["doc"]["id"]
    print(f"  photo uploaded: media id={media_id}")

    # Create in GE locale first (Payload's default locale)
    create_data = {
        "name": TR_LADO["ge"]["name"],
        "slug": "lado-baziashvili",
        "specialty": TR_LADO["ge"]["specialty"],
        "photo": media_id,
        "qualifications": QUALS_MD_PHD,
        "inactive": False,
    }
    r = requests.post(
        f"{BASE}/api/doctors?locale=ge",
        headers={**auth, "Content-Type": "application/json"},
        json=create_data,
        timeout=60,
    )
    if r.status_code not in (200, 201):
        print(f"  create failed: HTTP {r.status_code} — {r.text[:300]}")
        return 1
    lado_id = r.json()["doc"]["id"]
    print(f"  Lado created: id={lado_id}")

    # Mirror to EN and RU locales — need to fetch back to get array IDs first
    r = requests.get(f"{BASE}/api/doctors/{lado_id}?locale=ge&depth=0", headers=auth, timeout=30)
    qual_rows = r.json().get("qualifications", [])
    en_quals = [{"id": q["id"], "qualification": "MD" if i == 0 else "PhD"} for i, q in enumerate(qual_rows)]
    ru_quals = en_quals  # same string in all langs

    for locale in ("en", "ru"):
        r = requests.patch(
            f"{BASE}/api/doctors/{lado_id}?locale={locale}",
            headers={**auth, "Content-Type": "application/json"},
            json={
                "name": TR_LADO[locale]["name"],
                "specialty": TR_LADO[locale]["specialty"],
                "qualifications": en_quals if locale == "en" else ru_quals,
            },
            timeout=60,
        )
        print(f"  Lado {locale}: HTTP {r.status_code}")

    # ──────────────────────────────────────────────────────────────────
    # 3. Create Viktoria Babenko (no photo)
    # ──────────────────────────────────────────────────────────────────
    print("\n[3/3] Creating Viktoria Babenko (no photo)")
    create_data = {
        "name": TR_VIKTORIA["ge"]["name"],
        "slug": "viktoria-babenko",
        "specialty": TR_VIKTORIA["ge"]["specialty"],
        "inactive": False,
    }
    r = requests.post(
        f"{BASE}/api/doctors?locale=ge",
        headers={**auth, "Content-Type": "application/json"},
        json=create_data,
        timeout=60,
    )
    if r.status_code not in (200, 201):
        print(f"  create failed: HTTP {r.status_code} — {r.text[:300]}")
        return 1
    viktoria_id = r.json()["doc"]["id"]
    print(f"  Viktoria created: id={viktoria_id}")

    for locale in ("en", "ru"):
        r = requests.patch(
            f"{BASE}/api/doctors/{viktoria_id}?locale={locale}",
            headers={**auth, "Content-Type": "application/json"},
            json={
                "name": TR_VIKTORIA[locale]["name"],
                "specialty": TR_VIKTORIA[locale]["specialty"],
            },
            timeout=60,
        )
        print(f"  Viktoria {locale}: HTTP {r.status_code}")

    print("\nDONE")
    return 0


if __name__ == "__main__":
    sys.exit(main())
