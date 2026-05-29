'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Post } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(post: Post) {
    await supabase.from('posts').update({ published: !post.published }).eq('id', post.id);
    toast.success(post.published ? 'Post unpublished' : 'Post published');
    load();
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await supabase.from('posts').delete().eq('id', id);
    toast.success('Post deleted');
    load();
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <div>
              <h1 className="text-2xl font-bold">Manage Posts</h1>
              <p className="text-muted-foreground text-sm">{posts.length} total articles</p>
            </div>
          </div>
          <Link href="/admin/posts/new">
            <Button className="bg-accent hover:bg-accent/90 text-white gap-2"><Plus className="w-4 h-4" /> New Post</Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm line-clamp-1">{post.title}</div>
                      <div className="text-muted-foreground text-xs">{post.slug}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <Badge variant="secondary" className="text-xs capitalize">{post.category}</Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={post.published ? 'bg-green-100 text-green-700 border-0' : 'bg-muted text-muted-foreground border-0'}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => togglePublish(post)} className="p-1.5 text-muted-foreground hover:text-accent transition-colors" title={post.published ? 'Unpublish' : 'Publish'}>
                          {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link href={`/admin/posts/${post.id}/edit`} className="p-1.5 text-muted-foreground hover:text-accent transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deletePost(post.id, post.title)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
