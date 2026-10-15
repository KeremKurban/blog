import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-grounds/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-mocha sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Written in Geneva by <a href={site.home} className="text-latte underline decoration-grounds underline-offset-4 hover:text-crema">{site.name}</a>.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li><a href={site.github} className="hover:text-crema">GitHub</a></li>
          <li><a href={site.linkedin} className="hover:text-crema">LinkedIn</a></li>
          <li><a href={`mailto:${site.email}`} className="hover:text-crema">Email</a></li>
          <li><a href="/feed.xml" className="hover:text-crema">RSS</a></li>
        </ul>
      </div>
    </footer>
  );
}
