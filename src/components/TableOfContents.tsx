"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/posts";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const { id } of items) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-labelledby="toc-label" className="text-sm">
      <p id="toc-label" className="mb-3 font-serif text-base italic text-mocha">In this post</p>
      <ol className="space-y-0.5 border-l border-grounds">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "location" : undefined}
              className={`-ml-px block border-l-2 py-1.5 leading-snug transition ${it.depth === 3 ? "pl-7" : "pl-4"} ${
                active === it.id ? "border-crema text-milk" : "border-transparent text-mocha hover:text-latte"
              }`}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
