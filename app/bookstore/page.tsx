import { Suspense } from 'react';
import { BookStorePage } from '@/components/bookstore/bookstore-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Psychology Bookstore',
  description: 'Curated collection of essential psychology books on CBT, mindfulness, trauma, and relationships.',
};

export default function Bookstore() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24" />}>
      <BookStorePage />
    </Suspense>
  );
}
