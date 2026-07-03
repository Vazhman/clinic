"use client";

import { useState, useId } from "react";

interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className = "" }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const buttonId = `${baseId}-btn-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <div
            key={index}
            className="border border-grey-lighter rounded-xl overflow-hidden"
          >
            <button
              id={buttonId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left font-medium text-grey hover:bg-pink-light/30 transition-colors cursor-pointer"
            >
              <span className="break-words min-w-0 flex-1">{item.title}</span>
              <svg
                className={`w-5 h-5 text-blackberry transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={`transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
            >
              <div className="p-4 sm:p-5 pt-0 text-grey-light leading-relaxed break-words">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
