/**
 * Rules Editor Component
 * UX-009: Visual rules builder with AI-powered suggestions and preview
 * Future-forward: Drag-and-drop interface, AI rule generation, real-time impact analysis
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Play, TrendingUp, AlertCircle, CheckCircle2 } from '@/lib/lucide-react';
import { MatchingRule } from '@settler/types';

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  rules: MatchingRule[];
  estimatedAccuracy: number;
  estimatedMatchRate: number;
  useCase: string;
}

interface PreviewResult {
  wouldMatch: boolean;
  confidence: number;
  breakdown: Array<{ rule: string; score: number }>;
  factors: { exactMatches: number; fuzzyMatches: number; rangeMatches: number };
  recommendations: string[];
}

interface ImpactAnalysis {
  estimatedMatchRate: number;
  estimatedAccuracy: number;
  performanceImpact?: {
    executionTime?: string;
    complexity?: string;
  };
  recommendations?: string[];
}

export function RulesEditor({ jobId }: { jobId?: string }) {
  const [rules, setRules] = useState<MatchingRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [_selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<MatchingRule[]>([]);

  useEffect(() => {
    loadTemplates();
    loadAISuggestions();
  }, [jobId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/rules/templates');
      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadAISuggestions = async () => {
    try {
      const response = await fetch('/api/v1/rules/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();
      setAiSuggestions(data.data?.suggestions?.[0]?.rules || []);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setRules(template.rules);
      setSelectedTemplate(templateId);
    }
  };

  const addRule = () => {
    setRules([...rules, { field: 'transactionId', type: 'exact' }]);
  };

  const updateRule = (index: number, updates: Partial<MatchingRule>) => {
    const updated = [...rules];
    const currentRule = updated[index];
    if (!currentRule) return;
    
    const mergedRule: MatchingRule = {
      field: updates.field !== undefined ? updates.field : currentRule.field,
      type: updates.type !== undefined ? updates.type : currentRule.type,
    };
    if (updates.tolerance !== undefined) {
      mergedRule.tolerance = updates.tolerance;
    } else if (currentRule.tolerance !== undefined) {
      mergedRule.tolerance = currentRule.tolerance;
    }
    if (updates.threshold !== undefined) {
      mergedRule.threshold = updates.threshold;
    } else if (currentRule.threshold !== undefined) {
      mergedRule.threshold = currentRule.threshold;
    }
    updated[index] = mergedRule;
    setRules(updated);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const previewRules = async () => {
    try {
      const response = await fetch('/api/v1/rules/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules,
          sampleData: {
            source: { order_id: '12345', amount: 99.99, date: '2026-01-15T10:00:00Z' },
            target: { order_id: '12345', amount: 99.99, date: '2026-01-15T10:01:00Z' },
          },
        }),
      });
      const data = await response.json();
      setPreviewResult(data.data?.insights || null);
    } catch (error) {
      console.error('Failed to preview rules:', error);
    }
  };

  const analyzeImpact = async () => {
    try {
      const response = await fetch('/api/v1/rules/analyze-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      const data = await response.json();
      setImpactAnalysis(data.data?.impact || null);
    } catch (error) {
      console.error('Failed to analyze impact:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Matching Rules</h2>
          <p className="text-muted-foreground">Configure how transactions are matched</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAISuggestions}>
            <Sparkles className="w-4 h-4 mr-2" />
            AI Suggestions
          </Button>
          <Button onClick={previewRules}>
            <Play className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={analyzeImpact}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Analyze Impact
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Rule Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No rules configured. Add a rule or select a template to get started.</p>
                  <Button onClick={addRule} className="mt-4">
                    Add Rule
                  </Button>
                </div>
              ) : (
                rules.map((rule, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-3">
                        <Label>Field</Label>
                        <Input
                          value={rule.field}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRule(index, { field: e.target.value })}
                          placeholder="transaction_id"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Type</Label>
                        <Select
                          value={rule.type}
                          onValueChange={(value: string) => updateRule(index, { type: value as MatchingRule['type'] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exact">Exact</SelectItem>
                            <SelectItem value="fuzzy">Fuzzy</SelectItem>
                            <SelectItem value="range">Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {rule.type === 'exact' && (
                        <div className="col-span-2">
                          <Label>Tolerance</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={rule.tolerance?.amount || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = parseFloat(e.target.value);
                              const updates: Partial<MatchingRule> = {};
                              if (!isNaN(value)) {
                                updates.tolerance = { amount: value };
                              }
                              updateRule(index, updates);
                            }}
                            placeholder="0.01"
                          />
                        </div>
                      )}
                      {rule.type === 'fuzzy' && (
                        <div className="col-span-2">
                          <Label>Threshold</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={rule.threshold || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = parseFloat(e.target.value);
                              const updates: Partial<MatchingRule> = {};
                              if (!isNaN(value)) {
                                updates.threshold = value;
                              }
                              updateRule(index, updates);
                            }}
                            placeholder="0.85"
                          />
                        </div>
                      )}
                      {rule.type === 'range' && (
                        <div className="col-span-2">
                          <Label>Days</Label>
                          <Input
                            type="number"
                            value={rule.tolerance?.days || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const value = parseInt(e.target.value);
                              const updates: Partial<MatchingRule> = {};
                              if (!isNaN(value)) {
                                updates.tolerance = { days: value };
                              }
                              updateRule(index, updates);
                            }}
                            placeholder="1"
                          />
                        </div>
                      )}
                      <div className="col-span-1">
                        <Button variant="destructive" size="sm" onClick={() => removeRule(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
              <Button variant="outline" onClick={addRule}>
                + Add Rule
              </Button>
            </CardContent>
          </Card>

          {previewResult && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {previewResult.wouldMatch ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-semibold">
                      {previewResult.wouldMatch ? 'Would Match' : 'Would Not Match'}
                    </span>
                    <Badge variant="secondary">
                      {(previewResult.confidence * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Breakdown</h4>
                    <div className="space-y-1">
                      {previewResult.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{b.rule}</span>
                          <span>{(b.score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {previewResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {previewResult.recommendations.map((r, i) => (
                          <li key={i} className="text-sm text-muted-foreground">{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {impactAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Match Rate</p>
                    <p className="text-2xl font-bold">{(impactAnalysis.estimatedMatchRate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Accuracy</p>
                    <p className="text-2xl font-bold">{(impactAnalysis.estimatedAccuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Performance Impact</p>
                    <p className="text-lg">{impactAnalysis.performanceImpact?.executionTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Complexity</p>
                    <Badge>{impactAnalysis.performanceImpact?.complexity}</Badge>
                  </div>
                </div>
                {impactAnalysis.recommendations && impactAnalysis.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {impactAnalysis.recommendations.map((r, i) => (
                        <li key={i} className="text-sm">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:border-primary" onClick={() => applyTemplate(template.id)}>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy:</span>
                      <Badge>{(template.estimatedAccuracy * 100).toFixed(0)}%</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Match Rate:</span>
                      <Badge variant="secondary">{(template.estimatedMatchRate * 100).toFixed(0)}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{template.useCase}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI-Powered Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiSuggestions.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Based on your adapter configuration, here are optimized rules:
                  </p>
                  <div className="space-y-2">
                    {aiSuggestions.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Badge>{rule.type}</Badge>
                        <span className="font-mono text-sm">{rule.field}</span>
                        {rule.tolerance?.amount && <span className="text-xs text-muted-foreground">±{rule.tolerance.amount}</span>}
                        {rule.tolerance?.days && <span className="text-xs text-muted-foreground">±{rule.tolerance.days}d</span>}
                        {rule.threshold && <span className="text-xs text-muted-foreground">≥{rule.threshold}</span>}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRules([...rules, rule])}
                          className="ml-auto"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No AI suggestions available. Configure your job first.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
