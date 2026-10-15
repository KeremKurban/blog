export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
      <h1 className="font-serif text-[2.4rem] font-medium tracking-tight text-milk">This page doesn't exist</h1>
      <p className="mt-3 max-w-[50ch] text-latte">The link may have a typo, or the post moved. Every post is listed on the front page.</p>
      <a href="/" className="mt-8 inline-block rounded-sm bg-crema px-4 py-2 text-sm font-medium text-espresso hover:bg-crema-strong">
        Go to all posts
      </a>
    </div>
  );
}
