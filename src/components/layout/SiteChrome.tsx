"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

// Routes that render WITHOUT the marketing chrome (header / footer / chat /
// whatsapp) — e.g. the logged-in patient portal, which has its own top bar.
// usePathname() here is locale-independent (next-intl), so "/patient-room"
// matches /ge, /en and /ru. Header/Footer/widgets are passed in as
// server-rendered elements, so this client wrapper only decides whether to
// show them — no extra client weight from the chrome itself.
const BARE_ROUTES = ["/patient-room"];

export default function SiteChrome({
  header,
  footer,
  widgets,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  widgets: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (bare) {
    // Keep the a11y-content wrapper so accessibility CSS filters still apply,
    // but drop the marketing header/footer/floating widgets.
    return (
      <div className="a11y-content">
        <main id="main-content">{children}</main>
      </div>
    );
  }

  return (
    <>
      <div className="a11y-content flex min-h-screen flex-col">
        {header}
        <main id="main-content" className="flex-1">{children}</main>
        {footer}
      </div>
      {widgets}
    </>
  );
}
