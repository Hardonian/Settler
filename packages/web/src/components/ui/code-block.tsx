import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
}

const CodeBlock = React.forwardRef<HTMLPreElement, CodeBlockProps>(
  ({ code, language: _language, className, showLineNumbers, highlightLines, ...props }, ref) => {
    const lines = code.split('\n');
    
    return (
      <pre
        ref={ref}
        className={cn(
          'relative w-full overflow-auto rounded-lg border bg-muted p-4',
          className
        )}
        {...props}
      >
        <code className="text-sm font-mono">
          {showLineNumbers ? (
            <div className="flex">
              <div className="select-none pr-4 text-right text-muted-foreground">
                {lines.map((_, i) => (
                  <div key={i} className={highlightLines?.includes(i + 1) ? 'bg-accent' : ''}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={highlightLines?.includes(i + 1) ? 'bg-accent' : ''}
                  >
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            code
          )}
        </code>
      </pre>
    );
  }
);
CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };
