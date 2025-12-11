"use client";

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageBlock, blockDefaults, PageBlockSchema } from '@/domain/siteBuilder/pageSchema';
import { PageRenderer } from '@/domain/siteBuilder/pageRenderer';
import { updatePageBlocks } from '@/app/actions/admin';
import { Plus, Save, ArrowLeft, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EditorClientProps {
    initialPage: any;
    initialBlocks: PageBlock[];
}

export default function EditorClient({ initialPage, initialBlocks }: EditorClientProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  // Basic metadata state
  const [title, setTitle] = useState(initialPage.metadata?.title || '');

  const addBlock = (type: string) => {
    const newBlock = {
      ...blockDefaults[type],
      id: Math.random().toString(36).substr(2, 9),
    } as PageBlock;
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<PageBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } as PageBlock : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleSave = () => {
      startTransition(async () => {
          const result = await updatePageBlocks(initialPage.id, blocks, { title });
          if (result.success) {
              // Ideally use a toast here
              alert('Saved successfully');
              router.refresh();
          } else {
              alert('Failed to save: ' + result.error);
          }
      });
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Top Bar */}
      <header className="fixed top-0 left-64 right-0 h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
            <Link href="/admin/pages">
                <Button variant="ghost" size="sm">
                    <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
            </Link>
            <div className="flex flex-col">
                <h1 className="font-semibold text-sm">Editing: {initialPage.slug}</h1>
                <span className="text-xs text-slate-500">{isPending ? 'Saving...' : 'Unsaved changes'}</span>
            </div>
        </div>
        <div className="flex gap-2">
             <Link href={`/${initialPage.slug}`} target="_blank">
                <Button variant="outline">Preview Live</Button>
             </Link>
            <Button className="gap-2" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                Save Changes
            </Button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex pt-16 h-full">
        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto bg-white dark:bg-black shadow-lg min-h-[800px] rounded-lg border border-slate-200 dark:border-slate-800 relative">
                <PageRenderer blocks={blocks} className="" />
                
                {/* Overlay for selection */}
                <div className="absolute inset-0 pointer-events-none">
                    {blocks.map((block, index) => (
                        <div 
                            key={block.id}
                            className={`
                                relative group pointer-events-auto
                                ${selectedBlockId === block.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-300'}
                            `}
                            onClick={() => setSelectedBlockId(block.id)}
                        >
                            {/* Block Controls */}
                            <div className={`
                                absolute right-2 top-2 bg-white dark:bg-slate-800 shadow-sm rounded-md border border-slate-200 dark:border-slate-700 p-1 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity
                                ${selectedBlockId === block.id ? 'opacity-100' : ''}
                            `}>
                                <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ArrowUp size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ArrowDown size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }} className="p-1 hover:bg-red-100 text-red-600 rounded"><Trash2 size={14} /></button>
                            </div>
                            
                            {/* Render a transparent overlay to capture clicks reliably */}
                            <div className="absolute inset-0 z-0" />
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
            {selectedBlock ? (
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="font-bold text-lg mb-4 capitalize">{selectedBlock.type} Settings</h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>ID</Label>
                            <Input value={selectedBlock.id} disabled className="bg-slate-50 font-mono text-xs" />
                        </div>

                        {/* Common Fields */}
                        <div className="space-y-2">
                             <Label>Visibility</Label>
                             <div className="flex items-center gap-2">
                                 <input 
                                    type="checkbox" 
                                    checked={selectedBlock.visible !== false}
                                    onChange={(e) => updateBlock(selectedBlock.id, { visible: e.target.checked })}
                                 />
                                 <span className="text-sm">Visible</span>
                             </div>
                        </div>

                        {/* Dynamic fields based on block type - simplistic for now */}
                        {'title' in selectedBlock && (
                             <div className="space-y-2">
                                <Label>Title</Label>
                                <Input 
                                    value={(selectedBlock as any).title || ''} 
                                    onChange={(e) => updateBlock(selectedBlock.id, { title: e.target.value })} 
                                />
                             </div>
                        )}
                         {'subtitle' in selectedBlock && (
                             <div className="space-y-2">
                                <Label>Subtitle</Label>
                                <Input 
                                    value={(selectedBlock as any).subtitle || ''} 
                                    onChange={(e) => updateBlock(selectedBlock.id, { subtitle: e.target.value })} 
                                />
                             </div>
                        )}
                        {'description' in selectedBlock && (
                             <div className="space-y-2">
                                <Label>Description</Label>
                                <Input 
                                    value={(selectedBlock as any).description || ''} 
                                    onChange={(e) => updateBlock(selectedBlock.id, { description: e.target.value })} 
                                />
                             </div>
                        )}
                        {'code' in selectedBlock && (
                             <div className="space-y-2">
                                <Label>Code</Label>
                                <textarea 
                                    className="w-full min-h-[100px] p-2 border rounded font-mono text-xs"
                                    value={(selectedBlock as any).code || ''} 
                                    onChange={(e) => updateBlock(selectedBlock.id, { code: e.target.value })} 
                                />
                             </div>
                        )}
                        
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                             <Button variant="destructive" size="sm" onClick={() => removeBlock(selectedBlock.id)} className="w-full">
                                Remove Block
                             </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-6 text-center text-slate-500 flex flex-col items-center justify-center">
                    <div className="mb-4">
                        <Label>Page Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                    </div>
                    <p>Select a block to edit properties</p>
                </div>
            )}

            {/* Block Toolbox */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Add Block</h4>
                <div className="grid grid-cols-2 gap-2">
                    {['hero', 'featureGrid', 'pricingTable', 'ctaBanner', 'faq', 'stats', 'footer', 'codeExample', 'twoColumnText'].map(type => (
                        <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)} className="text-xs justify-start px-2 capitalize">
                            <Plus size={12} className="mr-1" /> {type.replace(/([A-Z])/g, ' $1').trim()}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
