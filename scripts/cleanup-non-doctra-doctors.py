"""
Cleanup pass: remove every doctor row that didn't come from Doctra's
`get_doctors` API. After this runs the only doctors in Payload are the
146 real Doctra-imported ones — clinic-admin clicks the "Doctra sync"
button on the dashboard to add any new doctors going forward.

What this script does:

  1. Find the 13 duplicate pairs where a legacy seed row and a Doctra-
     imported row are the same person. For any legacy row that has a
     REAL photo (not the stock placeholder media id 2 or 3), copy the
     photo_id over to the Doctra row first.
  2. DELETE every doctor row where doctra_id IS NULL — legacy seed +
     the two manually-created (Lado, Viktoria).

What this script does NOT do:

  - Touch the Media collection (Vercel Blob uploads stay alive)
  - Touch services / reviews / checkup packages / globals / pages
  - Wipe or truncate any table
  - Delete a Doctra-imported doctor (those have doctra_id set)

Idempotent. Re-runs after a Doctra sync don't re-delete real Doctra rows.
"""
from __future__ import annotations

import json
import sys
import requests

TARGET = (sys.argv[1] if len(sys.argv) > 1 else "prod").lower()
BASE = "https://clinic-one-blush.vercel.app" if TARGET == "prod" else "http://localhost:3000"
EMAIL = "admin@admin.ge"
PASSWORD = "111111"

PLACEHOLDER_MEDIA_IDS = {2, 3}


def fetch_all_paginated(base: str, auth: dict, path: str, where: dict) -> list:
    docs = []
    page = 1
    while True:
        params = {"limit": 200, "page": page, "depth": 0}
        for k, v in where.items():
            params[k] = v
        r = requests.get(f"{base}{path}", headers=auth, params=params, timeout=60)
        r.raise_for_status()
        body = r.json()
        docs.extend(body["docs"])
        if not body.get("hasNextPage"):
            break
        page += 1
    return docs


def main() -> int:
    print(f"target: {BASE}")
    r = requests.post(f"{BASE}/api/users/login", json={"email": EMAIL, "password": PASSWORD}, timeout=30)
    r.raise_for_status()
    auth = {"Authorization": f"JWT {r.json()['token']}"}
    print("[ok] logged in")

    # ── 1. Fetch all doctors with doctra_id (the keepers) + their names ─────
    keepers = fetch_all_paginated(BASE, auth, "/api/doctors", {"where[doctraId][exists]": "true"})
    print(f"[ok] {len(keepers)} Doctra-imported doctors will be kept")

    # ── 2. Fetch all doctors without doctra_id (the to-delete list) ─────────
    losers = fetch_all_paginated(BASE, auth, "/api/doctors", {"where[doctraId][exists]": "false"})
    print(f"[ok] {len(losers)} non-Doctra doctor rows queued for deletion")

    # Map keepers by normalized name for duplicate detection
    def norm(s: str) -> str:
        import re
        return re.sub(r"\s+", " ", (s or "").strip().lower())

    keeper_by_name: dict[str, dict] = {}
    for k in keepers:
        keeper_by_name[norm(k.get("name", ""))] = k

    # ── 3. For each loser with a REAL photo + matching Doctra row, copy photo ──
    photo_transfers = 0
    for loser in losers:
        photo = loser.get("photo")
        photo_id = (
            photo["id"] if isinstance(photo, dict)
            else photo if isinstance(photo, int)
            else None
        )
        if not photo_id or photo_id in PLACEHOLDER_MEDIA_IDS:
            continue  # placeholder or no photo — nothing to save
        n = norm(loser.get("name", ""))
        match = keeper_by_name.get(n)
        if not match:
            continue  # legacy doctor with real photo but no Doctra duplicate
        # If the Doctra version already has a non-placeholder photo, leave it
        kp = match.get("photo")
        kp_id = kp["id"] if isinstance(kp, dict) else kp if isinstance(kp, int) else None
        if kp_id and kp_id not in PLACEHOLDER_MEDIA_IDS:
            continue
        # Copy the photo
        r = requests.patch(
            f"{BASE}/api/doctors/{match['id']}",
            headers={**auth, "Content-Type": "application/json"},
            json={"photo": photo_id},
            timeout=60,
        )
        if r.status_code == 200:
            photo_transfers += 1
            print(f"  photo transferred: legacy id={loser['id']} ({loser.get('name')}) → Doctra id={match['id']}")
        else:
            print(f"  [warn] photo transfer failed legacy {loser['id']} → Doctra {match['id']}: HTTP {r.status_code}")

    print(f"\n[ok] {photo_transfers} photos transferred to Doctra duplicates")

    # ── 4. DELETE every non-Doctra doctor row ───────────────────────────────
    ok = 0
    fail = 0
    for i, loser in enumerate(losers, 1):
        r = requests.delete(f"{BASE}/api/doctors/{loser['id']}", headers=auth, timeout=60)
        if r.status_code == 200:
            ok += 1
        else:
            fail += 1
            print(f"  [fail] delete id={loser['id']} ({loser.get('name')}): HTTP {r.status_code} — {r.text[:150]}")
        if i % 20 == 0:
            print(f"  deleted {i}/{len(losers)} (ok={ok} fail={fail})")

    print(f"\nDONE — {ok} doctor rows deleted, {fail} failed.")
    print(f"Remaining doctors: {len(keepers)} (Doctra-imported only)")
    return 0 if fail == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
