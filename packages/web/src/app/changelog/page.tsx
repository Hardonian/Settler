import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getAllChangelogPosts } from "@/lib/changelog";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Latest updates and improvements to the Settler API.",
};

export default function ChangelogPage() {
  const posts = getAllChangelogPosts();

  return (
    <AnimatedPageWrapper aria-label="Changelog page">
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: "Changelog" }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Changelog</h1>
        <div className="space-y-12">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="relative flex flex-col gap-4 border-l pl-8 border-slate-200 dark:border-slate-800 pb-8 last:pb-0"
            >
              <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-white bg-slate-300 dark:border-slate-900 dark:bg-slate-700" />
              <div className="flex flex-col gap-1">
                <time dateTime={post.date} className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  <Link
                    href={`/changelog/${post.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {post.title}
                  </Link>
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 max-w-2xl">{post.description}</p>
              <Link
                href={`/changelog/${post.slug}`}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline w-fit"
              >
                Read more &rarr;
              </Link>
            </article>
          ))}
          {posts.length === 0 && <p className="text-slate-500">No updates yet.</p>}
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
