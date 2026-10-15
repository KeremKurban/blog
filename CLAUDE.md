# Blog (blog.keremkurban.site)

Static Next.js export, posts in `content/posts/*.md`. See README.md for frontmatter and commands.

## Rules from Kerem

- Every post is written for a first-time reader who has no memory of the conversation it came from: TL;DR, then Introduction (origin, problem, why it matters, how to read), then main sections, then a Glossary when needed. Never start mid-topic.
- Public content: never name a company Kerem interviewed with, a client, or an employer's internal systems unless he explicitly says to.
- No em dashes in prose.
- Do not publish or change a post's content without his explicit choice.

## Design system

- Light, warm palette in the Claude family. Tokens are named by role in `src/app/globals.css`: paper `#faf9f5` page, surface `#f0eee6` code and chips, rule `#dedcd1` borders, ink `#141413` headings, body `#3d3929` text, muted `#6f6b5e` secondary, accent `#ae4f2c` links and active states (meets 4.5:1), clay `#d97757` decoration only (ring, progress bar, bullets). Never use clay for text.
- Type: Newsreader (serif, titles and body), Instrument Sans (navigation, tags, dates, tables), JetBrains Mono (code only).
- The index is a journal contents page (date in the margin, serif title), not a card grid. The coffee ring behind the homepage title is the one decorative element; don't add more.
- The blog is not limited to one subject. Keep homepage and metadata copy topic-neutral.
- Diagrams in posts use the same hex values (light variants). Code blocks use the `github-light` Shiki theme.
