'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/audio-utils';
import { Confetti } from './confetti';

type Difficulty = 'easy' | 'medium' | 'hard';
type GamePhase = 'rules' | 'mode-select' | 'playing' | 'won';

const DIFFICULTY_CONFIGS = {
  easy:   { pairs: 6,  label: 'সহজ 🟢',   desc: '১২টি কার্ড • ১-৯',           baseScore: 100, moveLimit: 6,  penalty: 3 },
  medium: { pairs: 8,  label: 'মাঝারি 🟡', desc: '১৬টি কার্ড • ৫০-১০০',       baseScore: 150, moveLimit: 8,  penalty: 4 },
  hard:   { pairs: 10, label: 'কঠিন 🔴',   desc: '২০টি কার্ড • মিশ্র সংখ্যা',  baseScore: 200, moveLimit: 10, penalty: 5 },
};

interface Card {
  uid: string;
  number: number;
  flipped: boolean;
  matched: boolean;
  shake: boolean;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNumbers(diff: Difficulty, count: number): number[] {
  const nums: number[] = [];
  for (let i = 0; i < count; i++) {
    if (diff === 'easy') {
      nums.push(randInt(1, 9));
    } else if (diff === 'medium') {
      nums.push(randInt(50, 100));
    } else {
      const r = Math.random();
      if (r < 0.3)      nums.push(randInt(1, 9));
      else if (r < 0.6) nums.push(randInt(50, 100));
      else              nums.push(randInt(100, 500));
    }
  }
  const unique = Array.from(new Set(nums));
  while (unique.length < count) {
    let n: number;
    if (diff === 'easy')        n = randInt(1, 9);
    else if (diff === 'medium') n = randInt(50, 100);
    else                        n = randInt(100, 500);
    if (!unique.includes(n)) unique.push(n);
  }
  return unique.slice(0, count);
}

function buildDeck(diff: Difficulty): Card[] {
  const config = DIFFICULTY_CONFIGS[diff];
  const nums = generateNumbers(diff, config.pairs);
  const pairs = [...nums, ...nums].sort(() => Math.random() - 0.5);
  return pairs.map((number, i) => ({ uid: `c${i}`, number, flipped: false, matched: false, shake: false }));
}

function calcScore(diff: Difficulty, moves: number): number {
  const cfg = DIFFICULTY_CONFIGS[diff];
  const extraMoves = Math.max(0, moves - cfg.pairs);
  const raw = 10 - extraMoves * 0.5;
  return Math.max(1, Math.min(10, Math.round(raw * 10) / 10));
}

function starCount(score: number): number {
  if (score >= 9) return 3;
  if (score >= 6) return 2;
  return 1;
}

function winMessage(score: number): string {
  if (score >= 9) return 'তুমি একদম জিনিয়াস! 🧠🔥';
  if (score >= 7) return 'অসাধারণ! দারুণ খেলেছ! 🎉';
  if (score >= 5) return 'ভালো চেষ্টা! 👏';
  return 'পরের বার আরও ভালো হবে! 💪';
}

interface ScoreEntry { name: string; score: number; moves: number; time: number; diff: string; }

function getScoreboard(): ScoreEntry[] {
  try { return JSON.parse(localStorage.getItem('nmm_scores') || '[]'); } catch { return []; }
}
function saveToScoreboard(entry: ScoreEntry) {
  const scores = getScoreboard();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('nmm_scores', JSON.stringify(scores.slice(0, 10)));
}
function getSavedName(): string {
  return localStorage.getItem('nmm_player_name') || '';
}
function savePlayerName(name: string) {
  localStorage.setItem('nmm_player_name', name);
}

interface Props { onExit: () => void; }

export function NumberMemoryMatchGame({ onExit }: Props) {
  const [phase, setPhase] = useState<GamePhase>('rules');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rulesSeen = localStorage.getItem('nmm_rules_seen');
    const savedName = getSavedName();
    if (savedName) setPlayerName(savedName);
    if (rulesSeen) setPhase('mode-select');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 200);
    return () => clearInterval(t);
  }, [phase, startTime]);

  const startGame = useCallback((diff: Difficulty) => {
    const deck = buildDeck(diff);
    setCards(deck);
    setSelected([]);
    setMoves(0);
    setElapsed(0);
    setLocked(true);

    setCards(deck.map(c => ({ ...c, flipped: true })));
    setTimeout(() => {
      setCards(deck.map(c => ({ ...c, flipped: false })));
      setStartTime(Date.now());
      setLocked(false);
      setPhase('playing');
      setTimeout(() => gameAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }, 1500);
  }, []);

  const flipCard = useCallback((uid: string) => {
    if (locked) return;
    if (selected.length >= 2) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || card.flipped || card.matched) return;

    playSound.cardTap();
    const newCards = cards.map(c => c.uid === uid ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newSelected = [...selected, uid];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setLocked(true);
      const newMoves = moves + 1;
      setMoves(newMoves);
      const [aUid, bUid] = newSelected;
      const a = newCards.find(c => c.uid === aUid)!;
      const b = newCards.find(c => c.uid === bUid)!;

      if (a.number === b.number) {
        playSound.matchSuccess();
        const matched = newCards.map(c => newSelected.includes(c.uid) ? { ...c, matched: true } : c);
        setCards(matched);
        setSelected([]);
        setLocked(false);

        if (matched.every(c => c.matched)) {
          const el = Math.floor((Date.now() - startTime) / 1000);
          const score = calcScore(difficulty, newMoves);
          setFinalScore(score);
          setFinalElapsed(el);
          playSound.winFanfare();
          const boards = getScoreboard();
          setScoreboard(boards);
          setPhase('won');
        }
      } else {
        playSound.errorBuzz();
        setCards(newCards.map(c => newSelected.includes(c.uid) ? { ...c, shake: true } : c));
        setTimeout(() => {
          setCards(prev => prev.map(c => newSelected.includes(c.uid) ? { ...c, flipped: false, shake: false } : c));
          setSelected([]);
          setLocked(false);
        }, 1000);
      }
    }
  }, [cards, selected, locked, moves, startTime, difficulty]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSaveScore = () => {
    const name = playerName.trim();
    if (!name) return;
    savePlayerName(name);
    saveToScoreboard({ name, score: finalScore, moves, time: finalElapsed, diff: DIFFICULTY_CONFIGS[difficulty].label });
    setScoreboard(getScoreboard());
  };

  if (phase === 'rules') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> ফিরে যাও
          </button>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔢</div>
            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>সংখ্যা চ্যালেঞ্জ</h1>
            <p className="text-slate-300">কার্ড উলটিয়ে মিলিয়ে ফেলো — যত কম চেষ্টায় তত বেশি স্কোর!</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 space-y-4 text-sm text-slate-300">
            {[
              ['🎯', 'কার্ড উলটিয়ে একই সংখ্যার দুটি কার্ড মেলাও'],
              ['⚡', 'যত কম চেষ্টায় মিলাবে তত বেশি স্কোর (১০/১০ থেকে শুরু)'],
              ['⭐', 'স্কোর ৯+ = ৩ তারা, ৬-৮ = ২ তারা, ৫ এর নিচে = ১ তারা'],
              ['🔢', 'সহজ: ১-৯, মাঝারি: ৫০-১০০, কঠিন: মিশ্র সংখ্যা'],
            ].map(([icon, text]) => (
              <div key={text as string} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-300 mb-2">স্কোর হিসাব (X/১০):</p>
            <p>নিখুঁত = ১০/১০, প্রতি অতিরিক্ত চেষ্টায় −০.৫ পয়েন্ট</p>
            <p>সর্বনিম্ন স্কোর: ১/১০</p>
          </div>
          <button
            onClick={() => { localStorage.setItem('nmm_rules_seen', '1'); setPhase('mode-select'); }}
            className="w-full h-14 rounded-2xl font-black text-black text-lg transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
          >
            বুঝেছি, খেলা শুরু করো! 🚀
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'mode-select') {
    const boards = getScoreboard();
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> ফিরে যাও
          </button>
          <div className="text-center mb-10">
            <div className="text-5xl mb-3">🔢</div>
            <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>সংখ্যা চ্যালেঞ্জ</h1>
            <p className="text-slate-400">কঠিনতা বেছে নাও</p>
          </div>

          <div className="mb-8">
            {playerName ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-slate-300 text-sm">খেলোয়াড়: <strong className="text-white">{playerName}</strong></span>
                <button onClick={() => { setPlayerName(''); setNameInput(''); }} className="text-xs text-slate-500 hover:text-slate-300 underline">পরিবর্তন</button>
              </div>
            ) : (
              <div className="max-w-sm mx-auto">
                <p className="text-slate-400 text-sm text-center mb-3">তোমার নাম দাও (একবারই লাগবে!)</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="নাম লেখো..." value={nameInput} onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setPlayerName(nameInput.trim()); savePlayerName(nameInput.trim()); } }}
                    className="flex-1 h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" autoFocus />
                  <button onClick={() => { if (nameInput.trim()) { setPlayerName(nameInput.trim()); savePlayerName(nameInput.trim()); } }}
                    disabled={!nameInput.trim()} className="px-4 rounded-xl font-bold text-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>ঠিক আছে</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {(['easy', 'medium', 'hard'] as const).map((diff) => {
              const cfg = DIFFICULTY_CONFIGS[diff];
              const colors = { easy: 'from-green-500/20 to-teal-500/20 border-green-500/30 hover:border-green-400', medium: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:border-yellow-400', hard: 'from-red-500/20 to-pink-500/20 border-red-500/30 hover:border-red-400' };
              return (
                <button key={diff} onClick={() => { setDifficulty(diff); startGame(diff); }}
                  className={cn('p-6 rounded-2xl border-2 bg-gradient-to-br transition-all hover:scale-105 text-left', colors[diff])}>
                  <div className="text-3xl mb-2">{diff === 'easy' ? '🟢' : diff === 'medium' ? '🟡' : '🔴'}</div>
                  <h3 className="font-black text-white text-xl mb-1">{cfg.label}</h3>
                  <p className="text-slate-300 text-sm">{cfg.desc}</p>
                  <p className="text-slate-400 text-xs mt-2">নিখুঁতে: ১০/১০</p>
                </button>
              );
            })}
          </div>

          {boards.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> শীর্ষ স্কোর</h3>
              <div className="space-y-2">
                {boards.slice(0, 5).map((s, i) => (
                  <div key={i} className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-sm', i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5')}>
                    <div className="flex items-center gap-2">
                      {i === 0 ? <Crown className="w-4 h-4 text-yellow-400" /> : <span className="text-slate-500 w-4 text-center">{i + 1}</span>}
                      <span className="text-white font-medium">{s.name}</span>
                      <span className="text-slate-500 text-xs">{s.diff}</span>
                    </div>
                    <span className="font-black text-yellow-400">{s.score}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'won') {
    const stars = starCount(finalScore);
    const msg = winMessage(finalScore);
    return (
      <>
        <Confetti />
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 pt-24 pb-20 flex items-center justify-center">
          <div className="max-w-md w-full px-4 mx-auto text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-5xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>জয়ী!</h1>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3].map(s => (
                <span key={s} className={cn('text-4xl transition-opacity', s <= stars ? 'opacity-100' : 'opacity-20')}>⭐</span>
              ))}
            </div>
            <p className="text-5xl font-black mb-6" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {finalScore}<span className="text-2xl">/10</span>
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <p className="text-xl font-bold text-white mb-4">{msg}</p>
              <div className="space-y-1 text-sm text-slate-300">
                <p>⏱ সময়: {formatTime(finalElapsed)}</p>
                <p>🎯 চেষ্টা: {moves}</p>
                <p>📊 কঠিনতা: {DIFFICULTY_CONFIGS[difficulty].label}</p>
              </div>
            </div>

            {!showNameInput && !playerName && (
              <button onClick={() => setShowNameInput(true)} className="w-full mb-3 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors">স্কোর সংরক্ষণ করো</button>
            )}
            {(showNameInput || playerName) && (
              <div className="mb-4">
                {!playerName ? (
                  <div>
                    <input type="text" placeholder="তোমার নাম লেখো..." value={nameInput} onChange={e => setNameInput(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2" autoFocus />
                    <button onClick={() => { if (nameInput.trim()) { setPlayerName(nameInput.trim()); savePlayerName(nameInput.trim()); handleSaveScore(); } }}
                      disabled={!nameInput.trim()} className="w-full py-3 rounded-xl font-bold text-black disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>সংরক্ষণ করো</button>
                  </div>
                ) : (
                  <button onClick={handleSaveScore} className="w-full py-3 rounded-xl font-bold text-black"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                    {playerName}-এর স্কোর সংরক্ষণ করো ✅
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <button onClick={() => startGame(difficulty)}
                className="w-full h-12 rounded-xl font-bold text-black flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                <RotateCcw className="w-4 h-4" /> আবার খেলো
              </button>
              <button onClick={() => setPhase('mode-select')}
                className="w-full h-12 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-colors">
                মোড পরিবর্তন করো
              </button>
              <button onClick={onExit} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-300 transition-colors text-sm">খেলায় ফিরুন</button>
            </div>

            {scoreboard.length > 0 && (
              <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> শীর্ষ স্কোর</h3>
                <div className="space-y-1.5">
                  {scoreboard.slice(0, 5).map((s, i) => (
                    <div key={i} className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-sm', i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5')}>
                      <div className="flex items-center gap-2">
                        {i === 0 ? <Crown className="w-4 h-4 text-yellow-400" /> : <span className="text-slate-500">{i + 1}</span>}
                        <span className="text-white">{s.name}</span>
                        <span className="text-slate-500 text-xs">{s.diff}</span>
                      </div>
                      <span className="font-black text-yellow-400">{s.score}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const cols = difficulty === 'hard' ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 pt-24 pb-20" ref={gameAreaRef}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরুন
          </button>
          <button onClick={() => startGame(difficulty)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> পুনরায়
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'খেলোয়াড়', value: playerName || '?' },
            { label: 'চেষ্টা', value: moves },
            { label: 'সময়', value: formatTime(elapsed) },
            { label: 'জোড়া', value: `${cards.filter(c => c.matched).length / 2}/${cfg.pairs}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center">
              <div className="text-slate-400 text-xs mb-0.5">{label}</div>
              <div className="font-black text-white text-sm truncate">{value}</div>
            </div>
          ))}
        </div>

        <div className={cn('grid gap-3', cols)}>
          {cards.map((card) => (
            <button
              key={card.uid}
              onClick={() => flipCard(card.uid)}
              disabled={card.matched || card.flipped}
              className={cn(
                'aspect-square rounded-xl font-black text-xl sm:text-2xl transition-all duration-300 flex items-center justify-center select-none',
                card.shake ? 'animate-pulse' : '',
                card.matched
                  ? 'bg-gradient-to-br from-green-500/30 to-teal-500/30 border-2 border-green-500/60 text-green-300 cursor-default scale-95'
                  : card.flipped
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-blue-400 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 text-slate-400 hover:border-blue-400/60 hover:from-slate-600 hover:to-slate-700 cursor-pointer active:scale-95'
              )}
            >
              {card.flipped || card.matched ? card.number : '?'}
            </button>
          ))}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          {cfg.label} মোড — কম চেষ্টায় বেশি স্কোর!
        </p>
      </div>
    </div>
  );
}
