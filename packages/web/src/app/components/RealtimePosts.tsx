/**
 * Real-time Posts Component
 * 
 * Uses Supabase Realtime Subscriptions to display live post updates
 * All frontend display is backed by table queries - no static data
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, TrendingUp, Eye } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  views: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export function RealtimePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const supabase = createClient();

      // Check if supabase client is valid
      if (!supabase || typeof supabase.from !== 'function') {
        console.warn('Supabase client not available');
        setIsLoading(false);
        return;
      }

      // Initial fetch
      const fetchPosts = async () => {
        try {
          const { data, error } = await supabase
            .from('posts')
            .select('id, title, views, upvotes, downvotes, created_at')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) {
            console.error('Error fetching posts:', error);
          } else {
            setPosts(data || []);
          }
        } catch (err) {
          console.error('Error in fetchPosts:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPosts();

      // Subscribe to real-time changes
      try {
        const channel = supabase
          .channel('posts-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'posts',
              filter: 'status=eq.published',
            },
            (payload) => {
              console.log('Post change received:', payload);
              
              if (payload.eventType === 'INSERT') {
                setPosts((prev) => [payload.new as Post, ...prev].slice(0, 10));
              } else if (payload.eventType === 'UPDATE') {
                setPosts((prev) =>
                  prev.map((post) =>
                    post.id === payload.new.id ? (payload.new as Post) : post
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setPosts((prev) => prev.filter((post) => post.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        return () => {
          try {
            supabase.removeChannel(channel);
          } catch (err) {
            console.error('Error removing channel:', err);
          }
        };
      } catch (err) {
        console.error('Error setting up realtime subscription:', err);
        return () => {};
      }
    } catch (err) {
      console.error('Error initializing Supabase client:', err);
      setIsLoading(false);
      return () => {};
    }
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">No posts yet. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-electric-cyan" />
        Recent Posts (Live)
      </h3>
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
        >
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
            {post.title}
          </h4>
          <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.views} views
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {post.upvotes} upvotes
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
