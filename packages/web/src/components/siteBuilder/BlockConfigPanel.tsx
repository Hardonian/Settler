/**
 * Block Configuration Panel
 * 
 * Form for editing block properties.
 */

'use client';

import { useState } from 'react';
import { PageBlock } from '@/domain/siteBuilder/pageSchema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BlockConfigPanelProps {
  block: PageBlock;
  onUpdate: (updates: Partial<PageBlock>) => void;
}

export function BlockConfigPanel({ block, onUpdate }: BlockConfigPanelProps) {
  const [localBlock, setLocalBlock] = useState(block);

  function handleFieldChange(field: string, value: unknown) {
    const updated = { ...localBlock, [field]: value };
    setLocalBlock(updated);
    onUpdate({ [field]: value });
  }

  function handleNestedFieldChange(path: string[], value: unknown) {
    const updated = { ...localBlock };
    let current: any = updated;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === undefined) continue;
      current = current[key] = { ...current[key] };
    }
    const lastKey = path[path.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
    setLocalBlock(updated);
    onUpdate(updated);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{block.type} Block</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Common Fields */}
          <div>
            <Label>Block ID</Label>
            <Input value={block.id} disabled className="mt-1" />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              checked={block.visible !== false}
              onCheckedChange={(checked) => handleFieldChange('visible', checked)}
            />
            <Label>Visible</Label>
          </div>

          {/* Type-specific fields */}
          {block.type === 'hero' && (
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="cta">CTAs</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
              </TabsList>
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={block.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={block.subtitle || ''}
                    onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={block.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </TabsContent>
              <TabsContent value="cta" className="space-y-4">
                <div>
                  <Label>Primary CTA Label</Label>
                  <Input
                    value={block.primaryCta?.label || ''}
                    onChange={(e) => handleNestedFieldChange(['primaryCta', 'label'], e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Primary CTA Link</Label>
                  <Input
                    value={block.primaryCta?.href || ''}
                    onChange={(e) => handleNestedFieldChange(['primaryCta', 'href'], e.target.value)}
                    className="mt-1"
                  />
                </div>
              </TabsContent>
              <TabsContent value="style" className="space-y-4">
                <div>
                  <Label>Alignment</Label>
                  <select
                    value={block.alignment || 'center'}
                    onChange={(e) => handleFieldChange('alignment', e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div>
                  <Label>Background Gradient</Label>
                  <Input
                    value={block.backgroundGradient || ''}
                    onChange={(e) => handleFieldChange('backgroundGradient', e.target.value)}
                    className="mt-1"
                    placeholder="linear-gradient(...)"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {block.type === 'featureGrid' && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={block.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={block.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Columns</Label>
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={block.columns || 3}
                  onChange={(e) => handleFieldChange('columns', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Features ({block.features?.length || 0})</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure features in the block JSON editor.
                </p>
              </div>
            </div>
          )}

          {block.type === 'ctaBanner' && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={block.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={block.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Primary CTA Label</Label>
                <Input
                  value={block.primaryCta.label}
                  onChange={(e) => handleNestedFieldChange(['primaryCta', 'label'], e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Primary CTA Link</Label>
                <Input
                  value={block.primaryCta.href}
                  onChange={(e) => handleNestedFieldChange(['primaryCta', 'href'], e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Add more block type editors as needed */}
        </CardContent>
      </Card>
    </div>
  );
}
