/**
 * Code Generator Component
 * 
 * Generates code snippets from API calls in multiple languages.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';
import { generateAllCodeSnippets, CodeSnippet, ApiCall } from '@/lib/playground/code-generator';

interface CodeGeneratorProps {
  apiCall: ApiCall;
  apiKey: string;
}

export function CodeGenerator({ apiCall, apiKey }: CodeGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const snippets = generateAllCodeSnippets(apiCall, apiKey);

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(language);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Code</CardTitle>
        <CardDescription>
          Copy code snippets for your preferred language
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={snippets[0]?.language}>
          <TabsList className="grid w-full grid-cols-4">
            {snippets.map((snippet) => (
              <TabsTrigger key={snippet.language} value={snippet.language}>
                {snippet.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {snippets.map((snippet) => (
            <TabsContent key={snippet.language} value={snippet.language}>
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-sm">
                  <code>{snippet.code}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(snippet.code, snippet.language)}
                >
                  {copied === snippet.language ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
