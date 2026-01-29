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
import { Copy, Check, AlertCircle } from 'lucide-react';
import { generateAllCodeSnippets, ApiCall } from '@/lib/playground/code-generator';

interface CodeGeneratorProps {
  apiCall: ApiCall;
  apiKey: string;
}

export function CodeGenerator({ apiCall, apiKey }: CodeGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null);

  // Validate inputs
  if (!apiKey || !apiKey.startsWith('rk_')) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Please create an API key to generate code snippets.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  let snippets;
  try {
    snippets = generateAllCodeSnippets(apiCall, apiKey);
  } catch (error: unknown) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm">Failed to generate code. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(language);
      setTimeout(() => setCopied(null), 2000);
    } catch (error: unknown) {
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
