'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase, type Post } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.from('posts').select('*').eq('published', true).or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`).order('created_at', { ascending: false }).limit(20);
    if (data) setResults(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (q) doSearch(q);
  }, [searchParams, doSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
    doSearch(query);
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">Search</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>Find Articles</h1>
          <p className="text-muted-foreground text-lg">Search through our library of psychology articles.</p>
        </div>

        <form onSubmit={handleSubmit} className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles, topics, tags..." className="w-full h-14 pl-12 pr-24 rounded-xl border-2 border-border bg-card text-base focus:outline-none focus:border-accent transition-colors" />
          <button type="submit" className="absolute right-2 top-2 bottom-2 px-5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">Search</button>
        </form>

        {loading && <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}</div>}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No articles found for &quot;{query}&quot;. Try different keywords.</div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-5">{results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;</p>
            <div className="space-y-4">
              {results.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group card-hover block">
                  <div className="bg-card border border-border rounded-xl p-5 flex gap-5">
                    {post.cover_image && (
                      <div className="hidden sm:block w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-accent text-white border-0 text-xs capitalize">{post.category}</Badge>
                      </div>
                      <h3 className="font-semibold text-base line-clamp-2 mb-1 group-hover:text-accent transition-colors">{post.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" /><span>{post.read_time} min read</span>
                        <span>·</span>
                        <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!searched && <div className="text-center py-16 text-muted-foreground">Start typing to search psychology articles...</div>}
      </div>
    </div>
  );
}
