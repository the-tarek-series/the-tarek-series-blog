import { Suspense } from 'react';
import { BlogListPage } from '@/components/blog/blog-list-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Evidence-based psychology articles on CBT, mindfulness, relationships, trauma, and more.',
};

export default function BlogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24" />}>
      <BlogListPage />
    </Suspense>
  );
}
