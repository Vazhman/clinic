// Reproduce the news PATCH 500 on prod with a no-op change, then restore.
const SITE = process.env.SITE || "https://clinic-one-blush.vercel.app";

const login = await fetch(`${SITE}/api/users/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@admin.ge", password: "111111" }),
}).then((r) => r.json());

const headers = { "Content-Type": "application/json", Authorization: `JWT ${login.token}` };

const list = await fetch(`${SITE}/api/news?limit=1&locale=ge&depth=0`, { headers }).then((r) => r.json());
const doc = list.docs[0];
console.log("doc id:", doc.id, "title:", doc.title?.slice(0, 40), "_status:", doc._status, "status:", doc.status);

const res = await fetch(`${SITE}/api/news/${doc.id}?locale=ge&depth=0`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ title: doc.title }), // no-op write
});
console.log("PATCH status:", res.status);
console.log(JSON.stringify(await res.json()).slice(0, 500));
