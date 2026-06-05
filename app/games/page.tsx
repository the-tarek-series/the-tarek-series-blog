import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Memory Games', description: 'Train your cognitive abilities with science-backed psychology memory games.' };

const GamesPage = dynamic(() => import('@/components/games/games-page').then(m => m.GamesPage), { ssr: false });

export default function Games() {
  return <GamesPage />;
}
