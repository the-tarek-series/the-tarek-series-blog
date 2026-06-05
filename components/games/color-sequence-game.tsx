'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Palette, Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/audio-utils';
import { Confetti } from './confetti';

type GamePhase = 'intro' | 'playing' | 'correct' | 'wrong' | 'victory';
type StroopDifficulty = 'easy' | 'medium' | 'hard';

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

const STROOP_CONFIG: Record<StroopDifficulty, { label: string; selectTimeout: number; colorCount: number }> = {
  easy:   { label: 'সহজ',    selectTimeout: 2,   colorCount: 4 },
  medium: { label: 'মাঝারি', selectTimeout: 1.5, colorCount: 6 },
  hard:   { label: 'কঠিন',   selectTimeout: 1,   colorCount: 6 },
};

const TOTAL_ROUNDS = 10;

interface RoundData {
  wordText: string;
  wordColor: string;
  wordColorName: string;
  correctAnswer: string;
  correctAnswerName: string;
}

function generateRound(colorCount: number): RoundData {
  const available = COLORS.slice(0, colorCount);
  const wordIdx = Math.floor(Math.random() * available.length);
  let colorIdx = Math.floor(Math.random() * available.length);
  while (colorIdx === wordIdx) colorIdx = Math.floor(Math.random() * available.length);
  return {
    wordText: available[wordIdx].name,
    wordColor: available[colorIdx].hex,
    wordColorName: available[colorIdx].name,
    correctAnswer: available[colorIdx].hex,
    correctAnswerName: available[colorIdx].name,
  };
}

function winMessage(score: number): string {
  if (score === TOTAL_ROUNDS) return 'তুমি জিনিয়াস! 🧠🔥';
  if (score >= 7) return 'দারুণ! 🎉';
  if (score >= 5) return 'ভালো চেষ্টা! 👏';
  return 'আরো চেষ্টা করো! 💪';
}

interface ScoreEntry { name: string; score: number; diff: string; }

function getScoreboard(): ScoreEntry[] {
  try { return JSON.parse(localStorage.getItem('stroop_scores') || '[]'); } catch { return []; }
}
function saveToScoreboard(entry: ScoreEntry) {
  const scores = getScoreboard();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem('stroop_scores', JSON.stringify(scores.slice(0, 10)));
}
function getSavedName(): string {
  return localStorage.getItem('stroop_player_name') || '';
}
function savePlayerName(name: string) {
  localStorage.setItem('stroop_player_name', name);
}

interface Props {
  onExit: () => void;
}

