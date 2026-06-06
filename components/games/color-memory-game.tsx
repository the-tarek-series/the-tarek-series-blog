'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const COLORS = [
  { name: 'লাল', bg: 'bg-red-500', hover: 'hover:bg-red-400', active: 'bg-red-300', hex: '#ef4444' },
  { name: 'নীল', bg: 'bg-blue-500', hover: 'hover:bg-blue-400', active: 'bg-blue-300', hex: '#3b82f6' },
  { name: 'সবুজ', bg: 'bg-green-500', hover: 'hover:bg-green-400', active: 'bg-green-300', hex: '#22c55e' },
  { name: 'হলুদ', bg: 'bg-yellow-400', hover: 'hover:bg-yellow-300', active: 'bg-yellow-200', hex: '#facc15' },
  { name: 'বেগুনি', bg: 'bg-purple-500', hover: 'hover:bg-purple-400', active: 'bg-purple-300', hex: '#a855f7' },
  { name: 'কমলা', bg: 'bg-orange-500', hover: 'hover:bg-orange-400', active: 'bg-orange-300', hex: '#f97316' },
];

type Difficulty = 'সহজ' | 'মধ্যম' | 'কঠিন';

const DIFFICULTY_SETTINGS: Record<Difficulty, { colorsCount: number; showMs: number; label: string }> = {
  সহজ: { colorsCount: 4, showMs: 1200, label: 'সহজ' },
  মধ্যম: { colorsCount: 5, showMs: 800, label: 'মধ্যম' },
  কঠিন: { colorsCount: 6, showMs: 500, label: 'কঠিন' },
};

type Phase = 'idle' | 'showing' | 'input' | 'result';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  level: number;
  difficulty: string;
  created_at: string;
}

interface Props { onExit: () => void; }

