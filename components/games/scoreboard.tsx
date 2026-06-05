'use client';

import { useState, useEffect } from 'react';
import { getTopScores, GameScore } from '@/lib/game-scoring';
import { Trophy, Crown } from 'lucide-react';

interface ScoreboardProps {
  gameType?: 'memory-cards' | 'number-sequence' | 'word-association';
  level?: string;
}

export function Scoreboard({ gameType, level }: ScoreboardProps) {
  const [scores, setScores] = useState<GameScore[]>([]);

  useEffect(() => {
    const topScores = getTopScores(gameType, level);
    setScores(topScores);
  }, [gameType, level]);

  if (scores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>এখনো কোন স্কোর নেই। একটি গেম খেলুন!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" />
        শীর্ষ ১০ স্কোর
      </h3>
      <div className="space-y-2">
        {scores.slice(0, 10).map((score, index) => (
          <div
            key={score.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0 ? 'bg-accent/10 border border-accent/30' : 'bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              {index === 0 ? (
                <Crown className="w-5 h-5 text-accent flex-shrink-0" />
              ) : (
                <span className="text-muted-foreground font-medium w-5">{index + 1}</span>
              )}
              <div className="flex-1">
                <p className="font-medium">{score.playerName}</p>
                <p className="text-xs text-muted-foreground">
                  {score.level} • {score.time}s
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-accent">{score.score}</p>
              <p className="text-xs text-muted-foreground">
                {'⭐'.repeat(score.stars)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
