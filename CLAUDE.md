# Blog (blog.keremkurban.site)

Static Next.js export, posts in `content/posts/*.md`. See README.md for frontmatter and commands.

## Rules from Kerem

- Every post is written for a first-time reader who has no memory of the conversation it came from: TL;DR, then Introduction (origin, problem, why it matters, how to read), then main sections, then a Glossary when needed. Never start mid-topic.
- Public content: never name a company Kerem interviewed with, a client, or an employer's internal systems unless he explicitly says to.
- No em dashes in prose.
- Do not publish or change a post's content without his explicit choice.

## Design system

- Coffee palette, tokens in `src/app/globals.css`: espresso `#1b1410` page, roast `#261c16` surfaces, grounds `#3d2e24` rules, milk `#f2e6d8` headings, latte `#d8c6b2` body, mocha `#a8927d` secondary, crema `#e3ab6a` the only accent.
- Type: Newsreader (serif, titles and body), Instrument Sans (navigation, tags, dates, tables), JetBrains Mono (code only).
- The index is a journal contents page (date in the margin, serif title), not a card grid. The coffee ring behind the homepage title is the one decorative element; don't add more.
- Diagrams in posts use the same hex values. Code blocks use the `gruvbox-dark-medium` Shiki theme.
