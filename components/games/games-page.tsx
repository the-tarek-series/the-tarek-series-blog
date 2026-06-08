'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoryCardGame } from './memory-card-game';
import { ColorMemoryGame } from './color-memory-game';
import { Brain, Palette, Map, Gamepad2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const BivrantiMazeGame = dynamic(
  () => import('./bivranti-maze-game').then(m => ({ default: m.BivrantiMazeGame })),
  { ssr: false }
);

const GAMES = [
  {
    id: 'cards',
    title: 'মাবারি',
    subtitle: 'Memory Match',
    desc: 'কার্ড উল্টিয়ে একই সংখ্যার জোড়া খুঁজো। স্মৃতিশক্তি ও মনোযোগের চ্যালেঞ্জ!',
    icon: Brain,
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-gradient-to-br from-blue-500/10 to-cyan-400/10',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-500',
    tag: '৩-৮ মিনিট',
    level: 'সব স্তর',
  },
  {
    id: 'colors',
    title: 'রঙ মেমরি',
    subtitle: 'Color Sequence',
    desc: 'রঙিন বাংলা শব্দ দেখাবে — মনে রাখো এবং সঠিক ক্রমে উত্তর দাও!',
    icon: Palette,
    gradient: 'from-pink-500 to-rose-400',
    bg: 'bg-gradient-to-br from-pink-500/10 to-rose-400/10',
    border: 'border-pink-200 dark:border-pink-800',
    iconBg: 'bg-pink-500',
    tag: '৩-৬ মিনিট',
    level: 'সহজ - কঠিন',
  },
  {
    id: 'maze',
    title: 'বিভ্রান্তির গলি',
    subtitle: 'Memory Maze',
    desc: '১০ সেকেন্ড পথ দেখো, মনে রাখো — তারপর অনুসরণ করো!',
    icon: Map,
    gradient: 'from-emerald-500 to-teal-400',
    bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-400/10',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-500',
    tag: '৫-১০ মিনিট',
    level: 'সহজ',
  },
];

function useCelebrationSound() {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    const timeout = setTimeout(() => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const notes = [523, 659, 784, 1047, 1319];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          const t = ctx.currentTime + i * 0.1;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      } catch {}
    }, 600);
    return () => clearTimeout(timeout);
  }, []);
}

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  useCelebrationSound();

  if (activeGame === 'cards') return <MemoryCardGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'colors') return <ColorMemoryGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'maze') return <BivrantiMazeGame onExit={() => setActiveGame(null)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-24 pb-20">
      <style>{`
        @keyframes float-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float-up { animation: float-up 0.6s ease-out forwards; }
        .animate-float-up-1 { animation: float-up 0.6s 0.1s ease-out both; }
        .animate-float-up-2 { animation: float-up 0.6s 0.2s ease-out both; }
        .animate-float-up-3 { animation: float-up 0.6s 0.3s ease-out both; }
        .game-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .game-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15); }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16 animate-float-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
            <Gamepad2 className="w-4 h-4" />
            ব্রেইন ট্রেনিং
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-slate-800 via-blue-700 to-emerald-600 dark:from-slate-100 dark:via-blue-300 dark:to-emerald-300 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-playfair)' }}>
            মনোবিজ্ঞান গেমস
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            মস্তিষ্কের শক্তি বাড়াও — তিনটি অনন্য গেমে স্মৃতিশক্তি, মনোযোগ ও প্রতিক্রিয়া পরীক্ষা করো।
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-14 animate-float-up-1">
          {[
            { label: 'স্মৃতিশক্তি বাড়ান', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
            { label: 'মানসিক চাপ কমান', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
            { label: 'মনোযোগ বাড়ান', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
          ].map(({ label, color }) => (
            <span key={label} className={cn('px-4 py-2 rounded-full text-sm font-medium', color)}>
              {label}
            </span>
          ))}
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {GAMES.map((game, i) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className={cn(
                  'game-card relative rounded-2xl border-2 overflow-hidden cursor-pointer bg-card',
                  game.border,
                  `animate-float-up-${i + 1}`
                )}
                onClick={() => setActiveGame(game.id)}
              >
                {/* Gradient top bar */}
                <div className={cn('h-1.5 w-full bg-gradient-to-r', game.gradient)} />

                <div className="p-6">
                  {/* Icon */}
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', game.iconBg)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold mb-0.5">{game.title}</h2>
                  <p className="text-xs text-muted-foreground mb-3">{game.subtitle}</p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{game.desc}</p>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{game.level}</span>
                    <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{game.tag}</span>
                  </div>

                  {/* CTA */}
                  <button
                    className={cn(
                      'w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 bg-gradient-to-r transition-opacity hover:opacity-90',
                      game.gradient
                    )}
                    onClick={e => { e.stopPropagation(); setActiveGame(game.id); }}
                  >
                    খেলুন <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-sm text-muted-foreground mt-12 animate-float-up-3">
          প্রতিটি গেম বিনামূল্যে খেলা যায় — লিডারবোর্ডে নিজের নাম রাখো!
        </p>
      </div>
    </div>
  );
}
