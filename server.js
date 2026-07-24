// Passenger/cPanel entry point for the Next.js app.
//
// cPanel's "Setup Node.js App" runs the app under Phusion Passenger, which
// executes a startup FILE (this one) — it does NOT run `next start`. So we boot
// Next programmatically and hand every request to Next's request handler
// (App Router, Payload admin, and API routes all flow through it).
//
// Passenger provides the port/socket via process.env.PORT.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> Ready on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
