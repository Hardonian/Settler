/**
 * Enhanced Rules Engine Component
 * Visual rule builder with templates and preview
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Play, Save } from "lucide-react";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import {
  getApiErrorMessage,
  getGovernanceRecoveryHref,
  parseGovernanceFreezeError,
  type GovernanceFreezeErrorDetails,
} from "@/lib/governance/freeze-client";

interface CustomField {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  sourcePath: string;
  targetPath: string;
}

interface MatchingRule {
  id?: string;
  name: string;
  description?: string;
  ruleType: "exact" | "fuzzy" | "range" | "custom";
  ruleConfig: {
    fields: CustomField[];
    conditions?: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
    compositeOperator?: "AND" | "OR";
    weight?: number;
  };
  customFields?: CustomField[];
  isTemplate?: boolean;
  isActive?: boolean;
}

export function EnhancedRulesEngine() {
  const [rules, setRules] = useState<MatchingRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<MatchingRule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freezeError, setFreezeError] = useState<GovernanceFreezeErrorDetails | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [newField, setNewField] = useState<CustomField>({
    name: "",
    type: "string",
    sourcePath: "",
    targetPath: "",
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/advanced-matching-rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      const data = await res.json();
      setRules(data.data || []);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setSelectedRule({
      name: "",
      description: "",
      ruleType: "exact",
      ruleConfig: {
        fields: [],
        compositeOperator: "AND",
      },
      isActive: true,
    });
  };

  const handleSaveRule = async () => {
    if (!selectedRule || !selectedRule.name) {
      setError("Rule name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFreezeError(null);

      const res = await fetch("/api/v1/advanced-matching-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedRule),
      });

      const payload = (await res.json().catch(() => null)) as unknown;
      const freezeDetails = parseGovernanceFreezeError(payload, res.status);

      if (freezeDetails) {
        setFreezeError(freezeDetails);
        return;
      }

      if (!res.ok) {
        throw new Error(getApiErrorMessage(payload, "Failed to save rule"));
      }

      await fetchRules();
      setSelectedRule(null);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to save rule");
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    if (!selectedRule || !newField.name || !newField.sourcePath || !newField.targetPath) {
      setError("All field properties are required");
      return;
    }

    setSelectedRule({
      ...selectedRule,
      ruleConfig: {
        ...selectedRule.ruleConfig,
        fields: [...selectedRule.ruleConfig.fields, newField],
      },
    });

    setNewField({ name: "", type: "string", sourcePath: "", targetPath: "" });
  };

  const handleTestRule = async () => {
    if (!selectedRule) return;

    try {
      setLoading(true);
      setError(null);
      setFreezeError(null);
      const res = await fetch(`/api/v1/advanced-matching-rules/${selectedRule.id || "test"}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceData: { amount: 100, description: "Test transaction" },
          targetData: { amount: 100, description: "Test transaction" },
        }),
      });

      const payload = (await res.json().catch(() => null)) as unknown;
      const freezeDetails = parseGovernanceFreezeError(payload, res.status);

      if (freezeDetails) {
        setFreezeError(freezeDetails);
        return;
      }

      if (!res.ok) throw new Error(getApiErrorMessage(payload, "Failed to test rule"));
      setTestResult(payload);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to test rule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enhanced Rules Engine</CardTitle>
              <CardDescription>Create and manage custom matching rules</CardDescription>
            </div>
            <Button onClick={handleCreateRule}>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {freezeError ? (
            <FreezeErrorAlert
              reason={freezeError.reason}
              frozenAt={freezeError.frozenAt ?? undefined}
              recoveryAction={{
                label: "Open Governance Controls",
                href: getGovernanceRecoveryHref(),
              }}
            />
          ) : null}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="rules">
            <TabsList>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              {selectedRule && <TabsTrigger value="builder">Rule Builder</TabsTrigger>}
              {selectedRule && <TabsTrigger value="preview">Preview</TabsTrigger>}
            </TabsList>

            <TabsContent value="rules">
              {loading ? (
                <div className="text-center py-8">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No rules found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Fields</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.ruleType}</Badge>
                        </TableCell>
                        <TableCell>{rule.ruleConfig.fields.length} fields</TableCell>
                        <TableCell>
                          {rule.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelectedRule(rule)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="templates">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Rule templates help you quickly create common reconciliation rules.
                </p>
                <p className="text-xs text-muted-foreground">
                  Create custom rules using the Rule Builder tab above.
                </p>
              </div>
            </TabsContent>

            {selectedRule && (
              <>
                <TabsContent value="builder">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rule Builder</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Rule Name</Label>
                        <Input
                          value={selectedRule.name}
                          onChange={(e) =>
                            setSelectedRule({ ...selectedRule, name: e.target.value })
                          }
                          placeholder="Enter rule name"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={selectedRule.description || ""}
                          onChange={(e) =>
                            setSelectedRule({ ...selectedRule, description: e.target.value })
                          }
                          placeholder="Enter description"
                        />
                      </div>

                      <div>
                        <Label>Rule Type</Label>
                        <Select
                          value={selectedRule.ruleType}
                          onValueChange={(value: any) =>
                            setSelectedRule({ ...selectedRule, ruleType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exact">Exact Match</SelectItem>
                            <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
                            <SelectItem value="range">Range Match</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Custom Fields</Label>
                        <div className="space-y-2 border rounded p-4">
                          {selectedRule.ruleConfig.fields.map((field, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Badge>{field.name}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {field.sourcePath} → {field.targetPath}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <Input
                            placeholder="Field name"
                            value={newField.name}
                            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                          />
                          <Select
                            value={newField.type}
                            onValueChange={(value: any) =>
                              setNewField({ ...newField, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">String</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Source path"
                            value={newField.sourcePath}
                            onChange={(e) =>
                              setNewField({ ...newField, sourcePath: e.target.value })
                            }
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Target path"
                              value={newField.targetPath}
                              onChange={(e) =>
                                setNewField({ ...newField, targetPath: e.target.value })
                              }
                            />
                            <Button onClick={handleAddField} size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleSaveRule} disabled={loading}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Rule
                        </Button>
                        <Button variant="outline" onClick={handleTestRule} disabled={loading}>
                          <Play className="h-4 w-4 mr-2" />
                          Test Rule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rule Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {testResult ? (
                        <div className="space-y-4">
                          <div>
                            <div className="font-semibold">Match Result:</div>
                            <Badge variant={testResult.matches ? "default" : "destructive"}>
                              {testResult.matches ? "MATCH" : "NO MATCH"}
                            </Badge>
                          </div>
                          <div>
                            <div className="font-semibold">Confidence:</div>
                            <div>{(testResult.confidence * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="font-semibold">Match Details:</div>
                            <pre className="text-xs bg-muted p-2 rounded">
                              {JSON.stringify(testResult.matchDetails, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Run a test to see preview results
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
