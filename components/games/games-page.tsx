'use client';

import { useState, useEffect, useRef } from 'react';
import { NumberMemoryMatchGame } from './number-memory-match';
import { ColorSequenceGame } from './color-sequence-game';
import { BivrantiMazeGame } from './bivranti-maze-game';
import { playSound } from '@/lib/audio-utils';

const games = [
  {
    id: 'numbers-match',
    title: 'সংখ্যা চ্যালেঞ্জ',
    emoji: '🔢',
    description: 'সংখ্যা মনে রাখো, কার্ড মিলাও আর স্কোর বাড়াও একদম সহজে!',
    difficulties: ['সহজ 🟢', 'মাঝারি 🟡', 'কঠিন 🔴'],
    time: '৫-১০ মিনিট',
    gradientFrom: '#f97316',
    gradientTo: '#ef4444',
  },
  {
    id: 'color-memory',
    title: 'রঙ মেমরি',
    emoji: '🎨',
    description: 'রঙের নাম মনে রাখো আর সঠিক রঙ বেছে নাও! স্ট্রোপ ইফেক্ট চ্যালেঞ্জ!',
    difficulties: ['মাঝারি 🟡'],
    time: '৩-৭ মিনিট',
    gradientFrom: '#ec4899',
    gradientTo: '#a855f7',
  },
  {
    id: 'bivranti-maze',
    title: 'বিভ্রান্তির গলি',
    emoji: '🌀',
    description: 'গোলকধাঁধার পথ মনে রেখে এগিয়ে যাও! স্মৃতিশক্তি ও মনোযোগের চূড়ান্ত পরীক্ষা!',
    difficulties: ['সহজ 🟢', 'কঠিন 🔴'],
    time: '৩-৮ মিনিট',
    gradientFrom: '#0ea5e9',
    gradientTo: '#6366f1',
  },
];

const benefits = [
  { emoji: '🧠', title: 'ব্রেইন শার্প রাখো', description: 'প্রতিদিন একটু খেললেই মাথা ঝরঝরে থাকে!', color: 'from-purple-500/20 to-blue-500/20 border-purple-500/30' },
  { emoji: '⚡', title: 'ফোকাস বাড়াও', description: 'পড়াশোনা, কাজ সব কিছুতে মনোযোগ বাড়বে!', color: 'from-orange-500/20 to-red-500/20 border-orange-500/30' },
  { emoji: '😌', title: 'স্ট্রেস উড়িয়ে দাও', description: 'খেলার মধ্যে ডুবে গেলে টেনশন পালায়!', color: 'from-green-500/20 to-teal-500/20 border-green-500/30' },
  { emoji: '🎯', title: 'স্মৃতি শক্তিশালী করো', description: 'মাত্র ৫ মিনিট খেললেই পার্থক্য টের পাবে!', color: 'from-blue-500/20 to-purple-500/20 border-blue-500/30' },
  { emoji: '🏆', title: 'নিজেকে চ্যালেঞ্জ করো', description: 'প্রতিবার নিজের রেকর্ড ভাঙার মজাই আলাদা!', color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30' },
];

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const gameScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playSound.welcome();
  }, []);

  const handlePlayClick = (gameId: string) => {
    setActiveGame(gameId);
    setTimeout(() => {
      gameScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (activeGame === 'numbers-match') return <NumberMemoryMatchGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'color-memory') return <ColorSequenceGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'bivranti-maze') return <BivrantiMazeGame onExit={() => setActiveGame(null)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/15 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/15 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6 text-6xl animate-bounce">🧠</div>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black mb-4 tracking-tight"
              style={{
                fontFamily: 'var(--font-playfair)',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              মস্তিষ্কের খেলা 🧠
            </h1>
            <p className="text-xl sm:text-2xl font-bold mb-2"
              style={{ background: 'linear-gradient(135deg,#a78bfa,#f472b6,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              খেলো, শেখো, নিজেকে চেনো
            </p>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              মজার মধ্যে আপনার মস্তিষ্ক শার্প করুন আর প্রতিদিন নতুন চ্যালেঞ্জ নিন!
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex-shrink-0 w-72 snap-center">
                  <div className={`h-40 rounded-2xl border bg-gradient-to-br backdrop-blur-xl p-6 transition-all hover:scale-105 duration-300 ${benefit.color}`}>
                    <div className="text-4xl mb-2">{benefit.emoji}</div>
                    <h3 className="text-lg font-bold text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Game Cards */}
        <div ref={gameScrollRef} className="px-4 sm:px-6 lg:px-8 pb-32">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {games.map((game) => (
              <div
                key={game.id}
                className="group relative h-96 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105"
              >
                {/* Gradient background */}
                <div
                  className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(135deg, ${game.gradientFrom}, ${game.gradientTo})` }}
                />

                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm group-hover:backdrop-blur-none transition-all duration-300" />

                {/* Glowing border */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="relative h-full p-8 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl">{game.emoji}</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 group-hover:text-yellow-200 transition-colors">
                      {game.title}
                    </h2>
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {game.difficulties.map((diff, idx) => (
                        <span key={idx} className="text-xs font-bold text-white/90 bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20">
                          {diff}
                        </span>
                      ))}
                      <span className="text-xs font-bold text-white/70 bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20">
                        ⏱ {game.time}
                      </span>
                    </div>

                    <button
                      onClick={() => handlePlayClick(game.id)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-black rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-orange-500/50 flex items-center justify-center gap-2"
                    >
                      <span>এখনই খেলো</span>
                      <span className="group-hover:translate-y-1 transition-transform">↓</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
