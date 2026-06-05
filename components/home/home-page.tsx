'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Post, type Book } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Gamepad2, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: featured }, { data: recent }, { data: books }] = await Promise.all([
        supabase.from('posts').select('*').eq('published', true).eq('featured', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('posts').select('*').eq('published', true).order('created_at', { ascending: false }).limit(6),
        supabase.from('books').select('*').eq('featured', true).limit(3),
      ]);
      if (featured) setFeaturedPosts(featured);
      if (recent) setRecentPosts(recent);
      if (books) setFeaturedBooks(books);
    }
    load();
  }, []);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    await supabase.from('newsletter_subscribers').insert({ email });
    setSubscribed(true);
    setEmail('');
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center pt-16 overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1600')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 backdrop-blur-sm text-xs uppercase tracking-widest font-medium">Psychology & Mental Wellness</Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white dark:text-white leading-[1.08] mb-8" style={{ fontFamily: 'var(--font-playfair)' }}>
              Understand<br />Your Mind.<br /><span className="text-accent">Transform</span> Your Life.
            </h1>
            <p className="text-lg sm:text-xl text-white/65 dark:text-white/65 leading-relaxed mb-10 max-w-xl">
              Evidence-based psychology articles, interactive memory training, and expertly curated books.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/blog">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white gap-2 h-12 px-7">Read the Blog <ArrowRight className="w-4 h-4" /></Button>
              </Link>
              <Link href="/games">
                <Button size="lg" variant="outline" className="border-white/25 text-white hover:bg-white/10 hover:text-white gap-2 h-12 px-7"><Brain className="w-4 h-4" /> Play Memory Games</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: '120+', label: 'Articles Published' },
              { num: '50K+', label: 'Monthly Readers' },
              { num: '12', label: 'Memory Games' },
              { num: '200+', label: 'Books Curated' },
            ].map(({ num, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-white">{num}</div>
                <div className="text-white/70 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-accent text-sm font-medium uppercase tracking-widest mb-2">Editor's Picks</p>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>Featured Articles</h2>
            </div>
            <Link href="/blog" className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredPosts.map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className={cn('group block card-hover', i === 0 && 'lg:col-span-2')}>
                <article className="bg-card border border-border rounded-xl overflow-hidden h-full">
                  <div className={cn('relative overflow-hidden', i === 0 ? 'h-64 lg:h-80' : 'h-48')}>
                    {post.cover_image && (
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Badge className="absolute top-4 left-4 bg-accent text-white border-0 text-xs capitalize">{post.category}</Badge>
                  </div>
                  <div className="p-6">
                    <h3 className={cn('font-bold leading-tight mb-3 group-hover:text-accent transition-colors', i === 0 ? 'text-xl lg:text-2xl' : 'text-lg')}>{post.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.read_time} min read</span>
                      <span className="text-border">·</span>
                      <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Games CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-primary via-primary/80 to-primary dark:from-slate-900 dark:to-slate-800 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-12 lg:p-16 flex flex-col justify-center">
              <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                <Gamepad2 className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white dark:text-white mb-5 leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>Train Your Memory with Psychology Games</h2>
              <p className="text-white/60 dark:text-white/60 text-lg mb-8 leading-relaxed">Sharpen your cognitive abilities through science-backed memory exercises.</p>
              <Link href="/games">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white gap-2 w-fit">Start Playing <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </div>
            <div className="relative min-h-[320px] lg:min-h-0" style={{ backgroundImage: `url('https://images.pexels.com/photos/5428832/pexels-photo-5428832.jpeg?auto=compress&cs=tinysrgb&w=800')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/60 dark:from-slate-900/60 to-transparent lg:bg-gradient-to-l" />
            </div>
          </div>
        </div>
      </section>

      {/* Books */}
      {featuredBooks.length > 0 && (
        <section className="bg-muted/40 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-accent text-sm font-medium uppercase tracking-widest mb-2">Bookstore</p>
                <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>Essential Reads</h2>
              </div>
              <Link href="/bookstore" className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors">Browse all <ChevronRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredBooks.map((book) => (
                <Link key={book.id} href={`/bookstore`} className="group card-hover block">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="relative h-56 overflow-hidden">
                      <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary" className="text-xs capitalize mb-3">{book.category}</Badge>
                      <h3 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-accent transition-colors">{book.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-accent text-lg">${book.price}</span>
                        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white"><BookOpen className="w-3.5 h-3.5 mr-1.5" /> Buy Now</Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Weekly Psychology Insights</h2>
          <p className="text-muted-foreground text-lg mb-8">Join 12,000+ readers who receive evidence-based psychology insights every Thursday.</p>
          {subscribed ? (
            <div className="bg-accent/10 text-accent rounded-xl px-8 py-6 font-medium">You're subscribed! Welcome to the community.</div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 h-12 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-white h-12 px-6">Subscribe</Button>
            </form>
          )}
          <p className="text-muted-foreground text-xs mt-4">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  );
}
