# blog.keremkurban.site

Kerem Kurban's blog. A static Next.js export deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Add a post

1. Create `content/posts/<slug>.md`. The file name becomes the URL: `/posts/<slug>/`.
2. Start it with frontmatter:

   ```yaml
   ---
   title: "Post title"
   date: 2026-10-15        # yyyy-mm-dd, sets the order on the index
   summary: "One or two sentences shown on the card and in link previews."
   tags: [Agentic AI, Interpretability]
   draft: true             # optional; drafts show in `npm run dev` but not in production
   updated: 2026-11-01     # optional
   ---
   ```

3. Write the body in Markdown (GitHub flavoured: tables, task lists, fenced code with syntax highlighting).
4. Images and diagrams go in `public/posts/<slug>/` and are referenced as `![alt text](/posts/<slug>/file.svg)`.
5. Push to `main`. The index, tag pages, table of contents and RSS feed update automatically.

### House style

Every post must make sense to someone arriving cold, months later:

- `## TL;DR` first: what the post concludes, in two or three sentences.
- `## Introduction` next: where the topic came from, the problem, why it matters, and how to read the rest.
- Then the main sections. Add a `## Glossary` when the post uses specialist terms.

## Run locally

```sh
npm ci
npm run dev          # http://localhost:3000
npm run build        # static site in out/
npm run serve        # serve out/ on http://localhost:4322
```

## Deployment

- Repo settings → Pages → Source: **GitHub Actions**; custom domain `blog.keremkurban.site`.
- DNS at Namecheap: `CNAME blog → keremkurban.github.io.`
- `public/CNAME` keeps the custom domain on every deploy.
