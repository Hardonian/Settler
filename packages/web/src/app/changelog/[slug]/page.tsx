import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getChangelogPost, getAllChangelogPosts } from "@/lib/changelog";
import { notFound } from "next/navigation";
import { MdxPlainRenderer } from "@/components/content/MdxPlainRenderer";
import { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getChangelogPost(params.slug);
  if (!post) {
    return { title: "Not Found" };
  }
  return {
    title: `${post.title} - Changelog`,
    description: post.description,
  };
}

export async function generateStaticParams() {
  const posts = getAllChangelogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default function ChangelogPostPage({ params }: Props) {
  const post = getChangelogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <AnimatedPageWrapper aria-label={post.title}>
      <Navigation />
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[{ label: "Changelog", href: "/changelog" }, { label: post.title }]}
          />
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <time
            dateTime={post.date}
            className="text-sm text-slate-500 dark:text-slate-400 mb-2 block"
          >
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">{post.title}</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">{post.description}</p>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <MdxPlainRenderer source={post.content} />
        </div>
      </article>
      <Footer />
    </AnimatedPageWrapper>
  );
}
