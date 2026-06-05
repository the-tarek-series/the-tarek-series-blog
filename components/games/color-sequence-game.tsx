'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Eye, EyeOff, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/audio-utils';
import { Confetti } from './confetti';
import { calculateScore, saveScore, type GameScore } from '@/lib/game-scoring';

type GamePhase = 'intro' | 'showing' | 'selecting' | 'correct' | 'wrong' | 'gameover' | 'victory';

interface ColorData {
  name: string;
  hex: string;
}

const COLORS: ColorData[] = [
  { name: 'লাল', hex: '#DC2626' },
  { name: 'নীল', hex: '#2563EB' },
  { name: 'সবুজ', hex: '#16A34A' },
  { name: 'হলুদ', hex: '#EAB308' },
  { name: 'বেগুনি', hex: '#9333EA' },
  { name: 'কমলা', hex: '#EA580C' },
];

const TOTAL_ROUNDS = 10;
const SHOW_DURATION = 3;
const SELECT_TIMEOUT = 8;

interface RoundData {
  wordText: string;
  wordColor: string;
  wordColorName: string;
  correctAnswer: string;
  correctAnswerName: string;
}

function generateRound(level: number): RoundData {
  const wordIdx = Math.floor(Math.random() * COLORS.length);
  let colorIdx = Math.floor(Math.random() * COLORS.length);
  if (level <= 3) {
    while (colorIdx === wordIdx) colorIdx = Math.floor(Math.random() * COLORS.length);
  }
  return {
    wordText: COLORS[wordIdx].name,
    wordColor: COLORS[colorIdx].hex,
    wordColorName: COLORS[colorIdx].name,
    correctAnswer: COLORS[colorIdx].hex,
    correctAnswerName: COLORS[colorIdx].name,
  };
}

interface Props {
  onExit: () => void;
}

