'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Eye, FileText, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';

interface AnalyticsStat {
  totalVisitors: number;
  totalPageViews: number;
  totalSessions: number;
  mostViewedPosts: Array<{ id: string; title: string; slug: string; views: number }>;
  dailyTraffic: Array<{ date: string; views: number }>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStat>({
    totalVisitors: 0,
    totalPageViews: 0,
    totalSessions: 0,
    mostViewedPosts: [],
    dailyTraffic: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30);

        const [
          { data: events, error: eventsError },
          { data: sessions, error: sessionsError },
          { data: posts, error: postsError },
        ] = await Promise.all([
          supabase
            .from('analytics_events')
            .select('*')
            .gte('created_at', thirtyDaysAgo.toISOString()),
          supabase
            .from('analytics_sessions')
            .select('*')
            .gte('created_at', thirtyDaysAgo.toISOString()),
          supabase
            .from('posts')
            .select('id, title, slug, view_count')
            .eq('published', true)
            .order('view_count', { ascending: false })
            .limit(5),
        ]);

        const uniqueVisitors = new Set((events || []).map((e) => e.user_session_id)).size;
        const pageViews = (events || []).filter((e) => e.event_type === 'page_view').length;
        const uniqueSessions = (sessions || []).length;

        const dailyViews: Record<string, number> = {};
        (events || []).forEach((event) => {
          const date = format(new Date(event.created_at), 'MMM dd');
          dailyViews[date] = (dailyViews[date] || 0) + 1;
        });

        const dailyTraffic = Object.entries(dailyViews)
          .map(([date, views]) => ({ date, views }))
          .sort((a, b) => new Date(`2024 ${a.date}`).getTime() - new Date(`2024 ${b.date}`).getTime());

        setStats({
          totalVisitors: uniqueVisitors,
          totalPageViews: pageViews,
          totalSessions: uniqueSessions,
          mostViewedPosts: (posts || []).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            views: p.view_count || 0,
          })),
          dailyTraffic,
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
      setLoading(false);
    }

    loadAnalytics();
  }, []);

  const cards = [
    {
      title: 'Total Visitors',
      value: stats.totalVisitors,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Page Views',
      value: stats.totalPageViews,
      icon: Eye,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Sessions',
      value: stats.totalSessions,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground text-sm">Last 30 days overview</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          {cards.map(({ title, value, icon: Icon, color }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold mb-1">{loading ? '-' : value}</div>
              <div className="font-medium text-sm text-muted-foreground">{title}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Most Viewed Posts</h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stats.mostViewedPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {stats.mostViewedPosts.map((post, idx) => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm line-clamp-1">{post.title}</div>
                        <div className="text-xs text-muted-foreground">{post.slug}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-accent font-semibold">
                      <Eye className="w-4 h-4" />
                      {post.views}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Traffic</h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stats.dailyTraffic.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data yet</p>
            ) : (
              <div className="space-y-2">
                {stats.dailyTraffic.slice(-7).map((day) => {
                  const maxViews = Math.max(...stats.dailyTraffic.map((d) => d.views), 1);
                  const percentage = (day.views / maxViews) * 100;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="w-16 text-xs text-muted-foreground">{day.date}</div>
                      <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-accent/50 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right font-medium text-sm">{day.views}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
