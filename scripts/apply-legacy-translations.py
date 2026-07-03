"""Apply the 54 legacy seed doctor name+specialty translations to prod
(or local). Re-runs are idempotent. Plus fixes review 3's missing RU row."""
import json, sys, requests
from pathlib import Path

TARGET = (sys.argv[1] if len(sys.argv) > 1 else "prod").lower()
BASE = "https://clinic-one-blush.vercel.app" if TARGET == "prod" else "http://localhost:3000"
TR = Path(__file__).resolve().parent.parent / "translations"

print(f"target: {BASE}")
legacy = json.load(open(TR / "legacy-doctors.json", encoding="utf-8"))
print(f"loaded {len(legacy)} legacy doctor translations")

r = requests.post(f"{BASE}/api/users/login", json={"email":"admin@admin.ge","password":"111111"}, timeout=30)
r.raise_for_status()
auth = {"Authorization": f"JWT {r.json()['token']}", "Content-Type": "application/json"}

ok, fail = 0, 0
for doc_id, tr in legacy.items():
    for locale in ("en", "ru"):
        payload = {"name": tr[locale]["name"], "specialty": tr[locale]["specialty"]}
        r = requests.patch(f"{BASE}/api/doctors/{doc_id}?locale={locale}", headers=auth, json=payload, timeout=60)
        if r.status_code == 200: ok += 1
        else:
            fail += 1
            print(f"  [fail] doctor {doc_id} {locale}: HTTP {r.status_code} {r.text[:150]}")

# Fix review 3 RU row (was missing — RU is the original source language for that review)
r = requests.patch(
    f"{BASE}/api/reviews/3?locale=ru", headers=auth,
    json={"author": "Мария С.", "text": "Отличная клиника! Прекрасное обслуживание и профессиональные врачи."},
    timeout=30,
)
print(f"review 3 RU: HTTP {r.status_code}")

print(f"\nDONE — {ok} locale-patches succeeded, {fail} failed")
