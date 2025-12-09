/**
 * Navigation Editor
 * 
 * Edit tenant navigation: header and footer items.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { TenantNavigationItem } from '@/shared/tenant/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NavigationEditorPage() {
  const router = useRouter();
  const [navItems, setNavItems] = useState<TenantNavigationItem[]>([]);
  const [footerItems, setFooterItems] = useState<TenantNavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNavigation();
  }, []);

  async function loadNavigation() {
    try {
      const response = await fetch('/api/console/site/navigation');
      if (!response.ok) throw new Error('Failed to load navigation');
      const data = await response.json();
      setNavItems(data.navigation?.navItems || []);
      setFooterItems(data.navigation?.footerItems || []);
    } catch (error) {
      console.error('Error loading navigation:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch('/api/console/site/navigation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          navItems,
          footerItems,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save navigation');
      }

      alert('Navigation saved successfully');
    } catch (error) {
      console.error('Error saving navigation:', error);
      alert(error instanceof Error ? error.message : 'Failed to save navigation');
    } finally {
      setSaving(false);
    }
  }

  function handleAddItem(type: 'nav' | 'footer') {
    const newItem: TenantNavigationItem = {
      label: 'New Item',
      href: '/',
      type: 'internal',
    };
    
    if (type === 'nav') {
      setNavItems([...navItems, newItem]);
    } else {
      setFooterItems([...footerItems, newItem]);
    }
  }

  function handleUpdateItem(
    type: 'nav' | 'footer',
    index: number,
    updates: Partial<TenantNavigationItem>
  ) {
    if (type === 'nav') {
      const updated = [...navItems];
      const existing = updated[index];
      if (existing) {
        updated[index] = { ...existing, ...updates } as TenantNavigationItem;
        setNavItems(updated);
      }
    } else {
      const updated = [...footerItems];
      const existing = updated[index];
      if (existing) {
        updated[index] = { ...existing, ...updates } as TenantNavigationItem;
        setFooterItems(updated);
      }
    }
  }

  function handleDeleteItem(type: 'nav' | 'footer', index: number) {
    if (type === 'nav') {
      setNavItems(navItems.filter((_, i) => i !== index));
    } else {
      setFooterItems(footerItems.filter((_, i) => i !== index));
    }
  }

  // Removed unused function _handleMoveItem

  function renderItemEditor(
    item: TenantNavigationItem,
    index: number,
    type: 'nav' | 'footer'
  ) {
    return (
      <Card key={index} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <GripVertical className="w-5 h-5 text-slate-400 mt-2 cursor-move" />
            <div className="flex-1 space-y-4">
              <div>
                <Label>Label</Label>
                <Input
                  value={item.label}
                  onChange={(e) => handleUpdateItem(type, index, { label: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Link</Label>
                <Input
                  value={item.href}
                  onChange={(e) => handleUpdateItem(type, index, { href: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={item.type}
                  onValueChange={(value) =>
                    handleUpdateItem(type, index, { type: value as 'internal' | 'external' })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteItem(type, index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading navigation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/console/site')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Navigation
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage header and footer navigation items
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Header Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Header Navigation</CardTitle>
                <CardDescription>Main navigation menu items</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddItem('nav')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {navItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No navigation items. Add one to get started.
              </p>
            ) : (
              navItems.map((item, index) => renderItemEditor(item, index, 'nav'))
            )}
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Footer Navigation</CardTitle>
                <CardDescription>Footer link items</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddItem('footer')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {footerItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No footer items. Add one to get started.
              </p>
            ) : (
              footerItems.map((item, index) => renderItemEditor(item, index, 'footer'))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