export function ColorSequenceGame({ onExit }: Props) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentRound, setCurrentRound] = useState<RoundData>(generateRound(1));
  const [showTimer, setShowTimer] = useState(SHOW_DURATION);
  const [selectTimer, setSelectTimer] = useState(SELECT_TIMEOUT);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [options, setOptions] = useState<ColorData[]>([]);

  const getOptionCount = useCallback(() => {
    if (round <= 3) return 4;
    if (round <= 6) return 5;
    return 6;
  }, [round]);

  const startGame = useCallback(() => {
    setRound(1);
    setScore(0);
    setLives(3);
    setStreak(0);
    setBestStreak(0);
    setSelectedAnswer(null);
    setPlayerName('');
    setNameInput('');
    setShowNameInput(false);
    const firstRound = generateRound(1);
    setCurrentRound(firstRound);
    setPhase('showing');
    setShowTimer(SHOW_DURATION);
    setStartTime(Date.now());
    setElapsed(0);
  }, []);

  useEffect(() => {
    if (phase === 'selecting') {
      const count = getOptionCount();
      const correctColor = COLORS.find(c => c.hex === currentRound.correctAnswer)!;
      const others = COLORS.filter(c => c.hex !== currentRound.correctAnswer);
      const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, count - 1);
      setOptions([correctColor, ...shuffled].sort(() => Math.random() - 0.5));
      setSelectTimer(SELECT_TIMEOUT);
    }
  }, [phase, currentRound, getOptionCount]);

  useEffect(() => {
    if (phase !== 'showing') return;
    if (showTimer <= 0) { setPhase('selecting'); return; }
    const t = setTimeout(() => setShowTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, showTimer]);

  useEffect(() => {
    if (phase !== 'selecting') return;
    if (selectTimer <= 0) {
      playSound.errorBuzz();
      setStreak(0);
      setLives(l => {
        const next = l - 1;
        if (next <= 0) setTimeout(() => setPhase('gameover'), 500);
        return next;
      });
      setPhase('wrong');
      return;
    }
    const t = setTimeout(() => setSelectTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, selectTimer]);

  useEffect(() => {
    if (phase === 'gameover' || phase === 'victory' || !startTime) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime, phase]);

  const handleSelect = useCallback((color: ColorData) => {
    if (phase !== 'selecting') return;
    setSelectedAnswer(color.hex);
    playSound.cardTap();

    if (color.hex === currentRound.correctAnswer) {
      playSound.matchSuccess();
      const bonus = streak >= 2 ? Math.min(streak, 3) * 5 : 0;
      setScore(s => s + 10 + bonus);
      setStreak(s => { const next = s + 1; setBestStreak(b => Math.max(b, next)); return next; });
      setPhase('correct');
      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) { playSound.winFanfare(); setPhase('victory'); return; }
        const nextRound = generateRound(round + 1);
        setCurrentRound(nextRound);
        setRound(r => r + 1);
        setShowTimer(SHOW_DURATION);
        setSelectedAnswer(null);
        setPhase('showing');
      }, 1000);
    } else {
      playSound.errorBuzz();
      setStreak(0);
      setLives(l => {
        const next = l - 1;
        if (next <= 0) setTimeout(() => setPhase('gameover'), 500);
        return next;
      });
      setPhase('wrong');
      setTimeout(() => {
        if (lives <= 1) return;
        setCurrentRound(generateRound(round));
        setShowTimer(SHOW_DURATION);
        setSelectedAnswer(null);
        setPhase('showing');
      }, 1500);
    }
  }, [phase, currentRound, round, streak, lives]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const getDifficultyLabel = () => round <= 3 ? 'সহজ' : round <= 6 ? 'মাঝারি' : 'কঠিন';

  const handleSaveScore = () => {
    const fs = calculateScore(elapsed);
    saveScore({
      id: crypto.randomUUID(),
      playerName: playerName || 'বেনামী',
      score: fs.score, time: elapsed, level: getDifficultyLabel(),
      stars: fs.stars, gameType: 'memory-cards', timestamp: Date.now(),
    } as GameScore);
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 pt-24 pb-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> খেলায় ফিরুন
          </button>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}>
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black mb-3 text-white" style={{ fontFamily: 'var(--font-playfair)' }}>রঙ মেমরি গেম 🎨</h1>
            <p className="text-slate-300 leading-relaxed">রঙের নাম দেখানো হবে অন্য রঙে লেখা — শব্দটি যে রঙে লেখা সেই রঙ বেছে নাও!</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-bold mb-4 text-center text-white">কিভাবে খেলবে?</h3>
            <div className="space-y-3 text-sm text-slate-300">
              {[
                'একটি রঙের নাম দেখানো হবে, কিন্তু ভিন্ন রঙে লেখা (যেমন "লাল" নীল রঙে)',
                'শব্দটি যে রঙে লেখা সেই রঙের বাটনে চাপো',
                'মোট ১০ পর্যায়, ৩ জীবন — দ্রুত উত্তরে বোনাস!',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8 text-center">
            <p className="text-slate-400 text-xs mb-2">উদাহরণ</p>
            <span className="text-4xl font-black" style={{ color: '#2563EB' }}>লাল</span>
            <p className="text-slate-400 text-sm mt-2">এখানে সঠিক উত্তর হলো <strong className="text-blue-400">নীল</strong></p>
          </div>

          <button onClick={startGame} className="w-full h-14 rounded-2xl font-bold text-black text-lg transition-all hover:scale-[1.02] hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
            খেলা শুরু করো! 🚀
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'victory') {
    const fs = calculateScore(elapsed);
    return (
      <>
        <Confetti />
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 pt-24 pb-20 flex items-center justify-center">
          <div className="max-w-md w-full px-4 mx-auto text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-5xl font-black mb-2 text-white" style={{ fontFamily: 'var(--font-playfair)' }}>অসাধারণ!</h1>
            <p className="text-5xl font-black mb-2" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score} পয়েন্ট</p>
            <p className="text-2xl mb-6">{'⭐'.repeat(fs.stars)}</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <p className="text-xl font-bold text-white mb-4">{fs.message}</p>
              <div className="space-y-1 text-sm text-slate-300">
                <p>⏱ সময়: {formatTime(elapsed)}</p>
                <p>✅ সব পর্যায় সম্পন্ন: {TOTAL_ROUNDS}/{TOTAL_ROUNDS}</p>
                <p>🔥 সর্বোচ্চ ধারা: {bestStreak}x</p>
              </div>
            </div>
            {!playerName && !showNameInput && (
              <button onClick={() => setShowNameInput(true)} className="w-full mb-3 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors">স্কোর সংরক্ষণ করো</button>
            )}
            {showNameInput && !playerName && (
              <div className="mb-3">
                <input type="text" placeholder="তোমার নাম লেখো..." value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setPlayerName(nameInput.trim()); handleSaveScore(); } }}
                  className="w-full h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 mb-2" autoFocus />
                <button onClick={() => { if (nameInput.trim()) { setPlayerName(nameInput.trim()); handleSaveScore(); } }} disabled={!nameInput.trim()}
                  className="w-full py-3 rounded-xl font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>সংরক্ষণ করো</button>
              </div>
            )}
            <div className="space-y-2">
              <button onClick={startGame} className="w-full h-12 rounded-xl font-bold text-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>
                <RotateCcw className="w-4 h-4" /> আবার খেলো
              </button>
              <button onClick={onExit} className="w-full h-12 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-colors">খেলায় ফিরুন</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (phase === 'gameover') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full px-4 mx-auto text-center">
          <div className="text-7xl mb-4">💔</div>
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>খেলা শেষ!</h1>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <p className="text-5xl font-black mb-3" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score}</p>
            <div className="space-y-1 text-sm text-slate-300">
              <p>পর্যায়: {round}/{TOTAL_ROUNDS}</p>
              <p>সময়: {formatTime(elapsed)}</p>
            </div>
          </div>
          {!playerName && !showNameInput && score > 0 && (
            <button onClick={() => setShowNameInput(true)} className="w-full mb-3 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors">স্কোর সংরক্ষণ করো</button>
          )}
          {showNameInput && !playerName && score > 0 && (
            <div className="mb-3">
              <input type="text" placeholder="তোমার নাম লেখো..." value={nameInput} onChange={e => setNameInput(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 mb-2" autoFocus />
              <button onClick={() => { if (nameInput.trim()) { setPlayerName(nameInput.trim()); handleSaveScore(); } }} disabled={!nameInput.trim()}
                className="w-full py-3 rounded-xl font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>সংরক্ষণ করো</button>
            </div>
          )}
          <div className="space-y-2">
            <button onClick={startGame} className="w-full h-12 rounded-xl font-bold text-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>
              <RotateCcw className="w-4 h-4" /> আবার খেলো
            </button>
            <button onClick={onExit} className="w-full h-12 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-colors">খেলায় ফিরুন</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরুন
          </button>
          <button onClick={startGame} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> পুনরায়
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'স্কোর', value: score, accent: true },
            { label: 'রঙ সংখ্যা', value: getOptionCount() },
            { label: 'পর্যায়', value: `${round}/${TOTAL_ROUNDS}` },
            { label: 'জীবন', value: Array.from({ length: 3 }).map((_, i) => i < lives ? '❤️' : '🖤').join('') },
          ].map(({ label, value, accent }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center">
              <div className="text-slate-400 text-xs mb-0.5">{label}</div>
              <div className={cn('font-bold text-base', accent ? 'text-pink-400' : 'text-white')}>{value}</div>
            </div>
          ))}
        </div>

        {streak >= 2 && (
          <div className="text-center mb-4">
            <span className="bg-orange-500/20 text-orange-300 px-4 py-1.5 rounded-full text-sm font-bold border border-orange-500/30">
              🔥 ধারা: {streak}x {streak >= 3 ? '— বোনাস পাচ্ছো!' : ''}
            </span>
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          {phase === 'showing' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4 text-slate-400 text-sm">
                <Eye className="w-4 h-4" /> মনোযোগ দাও! লুকাচ্ছি {showTimer}s...
              </div>
              <div className="py-12">
                <span className="text-6xl sm:text-7xl font-black" style={{ color: currentRound.wordColor }}>
                  {currentRound.wordText}
                </span>
              </div>
              <p className="text-sm text-slate-400">শব্দটি যে রঙে লেখা সেই রঙ মনে রাখো</p>
            </div>
          )}

          {phase === 'selecting' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3 text-slate-400 text-sm">
                <EyeOff className="w-4 h-4" /> কোন রঙে লেখা ছিল?
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                <div className={cn('h-2 rounded-full transition-all duration-1000', selectTimer <= 3 ? 'bg-red-500' : 'bg-gradient-to-r from-pink-500 to-purple-500')}
                  style={{ width: `${(selectTimer / SELECT_TIMEOUT) * 100}%` }} />
              </div>
              <div className="mb-6 py-5 bg-white/5 rounded-xl">
                <span className="text-3xl font-black text-white">{currentRound.wordText}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {options.map((color) => (
                  <button key={color.hex} onClick={() => handleSelect(color)}
                    className="py-4 px-3 rounded-xl font-black text-xl text-white transition-all hover:scale-105 hover:shadow-2xl border-2 border-white/20"
                    style={{ backgroundColor: color.hex }}>
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'correct' && (
            <div className="text-center py-10">
              <div className="text-6xl mb-3 animate-bounce">✅</div>
              <h3 className="text-2xl font-black text-green-400 mb-2">সঠিক! 🎯</h3>
              <p className="text-slate-300">শব্দটি <span style={{ color: currentRound.correctAnswer }} className="font-black">{currentRound.correctAnswerName}</span> রঙে ছিল</p>
              {streak >= 2 && <p className="text-orange-400 font-bold mt-2">+{Math.min(streak - 1, 3) * 5} বোনাস 🔥</p>}
            </div>
          )}

          {phase === 'wrong' && (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">❌</div>
              <h3 className="text-2xl font-black text-red-400 mb-2">ভুল হয়েছে!</h3>
              <p className="text-slate-300">সঠিক উত্তর ছিল <span style={{ color: currentRound.correctAnswer }} className="font-black">{currentRound.correctAnswerName}</span></p>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-slate-500 text-center mb-2">রঙের তালিকা</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COLORS.map((color) => (
              <div key={color.hex} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border"
                style={{ backgroundColor: color.hex + '20', color: color.hex, borderColor: color.hex + '40' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.hex }} />
                {color.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
