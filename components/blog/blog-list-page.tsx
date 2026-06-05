'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase, type Post } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Therapy', value: 'therapy' },
  { label: 'Mindfulness', value: 'mindfulness' },
  { label: 'Relationships', value: 'relationships' },
  { label: 'Trauma', value: 'trauma' },
  { label: 'Behavior', value: 'behavior' },
  { label: 'Neuroscience', value: 'neuroscience' },
];

export function BlogListPage() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get('category') || '');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false });
    if (category) q = q.eq('category', category);
    const { data } = await q;
    if (data) setPosts(data);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">The Blog</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>Psychology Insights</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">Evidence-based articles on mental health, therapy, mindfulness, and the science of the human mind.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => setCategory(cat.value)} className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all',
              category === cat.value ? 'bg-accent text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}>{cat.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-muted animate-pulse rounded-xl h-80" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No articles in this category yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group card-hover block">
                <article className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
                  <div className="relative h-52 overflow-hidden">
                    {post.cover_image && <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    <Badge className="absolute top-3 left-3 bg-accent text-white border-0 text-xs capitalize">{post.category}</Badge>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags?.slice(0, 2).map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                    </div>
                    <h2 className="font-bold text-lg leading-snug mb-2 line-clamp-2 group-hover:text-accent transition-colors">{post.title}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4 flex-1">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>{post.read_time} min read</span></div>
                      <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
