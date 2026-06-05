import { GamesPage } from '@/components/games/games-page';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Memory Games', description: 'Train your cognitive abilities with science-backed psychology memory games.' };

export default function Games() {
  return <GamesPage />;
}
