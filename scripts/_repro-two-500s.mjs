// Reproduce checkup-packages + reviews PATCH 500s (no-op writes), and dump
// the navigation global's actual shape.
const SITE = "https://clinic-one-blush.vercel.app";
const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());
const headers = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

for (const [col, field] of [["checkup-packages", "name"], ["reviews", "text"]]) {
  const list = await fetch(`${SITE}/api/${col}?limit=1&locale=ge&depth=0`, { headers }).then((r) => r.json());
  const doc = list.docs[0];
  const res = await fetch(`${SITE}/api/${col}/${doc.id}?locale=ge&depth=0`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ [field]: doc[field] }),
  });
  console.log(`${col}/${doc.id} no-op PATCH -> ${res.status}`);
}

const nav = await fetch(`${SITE}/api/globals/navigation?locale=ge&depth=0`, { headers }).then((r) => r.json());
console.log("navigation keys:", Object.keys(nav).join(", "));
console.log("navigation sample:", JSON.stringify(nav).slice(0, 400));
