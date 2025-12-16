/**
 * Feature Flags Policy Component
 * 
 * UI for managing feature flags as business policy controls.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle2, Save, RotateCcw } from 'lucide-react';
import type { FlagValue } from '@/lib/domain/types';
import { FLAG_REGISTRY, getFlagsByScope } from '@/lib/flags/registry';

export function FeatureFlagsPolicy() {
  const [flags, setFlags] = useState<FlagValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Map<string, boolean | number | string>>(new Map());

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/console/feature-flags');

      if (!res.ok) {
        throw new Error(`Failed to fetch flags: ${res.status}`);
      }

      const data = await res.json();
      setFlags(data.flags || []);
    } catch (err) {
      console.error('Failed to fetch feature flags:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagChange = (key: string, value: boolean | number | string) => {
    setChanges(new Map(changes.set(key, value)));
  };

  const saveFlag = async (key: string) => {
    const value = changes.get(key);
    if (value === undefined) return;

    try {
      setSaving(key);
      setError(null);

      const res = await fetch('/api/console/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save flag: ${res.status}`);
      }

      // Remove from changes
      const newChanges = new Map(changes);
      newChanges.delete(key);
      setChanges(newChanges);

      // Refresh flags
      await fetchFlags();
    } catch (err) {
      console.error('Failed to save feature flag:', err);
      setError(err instanceof Error ? err.message : 'Failed to save feature flag');
    } finally {
      setSaving(null);
    }
  };

  const resetToDefault = (key: string) => {
    const flagDef = FLAG_REGISTRY[key];
    if (!flagDef) return;

    handleFlagChange(key, flagDef.default);
  };

  const getFlagValue = (key: string): boolean | number | string | Record<string, unknown> => {
    const flag = flags.find((f) => f.key === key);
    if (flag) {
      // Check if there's a pending change
      if (changes.has(key)) {
        return changes.get(key)!;
      }
      return flag.value;
    }
    return FLAG_REGISTRY[key]?.default ?? false;
  };

  const tenantFlags = getFlagsByScope('tenant');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading feature flags...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchFlags}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  // Group flags by category
  const flagsByCategory: Record<string, typeof tenantFlags> = {};
  for (const flag of tenantFlags) {
    const category = flag.key.split('.')[0];
    if (!flagsByCategory[category]) {
      flagsByCategory[category] = [];
    }
    flagsByCategory[category].push(flag);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Feature Flags
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Manage business policy controls (alert thresholds, sensitivity, export permissions).
          </p>
        </div>
        <Button onClick={fetchFlags} variant="outline">
          Refresh
        </Button>
      </div>

      {Object.entries(flagsByCategory).map(([category, categoryFlags]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
            <CardDescription>
              {categoryFlags.length} policy control{categoryFlags.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categoryFlags.map((flagDef) => {
                const currentValue = getFlagValue(flagDef.key);
                const hasChanges = changes.has(flagDef.key);
                const isDefault = !hasChanges && currentValue === flagDef.default;

                return (
                  <div key={flagDef.key} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="font-semibold">{flagDef.key}</Label>
                        {isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {hasChanges && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-800">
                            Changed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {flagDef.description}
                      </p>

                      {/* Boolean Flag */}
                      {flagDef.type === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={currentValue as boolean}
                            onCheckedChange={(checked) => handleFlagChange(flagDef.key, checked)}
                          />
                          <span className="text-sm">
                            {currentValue ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      )}

                      {/* Number Flag */}
                      {flagDef.type === 'number' && (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={currentValue as number}
                            onChange={(e) =>
                              handleFlagChange(flagDef.key, parseFloat(e.target.value) || 0)
                            }
                            min={flagDef.validation?.min}
                            max={flagDef.validation?.max}
                            className="w-48"
                          />
                          {flagDef.validation && (
                            <p className="text-xs text-slate-500">
                              Range: {flagDef.validation.min ?? '0'} - {flagDef.validation.max ?? '∞'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* String Flag */}
                      {flagDef.type === 'string' && (
                        <div>
                          {flagDef.validation?.enum ? (
                            <Select
                              value={currentValue as string}
                              onValueChange={(value) => handleFlagChange(flagDef.key, value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {flagDef.validation.enum.map((option) => (
                                  <SelectItem key={String(option)} value={String(option)}>
                                    {String(option)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type="text"
                              value={currentValue as string}
                              onChange={(e) => handleFlagChange(flagDef.key, e.target.value)}
                              className="w-48"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {hasChanges && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetToDefault(flagDef.key)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveFlag(flagDef.key)}
                            disabled={saving === flagDef.key}
                          >
                            {saving === flagDef.key ? (
                              <>
                                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-white"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {tenantFlags.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-600 dark:text-slate-400">No feature flags configured</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
