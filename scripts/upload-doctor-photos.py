"""
Upload the WeTransfer batch of doctor photos to Payload Media and assign
each photo to the matching doctor row.

Source folder: C:\\Users\\nika.fartenadze.LCIBATUMI\\Downloads\\wetransfer_jpg_2026-05-12_0953
Target: clinic-one-blush.vercel.app (Payload + Vercel Blob)

Matching: filename (stripped of trailing digits + "-specialty" suffix)
compared against doctor.name in GE locale, with `(...)` specialty suffixes
also stripped from the DB side, plus Georgian-nickname expansion.

Skipped intentionally:
  - ლადო ბაზიაშვილი.jpg     — no matching doctor in DB
  - სტომატოლოგია.jpeg        — not a doctor photo (specialty/department image)
  - კობა ქამაშიძე2.jpg       — duplicate, user picked the .1 file
  - მერაბ ნაკაშიძე1.jpg      — duplicate, user picked the .2 file
"""
from __future__ import annotations

import io
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

import requests
from PIL import Image

# Max longest-edge for uploaded images. Clinic batch came in at 8-14 MB
# each (RAW exports); Vercel Functions reject >4.5 MB request bodies.
# 1600px @ JPEG quality 85 lands in the 200-700 KB range — sharp on
# retina displays, fits comfortably under the limit with form-encoding overhead.
RESIZE_MAX_EDGE = 1600
JPEG_QUALITY = 85

TARGET = (sys.argv[1] if len(sys.argv) > 1 else "prod").lower()
BASE = (
    "https://clinic-one-blush.vercel.app"
    if TARGET == "prod"
    else "http://localhost:3000"
)
EMAIL = "admin@admin.ge"
PASSWORD = "111111"
IMG_DIR = Path(r"C:\Users\nika.fartenadze.LCIBATUMI\Downloads\wetransfer_jpg_2026-05-12_0953")
DOCTORS_FILE = Path(__file__).resolve().parent.parent / "translations" / "all-doctors.txt"

SKIP_FILES = {
    "ლადო ბაზიაშვილი.jpg",   # no DB match
    "სტომატოლოგია.jpeg",      # not a doctor
    "კობა ქამაშიძე2.jpg",     # duplicate — user picked .1
    "მერაბ ნაკაშიძე1.jpg",    # duplicate — user picked .2
}

GEORGIAN_NICKNAMES = {
    "ზურა": "ზურაბ",  # Zura → Zurab
    "ლადო": "ვლადიმერ",
}


def normalize(s: str) -> str:
    """Lowercase + collapse whitespace + strip `(...)` suffix."""
    s = re.sub(r"\s*\([^)]*\)", "", s)
    return re.sub(r"\s+", " ", s.lower().strip())


def expand_nicknames(s: str) -> str:
    return " ".join(GEORGIAN_NICKNAMES.get(p, p) for p in s.split())


def extract_name_from_filename(fn: str) -> str:
    """Strip extension, trailing digits, and '-specialty' suffix."""
    base = os.path.splitext(fn)[0]
    base = re.sub(r"\s*\d+$", "", base)
    base = base.split("-")[0]
    return base.strip()


