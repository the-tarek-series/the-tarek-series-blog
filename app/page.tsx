import { Suspense } from 'react';
import { HomePage } from '@/components/home/home-page';

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomePage />
    </Suspense>
  );
}
