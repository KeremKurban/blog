import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, Text, ElementContent } from "hast";
import { visit } from "unist-util-visit";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  updated?: string;
  summary: string;
  tags: string[];
  readingMinutes: number;
};

export type TocItem = { id: string; text: string; depth: 2 | 3 };

export type Post = PostMeta & { html: string; toc: TocItem[] };

type Frontmatter = {
  title: string;
  date: string | Date;
  updated?: string | Date;
  summary: string;
  tags?: string[];
  draft?: boolean;
};

const isoDay = (d: string | Date) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d));

function readSource(slug: string) {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  return { fm: data as Frontmatter, content };
}

function readingMinutes(markdown: string) {
  const prose = markdown.replace(/```[\s\S]*?```/g, " ");
  const words = prose.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function allSlugs() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function toMeta(slug: string): (PostMeta & { draft: boolean }) | null {
  const { fm, content } = readSource(slug);
  if (!fm.title || !fm.date) return null;
  return {
    slug,
    title: fm.title,
    date: isoDay(fm.date),
    updated: fm.updated ? isoDay(fm.updated) : undefined,
    summary: fm.summary ?? "",
    tags: fm.tags ?? [],
    readingMinutes: readingMinutes(content),
    draft: Boolean(fm.draft),
  };
}

/** Published posts, newest first. Drafts are skipped in production builds. */
export function getAllPosts(): PostMeta[] {
  const showDrafts = process.env.NODE_ENV !== "production";
  return allSlugs()
    .map(toMeta)
    .filter((p): p is PostMeta & { draft: boolean } => p !== null && (showDrafts || !p.draft))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ draft: _draft, ...meta }) => meta);
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of getAllPosts()) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export { tagSlug } from "./tags";

const textOf = (node: ElementContent): string =>
  node.type === "text" ? (node as Text).value : "children" in node ? (node.children as ElementContent[]).map(textOf).join("") : "";

/** Collects h2/h3 headings (after rehype-slug) into a table of contents. */
function rehypeToc(toc: TocItem[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && typeof node.properties?.id === "string") {
        toc.push({ id: node.properties.id, text: textOf(node).trim(), depth: node.tagName === "h2" ? 2 : 3 });
      }
    });
  };
}

/** Wraps tables in a scroll container so wide tables never break the page on phones. */
function rehypeWrapTables() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "table" || !parent || index === undefined) return;
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [node],
      };
    });
  };
}

export async function getPost(slug: string): Promise<Post> {
  const meta = toMeta(slug);
  if (!meta) throw new Error(`Post ${slug} is missing a title or date`);
  const { content } = readSource(slug);
  const toc: TocItem[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeToc(toc))
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["heading-anchor"], ariaHidden: "true", tabIndex: -1 },
      content: { type: "text", value: "#" },
    })
    .use(rehypePrettyCode, { theme: "github-light", keepBackground: false })
    .use(rehypeWrapTables)
    .use(rehypeStringify)
    .process(content);

  const { draft: _draft, ...rest } = meta;
  return { ...rest, html: String(file), toc };
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