export function ColorMemoryGame({ onExit }: Props) {
  const [difficulty, setDifficulty] = useState<Difficulty>('সহজ');
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const showingRef = useRef(false);

  const settings = DIFFICULTY_SETTINGS[difficulty];
  const colors = COLORS.slice(0, settings.colorsCount);

  const loadLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('*')
      .eq('game_type', 'color_memory')
      .order('score', { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const showSequence = useCallback(async (seq: number[]) => {
    if (showingRef.current) return;
    showingRef.current = true;
    setPhase('showing');
    setHighlightIdx(null);

    await new Promise(r => setTimeout(r, 500));

    for (let i = 0; i < seq.length; i++) {
      setHighlightIdx(seq[i]);
      await new Promise(r => setTimeout(r, settings.showMs));
      setHighlightIdx(null);
      await new Promise(r => setTimeout(r, 200));
    }

    showingRef.current = false;
    setPhase('input');
    setPlayerInput([]);
  }, [settings.showMs]);

  function startGame() {
    const initSeq = [Math.floor(Math.random() * colors.length)];
    setSequence(initSeq);
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setSaved(false);
    setPlayerInput([]);
    showSequence(initSeq);
  }

  function handleColorPress(idx: number) {
    if (phase !== 'input') return;
    setActiveBtn(idx);
    setTimeout(() => setActiveBtn(null), 200);

    const newInput = [...playerInput, idx];
    setPlayerInput(newInput);

    const pos = newInput.length - 1;
    if (newInput[pos] !== sequence[pos]) {
      const newLives = lives - 1;
      setLives(newLives);
      setFlash('wrong');
      setTimeout(() => setFlash(null), 600);
      if (newLives <= 0) {
        setGameOver(true);
        setPhase('idle');
      } else {
        setPhase('result');
        setTimeout(() => {
          setPlayerInput([]);
          showSequence(sequence);
        }, 1200);
      }
      return;
    }

    if (newInput.length === sequence.length) {
      const pts = level * 10 * (difficulty === 'কঠিন' ? 3 : difficulty === 'মধ্যম' ? 2 : 1);
      setScore(s => s + pts);
      setFlash('correct');
      setTimeout(() => setFlash(null), 600);

      const nextSeq = [...sequence, Math.floor(Math.random() * colors.length)];
      setSequence(nextSeq);
      setLevel(l => l + 1);
      setTimeout(() => {
        setPlayerInput([]);
        showSequence(nextSeq);
      }, 800);
    }
  }

  async function saveScore() {
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    await supabase.from('game_scores').insert({
      player_name: playerName.trim(),
      score,
      level,
      difficulty,
      game_type: 'color_memory',
    });
    setSaving(false);
    setSaved(true);
    await loadLeaderboard();
  }

  const difficultyColors: Record<Difficulty, string> = {
    সহজ: 'bg-green-100 text-green-700 border-green-300',
    মধ্যম: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    কঠিন: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Games
          </button>
          <button onClick={() => { setShowLeaderboard(!showLeaderboard); }} className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors">
            <Trophy className="w-4 h-4" /> Leaderboard
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>রঙ মেমোরি গেম</h1>
        <p className="text-muted-foreground mb-6 text-sm">ক্রম মনে রাখুন এবং সঠিক রঙে ট্যাপ করুন।</p>

        {/* Leaderboard panel */}
        {showLeaderboard && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> শীর্ষ খেলোয়াড়</h2>
            {leaderboard.length === 0 ? (
              <p className="text-muted-foreground text-sm">এখনও কোনো স্কোর নেই।</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold', i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted-foreground/20 text-muted-foreground')}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{entry.player_name}</p>
                      <p className="text-xs text-muted-foreground">{entry.difficulty} · Level {entry.level}</p>
                    </div>
                    <span className="font-bold text-accent">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Game over screen */}
        {gameOver ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>গেম শেষ!</h2>
            <p className="text-muted-foreground mb-1">আপনি Level {level} পর্যন্ত পৌঁছেছেন</p>
            <p className="text-5xl font-bold text-accent mb-6">{score} pts</p>

            {!saved ? (
              <div className="flex gap-2 mb-6 max-w-xs mx-auto">
                <input
                  type="text"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="আপনার নাম লিখুন"
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  onKeyDown={e => e.key === 'Enter' && saveScore()}
                />
                <Button onClick={saveScore} disabled={saving || !playerName.trim()} size="sm" className="bg-accent text-white hover:bg-accent/90">
                  {saving ? '...' : 'সেভ'}
                </Button>
              </div>
            ) : (
              <p className="text-green-600 text-sm mb-6 font-medium">স্কোর সেভ হয়েছে!</p>
            )}

            <Button onClick={startGame} className="bg-accent hover:bg-accent/90 text-white gap-2">
              <RotateCcw className="w-4 h-4" /> আবার খেলুন
            </Button>
          </div>
        ) : phase === 'idle' ? (
          /* Start screen */
          <div className="bg-card border border-border rounded-2xl p-8">
            <h2 className="font-semibold text-lg mb-4">কঠিনতা বেছে নিন</h2>
            <div className="flex gap-3 mb-8">
              {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn('flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all', difficulty === d ? difficultyColors[d] : 'border-border bg-muted text-muted-foreground hover:border-accent/30')}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8 text-center text-sm text-muted-foreground">
              <div><div className="font-bold text-foreground text-base">{settings.colorsCount}</div><div>রঙ সংখ্যা</div></div>
              <div><div className="font-bold text-foreground text-base">{settings.showMs}ms</div><div>দেখানোর সময়</div></div>
              <div><div className="font-bold text-foreground text-base">3</div><div>জীবন</div></div>
            </div>
            <Button onClick={startGame} className="w-full h-12 bg-accent hover:bg-accent/90 text-white text-base font-semibold">
              খেলা শুরু করুন
            </Button>
          </div>
        ) : (
          /* Active game */
          <div className={cn('bg-card border-2 rounded-2xl p-6 transition-colors duration-300', flash === 'correct' ? 'border-green-400 bg-green-50/30' : flash === 'wrong' ? 'border-red-400 bg-red-50/30' : 'border-border')}>
            {/* Stats row */}
            <div className="flex items-center justify-between mb-6 text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-muted-foreground">স্কোর: </span>
                  <span className="font-bold text-accent">{score}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">রঙ সংখ্যা: </span>
                  <span className="font-bold">{settings.colorsCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">পর্যায়: </span>
                  <span className={cn('font-bold text-xs px-2 py-0.5 rounded-full border', difficultyColors[difficulty])}>{difficulty}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart key={i} className={cn('w-5 h-5 transition-all', i < lives ? 'fill-red-500 text-red-500' : 'text-muted-foreground/30')} />
                ))}
              </div>
            </div>

            {/* Level + phase indicator */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-accent mb-1">Level {level}</div>
              <div className="text-sm text-muted-foreground">
                {phase === 'showing' ? 'মনোযোগ দিন...' : phase === 'input' ? `${playerInput.length} / ${sequence.length} — আপনার পালা!` : 'অপেক্ষা করুন...'}
              </div>
              {/* Progress dots */}
              {phase === 'input' && (
                <div className="flex justify-center gap-2 mt-3">
                  {sequence.map((colorIdx, i) => (
                    <div key={i} className={cn('w-3 h-3 rounded-full transition-all', i < playerInput.length ? (playerInput[i] === sequence[i] ? 'bg-green-500' : 'bg-red-500') : 'bg-muted')} />
                  ))}
                </div>
              )}
            </div>

            {/* Color buttons grid */}
            <div className={cn('grid gap-4', settings.colorsCount <= 4 ? 'grid-cols-2' : 'grid-cols-3')}>
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleColorPress(idx)}
                  disabled={phase !== 'input'}
                  className={cn(
                    'rounded-2xl h-24 flex items-center justify-center text-white font-bold text-xl transition-all duration-150 select-none',
                    color.bg,
                    phase === 'input' ? `${color.hover} cursor-pointer active:scale-95` : 'cursor-default opacity-90',
                    highlightIdx === idx ? `${color.active} scale-105 shadow-lg shadow-black/20 ring-4 ring-white/60` : '',
                    activeBtn === idx ? 'scale-95 brightness-110' : '',
                    phase === 'showing' && highlightIdx !== idx ? 'brightness-75' : ''
                  )}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
