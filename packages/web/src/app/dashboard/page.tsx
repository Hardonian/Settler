/**
 * Public Dashboard - "Loud & High" Metrics Display
 * 
 * Shows real-time aggregated social proof metrics from Supabase
 * Acts as "smoke signals" of a live, active ecosystem
 */

import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import { Activity, Users, TrendingUp, MessageSquare, Zap, Target, Github, Package } from 'lucide-react';
import { getExternalMetrics } from '@/lib/api/external';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

// Server Component: Fetch metrics from Supabase
async function DashboardMetrics() {
  try {
    const supabase = await createClient();
    
    // Fetch external metrics (GitHub, NPM) - with error handling
    let externalMetrics;
    try {
      externalMetrics = await getExternalMetrics();
    } catch (err) {
      console.warn('Failed to fetch external metrics:', err);
      externalMetrics = {
        github: { stars: 0, forks: 0, watchers: 0, openIssues: 0, lastUpdated: new Date().toISOString() },
        npm: { downloads: 0, version: '0.0.0', lastUpdated: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch KPI data using RPC function (with error handling)
    type KpiHealthData = { new_users_week: number; actions_last_hour: number; top_post_engagement: number; all_cylinders_firing: boolean };
    let kpiData: KpiHealthData | null = null;
    try {
      const result = await supabase.rpc('get_kpi_health_status').single() as { data: KpiHealthData | null; error: any };
      if (result.data) {
        kpiData = result.data;
      }
      if (result.error) {
        console.warn('RPC function error:', result.error);
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

    // Fetch most engaged post (using raw SQL calculation)
    let topPost: { id: string; title: string; views: number; upvotes: number } | null = null;
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, views, upvotes')
        .eq('status', 'published')
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Calculate engagement and find top post
      if (posts && posts.length > 0) {
        const typedPosts = posts as Array<{ id: string; title: string; views: number; upvotes: number }>;
        const firstPost = typedPosts[0];
        if (firstPost) {
          type PostType = { id: string; title: string; views: number; upvotes: number };
          const result: PostType = typedPosts.reduce<PostType>((max: PostType, post: PostType) => {
            const engagement = (post.views || 0) + (post.upvotes || 0) * 2;
            const maxEngagement = (max.views || 0) + (max.upvotes || 0) * 2;
            return engagement > maxEngagement ? post : max;
          }, firstPost);
          topPost = result;
        }
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

    const metrics = {
      newUsersWeek: newUsersCount,
      actionsLastHour: recentActivityCount,
      topPostEngagement: topPost ? (topPost.views || 0) + (topPost.upvotes || 0) * 2 : 0,
      topPostTitle: topPost?.title || 'No posts today yet',
      totalPosts: totalPosts,
      totalProfiles: totalProfiles,
      allCylindersFiring: kpiData?.all_cylinders_firing ?? false,
    };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-electric-cyan dark:via-electric-purple dark:to-electric-blue bg-clip-text text-transparent">
            Ecosystem Dashboard
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300">
            Real-time metrics from our living system
          </p>
        </div>

        {/* Status Badge */}
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
            metrics.allCylindersFiring
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-2 border-yellow-500'
          }`}>
            {metrics.allCylindersFiring ? (
              <>
                <Zap className="w-5 h-5" />
                Status: Loud and High ✓
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Status: Building Momentum
              </>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <MetricCard
            icon={Users}
            title="New Users This Week"
            value={metrics.newUsersWeek}
            threshold={50}
            description="Community members who joined in the last 7 days"
            passed={metrics.newUsersWeek > 50}
          />
          <MetricCard
            icon={Activity}
            title="Actions Last Hour"
            value={metrics.actionsLastHour}
            threshold={100}
            description="User interactions tracked in the past hour"
            passed={metrics.actionsLastHour > 100}
          />
          <MetricCard
            icon={TrendingUp}
            title="Top Post Engagement"
            value={metrics.topPostEngagement}
            threshold={100}
            description="Most engaged post today (views + upvotes)"
            passed={metrics.topPostEngagement > 100}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-electric-cyan" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Total Published Posts
              </h3>
            </div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {metrics.totalPosts}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Community content across all categories
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-indigo-600 dark:text-electric-purple" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Total Community Members
              </h3>
            </div>
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {metrics.totalProfiles}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Active profiles in the ecosystem
            </p>
          </div>
        </div>

        {/* Top Post Highlight */}
        {topPost && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700 mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Most Engaged Post Today
            </h3>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2">
              {topPost.title}
            </p>
            <div className="flex gap-6 text-sm text-slate-600 dark:text-slate-400">
              <span>{topPost.views || 0} views</span>
              <span>{topPost.upvotes || 0} upvotes</span>
              <span className="font-semibold">{metrics.topPostEngagement} total engagement</span>
            </div>
          </div>
        )}

        {/* External API Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Github className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                GitHub Repository
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Stars</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {externalMetrics.github.stars.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Forks</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {externalMetrics.github.forks.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Open Issues</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {externalMetrics.github.openIssues.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              Data from GitHub API (with demo fallback if unavailable)
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                NPM Package
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Version</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {externalMetrics.npm.version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Downloads</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {externalMetrics.npm.downloads.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              Data from NPM Registry API (with demo fallback if unavailable)
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
    );
  } catch (error) {
    console.error('Error in DashboardMetrics:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Error loading dashboard metrics
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }
}

function MetricCard({
  icon: Icon,
  title,
  value,
  threshold,
  description,
  passed,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  value: number;
  threshold: number;
  description: string;
  passed: boolean;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border-2 ${
      passed
        ? 'border-green-500 dark:border-green-400'
        : 'border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`w-6 h-6 ${
          passed
            ? 'text-green-600 dark:text-green-400'
            : 'text-slate-600 dark:text-slate-400'
        }`} />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
      <p className={`text-4xl font-bold mb-2 ${
        passed
          ? 'text-green-600 dark:text-green-400'
          : 'text-slate-900 dark:text-white'
      }`}>
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
        {description}
      </p>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          passed ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Target: {threshold.toLocaleString()} {passed ? '✓' : '(in progress)'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading dashboard metrics...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <DashboardMetrics />
    </Suspense>
  );
}
