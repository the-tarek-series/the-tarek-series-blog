import { Suspense } from 'react';
import { SearchPage } from '@/components/blog/search-page';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Search', description: 'Search psychology articles on MindScape.' };

export default function Search() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24" />}>
      <SearchPage />
    </Suspense>
  );
}
