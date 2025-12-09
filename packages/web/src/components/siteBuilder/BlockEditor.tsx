/**
 * Block Editor Component
 * 
 * Placeholder for future visual block editor.
 */

'use client';

import { PageBlock } from '@/domain/siteBuilder/pageSchema';

interface BlockEditorProps {
  block: PageBlock;
  onUpdate: (block: PageBlock) => void;
}

export function BlockEditor(_props: BlockEditorProps) {
  // Future: Visual block editor with drag-and-drop
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Visual block editor coming soon
      </p>
    </div>
  );
}
