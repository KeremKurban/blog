import { tagSlug } from "@/lib/tags";

export function TagChip({ tag, active = false }: { tag: string; active?: boolean }) {
  return (
    <a
      href={`/tags/${tagSlug(tag)}/`}
      className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-xs transition ${
        active ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-muted hover:border-accent/40 hover:text-accent"
      }`}
    >
      {tag}
    </a>
  );
}
