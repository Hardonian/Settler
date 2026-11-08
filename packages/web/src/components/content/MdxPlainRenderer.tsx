import type { ReactNode } from "react";

interface MdxPlainRendererProps {
  source: string;
}

function formatLatexExpression(expr: string): string {
  return expr
    .replace(/\\sum/g, "∑")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\le\b/g, "≤")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\times\b/g, "×")
    .replace(/\\to\b/g, "→")
    .replace(/\s+/g, " ")
    .trim();
}

export function renderInlineMarkdown(text: string): ReactNode[] {
  const tokenRegex = /(\$(?:[^$]+)\$|`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts
    .filter((part) => part.length > 0)
    .map((part, idx) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const inner = formatLatexExpression(part.slice(1, -1));
        return (
          <code
            key={`math-${idx}`}
            className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-sm font-medium text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
          >
            {inner}
          </code>
        );
      }

      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={`code-${idx}`}
            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={`bold-${idx}`} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={`link-${idx}`}
            href={linkMatch[2]}
            className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
          >
            {linkMatch[1]}
          </a>
        );
      }

      return part;
    });
}

export function MdxPlainRenderer({ source }: MdxPlainRendererProps) {
  const lines = source.split("\n");
  const blocks: Array<{
    type: "h1" | "h2" | "h3" | "li" | "p" | "code" | "hr";
    content: string;
  }> = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({ type: "code", content: codeBuffer.join("\n") });
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed === "---" || trimmed === "***") {
      blocks.push({ type: "hr", content: "" });
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", content: trimmed.replace(/^###\s+/, "") });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", content: trimmed.replace(/^##\s+/, "") });
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", content: trimmed.replace(/^#\s+/, "") });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      blocks.push({ type: "li", content: trimmed.replace(/^-\s+/, "") });
      continue;
    }

    blocks.push({ type: "p", content: trimmed });
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "hr") {
          return <hr key={`hr-${index}`} className="my-6 border-slate-200 dark:border-slate-800" />;
        }

        if (block.type === "h1") {
          return (
            <h1
              key={`${block.type}-${index}`}
              className="text-3xl font-bold text-slate-900 dark:text-white"
            >
              {renderInlineMarkdown(block.content)}
            </h1>
          );
        }

        if (block.type === "h2") {
          return (
            <h2
              key={`${block.type}-${index}`}
              className="text-2xl font-semibold text-slate-900 dark:text-white"
            >
              {renderInlineMarkdown(block.content)}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3
              key={`${block.type}-${index}`}
              className="text-xl font-semibold text-slate-900 dark:text-white"
            >
              {renderInlineMarkdown(block.content)}
            </h3>
          );
        }

        if (block.type === "li") {
          return (
            <li
              key={`${block.type}-${index}`}
              className="ml-5 list-disc text-slate-700 dark:text-slate-300"
            >
              {renderInlineMarkdown(block.content)}
            </li>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={`${block.type}-${index}`}
              className="overflow-x-auto rounded-md bg-slate-900 p-4 text-sm text-slate-100 dark:bg-slate-950"
            >
              <code>{block.content}</code>
            </pre>
          );
        }

        return (
          <p key={`${block.type}-${index}`} className="text-slate-700 dark:text-slate-300">
            {renderInlineMarkdown(block.content)}
          </p>
        );
      })}
    </div>
  );
}
