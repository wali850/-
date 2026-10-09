// Tools registry. Each tool module exports mount(host, api).
// `net` / `perm` flags are shown as badges — never hidden.
const REG = [
  { id: 'stopwatch', ico: '⏱️', grp: 'gaming', name: 'Stopwatch', sub: 'Laps and precise timing' },
  { id: 'timer', ico: '⏲️', grp: 'gaming', name: 'Countdown timer', sub: 'Turn timers and alerts' },
  { id: 'scoretracker', ico: '🏆', grp: 'gaming', sub: 'Track points for any game', name: 'Score tracker' },
  { id: 'rng', ico: '🎯', grp: 'gaming', name: 'Random number', sub: 'Random number in a range' },
  { id: 'teams', ico: '👥', grp: 'gaming', name: 'Team generator', sub: 'Split players into teams' },
  { id: 'dice', ico: '🎲', grp: 'gaming', name: 'Dice simulator', sub: 'Roll one or many dice' },
  { id: 'coin', ico: '🪙', grp: 'gaming', name: 'Coin flip', sub: 'Heads or tails' },
  { id: 'reaction', ico: '⚡', grp: 'gaming', name: 'Reaction test', sub: 'Measure your reflexes' },
  { id: 'focus', ico: '🎯', grp: 'gaming', name: 'Focus timer', sub: 'Focus / break intervals' },
  { id: 'calculator', ico: '🧮', grp: 'daily', name: 'Calculator', sub: 'Standard & scientific' },
  { id: 'converter', ico: '🔁', grp: 'daily', name: 'Unit converter', sub: 'Length, weight, temp…' },
  { id: 'notes', ico: '📝', grp: 'daily', name: 'Notes & to-do', sub: 'Notes with checkboxes' },
  { id: 'qrgen', ico: '▦', grp: 'daily', name: 'QR generator', sub: 'Make QR codes from text' },
  { id: 'qrscan', ico: '📷', grp: 'daily', name: 'QR scanner', sub: 'Scan codes with camera', perm: true },
  { id: 'password', ico: '🔑', grp: 'daily', name: 'Password generator', sub: 'Strong random passwords' },
  { id: 'calendar', ico: '📅', grp: 'daily', name: 'Calendar', sub: 'Month view' },
  { id: 'worldclock', ico: '🌍', grp: 'daily', name: 'World clock', sub: 'Times across cities' },
  { id: 'viewer', ico: '🖼️', grp: 'daily', name: 'File viewer', sub: 'View images & PDFs locally' },
];
export const TOOLS = REG;
