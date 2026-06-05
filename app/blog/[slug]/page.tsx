import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { BlogPost } from '@/components/blog/blog-post';
import type { Metadata } from 'next';

interface Props { params: { slug: string }; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: post } = await supabase.from('posts').select('title, excerpt, cover_image').eq('slug', params.slug).eq('published', true).maybeSingle();
  if (!post) return { title: 'Post Not Found' };
  return { title: post.title, description: post.excerpt, openGraph: { images: [post.cover_image] } };
}

export default async function PostPage({ params }: Props) {
  const { data: post } = await supabase.from('posts').select('*').eq('slug', params.slug).eq('published', true).maybeSingle();
  if (!post) notFound();
  const { data: related } = await supabase.from('posts').select('*').eq('published', true).eq('category', post.category).neq('id', post.id).limit(3);
  return <BlogPost post={post} related={related || []} />;
}
