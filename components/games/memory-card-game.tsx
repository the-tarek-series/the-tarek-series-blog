'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

const CARDS_DATA = [
  { id: 1, content: 'CBT', match: 'Cognitive Behavioral Therapy' },
  { id: 2, content: 'Amygdala', match: 'Fear & Emotion Center' },
  { id: 3, content: 'Dopamine', match: 'Reward Neurotransmitter' },
  { id: 4, content: 'Freud', match: 'Psychoanalysis Pioneer' },
  { id: 5, content: 'REM Sleep', match: 'Memory Consolidation' },
  { id: 6, content: 'Neuroplasticity', match: 'Brain Adaptation' },
];

type Card = { uid: string; id: number; content: string; flipped: boolean; matched: boolean };

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function buildDeck(): Card[] {
  const cards: Card[] = [];
  CARDS_DATA.forEach((item) => {
    cards.push({ uid: `${item.id}-a`, id: item.id, content: item.content, flipped: false, matched: false });
    cards.push({ uid: `${item.id}-b`, id: item.id, content: item.match, flipped: false, matched: false });
  });
  return shuffle(cards);
}

interface Props { onExit: () => void; }

export function MemoryCardGame({ onExit }: Props) {
  const [cards, setCards] = useState<Card[]>(buildDeck());
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [locked, setLocked] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (won) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [won, startTime]);

  const flip = useCallback((uid: string) => {
    if (locked || selected.length === 2) return;
    const card = cards.find((c) => c.uid === uid);
    if (!card || card.flipped || card.matched) return;

    setCards((prev) => prev.map((c) => c.uid === uid ? { ...c, flipped: true } : c));
    const newSelected = [...selected, uid];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newSelected.map((u) => cards.find((c) => c.uid === u)!);
      if (a.id === b.id) {
        setCards((prev) => prev.map((c) => newSelected.includes(c.uid) ? { ...c, matched: true } : c));
        setSelected([]);
        setCards((prev) => { if (prev.every((c) => c.matched)) setWon(true); return prev; });
      } else {
        setLocked(true);
        setTimeout(() => {
          setCards((prev) => prev.map((c) => newSelected.includes(c.uid) ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 1000);
      }
    }
  }, [locked, selected, cards]);

  function restart() {
    setCards(buildDeck());
    setSelected([]);
    setMoves(0);
    setWon(false);
    setLocked(false);
    setElapsed(0);
  }

  const matched = cards.filter((c) => c.matched).length / 2;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Games</button>
          <Button onClick={restart} variant="outline" size="sm" className="gap-2"><RotateCcw className="w-4 h-4" /> Restart</Button>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Memory Cards</h1>
        <p className="text-muted-foreground mb-8">Match each psychology term with its description.</p>

        <div className="flex gap-6 mb-8 text-sm">
          <div className="bg-card border border-border rounded-xl px-5 py-3"><div className="text-muted-foreground text-xs mb-1">Moves</div><div className="font-bold text-lg">{moves}</div></div>
          <div className="bg-card border border-border rounded-xl px-5 py-3"><div className="text-muted-foreground text-xs mb-1">Matched</div><div className="font-bold text-lg">{matched} / {CARDS_DATA.length}</div></div>
          <div className="bg-card border border-border rounded-xl px-5 py-3"><div className="text-muted-foreground text-xs mb-1">Time</div><div className="font-bold text-lg">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div></div>
        </div>

        {won ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Excellent Memory!</h2>
            <p className="text-muted-foreground mb-2">You matched all cards in {moves} moves</p>
            <p className="text-muted-foreground mb-8">Time: {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</p>
            <Button onClick={restart} className="bg-accent hover:bg-accent/90 text-white gap-2"><RotateCcw className="w-4 h-4" /> Play Again</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {cards.map((card) => (
              <button
                key={card.uid}
                onClick={() => flip(card.uid)}
                disabled={card.matched || card.flipped || locked}
                className={cn(
                  'aspect-[3/4] rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 border-2 p-3 flex items-center justify-center text-center leading-tight',
                  card.matched ? 'bg-accent/10 border-accent text-accent cursor-default' : card.flipped ? 'bg-card border-accent text-foreground shadow-md' : 'bg-foreground border-foreground text-foreground hover:bg-foreground/90 cursor-pointer'
                )}
              >
                {(card.flipped || card.matched) ? card.content : '?'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
