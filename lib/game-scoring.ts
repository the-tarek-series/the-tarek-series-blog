export interface GameScore {
  id: string;
  playerName: string;
  score: number;
  time: number; // in seconds
  level: string; // Easy, Medium, Hard
  stars: number;
  gameType: 'memory-cards' | 'number-sequence' | 'word-association';
  timestamp: number;
}

export const calculateScore = (timeInSeconds: number): { score: number; stars: number; message: string } => {
  let score = 0;
  let stars = 0;
  let message = '';

  if (timeInSeconds <= 30) {
    score = 10;
    stars = 3;
    message = 'তুমি একটা জিনিয়াস! 🧠🔥';
  } else if (timeInSeconds <= 60) {
    score = 9;
    stars = 3;
    message = 'অসাধারণ! প্রায় পারফেক্ট! 🎉';
  } else if (timeInSeconds <= 90) {
    score = 8;
    stars = 2;
    message = 'বাহ! বেশ ভালো করেছ! 👏';
  } else if (timeInSeconds <= 120) {
    score = 6;
    stars = 1;
    message = 'চেষ্টা করতে থাকো! 💪';
  } else {
    score = 5;
    stars = 1;
    message = 'পরবর্তী বার আরও ভালো করতে পারবে! 🌟';
  }

  return { score, stars, message };
};

export const getScoreboard = (): GameScore[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('game_scoreboard');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveScore = (score: GameScore): void => {
  if (typeof window === 'undefined') return;
  const scoreboard = getScoreboard();
  scoreboard.push(score);
  // Keep only top 100 scores
  scoreboard.sort((a, b) => b.score - a.score);
  localStorage.setItem('game_scoreboard', JSON.stringify(scoreboard.slice(0, 100)));
};

export const getTopScores = (gameType?: string, level?: string): GameScore[] => {
  let scores = getScoreboard();
  if (gameType) scores = scores.filter(s => s.gameType === gameType);
  if (level) scores = scores.filter(s => s.level === level);
  return scores.sort((a, b) => b.score - a.score).slice(0, 10);
};

export const getPlayerStats = (playerName: string): { totalGames: number; highScore: number; bestTime: number } => {
  const scores = getScoreboard().filter(s => s.playerName === playerName);
  return {
    totalGames: scores.length,
    highScore: scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0,
    bestTime: scores.length > 0 ? Math.min(...scores.map(s => s.time)) : 0,
  };
};
