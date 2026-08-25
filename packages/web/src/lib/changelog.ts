import fs from "fs";
import path from "path";
import { parseFrontmatter } from "./content/frontmatter";

function resolveContentDirectory(): string {
  const cwd = process.cwd();
  const directoryCandidates = [
    path.join(cwd, "content/changelog"),
    path.join(cwd, "packages/web/content/changelog"),
  ];

  for (const directory of directoryCandidates) {
    if (fs.existsSync(directory)) {
      return directory;
    }
  }

  return directoryCandidates[0] ?? path.join(cwd, "content/changelog");
}

const contentDirectory = resolveContentDirectory();

export interface ChangelogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  author: string;
  content: string;
  image?: string;
}

export function getAllChangelogPosts(): ChangelogPost[] {
  // Ensure directory exists
  if (!fs.existsSync(contentDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(contentDirectory);
  const allPostsData = fileNames
    .filter((fileName: string) => fileName.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(contentDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = parseFrontmatter<Record<string, any>>(fileContents);

      return {
        slug,
        content,
        title: (data.title as string) || slug,
        date: (data.date as string) || "",
        description: (data.description as string) || "",
        author: (data.author as string) || "Settler Team",
        image: data.image as string | undefined,
      } as ChangelogPost;
    });

  // Sort posts by date descending
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getChangelogPost(slug: string): ChangelogPost | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = parseFrontmatter<Record<string, any>>(fileContents);

    return {
      slug,
      content,
      title: (data.title as string) || slug,
      date: (data.date as string) || "",
      description: (data.description as string) || "",
      author: (data.author as string) || "Settler Team",
      image: data.image as string | undefined,
    } as ChangelogPost;
  } catch {
    return null;
  }
}
