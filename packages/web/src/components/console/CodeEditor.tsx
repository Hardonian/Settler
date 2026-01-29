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

// Note: Syntax highlighting is currently disabled for better performance
// In production, consider using a library like Prism.js or highlight.js for advanced highlighting

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
    } catch (error: unknown) {
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
    <div className={cn('relative border rounded-lg bg-slate-900 dark:bg-slate-950 border-slate-700 dark:border-slate-800 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300 dark:text-slate-400 uppercase leading-[1.5]">{language}</span>
          {showLineNumbers && (
            <span className="text-xs text-slate-400 dark:text-slate-500 leading-[1.5]">{lineCount} lines</span>
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
            className="absolute left-0 top-0 bottom-0 w-12 bg-slate-950 dark:bg-black border-r border-slate-700 dark:border-slate-800 text-right text-xs text-slate-400 dark:text-slate-500 py-3 font-mono select-none leading-[1.5]"
            aria-hidden="true"
          >
            {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
              <div key={i} className="px-2 leading-[1.5]">
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
              } catch (error: unknown) {
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
            'w-full h-full bg-transparent text-slate-100 dark:text-slate-200 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 dark:focus:ring-offset-slate-950',
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
