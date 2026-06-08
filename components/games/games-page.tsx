'use client';

import { useState, useEffect, useRef } from 'react';
import { MemoryCardGame } from './memory-card-game';
import { WordAssociationGame } from './word-association-game';
import { NumberSequenceGame } from './number-sequence-game';
import { ColorMemoryGame } from './color-memory-game';
import { ColorSequenceGame } from './color-sequence-game';
import { Brain, Gamepad2, Zap, Target, Palette, Layers, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const BivrantiMazeGame = dynamic(() => import('./bivranti-maze-game').then(m => ({ default: m.BivrantiMazeGame })), { ssr: false });

const games = [
  { id: 'colors', title: 'রঙ মেমোরি গেম', description: 'রঙের ক্রম মনে রাখুন এবং সঠিক রঙে ট্যাপ করুন। বাংলা রঙ — লাল, নীল, সবুজ, হলুদ, বেগুনি, কমলা। লিডারবোর্ড সহ।', icon: Palette, difficulty: 'সব স্তর', time: '৫-১৫ মিনিট', color: 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-950/40 dark:border-pink-800' },
  { id: 'cards', title: 'নম্বর মেমোরি ম্যাচ', description: 'কার্ড উল্টিয়ে মিলে যাওয়া নম্বর খুঁজুন। তিনটি স্তর — সহজ, মধ্যম, কঠিন। স্মৃতিশক্তি ও মনোযোগ পরীক্ষা করুন।', icon: Brain, difficulty: 'সব স্তর', time: '৩-৮ মিনিট', color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:border-blue-800' },
  { id: 'stroop', title: 'রঙ বিভ্রান্তি (Stroop)', description: 'রঙের নাম ভুল কালিতে লেখা — সঠিক কালির নাম বলুন! মস্তিষ্কের নিয়ন্ত্রণ শক্তি পরীক্ষা করুন।', icon: Layers, difficulty: 'মধ্যম-কঠিন', time: '২-৫ মিনিট', color: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:border-purple-800' },
  { id: 'maze', title: 'বিভ্রান্তির গলি', description: 'পথ দেখুন, মনে রাখুন, তারপর অনুসরণ করুন! বন, মহাকাশ ও সমুদ্র — তিনটি থিমে স্মৃতি পরীক্ষা।', icon: Map, difficulty: 'মধ্যম-কঠিন', time: '৫-১০ মিনিট', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800' },
  { id: 'words', title: 'শব্দ সংযোগ', description: 'মনোবিজ্ঞানের শব্দ ও সংজ্ঞা মেলান। সময়ের চাপে সঠিক উত্তর দিন এবং স্কোর বাড়ান।', icon: Zap, difficulty: 'মধ্যম', time: '২-৪ মিনিট', color: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/40 dark:border-green-800' },
  { id: 'numbers', title: 'নম্বর ক্রম', description: 'ক্রমবর্ধমান জটিল নম্বরের ক্রম মনে রাখুন এবং পুনরুত্পাদন করুন। মনোযোগ ও স্মৃতির চূড়ান্ত পরীক্ষা।', icon: Target, difficulty: 'কঠিন', time: '৫-১০ মিনিট', color: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:border-orange-800' },
];

function useCelebrationSound() {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch {}
  }, []);
}

export function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [bounce, setBounce] = useState(true);
  useCelebrationSound();

  useEffect(() => {
    const t = setTimeout(() => setBounce(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (activeGame === 'colors') return <ColorMemoryGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'cards') return <MemoryCardGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'stroop') return <ColorSequenceGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'maze') return <BivrantiMazeGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'words') return <WordAssociationGame onExit={() => setActiveGame(null)} />;
  if (activeGame === 'numbers') return <NumberSequenceGame onExit={() => setActiveGame(null)} />;

  return (
    <div className="pt-24 pb-20">
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .bounce-slow { animation: bounce-slow 1.2s ease-in-out infinite; }
      `}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="w-8 h-8 text-accent" />
          </div>
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">ব্রেইন ট্রেনিং</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>মনোবিজ্ঞান মেমোরি গেমস</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">বিজ্ঞানসম্মত জ্ঞানীয় অনুশীলন যা স্মৃতিশক্তি, মনোযোগ ও মানসিক দক্ষতা উন্নত করে।</p>
          <button
            onClick={() => document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth' })}
            className={cn('inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-medium text-lg hover:bg-accent/90 transition-colors', bounce && 'bounce-slow')}
          >
            এখনই খেলুন ↓
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
          {[
            { title: 'স্মৃতিশক্তি বাড়ান', desc: 'প্যাটার্ন শনাক্তকরণের মাধ্যমে স্মৃতির পথ শক্তিশালী করুন।' },
            { title: 'মানসিক চাপ কমান', desc: 'মনোযোগী খেলা ফ্লো স্টেট সক্রিয় করে মানসিক ক্লান্তি কমায়।' },
            { title: 'মনোযোগ বাড়ান', desc: 'সব গেমে বাস্তব মনোবিজ্ঞানের ধারণা অন্তর্ভুক্ত করা হয়েছে।' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-6 text-center">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div id="games-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <button onClick={() => setActiveGame(game.id)} className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors">
                    খেলুন
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
