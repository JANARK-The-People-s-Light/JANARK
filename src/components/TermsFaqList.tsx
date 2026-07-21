"use client";

import { useState } from "react";
import type { TermsFaq } from "@/lib/civic-post-terms";

export function TermsFaqList({ items }: { items: TermsFaq[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
              aria-expanded={open}
            >
              <span className="font-medium text-navy">{item.question}</span>
              <span
                className={`mt-0.5 shrink-0 text-sm text-muted transition ${
                  open ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            {open ? (
              <div className="space-y-3 border-t border-line bg-cream/40 px-4 py-4 text-sm leading-relaxed text-muted sm:px-5">
                {item.answer.map((p) => (
                  <p key={p.slice(0, 56)}>{p}</p>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
