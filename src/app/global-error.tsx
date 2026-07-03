"use client";

import { useEffect } from "react";

// Last-resort boundary for errors thrown in the root layout itself (before the
// locale layout/CSS load). Must render its own <html>/<body> and stay
// self-contained with inline styles. Trilingual since locale context is gone.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ka">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAF8",
          color: "#3D3D3D",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <h1 style={{ color: "#682149", fontSize: "1.6rem", marginBottom: "0.75rem" }}>
            Something went wrong / რაღაც შეცდომა მოხდა
          </h1>
          <p style={{ color: "#6b6b6b", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Please try again. / გთხოვთ, სცადეთ თავიდან.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#682149",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "0.85rem 1.75rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again / თავიდან ცდა
          </button>
        </div>
      </body>
    </html>
  );
}
