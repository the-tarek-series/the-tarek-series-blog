'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw, Trophy, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUESTIONS = [
  { term: 'Classical Conditioning', options: ['Pavlov', 'Freud', 'Skinner', 'Jung'], answer: 'Pavlov' },
  { term: 'Hierarchy of Needs', options: ['Rogers', 'Maslow', 'Bandura', 'Erikson'], answer: 'Maslow' },
  { term: 'Operant Conditioning', options: ['Watson', 'Pavlov', 'Skinner', 'Adler'], answer: 'Skinner' },
  { term: 'Collective Unconscious', options: ['Freud', 'Jung', 'Adler', 'Klein'], answer: 'Jung' },
  { term: 'Cognitive Dissonance', options: ['Festinger', 'Milgram', 'Zimbardo', 'Asch'], answer: 'Festinger' },
  { term: 'Self-Actualization', options: ['Maslow', 'Rogers', 'Frankl', 'Allport'], answer: 'Maslow' },
  { term: 'Social Learning Theory', options: ['Skinner', 'Bandura', 'Watson', 'Thorndike'], answer: 'Bandura' },
  { term: 'Attachment Theory', options: ['Freud', 'Klein', 'Bowlby', 'Winnicott'], answer: 'Bowlby' },
];

interface Props { onExit: () => void; }

export function WordAssociationGame({ onExit }: Props) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const advance = useCallback(() => {
    setSelected(null);
    setTimeLeft(15);
    if (idx + 1 >= QUESTIONS.length) { setFinished(true); } else { setIdx((i) => i + 1); }
  }, [idx]);

  useEffect(() => {
    if (selected !== null || finished) return;
    if (timeLeft <= 0) { advance(); return; }
    const t = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, selected, finished, advance]);

  function choose(option: string) {
    if (selected !== null) return;
    setSelected(option);
    if (option === QUESTIONS[idx].answer) setScore((s) => s + 1);
    setTimeout(advance, 1200);
  }

  function restart() {
    setIdx(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setTimeLeft(15);
  }

  const q = QUESTIONS[idx];
  const pct = Math.round((score / QUESTIONS.length) * 100);

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onExit} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Games</button>
          <Button onClick={restart} variant="outline" size="sm" className="gap-2"><RotateCcw className="w-4 h-4" /> Restart</Button>
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Word Association</h1>
        <p className="text-muted-foreground mb-8">Who is associated with each psychology concept?</p>

        {finished ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Trophy className="w-16 h-16 text-accent mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>{pct >= 70 ? 'Great Job!' : pct >= 50 ? 'Good Effort!' : 'Keep Practicing!'}</h2>
            <p className="text-muted-foreground mb-2">Score: {score} / {QUESTIONS.length}</p>
            <p className="text-4xl font-bold text-accent mb-8">{pct}%</p>
            <Button onClick={restart} className="bg-accent hover:bg-accent/90 text-white gap-2"><RotateCcw className="w-4 h-4" /> Play Again</Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
              <span>Question {idx + 1} of {QUESTIONS.length}</span>
              <div className="flex items-center gap-2"><Timer className="w-4 h-4" /><span className={cn('font-bold', timeLeft <= 5 ? 'text-destructive' : '')}>{timeLeft}s</span></div>
            </div>

            <div className="w-full bg-muted rounded-full h-1.5 mb-8">
              <div className="bg-accent h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / 15) * 100}%` }} />
            </div>

            <div className="text-center mb-8">
              <div className="bg-muted rounded-xl px-8 py-6 mb-2"><h2 className="text-2xl font-bold">{q.term}</h2></div>
              <p className="text-muted-foreground text-sm">Who is associated with this concept?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {q.options.map((option) => (
                <button
                  key={option}
                  onClick={() => choose(option)}
                  disabled={selected !== null}
                  className={cn(
                    'py-4 px-5 rounded-xl text-sm font-medium transition-all border-2',
                    selected === null
                      ? 'bg-muted border-transparent hover:border-accent hover:bg-accent/5 cursor-pointer'
                      : option === q.answer
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : selected === option
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'bg-muted border-transparent opacity-50'
                  )}
                >{option}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
