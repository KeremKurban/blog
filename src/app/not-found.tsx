export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">That page is not here</h1>
      <p className="mt-3 text-muted">It may have moved, or the link has a typo.</p>
      <a href="/" className="mt-8 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:bg-accent-strong">
        Back to all posts
      </a>
    </div>
  );
}