def load_doctors() -> list[dict]:
    doctors = []
    with open(DOCTORS_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            pid, name = line.split("|", 1)
            doctors.append({"id": int(pid), "name": name.strip()})
    return doctors


def find_doctor_id(filename: str, doctors: list[dict]) -> Optional[int]:
    img_name = extract_name_from_filename(filename)
    n = normalize(img_name)
    n_expanded = normalize(expand_nicknames(img_name))
    for d in doctors:
        dn = normalize(d["name"])
        if dn == n or dn.replace(" ", "") == n.replace(" ", ""):
            return d["id"]
        if dn == n_expanded:
            return d["id"]
    return None


def transliterate_filename(name: str) -> str:
    """Best-effort ASCII filename for Vercel Blob. Vercel rejects some
    Unicode in blob keys, so we transliterate to a safe ASCII slug."""
    table = {
        "ა": "a", "ბ": "b", "გ": "g", "დ": "d", "ე": "e", "ვ": "v",
        "ზ": "z", "თ": "t", "ი": "i", "კ": "k", "ლ": "l", "მ": "m",
        "ნ": "n", "ო": "o", "პ": "p", "ჟ": "zh", "რ": "r", "ს": "s",
        "ტ": "t", "უ": "u", "ფ": "f", "ქ": "q", "ღ": "gh", "ყ": "y",
        "შ": "sh", "ჩ": "ch", "ც": "ts", "ძ": "dz", "წ": "ts'", "ჭ": "ch'",
        "ხ": "kh", "ჯ": "j", "ჰ": "h",
    }
    base, ext = os.path.splitext(name)
    out = "".join(table.get(c, c) for c in base)
    out = re.sub(r"[^a-zA-Z0-9_-]", "-", out).strip("-")
    return f"{out}-{int(time.time())}{ext.lower()}"


def main() -> int:
    print(f"target: {BASE}")
    print(f"images: {IMG_DIR}")

    if not IMG_DIR.exists():
        print(f"image directory not found: {IMG_DIR}")
        return 1

    # Login
    r = requests.post(
        f"{BASE}/api/users/login",
        json={"email": EMAIL, "password": PASSWORD},
        timeout=30,
    )
    r.raise_for_status()
    token = r.json()["token"]
    auth = {"Authorization": f"JWT {token}"}
    print("[ok] logged in")

    doctors = load_doctors()
    print(f"[ok] loaded {len(doctors)} doctors")

    files = sorted(p.name for p in IMG_DIR.iterdir() if p.is_file())
    print(f"[ok] {len(files)} files in source folder")

    plan = []
    for fn in files:
        if fn in SKIP_FILES:
            continue
        doc_id = find_doctor_id(fn, doctors)
        if doc_id is None:
            print(f"  [skip] {fn} — no doctor match")
            continue
        plan.append((fn, doc_id))

    print(f"\n[ok] {len(plan)} photos to upload + assign")

    ok = 0
    fail = 0
    for i, (fn, doc_id) in enumerate(plan, 1):
        src_path = IMG_DIR / fn
        upload_name = transliterate_filename(fn)
        try:
            # Resize → JPEG bytes in memory. Always re-encode so we get a
            # consistent quality + correct EXIF rotation applied.
            with Image.open(src_path) as im:
                im = im.convert("RGB")
                if max(im.size) > RESIZE_MAX_EDGE:
                    im.thumbnail((RESIZE_MAX_EDGE, RESIZE_MAX_EDGE), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True)
                buf.seek(0)

            r = requests.post(
                f"{BASE}/api/media",
                headers=auth,
                files={"file": (upload_name, buf, "image/jpeg")},
                data={"_payload": json.dumps({"alt": os.path.splitext(fn)[0]})},
                timeout=120,
            )
            if r.status_code not in (200, 201):
                fail += 1
                print(f"  [fail {i}/{len(plan)}] upload {fn}: {r.status_code} {r.text[:150]}")
                continue
            media_id = r.json()["doc"]["id"]

            r = requests.patch(
                f"{BASE}/api/doctors/{doc_id}",
                headers={**auth, "Content-Type": "application/json"},
                json={"photo": media_id},
                timeout=60,
            )
            if r.status_code != 200:
                fail += 1
                print(f"  [fail {i}/{len(plan)}] patch doctor {doc_id}: {r.status_code} {r.text[:150]}")
                continue
            ok += 1
            if i % 10 == 0:
                print(f"  [{i}/{len(plan)}] ok={ok} fail={fail}")
        except Exception as e:
            fail += 1
            print(f"  [exc {i}/{len(plan)}] {fn}: {e}")

    print(f"\nDONE — {ok} photos uploaded + assigned, {fail} failed")
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
