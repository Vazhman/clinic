"""
One-shot restore: the apply-translations.py earlier wiped the GE locale
text rows for checkup_packages_included_services. The structure rows still
exist; only the GE text is missing. This re-PATCHes the GE includedServices
for the 3 checkup packages using the canonical Georgian list from
src/lib/data.ts.
"""
import sys, json, requests

TARGET = (sys.argv[1] if len(sys.argv) > 1 else "prod").lower()
BASE = "https://clinic-one-blush.vercel.app" if TARGET == "prod" else "http://localhost:3000"

# Canonical GE service lists from src/lib/data.ts
PACKAGES = {
    "1": {
        "duration": "2 საათი",
        "includedServices": [
            "სისხლის ზოგადი ანალიზი",
            "შარდის ანალიზი",
            "ბიოქიმიური ანალიზი",
            "ელექტროკარდიოგრამა",
            "თერაპევტის კონსულტაცია",
        ],
    },
    "2": {
        "duration": "3-4 საათი",
        "includedServices": [
            "სისხლის ზოგადი ანალიზი",
            "შარდის ანალიზი",
            "ბიოქიმიური ანალიზი",
            "ელექტროკარდიოგრამა",
            "მუცლის ღრუს ულტრაბგერა",
            "ფარისებრი ჯირკვლის ულტრაბგერა",
            "თერაპევტის კონსულტაცია",
            "ენდოკრინოლოგის კონსულტაცია",
        ],
    },
    "3": {
        "duration": "5-6 საათი",
        "includedServices": [
            "სისხლის ზოგადი ანალიზი",
            "შარდის ანალიზი",
            "ბიოქიმიური ანალიზი (გაფართოებული)",
            "ელექტროკარდიოგრამა",
            "მუცლის ღრუს ულტრაბგერა",
            "ფარისებრი ჯირკვლის ულტრაბგერა",
            "ექოკარდიოგრაფია",
            "თერაპევტის კონსულტაცია",
            "ენდოკრინოლოგის კონსულტაცია",
            "კარდიოლოგის კონსულტაცია",
            "ნევროლოგის კონსულტაცია",
            "ოფთალმოლოგის კონსულტაცია",
        ],
    },
}

r = requests.post(f"{BASE}/api/users/login", json={"email": "admin@admin.ge", "password": "111111"})
r.raise_for_status()
token = r.json()["token"]
auth = {"Authorization": f"JWT {token}", "Content-Type": "application/json"}

for pkg_id, data in PACKAGES.items():
    payload = {
        "duration": data["duration"],
        "includedServices": [{"service": s} for s in data["includedServices"]],
    }
    r = requests.patch(f"{BASE}/api/checkup-packages/{pkg_id}?locale=ge", headers=auth, json=payload, timeout=60)
    print(f"  checkup {pkg_id}: {r.status_code} ({len(data['includedServices'])} services)")
print("done.")
