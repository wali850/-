// GameBox — game registry. Each game module exports mount(host, api).
// Add new games by creating a module and registering it here.
const REG = [
  {
    id: 'snake', ico: '🐍', cats: ['arcade', 'offline'], pop: 98,
    name: 'Snake', sub: 'Classic snake — eat, grow, survive',
    how: 'Swipe or use the D-pad to move the snake. Eat food to grow. Avoid walls and your own tail.',
  },
  {
    id: 'g2048', ico: '🔢', cats: ['puzzle', 'offline'], pop: 95,
    name: '2048', sub: 'Merge tiles to reach 2048',
    how: 'Swipe to move all tiles. Equal tiles merge into their sum. Reach 2048 to win.',
  },
  {
    id: 'sudoku', ico: '🧩', cats: ['puzzle', 'brain', 'offline'], pop: 88,
    name: 'Sudoku', sub: 'Fill the grid 1–9 without repeats',
    how: 'Tap a cell, then a number. Every row, column and 3×3 box must contain 1–9 once.',
  },
  {
    id: 'tictactoe', ico: '⭕', cats: ['board', 'multiplayer', 'offline'], pop: 90,
    name: 'Tic-Tac-Toe', sub: 'vs AI or a friend (2 players)',
    how: 'Take turns marking cells. First to get 3 in a row wins. Play vs AI or pass-and-play.',
  },
  {
    id: 'minesweeper', ico: '💣', cats: ['puzzle', 'strategy', 'offline'], pop: 86,
    name: 'Minesweeper', sub: 'Clear the field, avoid mines',
    how: 'Tap to open a cell. Numbers show adjacent mines. Long-press to flag. Clear all safe cells.',
  },
  {
    id: 'memory', ico: '🧠', cats: ['brain', 'casual', 'offline'], pop: 84,
    name: 'Memory Match', sub: 'Find all matching pairs',
    how: 'Flip two cards per turn. Match all pairs in as few moves as possible.',
  },
  {
    id: 'wordsearch', ico: '🔤', cats: ['educational', 'puzzle', 'offline'], pop: 78,
    name: 'Word Search', sub: 'Find hidden words in the grid',
    how: 'Drag across letters to select words hidden horizontally, vertically or diagonally.',
  },
  {
    id: 'brickbreaker', ico: '🧱', cats: ['arcade', 'offline'], pop: 82,
    name: 'Brick Breaker', sub: 'Bounce the ball, smash all bricks',
    how: 'Move the paddle (touch or buttons). Keep the ball alive and break every brick.',
  },
  {
    id: 'runner', ico: '🏃', cats: ['platform', 'arcade', 'offline'], pop: 80,
    name: 'Endless Runner', sub: 'Jump obstacles, keep running',
    how: 'Tap to jump over obstacles. Speed increases the longer you survive.',
  },
  {
    id: 'space', ico: '🚀', cats: ['adventure', 'arcade', 'offline'], pop: 76,
    name: 'Space Adventure', sub: 'Dodge and shoot asteroids',
    how: 'Drag to move your ship. It fires automatically. Destroy asteroids and survive waves.',
  },
];
export const GAMES = REG;
export const CATS = ['all', 'arcade', 'puzzle', 'brain', 'strategy', 'adventure', 'platform', 'board', 'educational', 'casual', 'multiplayer', 'offline'];
