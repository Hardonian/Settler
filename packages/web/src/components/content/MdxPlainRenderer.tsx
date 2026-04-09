interface MdxPlainRendererProps {
  source: string;
}

export function MdxPlainRenderer({ source }: MdxPlainRendererProps) {
  const lines = source.split("\n");
  const blocks: Array<{ type: "h1" | "h2" | "h3" | "li" | "p" | "code"; content: string }> = [];

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
        if (block.type === "h1") {
          return (
            <h1
              key={`${block.type}-${index}`}
              className="text-3xl font-bold text-slate-900 dark:text-white"
            >
              {block.content}
            </h1>
          );
        }

        if (block.type === "h2") {
          return (
            <h2
              key={`${block.type}-${index}`}
              className="text-2xl font-semibold text-slate-900 dark:text-white"
            >
              {block.content}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3
              key={`${block.type}-${index}`}
              className="text-xl font-semibold text-slate-900 dark:text-white"
            >
              {block.content}
            </h3>
          );
        }

        if (block.type === "li") {
          return (
            <li
              key={`${block.type}-${index}`}
              className="ml-5 list-disc text-slate-700 dark:text-slate-300"
            >
              {block.content}
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
            {block.content}
          </p>
        );
      })}
    </div>
  );
}
