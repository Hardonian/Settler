/**
 * Content Provider
 * 
 * Provides content from Supabase with local fallback.
 * Never throws - always returns content (even if degraded).
 */

import { createClient } from '@/lib/supabase/server';
import { safeAsync } from '@/lib/safe';

export interface ContentItem {
  slug: string;
  title: string;
  body_md?: string;
  description_md?: string;
  updated_at?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CookbookItem extends ContentItem {
  steps_md?: string;
  category?: string;
  difficulty?: string;
  timeToImplement?: string;
}

export interface RunbookItem extends ContentItem {
  steps_md?: string;
  severity?: string;
}

export interface SchematicItem extends ContentItem {
  mermaid_md?: string;
}

/**
 * Content provider that tries Supabase first, falls back to local content
 */
export class ContentProvider {
  private supabaseTimeout = 5000; // 5 second timeout
  
  /**
   * Get content from Supabase with timeout and fallback
   */
  async getContent<T extends ContentItem>(
    table: 'public_content' | 'public_cookbook' | 'public_runbooks' | 'public_schematics',
    slug?: string,
    fallback: T[] = []
  ): Promise<T[]> {
    // Try Supabase fetch with timeout
    const supabaseResult = await safeAsync(async () => {
      const supabase = await createClient();
      
      const query = supabase.from(table).select('*');
      
      if (slug) {
        query.eq('slug', slug);
      }
      
      // Race against timeout
      const result = await Promise.race([
        query,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Content fetch timeout')), this.supabaseTimeout)
        ),
      ]);
      
      if (result.error) {
        throw result.error;
      }
      
      return (result.data || []) as T[];
    });
    
    if (supabaseResult.ok && supabaseResult.data.length > 0) {
      return supabaseResult.data;
    }
    
    // Fallback to local content
    return fallback;
  }
  
  /**
   * Get single content item
   */
  async getContentItem<T extends ContentItem>(
    table: 'public_content' | 'public_cookbook' | 'public_runbooks' | 'public_schematics',
    slug: string,
    fallback?: T
  ): Promise<T | null> {
    const items = await this.getContent<T>(table, slug, fallback ? [fallback] : []);
    return items[0] || null;
  }
  
  /**
   * Get all cookbook items
   */
  async getCookbookItems(fallback: CookbookItem[] = []): Promise<CookbookItem[]> {
    return this.getContent<CookbookItem>('public_cookbook', undefined, fallback);
  }
  
  /**
   * Get all runbook items
   */
  async getRunbookItems(fallback: RunbookItem[] = []): Promise<RunbookItem[]> {
    return this.getContent<RunbookItem>('public_runbooks', undefined, fallback);
  }
  
  /**
   * Get all schematic items
   */
  async getSchematicItems(fallback: SchematicItem[] = []): Promise<SchematicItem[]> {
    return this.getContent<SchematicItem>('public_schematics', undefined, fallback);
  }
}

// Singleton instance
export const contentProvider = new ContentProvider();
