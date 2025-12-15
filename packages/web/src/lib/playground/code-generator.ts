/**
 * Code Generator for API Playground
 * 
 * Generates code snippets from API calls:
 * - TypeScript/JavaScript
 * - Python
 * - cURL
 * - Go
 */

export interface CodeSnippet {
  language: string;
  code: string;
  label: string;
}

export interface ApiCall {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Generate TypeScript/JavaScript code
 */
export function generateTypeScriptCode(apiCall: ApiCall, apiKey: string): string {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...apiCall.headers,
  };

  const headersString = Object.entries(headers)
    .map(([key, value]) => `    '${key}': '${value}'`)
    .join(',\n');

  if (apiCall.method === 'GET') {
    return `import { SettlerClient } from '@settler/sdk';

const client = new SettlerClient({
  apiKey: '${apiKey}',
});

const result = await client.${getMethodName(apiCall.endpoint)}(${
      apiCall.body ? JSON.stringify(apiCall.body, null, 2) : ''
    });

console.log(result);`;
  }

  const bodyString = apiCall.body
    ? `,\n  body: ${JSON.stringify(apiCall.body, null, 2)}`
    : '';

  return `const response = await fetch('${apiCall.endpoint}', {
  method: '${apiCall.method}',
  headers: {
${headersString}
  }${bodyString}
});

const data = await response.json();
console.log(data);`;
}

/**
 * Generate Python code
 */
export function generatePythonCode(apiCall: ApiCall, apiKey: string): string {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...apiCall.headers,
  };

  const headersString = Object.entries(headers)
    .map(([key, value]) => `    '${key}': '${value}'`)
    .join(',\n');

  const bodyString = apiCall.body
    ? `,\n    json=${JSON.stringify(apiCall.body, null, 2)}`
    : '';

  return `import requests

response = requests.${apiCall.method.toLowerCase()}(
    '${apiCall.endpoint}',
    headers={
${headersString}
    }${bodyString}
)

print(response.json())`;
}

/**
 * Generate cURL code
 */
export function generateCurlCode(apiCall: ApiCall, apiKey: string): string {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...apiCall.headers,
  };

  const headersString = Object.entries(headers)
    .map(([key, value]) => `-H '${key}: ${value}'`)
    .join(' \\\n  ');

  const bodyString = apiCall.body
    ? ` \\\n  -d '${JSON.stringify(apiCall.body)}'`
    : '';

  return `curl -X ${apiCall.method} \\
  '${apiCall.endpoint}' \\
  ${headersString}${bodyString}`;
}

/**
 * Generate Go code
 */
export function generateGoCode(apiCall: ApiCall, apiKey: string): string {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...apiCall.headers,
  };

  const bodyString = apiCall.body
    ? `\n\tbody, _ := json.Marshal(${JSON.stringify(apiCall.body)})\n\treq, _ := http.NewRequest("${apiCall.method}", "${apiCall.endpoint}", bytes.NewBuffer(body))`
    : `\n\treq, _ := http.NewRequest("${apiCall.method}", "${apiCall.endpoint}", nil)`;

  return `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
${bodyString}
\treq.Header.Set("Content-Type", "application/json")
\treq.Header.Set("x-api-key", "${apiKey}")

\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()

\tvar result map[string]interface{}
\tjson.NewDecoder(resp.Body).Decode(&result)
\tfmt.Println(result)
}`;
}

/**
 * Generate all code snippets for an API call
 */
export function generateAllCodeSnippets(
  apiCall: ApiCall,
  apiKey: string
): CodeSnippet[] {
  return [
    {
      language: 'typescript',
      label: 'TypeScript',
      code: generateTypeScriptCode(apiCall, apiKey),
    },
    {
      language: 'python',
      label: 'Python',
      code: generatePythonCode(apiCall, apiKey),
    },
    {
      language: 'curl',
      label: 'cURL',
      code: generateCurlCode(apiCall, apiKey),
    },
    {
      language: 'go',
      label: 'Go',
      code: generateGoCode(apiCall, apiKey),
    },
  ];
}

/**
 * Get method name from endpoint (for SDK methods)
 */
function getMethodName(endpoint: string): string {
  if (endpoint.includes('/reconcile')) return 'reconcile';
  if (endpoint.includes('/receipts')) return 'receipts.parse';
  if (endpoint.includes('/feature-flags')) return 'featureFlags.evaluate';
  return 'request';
}
