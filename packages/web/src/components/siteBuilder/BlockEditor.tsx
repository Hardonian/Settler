/**
 * Block Editor Component
 *
 * Placeholder for future visual block editor.
 */

"use client";

import { PageBlock } from "@/domain/siteBuilder/pageSchema";

interface BlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function BlockEditor(_props: BlockEditorProps) {
  // Visual block editor - use JSON editor for now
  return (
    <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
        Edit block configuration using the JSON editor or form fields.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Visual drag-and-drop editor will be available in a future update.
      </p>
    </div>
  );
}
