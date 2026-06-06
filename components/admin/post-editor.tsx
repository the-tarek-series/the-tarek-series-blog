'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Post } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const CATEGORIES = ['therapy', 'mindfulness', 'relationships', 'trauma', 'behavior', 'neuroscience', 'general'];

interface Props { mode: 'create' | 'edit'; postId?: string; }

function slugify(text: string) { return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export function PostEditor({ mode, postId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', cover_image: '', category: 'general', tags: '',
    published: false, featured: false, read_time: 5,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');

  useEffect(() => {
    if (mode === 'edit' && postId) {
      supabase.from('posts').select('*').eq('id', postId).maybeSingle().then(({ data }) => {
        if (data) {
          const post = data as Post;
          setForm({
            title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
            cover_image: post.cover_image, category: post.category, tags: post.tags?.join(', ') || '',
            published: post.published, featured: post.featured, read_time: post.read_time,
          });
        }
        setLoading(false);
      });
    }
  }, [mode, postId]);

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: mode === 'create' ? slugify(title) : f.slug }));
  }

  async function handleSave(publish?: boolean) {
    if (!form.title || !form.slug) { toast.error('Title and slug are required.'); return; }
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      published: publish !== undefined ? publish : form.published,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (mode === 'create') {
      ({ error } = await supabase.from('posts').insert(payload));
    } else {
      ({ error } = await supabase.from('posts').update(payload).eq('id', postId!));
    }

    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); } else {
      toast.success(mode === 'create' ? 'Post created!' : 'Post updated!');
      router.push('/admin/posts');
    }
  }

  if (loading) return <div className="pt-24 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin/posts" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-2xl font-bold">{mode === 'create' ? 'New Post' : 'Edit Post'}</h1>
          </div>
          <div className="flex gap-3">
            {!form.published && <Button onClick={() => handleSave(false)} variant="outline" disabled={saving} className="gap-2"><Save className="w-4 h-4" /> Save Draft</Button>}
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-accent hover:bg-accent/90 text-white gap-2">
              <Eye className="w-4 h-4" /> {form.published ? 'Update' : 'Publish'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-base font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Post title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full h-10 px-4 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="post-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Excerpt</label>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                placeholder="Brief summary..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Content (HTML)</label>
              <textarea
                rows={18}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                placeholder="<h2>Introduction</h2><p>Content...</p>"
              />
              <p className="text-muted-foreground text-xs mt-1">Supports HTML. Use &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;blockquote&gt;.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Settings</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                <input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="https://images.pexels.com/..."
                />
                {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 rounded-lg h-24 w-full object-cover" />}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="CBT, therapy, mindfulness"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Read Time (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={form.read_time}
                  onChange={(e) => setForm({ ...form, read_time: parseInt(e.target.value) || 5 })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none"
                />
              </div>
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 accent-accent" />
                  <span className="text-sm font-medium">Published</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-accent" />
                  <span className="text-sm font-medium">Featured</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
