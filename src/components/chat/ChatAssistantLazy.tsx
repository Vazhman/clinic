"use client";

import dynamic from "next/dynamic";

// The chat widget pulls in the ai-sdk client runtime (@ai-sdk/react + ai) and
// its full UI. It's rendered globally in the frontend layout but closed by
// default, so there's no reason to ship it on the initial payload of every
// page. Loading it client-side only (ssr: false, after hydration) keeps the
// ai-sdk chunk off the critical path — important on the no-CDN cPanel host.
const ChatAssistant = dynamic(() => import("./ChatAssistant"), { ssr: false });

export default ChatAssistant;
