'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DocsSearch() {
  const [query, setQuery] = useState('');

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        type="search"
        placeholder="Search documentation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 w-full max-w-md"
      />
    </div>
  );
}
