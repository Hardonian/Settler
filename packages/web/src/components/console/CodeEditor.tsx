/**
 * Code Editor Component
 * 
 * A syntax-highlighted code editor for the console playground.
 * Uses a lightweight editor implementation with syntax highlighting.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Download, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: 'json' | 'javascript' | 'typescript' | 'python' | 'bash' | 'yaml';
  readOnly?: boolean;
  height?: string;
  showLineNumbers?: boolean;
  placeholder?: string;
  onRun?: () => void;
  isRunning?: boolean;
  className?: string;
}

// Syntax highlighting function - reserved for future use if needed
// Currently using plain textarea for better performance
// In production, consider using a library like Prism.js or highlight.js for advanced highlighting
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _syntaxHighlight = (_code: string, _language: string): string => {
  // Simple syntax highlighting using regex
  if (_language === 'json') {
    return _code
      .replace(/"([^"]+)":/g, '<span class="text-blue-400">"$1":</span>')
      .replace(/: "([^"]+)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="text-purple-400">$1</span>');
  }
  
  if (_language === 'javascript' || _language === 'typescript') {
    return _code
      .replace(/(const|let|var|function|async|await|return|if|else|for|while|import|from|export)/g, '<span class="text-purple-400">$1</span>')
      .replace(/("([^"]+)"|'([^']+)')/g, '<span class="text-green-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-slate-500">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500">$1</span>');
  }
  
  if (_language === 'bash') {
    return _code
      .replace(/(curl|wget|echo|export|set)/g, '<span class="text-blue-400">$1</span>')
      .replace(/(-[a-zA-Z]+|--[a-z-]+)/g, '<span class="text-yellow-400">$1</span>')
      .replace(/("([^"]+)"|'([^']+)')/g, '<span class="text-green-400">$1</span>');
  }
  
  return _code;
};

export function CodeEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  height = '400px',
  showLineNumbers = true,
  placeholder = 'Enter code...',
  onRun,
  isRunning = false,
  className,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    if (value) {
      setLineCount(value.split('\n').length);
    }
  }, [value]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'python' ? 'py' : language === 'bash' ? 'sh' : 'json'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('relative border rounded-lg bg-slate-900 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase">{language}</span>
          {showLineNumbers && (
            <span className="text-xs text-slate-500">{lineCount} lines</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRun && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRun}
              disabled={isRunning}
              className="h-7 text-xs"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Run
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-7 text-xs"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative" style={{ height }}>
        {showLineNumbers && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-12 bg-slate-950 border-r border-slate-700 text-right text-xs text-slate-500 py-3 font-mono select-none"
            aria-hidden="true"
          >
            {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
              <div key={i} className="px-2">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            // Auto-validate JSON if language is JSON
            if (language === 'json' && e.target.value.trim()) {
              try {
                JSON.parse(e.target.value);
                // Valid JSON - could add visual indicator
              } catch {
                // Invalid JSON - could add visual indicator
              }
            }
          }}
          onKeyDown={(e) => {
            // Handle Tab key for indentation
            if (e.key === 'Tab' && !readOnly) {
              e.preventDefault();
              const textarea = e.currentTarget;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const newValue = value.substring(0, start) + '  ' + value.substring(end);
              onChange?.(newValue);
              // Restore cursor position
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 2;
              }, 0);
            }
          }}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn(
            'w-full h-full bg-transparent text-slate-100 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900',
            showLineNumbers && 'pl-16',
            readOnly && 'cursor-default'
          )}
          style={{ 
            tabSize: 2,
            lineHeight: '1.5',
          }}
          spellCheck={false}
          aria-label={`Code editor for ${language}`}
          aria-readonly={readOnly}
        />
      </div>
    </div>
  );
}