export function ColorSequenceGame({ onExit }: Props) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [difficulty, setDifficulty] = useState<StroopDifficulty>('easy');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState<RoundData>(() => generateRound(4));
  const [selectTimer, setSelectTimer] = useState(2);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [options, setOptions] = useState<ColorData[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const saved = getSavedName();
    if (saved) setPlayerName(saved);
  }, []);

  const getSelectTimeout = useCallback(() => STROOP_CONFIG[difficulty].selectTimeout, [difficulty]);
  const getOptionCount = useCallback(() => STROOP_CONFIG[difficulty].colorCount, [difficulty]);

  const startGame = useCallback((diff?: StroopDifficulty) => {
    const d = diff ?? difficulty;
    setDifficulty(d);
    const cfg = STROOP_CONFIG[d];
    const firstRound = generateRound(cfg.colorCount);
    setCurrentRound(firstRound);
    setRound(1);
    setScore(0);
    setSelectedAnswer(null);
    setSelectTimer(cfg.selectTimeout);
    setShowNameInput(false);
    setPhase('playing');
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'playing') {
      const count = getOptionCount();
      const available = COLORS.slice(0, count);
      const correctColor = available.find(c => c.hex === currentRound.correctAnswer)!;
      const others = available.filter(c => c.hex !== currentRound.correctAnswer);
      const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, count - 1);
      setOptions([correctColor, ...shuffled].sort(() => Math.random() - 0.5));
      setSelectTimer(getSelectTimeout());
    }
  }, [phase, currentRound, getOptionCount, getSelectTimeout]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (selectTimer <= 0) {
      playSound.errorBuzz();
      setPhase('wrong');
      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          playSound.winFanfare();
          setScoreboard(getScoreboard());
          setPhase('victory');
          return;
        }
        const nextRound = generateRound(getOptionCount());
        setCurrentRound(nextRound);
        setRound(r => r + 1);
        setSelectedAnswer(null);
        setPhase('playing');
      }, 1000);
      return;
    }
    const t = setTimeout(() => setSelectTimer(s => Math.max(0, +(s - 0.1).toFixed(2))), 100);
    return () => clearTimeout(t);
  }, [phase, selectTimer, round, getOptionCount]);

  const handleSelect = useCallback((color: ColorData) => {
    if (phase !== 'playing') return;
    setSelectedAnswer(color.hex);
    playSound.cardTap();

    const isCorrect = color.hex === currentRound.correctAnswer;
    if (isCorrect) {
      playSound.matchSuccess();
      setScore(s => s + 1);
      setPhase('correct');
    } else {
      playSound.errorBuzz();
      setPhase('wrong');
    }

    setTimeout(() => {
      if (round >= TOTAL_ROUNDS) {
        playSound.winFanfare();
        setScoreboard(getScoreboard());
        setPhase('victory');
        return;
      }
      const nextRound = generateRound(getOptionCount());
      setCurrentRound(nextRound);
      setRound(r => r + 1);
      setSelectedAnswer(null);
      setPhase('playing');
    }, 1000);
  }, [phase, currentRound, round, getOptionCount]);

  const handleSaveScore = (name: string, finalScore: number) => {
    savePlayerName(name);
    saveToScoreboard({ name, score: finalScore, diff: STROOP_CONFIG[difficulty].label });
    setScoreboard(getScoreboard());
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
            <p className="text-slate-300 leading-relaxed">স্ট্রোপ ইফেক্ট — রঙের নাম অন্য রঙে লেখা থাকবে, লেখার রঙ বেছে নাও!</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h3 className="font-bold mb-4 text-center text-white">কিভাবে খেলবে?</h3>
            <div className="space-y-3 text-sm text-slate-300">
              {[
                'একটি রঙের নাম দেখানো হবে, কিন্তু ভিন্ন রঙে লেখা (যেমন "লাল" নীল রঙে)',
                'শব্দটি যে রঙে লেখা আছে সেই রঙের বাটনে চাপো',
                'মোট ১০ প্রশ্ন — সময়ের মধ্যে উত্তর দিতে হবে!',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-center">
            <p className="text-slate-400 text-xs mb-2">উদাহরণ</p>
            <span className="text-4xl font-black" style={{ color: '#2563EB' }}>লাল</span>
            <p className="text-slate-400 text-sm mt-2">সঠিক উত্তর: <strong className="text-blue-400">নীল</strong> (লেখার রঙ)</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={cn('py-3 rounded-xl border-2 font-bold text-sm transition-all',
                  difficulty === d
                    ? 'border-pink-500 bg-pink-500/20 text-white'
                    : 'border-white/20 text-slate-400 hover:border-white/40 hover:text-white'
                )}>
                {STROOP_CONFIG[d].label}
                <div className="text-xs font-normal mt-0.5 opacity-70">{STROOP_CONFIG[d].selectTimeout}s</div>
              </button>
            ))}
          </div>

          <button onClick={() => startGame(difficulty)} className="w-full h-14 rounded-2xl font-bold text-black text-lg transition-all hover:scale-[1.02] hover:shadow-2xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>
            খেলা শুরু করো! 🚀
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'victory') {
    const msg = winMessage(score);
    return (
      <>
        <Confetti />
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 pt-24 pb-20 flex items-center justify-center">
          <div className="max-w-md w-full px-4 mx-auto text-center">
            <div className="text-7xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-5xl font-black mb-2 text-white" style={{ fontFamily: 'var(--font-playfair)' }}>শেষ!</h1>
            <p className="text-5xl font-black mb-6" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {score}/{TOTAL_ROUNDS}
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <p className="text-xl font-bold text-white mb-3">{msg}</p>
              <p className="text-slate-400 text-sm">কঠিনতা: {STROOP_CONFIG[difficulty].label}</p>
            </div>

            {!playerName && !showNameInput && (
              <button onClick={() => setShowNameInput(true)} className="w-full mb-3 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors">স্কোর সংরক্ষণ করো</button>
            )}
            {showNameInput && !playerName && (
              <div className="mb-3">
                <input type="text" placeholder="তোমার নাম লেখো..." value={nameInput} onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && nameInput.trim()) { setPlayerName(nameInput.trim()); handleSaveScore(nameInput.trim(), score); } }}
                  className="w-full h-11 px-4 rounded-xl border border-white/20 bg-white/5 text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/50 mb-2" autoFocus />
                <button onClick={() => { if (nameInput.trim()) { setPlayerName(nameInput.trim()); handleSaveScore(nameInput.trim(), score); } }} disabled={!nameInput.trim()}
                  className="w-full py-3 rounded-xl font-bold text-black disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>সংরক্ষণ করো</button>
              </div>
            )}
            {playerName && (
              <div className="mb-3">
                <button onClick={() => handleSaveScore(playerName, score)} className="w-full py-3 rounded-xl font-bold text-black" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>
                  {playerName}-এর স্কোর সংরক্ষণ করো ✅
                </button>
              </div>
            )}

            <div className="space-y-2">
              <button onClick={() => startGame()} className="w-full h-12 rounded-xl font-bold text-black flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#f59e0b,#ec4899)' }}>
                <RotateCcw className="w-4 h-4" /> আবার খেলো
              </button>
              <button onClick={() => setPhase('intro')} className="w-full h-12 rounded-xl border border-white/20 text-slate-300 hover:bg-white/10 transition-colors">কঠিনতা বদলাও</button>
              <button onClick={onExit} className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-300 transition-colors text-sm">খেলায় ফিরুন</button>
            </div>

            {scoreboard.length > 0 && (
              <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-left">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> শীর্ষ স্কোর</h3>
                <div className="space-y-1.5">
                  {scoreboard.slice(0, 10).map((s, i) => (
                    <div key={i} className={cn('flex items-center justify-between px-3 py-2 rounded-lg text-sm', i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5')}>
                      <div className="flex items-center gap-2">
                        {i === 0 ? <Crown className="w-4 h-4 text-yellow-400" /> : <span className="text-slate-500 w-4 text-center">{i + 1}</span>}
                        <span className="text-white">{s.name}</span>
                        <span className="text-slate-500 text-xs">{s.diff}</span>
                      </div>
                      <span className="font-black text-yellow-400">{s.score}/{TOTAL_ROUNDS}</span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরুন
          </button>
          <button onClick={() => startGame()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> পুনরায়
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'স্কোর', value: `${score}/${TOTAL_ROUNDS}`, accent: true },
            { label: 'প্রশ্ন', value: `${round}/${TOTAL_ROUNDS}` },
            { label: 'কঠিনতা', value: STROOP_CONFIG[difficulty].label },
          ].map(({ label, value, accent }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-center">
              <div className="text-slate-400 text-xs mb-0.5">{label}</div>
              <div className={cn('font-bold text-base', accent ? 'text-pink-400' : 'text-white')}>{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 mb-6">
          {(phase === 'playing' || phase === 'correct' || phase === 'wrong') && (
            <div className="text-center">
              {phase === 'playing' && (
                <>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                    <div
                      className={cn('h-2 rounded-full', selectTimer <= getSelectTimeout() * 0.3 ? 'bg-red-500' : 'bg-gradient-to-r from-pink-500 to-purple-500')}
                      style={{ width: `${(selectTimer / getSelectTimeout()) * 100}%`, transition: 'width 0.1s linear' }}
                    />
                  </div>
                  <p className="text-slate-400 text-sm mb-4">শব্দটি যে রঙে লেখা সেই রঙ বেছে নাও</p>
                  <div className="py-8">
                    <span className="text-6xl sm:text-7xl font-black" style={{ color: currentRound.wordColor }}>
                      {currentRound.wordText}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {options.map((color) => (
                      <button key={color.hex} onClick={() => handleSelect(color)}
                        className={cn(
                          'py-4 px-3 rounded-xl font-black text-xl text-white transition-all hover:scale-105 hover:shadow-2xl border-2',
                          selectedAnswer === color.hex ? 'border-white scale-105' : 'border-white/20'
                        )}
                        style={{ backgroundColor: color.hex }}>
                        {color.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {phase === 'correct' && (
                <div className="py-10">
                  <div className="text-6xl mb-3 animate-bounce">✅</div>
                  <h3 className="text-2xl font-black text-green-400 mb-2">সঠিক! 🎯</h3>
                  <p className="text-slate-300">রঙটি ছিল <span style={{ color: currentRound.correctAnswer }} className="font-black">{currentRound.correctAnswerName}</span></p>
                </div>
              )}

              {phase === 'wrong' && (
                <div className="py-10">
                  <div className="text-6xl mb-3">❌</div>
                  <h3 className="text-2xl font-black text-red-400 mb-2">ভুল!</h3>
                  <p className="text-slate-300">সঠিক উত্তর: <span style={{ color: currentRound.correctAnswer }} className="font-black">{currentRound.correctAnswerName}</span></p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
