'use client';

import { useState } from 'react';
import { MemoryCardGame } from './memory-card-game';
import { WordAssociationGame } from './word-association-game';
import { NumberSequenceGame } from './number-sequence-game';
import { ColorMemoryGame } from './color-memory-game';
import { Brain, Gamepad2, Zap, Target, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const games = [
  { id: 'colors', title: 'রঙ মেমোরি গেম', description: 'রঙের ক্রম মনে রাখুন এবং সঠিক রঙে ট্যাপ করুন। বাংলা রঙ — লাল, নীল, সবুজ, হলুদ, বেগুনি, কমলা। লিডারবোর্ড সহ।', icon: Palette, difficulty: 'সব স্তর', time: '5-15 min', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { id: 'cards', title: 'Memory Cards', description: 'Flip cards and find matching psychology concepts. Tests visual memory and recall.', icon: Brain, difficulty: 'Beginner', time: '3-5 min', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'words', title: 'Word Association', description: 'Connect psychological terms to their definitions under time pressure.', icon: Zap, difficulty: 'Intermediate', time: '2-4 min', color: 'bg-green-50 text-green-600 border-green-100' },
  { id: 'numbers', title: 'Number Sequence', description: 'Memorize and reproduce increasingly complex number sequences.', icon: Target, difficulty: 'Advanced', time: '5-10 min', color: 'bg-orange-50 text-orange-600 border-orange-100' },
];

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'colors') return <ColorMemoryGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'cards') return <MemoryCardGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'words') return <WordAssociationGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'numbers') return <NumberSequenceGame onExit={() => setActiveGame(null)} />;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="w-8 h-8 text-accent" />
          </div>
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">Brain Training</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>Psychology Memory Games</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">Science-backed cognitive exercises designed to improve memory, focus, and mental agility.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
          {[
            { title: 'Improve Recall', desc: 'Strengthen memory pathways through pattern recognition.' },
            { title: 'Reduce Stress', desc: 'Focused play activates flow states, reducing mental fatigue.' },
            { title: 'Learn Psychology', desc: 'All games incorporate real psychological concepts.' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <div key={game.id} className="bg-card border border-border rounded-2xl overflow-hidden card-hover">
                <div className="p-8">
                  <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center mb-5 border', game.color)}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h2 className="font-bold text-xl mb-2">{game.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">{game.description}</p>
                  <div className="flex items-center gap-3 mb-6 text-xs">
                    <span className="bg-muted px-3 py-1 rounded-full text-muted-foreground">{game.difficulty}</span>
                    <span className="bg-muted px-3 py-1 rounded-full text-muted-foreground">{game.time}</span>
                  </div>
                  <button onClick={() => setActiveGame(game.id)} className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors">Play Now</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
