import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content/pages');

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  content: string;
}

export function getContentPage(slug: string): ContentPage | null {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || '',
      content,
    };
  } catch (error) {
    return null;
  }
}
