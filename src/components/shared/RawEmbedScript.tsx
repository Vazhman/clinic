"use client";

import { useEffect, useRef } from "react";

// Scripts inserted via dangerouslySetInnerHTML never execute — the browser
// ignores <script> tags set through innerHTML. This recreates each one as a
// real DOM node so injected tracking snippets (e.g. TOP.GE) actually run.
export default function RawEmbedScript({ html }: { html?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!html?.trim() || injectedRef.current || !containerRef.current) return;
    injectedRef.current = true;

    const template = document.createElement("template");
    template.innerHTML = html;

    template.content.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      for (const { name, value } of Array.from(oldScript.attributes)) {
        newScript.setAttribute(name, value);
      }
      newScript.text = oldScript.text;
      containerRef.current?.appendChild(newScript);
    });

    template.content.querySelectorAll(":not(script)").forEach((node) => {
      containerRef.current?.appendChild(node.cloneNode(true));
    });
  }, [html]);

  if (!html?.trim()) return null;
  return <div ref={containerRef} />;
}
