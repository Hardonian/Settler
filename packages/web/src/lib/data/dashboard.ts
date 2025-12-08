/**
 * Dashboard Data Access
 * 
 * Centralized functions for fetching dashboard-related data.
 * These functions are pure data access - no React hooks, no state management.
 */

import { createClient } from '@/lib/supabase/server';
import { getExternalMetrics } from '@/lib/api/external';

export interface DashboardMetrics {
  newUsersWeek: number;
  actionsLastHour: number;
  topPostEngagement: number;
  topPostTitle: string;
  totalPosts: number;
  totalProfiles: number;
  allCylindersFiring: boolean;
}

export interface KpiHealthData {
  new_users_week: number;
  actions_last_hour: number;
  top_post_engagement: number;
  all_cylinders_firing: boolean;
}

export interface TopPost {
  id: string;
  title: string;
  views: number;
  upvotes: number;
}

/**
 * Fetch dashboard metrics from Supabase
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // Fetch KPI health data using RPC function (with fallback)
  let kpiData: KpiHealthData | null = null;
  try {
    const result = await supabase.rpc('get_kpi_health_status').single() as {
      data: KpiHealthData | null;
      error: any;
    };
    if (result.data) {
      kpiData = result.data;
    }
  } catch (err) {
    console.warn('RPC function not available, using fallback queries:', err);
  }

  // Fetch recent activity count
  let recentActivityCount = 0;
  try {
    const { count } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    recentActivityCount = count || 0;
  } catch (err) {
    console.warn('Error fetching activity count:', err);
  }

  // Fetch new users this week
  let newUsersCount = 0;
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    newUsersCount = count || 0;
  } catch (err) {
    console.warn('Error fetching new users count:', err);
  }

  // Fetch most engaged post
  let topPost: TopPost | null = null;
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, views, upvotes')
      .eq('status', 'published')
      .gte('created_at', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(10);

    if (posts && posts.length > 0) {
      const typedPosts = posts as TopPost[];
      topPost = typedPosts.reduce<TopPost>((max, post) => {
        const engagement = (post.views || 0) + (post.upvotes || 0) * 2;
        const maxEngagement = (max.views || 0) + (max.upvotes || 0) * 2;
        return engagement > maxEngagement ? post : max;
      }, typedPosts[0]);
    }
  } catch (err) {
    console.warn('Error fetching posts:', err);
  }

  // Fetch total posts count
  let totalPosts = 0;
  try {
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    totalPosts = count || 0;
  } catch (err) {
    console.warn('Error fetching total posts:', err);
  }

  // Fetch total profiles count
  let totalProfiles = 0;
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    totalProfiles = count || 0;
  } catch (err) {
    console.warn('Error fetching total profiles:', err);
  }

  return {
    newUsersWeek: newUsersCount,
    actionsLastHour: recentActivityCount,
    topPostEngagement: topPost ? (topPost.views || 0) + (topPost.upvotes || 0) * 2 : 0,
    topPostTitle: topPost?.title || 'No posts today yet',
    totalPosts,
    totalProfiles,
    allCylindersFiring: kpiData?.all_cylinders_firing ?? false,
  };
}

/**
 * Fetch external metrics (GitHub, NPM)
 */
export async function getExternalMetricsData() {
  try {
    return await getExternalMetrics();
  } catch (err) {
    console.warn('Failed to fetch external metrics:', err);
    return {
      github: {
        stars: 0,
        forks: 0,
        watchers: 0,
        openIssues: 0,
        lastUpdated: new Date().toISOString(),
      },
      npm: {
        downloads: 0,
        version: '0.0.0',
        lastUpdated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
