'use client';

import Link from 'next/link';
import { type Post } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Props { post: Post; related: Post[]; }

export function BlogPost({ post, related }: Props) {
  return (
    <div className="pt-20 pb-20">
      <div className="relative h-80 sm:h-[480px] overflow-hidden">
        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-24 relative">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 shadow-sm mb-12">
          <div className="flex flex-wrap gap-2 mb-5">
            <Badge className="bg-accent text-white border-0 capitalize">{post.category}</Badge>
            {post.tags?.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>{post.title}</h1>
          <p className="text-muted-foreground text-xl leading-relaxed mb-8 border-l-4 border-accent pl-5">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground pb-8 mb-8 border-b border-border">
            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{format(new Date(post.created_at), 'MMMM d, yyyy')}</span></div>
            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{post.read_time} min read</span></div>
          </div>
          <div className="prose-custom" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {related.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group card-hover block">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {r.cover_image && (
                      <div className="h-36 overflow-hidden">
                        <img src={r.cover_image} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-accent transition-colors">{r.title}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><Clock className="w-3 h-3" /> {r.read_time} min</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
