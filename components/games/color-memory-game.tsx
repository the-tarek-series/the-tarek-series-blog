'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy, Eye, EyeOff, Palette } from 'lucide-react';
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

export function ColorMemoryGame({ onExit }: Props) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [colorCount, setColorCount] = useState(6);
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

  const getOptionCount = useCallback(() => {
    if (round <= 3) return 4;
    if (round <= 6) return 5;
    return 6;
  }, [round]);

  const getOptions = useCallback((): ColorData[] => {
    const count = getOptionCount();
    const correctColor = COLORS.find(c => c.hex === currentRound.correctAnswer)!;
    const others = COLORS.filter(c => c.hex !== currentRound.correctAnswer);
    const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, count - 1);
    return [correctColor, ...shuffled].sort(() => Math.random() - 0.5);
  }, [currentRound, getOptionCount]);

  const [options, setOptions] = useState<ColorData[]>([]);

  // Start game
  const startGame = useCallback(() => {
    setRound(1);
    setScore(0);
    setLives(3);
    setStreak(0);
    setBestStreak(0);
    const firstRound = generateRound(1);
    setCurrentRound(firstRound);
    setPhase('showing');
    setShowTimer(SHOW_DURATION);
    setStartTime(Date.now());
    setElapsed(0);
  }, []);

  // Generate options when entering selecting phase
  useEffect(() => {
    if (phase === 'selecting') {
      const count = getOptionCount();
      const correctColor = COLORS.find(c => c.hex === currentRound.correctAnswer)!;
      const others = COLORS.filter(c => c.hex !== currentRound.correctAnswer);
      const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, count - 1);
      const newOptions = [correctColor, ...shuffled].sort(() => Math.random() - 0.5);
      setOptions(newOptions);
      setSelectTimer(SELECT_TIMEOUT);
    }
  }, [phase, currentRound, getOptionCount]);

  // Show timer countdown
  useEffect(() => {
    if (phase !== 'showing') return;
    if (showTimer <= 0) {
      setPhase('selecting');
      return;
    }
    const t = setTimeout(() => setShowTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, showTimer]);

  // Select timer countdown
  useEffect(() => {
    if (phase !== 'selecting') return;
    if (selectTimer <= 0) {
      playSound.errorBuzz();
      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setTimeout(() => setPhase('gameover'), 500);
        }
        return next;
      });
      setStreak(0);
      setPhase('wrong');
      return;
    }
    const t = setTimeout(() => setSelectTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, selectTimer]);

  // Elapsed timer
  useEffect(() => {
    if (phase === 'gameover' || phase === 'victory') return;
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, phase]);

  // Handle color selection
  const handleSelect = useCallback((color: ColorData) => {
    if (phase !== 'selecting') return;
    setSelectedAnswer(color.hex);
    playSound.cardTap();

    if (color.hex === currentRound.correctAnswer) {
      playSound.matchSuccess();
      const bonus = streak >= 2 ? Math.min(streak, 3) * 5 : 0;
      setScore(s => s + 10 + bonus);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
      setPhase('correct');

      setTimeout(() => {
        if (round >= TOTAL_ROUNDS) {
          setPhase('victory');
          playSound.winFanfare();
          return;
        }
        const nextRound = generateRound(round + 1);
        setCurrentRound(nextRound);
        setRound(r => r + 1);
        setPhase('showing');
        setShowTimer(SHOW_DURATION);
        setSelectedAnswer(null);
      }, 1000);
    } else {
      playSound.errorBuzz();
      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setTimeout(() => setPhase('gameover'), 500);
        }
        return next;
      });
      setStreak(0);
      setPhase('wrong');

      setTimeout(() => {
        if (lives <= 1) return;
        const nextRound = generateRound(round);
        setCurrentRound(nextRound);
        setPhase('showing');
        setShowTimer(SHOW_DURATION);
        setSelectedAnswer(null);
      }, 1500);
    }
  }, [phase, currentRound, round, streak, lives]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate difficulty level for scoring
  const getDifficultyLabel = () => {
    if (round <= 3) return 'সহজ';
    if (round <= 6) return 'মাঝারি';
    return 'কঠিন';
  };

  // Save score on game end
  const handleSaveScore = () => {
    const finalScore = calculateScore(elapsed);
    const gameScore: GameScore = {
      id: crypto.randomUUID(),
      playerName: playerName || 'বেনামী',
      score: finalScore.score,
      time: elapsed,
      level: getDifficultyLabel(),
      stars: finalScore.stars,
      gameType: 'memory-cards',
      timestamp: Date.now(),
    };
    saveScore(gameScore);
  };

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> খেলায় ফিরুন
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Palette className="w-8 h-8 text-pink-600" />
            </div>
            <h1
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              রঙ মেমরি গেম
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              একটি রঙের নাম দেখানো হবে অন্য রঙে লেখা। আপনাকে শব্দটি যে রঙে লেখা হয়েছে সেই রঙ নির্বাচন করতে হবে, শব্দটি নয়!
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <h3 className="font-bold mb-4 text-center">কিভাবে খেলবেন?</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">১</span>
                <p>একটি রঙের নাম দেখানো হবে, কিন্তু এটি অন্য রঙে লেখা থাকবে (যেমন "লাল" নীল রঙে লেখা)</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">২</span>
                <p>শব্দটি যে রঙে লেখা হয়েছে সেই রঙের কার্ডে ক্লিক করুন</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">৩</span>
                <p>মোট ১০ পর্যায়, ৩ জীবন। দ্রুত সঠিক উত্তরে বোনাস স্কোর!</p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="bg-muted/50 border border-border rounded-xl p-6 mb-8">
            <h3 className="font-bold mb-3 text-center">উদাহরণ</h3>
            <div className="text-center mb-3">
              <span className="text-3xl font-bold" style={{ color: '#2563EB' }}>লাল</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              এখানে "লাল" শব্দটি <strong className="text-blue-600">নীল</strong> রঙে লেখা, তাই সঠিক উত্তর হলো <strong className="text-blue-600">নীল</strong>
            </p>
          </div>

          <Button
            onClick={startGame}
            className="w-full bg-accent hover:bg-accent/90 text-white h-12"
          >
            খেলা শুরু করুন
          </Button>
        </div>
      </div>
    );
  }

  // Victory screen
  if (phase === 'victory') {
    const finalScore = calculateScore(elapsed);
    return (
      <>
        <Confetti />
        <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full px-4 mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h1
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                জয়ী!
              </h1>
              <p className="text-5xl font-bold text-accent mb-2">{score}</p>
              <p className="text-lg mb-4 flex justify-center gap-1">
                {'⭐'.repeat(finalScore.stars)}
              </p>

              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <p className="text-2xl font-bold mb-4">{finalScore.message}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>সময়: {formatTime(elapsed)}</p>
                  <p>পর্যায় সম্পন্ন: {TOTAL_ROUNDS}/{TOTAL_ROUNDS}</p>
                  <p>সর্বোচ্চ ধারা: {bestStreak}</p>
                </div>
              </div>

              {!playerName && !showNameInput && (
                <Button
                  onClick={() => setShowNameInput(true)}
                  variant="outline"
                  className="w-full mb-3"
                >
                  স্কোর সংরক্ষণ করুন
                </Button>
              )}

              {showNameInput && !playerName && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="আপনার নাম লিখুন..."
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nameInput.trim()) {
                        setPlayerName(nameInput.trim());
                        handleSaveScore();
                      }
                    }}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/50 mb-2"
                    autoFocus
                  />
                  <Button
                    onClick={() => {
                      if (nameInput.trim()) {
                        setPlayerName(nameInput.trim());
                        handleSaveScore();
                      }
                    }}
                    disabled={!nameInput.trim()}
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                  >
                    সংরক্ষণ করুন
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={startGame}
                  className="w-full bg-accent hover:bg-accent/90 text-white h-12 gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  আবার খেলুন
                </Button>
                <Button onClick={onExit} variant="ghost" className="w-full h-12">
                  খেলায় ফিরুন
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Game over screen
  if (phase === 'gameover') {
    return (
      <div className="pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4 mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">💔</div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              খেলা শেষ!
            </h1>

            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold text-accent mb-2">{score} পয়েন্ট</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>পর্যায়: {round}/{TOTAL_ROUNDS}</p>
                <p>সময়: {formatTime(elapsed)}</p>
              </div>
            </div>

            {!playerName && !showNameInput && score > 0 && (
              <Button
                onClick={() => setShowNameInput(true)}
                variant="outline"
                className="w-full mb-3"
              >
                স্কোর সংরক্ষণ করুন
              </Button>
            )}

            {showNameInput && !playerName && score > 0 && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="আপনার নাম লিখুন..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nameInput.trim()) {
                      setPlayerName(nameInput.trim());
                      handleSaveScore();
                    }
                  }}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/50 mb-2"
                  autoFocus
                />
                <Button
                  onClick={() => {
                    if (nameInput.trim()) {
                      setPlayerName(nameInput.trim());
                      handleSaveScore();
                    }
                  }}
                  disabled={!nameInput.trim()}
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  সংরক্ষণ করুন
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={startGame}
                className="w-full bg-accent hover:bg-accent/90 text-white h-12 gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                আবার খেলুন
              </Button>
              <Button onClick={onExit} variant="ghost" className="w-full h-12">
                খেলায় ফিরুন
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> খেলায় ফিরুন
          </button>
          <Button onClick={startGame} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" /> পুনরায় শুরু
          </Button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1 min-w-[80px]">
            <div className="text-muted-foreground text-xs mb-0.5">স্কোর</div>
            <div className="font-bold text-lg text-accent">{score}</div>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1 min-w-[80px]">
            <div className="text-muted-foreground text-xs mb-0.5">রঙ সংখ্যা</div>
            <div className="font-bold text-lg">{getOptionCount()}</div>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1 min-w-[80px]">
            <div className="text-muted-foreground text-xs mb-0.5">পর্যায়</div>
            <div className="font-bold text-lg">{round}/{TOTAL_ROUNDS}</div>
          </div>
          <div className="bg-card border border-border rounded-xl px-4 py-3 flex-1 min-w-[80px]">
            <div className="text-muted-foreground text-xs mb-0.5">জীবন</div>
            <div className="font-bold text-lg">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? 'opacity-100' : 'opacity-20'}>
                  {'❤️'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Streak indicator */}
        {streak >= 2 && (
          <div className="text-center mb-4">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
              🔥 ধারা: {streak}x {streak >= 3 ? '(বোনাস!)' : ''}
            </span>
          </div>
        )}

        {/* Game area */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-6">
          {/* Showing phase - display the color word */}
          {phase === 'showing' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground text-sm">
                <Eye className="w-4 h-4" /> মনোযোগ দিন! লুকাচ্ছি {showTimer}...
              </div>
              <div className="py-12">
                <span
                  className="text-5xl sm:text-6xl font-black"
                  style={{ color: currentRound.wordColor }}
                >
                  {currentRound.wordText}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                শব্দটি যে রঙে লেখা সেই রঙ মনে রাখুন
              </p>
            </div>
          )}

          {/* Selecting phase - choose the color */}
          {phase === 'selecting' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground text-sm">
                <EyeOff className="w-4 h-4" /> শব্দটি যে রঙে লেখা ছিল সেই রঙ বেছে নিন
              </div>

              {/* Timer bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-6">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-1000',
                    selectTimer <= 3 ? 'bg-red-500' : 'bg-accent'
                  )}
                  style={{ width: `${(selectTimer / SELECT_TIMEOUT) * 100}%` }}
                />
              </div>

              {/* Hint text */}
              <div className="mb-6 py-6 bg-muted/50 rounded-xl">
                <span className="text-3xl font-bold">{currentRound.wordText}</span>
                <p className="text-sm text-muted-foreground mt-2">
                  এই শব্দটি কোন রঙে লেখা ছিল?
                </p>
              </div>

              {/* Color options */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {options.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => handleSelect(color)}
                    className={cn(
                      'py-4 px-4 rounded-xl font-bold text-lg transition-all border-2',
                      'text-white hover:scale-105 hover:shadow-lg'
                    )}
                    style={{
                      backgroundColor: color.hex,
                      borderColor: color.hex,
                    }}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Correct feedback */}
          {phase === 'correct' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">সঠিক!</h3>
              <p className="text-muted-foreground">
                শব্দটি <span style={{ color: currentRound.correctAnswer }} className="font-bold">{currentRound.correctAnswerName}</span> রঙে লেখা ছিল
              </p>
            </div>
          )}

          {/* Wrong feedback */}
          {phase === 'wrong' && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">ভুল!</h3>
              <p className="text-muted-foreground">
                সঠিক উত্তর ছিল <span style={{ color: currentRound.correctAnswer }} className="font-bold">{currentRound.correctAnswerName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Color reference */}
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground text-center mb-2">রঙের তালিকা</p>
          <div className="flex flex-wrap justify-center gap-2">
            {COLORS.map((color) => (
              <div
                key={color.hex}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: color.hex + '15',
                  color: color.hex,
                  border: `1px solid ${color.hex}30`,
                }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
