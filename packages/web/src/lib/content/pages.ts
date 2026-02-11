import fs from "fs";
import path from "path";
import matter from "gray-matter";

function resolveContentDirectory(): string {
  const cwd = process.cwd();
  const directoryCandidates = [
    path.join(cwd, "content/pages"),
    path.join(cwd, "packages/web/content/pages"),
  ];

  for (const directory of directoryCandidates) {
    if (fs.existsSync(directory)) {
      return directory;
    }
  }

  // Fallback keeps behavior deterministic for environments where content is unavailable.
  return directoryCandidates[0] ?? path.join(cwd, "content/pages");
}

const contentDirectory = resolveContentDirectory();

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  content: string;
}

export function getContentPage(slug: string): ContentPage | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || "",
      content,
    };
  } catch {
    return null;
  }
}
