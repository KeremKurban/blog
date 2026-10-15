import { tagSlug } from "@/lib/tags";

export function TagChip({ tag }: { tag: string }) {
  return (
    <a
      href={`/tags/${tagSlug(tag)}/`}
      className="inline-block rounded-sm bg-surface px-2 py-0.5 text-[0.8rem] text-muted transition hover:bg-surface-2 hover:text-accent"
    >
      {tag}
    </a>
  );
}
