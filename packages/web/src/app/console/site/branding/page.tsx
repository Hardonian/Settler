/**
 * Branding Editor
 * 
 * Edit tenant branding: colors, fonts, logos.
 * Uses the existing token system for color management.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { COLOR_PRESETS, isValidColor } from '@/lib/tenant/colorTokens';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TenantBranding {
  id?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  borderRadiusScale?: number | null;
  fontFamilyPrimary?: string | null;
  fontFamilySecondary?: string | null;
}

const FONT_PRESETS = [
  { name: 'Inter (Default)', value: 'Inter, sans-serif' },
  { name: 'System', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
] as const;

export default function BrandingEditorPage() {
  const router = useRouter();
  const [branding, setBranding] = useState<TenantBranding>({
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    accentColor: '#06b6d4',
    backgroundColor: '#ffffff',
    borderRadiusScale: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  async function loadBranding() {
    try {
      const response = await fetch('/api/console/site/branding');
      if (!response.ok) throw new Error('Failed to load branding');
      const data = await response.json();
      if (data.branding) {
        setBranding(data.branding);
      }
    } catch {
      console.error('Error loading branding:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    // Validate colors
    if (!isValidColor(branding.primaryColor)) {
      alert('Invalid primary color format');
      return;
    }
    if (!isValidColor(branding.secondaryColor)) {
      alert('Invalid secondary color format');
      return;
    }
    if (!isValidColor(branding.accentColor)) {
      alert('Invalid accent color format');
      return;
    }
    if (!isValidColor(branding.backgroundColor)) {
      alert('Invalid background color format');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/console/site/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save branding');
      }

      alert('Branding saved successfully');
      await loadBranding();
    } catch {
      console.error('Error saving branding:', error);
      alert(error instanceof Error ? error.message : 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  }

  function handleColorChange(field: keyof TenantBranding, value: string | number) {
    setBranding(prev => ({ ...prev, [field]: value }));
  }

  function handlePresetSelect(preset: typeof COLOR_PRESETS[number], field: 'primaryColor' | 'secondaryColor' | 'accentColor') {
    setBranding(prev => ({ ...prev, [field]: preset.value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading branding...</p>
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
              Branding
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Customize your site's colors, fonts, and logos
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Set your brand colors. These integrate with the existing design token system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Primary Color */}
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="w-16 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      placeholder="#2563eb"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PRESETS.filter(p => p.category === 'primary').map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset, 'primaryColor')}
                      className="w-8 h-8 rounded border-2 border-transparent hover:border-slate-400"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      className="w-16 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                      placeholder="#7c3aed"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PRESETS.filter(p => p.category === 'secondary').map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset, 'secondaryColor')}
                      className="w-8 h-8 rounded border-2 border-transparent hover:border-slate-400"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <Label>Accent Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="w-16 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      placeholder="#06b6d4"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PRESETS.filter(p => p.category === 'accent').map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset, 'accentColor')}
                      className="w-8 h-8 rounded border-2 border-transparent hover:border-slate-400"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <Label>Background Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      className="w-16 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.backgroundColor}
                      onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Border Radius Scale */}
              <div>
                <Label>Border Radius Scale: {branding.borderRadiusScale ?? 1.0}</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={branding.borderRadiusScale ?? 1.0}
                  onChange={(e) => handleColorChange('borderRadiusScale', parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Adjusts the border radius of buttons, cards, and other rounded elements
                </p>
              </div>

              {/* Color Preview */}
              <div className="p-4 border rounded-lg space-y-2">
                <p className="text-sm font-medium">Preview</p>
                <div className="flex gap-2">
                  <div
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: branding.secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: branding.accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Choose font families for your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Font</Label>
                <select
                  value={branding.fontFamilyPrimary || FONT_PRESETS[0].value}
                  onChange={(e) => handleColorChange('fontFamilyPrimary', e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                >
                  {FONT_PRESETS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Secondary Font</Label>
                <select
                  value={branding.fontFamilySecondary || FONT_PRESETS[0].value}
                  onChange={(e) => handleColorChange('fontFamilySecondary', e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                >
                  {FONT_PRESETS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Favicon</CardTitle>
              <CardDescription>
                Upload your brand assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={branding.logoUrl || ''}
                  onChange={(e) => handleColorChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Full URL to your logo image
                </p>
              </div>
              <div>
                <Label>Favicon URL</Label>
                <Input
                  value={branding.faviconUrl || ''}
                  onChange={(e) => handleColorChange('faviconUrl', e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Full URL to your favicon (16x16 or 32x32 recommended)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
