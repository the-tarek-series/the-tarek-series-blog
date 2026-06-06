'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Eye, EyeOff } from 'lucide-react';

type Phase = 'show' | 'input' | 'result';

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
}

interface Props { onExit: () => void; }

export function NumberSequenceGame({ onExit }: Props) {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>('show');
  const [sequence, setSequence] = useState<number[]>(generateSequence(3));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showCount, setShowCount] = useState(3);

  useEffect(() => {
    if (phase !== 'show') return;
    setShowCount(3);
    const interval = setInterval(() => {
      setShowCount((c) => {
        if (c <= 1) { clearInterval(interval); setPhase('input'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, sequence]);

  function checkAnswer() {
    const correct = sequence.join(' ');
    const given = input.trim();
    if (given === correct) {
      setScore((s) => s + level * 10);
      setLevel((l) => l + 1);
      const newSeq = generateSequence(3 + level);
      setSequence(newSeq);
      setInput('');
      setPhase('show');
    } else {
      setLives((l) => { const next = l - 1; if (next <= 0) setGameOver(true); return next; });
      setPhase('result');
    }
  }

  function nextRound() {
    if (lives <= 0) { setGameOver(true); return; }
    const newSeq = generateSequence(3 + level - 1);
    setSequence(newSeq);
    setInput('');
    setPhase('show');
  }

  function restart() {
    setLevel(1);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setSequence(generateSequence(3));
    setInput('');
    setPhase('show');
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Games</button>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Number Sequence</h1>
        <p className="text-muted-foreground mb-8">Memorize the sequence, then type it back with spaces between numbers.</p>

        {gameOver ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Game Over</h2>
            <p className="text-muted-foreground mb-2">You reached level {level}</p>
            <p className="text-5xl font-bold text-accent mb-8">{score} pts</p>
            <Button onClick={restart} className="bg-accent hover:bg-accent/90 text-white">Play Again</Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8 text-sm">
              <div><span className="text-muted-foreground">Level </span><span className="font-bold text-xl">{level}</span></div>
              <div><span className="text-muted-foreground">Score </span><span className="font-bold text-xl text-accent">{score}</span></div>
              <div className="flex gap-1">{Array.from({ length: 3 }).map((_, i) => <span key={i} className={`text-xl ${i < lives ? 'opacity-100' : 'opacity-20'}`}>&#9829;</span>)}</div>
            </div>

            {phase === 'show' && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground text-sm">
                  <Eye className="w-4 h-4" /> Memorize! Hiding in {showCount}s...
                </div>
                <div className="flex justify-center gap-3 flex-wrap mt-6">
                  {sequence.map((n, i) => <div key={i} className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center text-white font-bold text-2xl">{n}</div>)}
                </div>
              </div>
            )}

            {phase === 'input' && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-6 text-muted-foreground text-sm">
                  <EyeOff className="w-4 h-4" /> Enter the sequence (e.g., &quot;3 7 2&quot;)
                </div>
                <input
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                  placeholder="3 7 2 ..."
                  className="w-full h-14 px-5 text-xl text-center rounded-xl border-2 border-border focus:border-accent focus:outline-none bg-background font-mono mb-5"
                />
                <Button onClick={checkAnswer} className="bg-accent hover:bg-accent/90 text-white w-full h-12">Check Answer</Button>
              </div>
            )}

            {phase === 'result' && (
              <div className="text-center">
                <div className="text-4xl mb-4">&#10060;</div>
                <h3 className="text-lg font-bold mb-2">Incorrect!</h3>
                <p className="text-muted-foreground mb-2">The correct sequence was:</p>
                <div className="flex justify-center gap-3 flex-wrap mb-6">
                  {sequence.map((n, i) => <div key={i} className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center font-bold text-xl">{n}</div>)}
                </div>
                <p className="text-muted-foreground text-sm mb-6">You entered: <strong>{input}</strong></p>
                {lives > 0 ? (
                  <Button onClick={nextRound} className="bg-accent hover:bg-accent/90 text-white">Try Again</Button>
                ) : (
                  <Button onClick={() => setGameOver(true)} className="bg-accent hover:bg-accent/90 text-white">See Results</Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
