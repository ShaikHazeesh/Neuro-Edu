interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: 'action' | 'puzzle' | 'relaxation' | 'arcade' | 'strategy' | 'quiz';
  benefits: string[];
  url: string;
  isExternal: boolean;
  provider?: string;
}

export const games: Game[] = [
  {
    id: 'subway-surfers',
    title: 'Subway Surfers',
    description: 'A fast-paced endless runner game that helps improve focus and reaction time.',
    thumbnail: '/images/games/subway-surfers.webp',
    category: 'action',
    benefits: [
      'Improves focus and concentration',
      'Enhances hand-eye coordination',
      'Provides stress relief through engaging gameplay'
    ],
    url: 'https://poki.com/en/g/subway-surfers',
    isExternal: true,
    provider: 'Poki'
  },
  {
    id: 'temple-run',
    title: 'Temple Run',
    description: 'An exciting endless runner that combines quick thinking with stress relief.',
    thumbnail: '/images/games/temple-run.webp',
    category: 'action',
    benefits: [
      'Reduces anxiety through immersive gameplay',
      'Improves decision-making skills',
      'Enhances reflexes and coordination'
    ],
    url: 'https://poki.com/en/g/temple-run-2',
    isExternal: true,
    provider: 'Poki'
  },
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Classic puzzle game proven to reduce stress and anxiety.',
    thumbnail: '/images/games/tetris.webp',
    category: 'puzzle',
    benefits: [
      'Scientifically proven to reduce stress',
      'Improves cognitive function',
      'Enhances problem-solving skills'
    ],
    url: 'https://tetris.com/play-tetris',
    isExternal: true,
    provider: 'Tetris'
  },
  {
    id: 'flow',
    title: 'Flow Free',
    description: 'A calming puzzle game about connecting matching colors.',
    thumbnail: '/images/games/flow.webp',
    category: 'puzzle',
    benefits: [
      'Promotes mindfulness',
      'Improves pattern recognition',
      'Reduces mental stress'
    ],
    url: 'https://www.crazygames.com/game/flow-free-online',
    isExternal: true,
    provider: 'CrazyGames'
  },
  {
    id: 'zen-garden',
    title: 'Zen Garden',
    description: 'Create your own peaceful zen garden for relaxation.',
    thumbnail: '/images/games/zen-garden.webp',
    category: 'relaxation',
    benefits: [
      'Promotes relaxation and calmness',
      'Encourages creativity',
      'Reduces anxiety through mindful interaction'
    ],
    url: '/games/zen-garden',
    isExternal: false
  },
  {
    id: 'chess',
    title: 'Chess Master',
    description: 'Challenge your mind with the classic game of strategy and tactics.',
    thumbnail: '/images/games/chess.webp',
    category: 'strategy',
    benefits: [
      'Improves strategic thinking',
      'Enhances problem-solving abilities',
      'Develops concentration and memory'
    ],
    url: 'https://www.chess.com/play/online',
    isExternal: true,
    provider: 'Chess.com'
  },
  {
    id: 'racing',
    title: 'Speed Racing',
    description: 'Experience the thrill of high-speed racing while improving your reflexes.',
    thumbnail: '/images/games/racing.webp',
    category: 'action',
    benefits: [
      'Enhances hand-eye coordination',
      'Improves quick decision making',
      'Develops spatial awareness'
    ],
    url: 'https://www.crazygames.com/game/traffic-racing',
    isExternal: true,
    provider: 'CrazyGames'
  },
  {
    id: 'quiz',
    title: 'Knowledge Quest',
    description: 'Test and expand your general knowledge in an engaging way.',
    thumbnail: '/images/games/quiz.webp',
    category: 'quiz',
    benefits: [
      'Expands general knowledge',
      'Improves memory and recall',
      'Enhances learning through fun interaction'
    ],
    url: 'https://www.sporcle.com/',
    isExternal: true,
    provider: 'Sporcle'
  },
  {
    id: 'pinball',
    title: 'Classic Pinball',
    description: 'Experience the timeless joy of pinball with realistic physics and classic gameplay.',
    thumbnail: '/images/games/pinball.webp',
    category: 'arcade',
    benefits: [
      'Improves hand-eye coordination',
      'Enhances reflexes and timing',
      'Develops spatial awareness'
    ],
    url: 'https://www.crazygames.com/game/space-pinball',
    isExternal: true,
    provider: 'CrazyGames'
  },
  {
    id: 'donkey-kong',
    title: 'Donkey Kong',
    description: 'Jump and climb your way through this classic arcade adventure.',
    thumbnail: '/images/games/donkey-kong.webp',
    category: 'arcade',
    benefits: [
      'Enhances timing and precision',
      'Improves problem-solving skills',
      'Develops quick reflexes'
    ],
    url: 'https://www.playemulator.com/nes-online/donkey-kong/',
    isExternal: true,
    provider: 'PlayEmulator'
  },
  {
    id: 'pacman',
    title: 'Pac-Man',
    description: 'Navigate through mazes and avoid ghosts in this beloved arcade classic.',
    thumbnail: '/images/games/pacman.webp',
    category: 'arcade',
    benefits: [
      'Improves strategic thinking',
      'Enhances pattern recognition',
      'Develops quick decision making'
    ],
    url: 'https://www.google.com/logos/2010/pacman10-i.html',
    isExternal: true,
    provider: 'Google'
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    description: 'Defend Earth from alien invaders in this iconic arcade shooter.',
    thumbnail: '/images/games/space-invaders.webp',
    category: 'arcade',
    benefits: [
      'Improves concentration',
      'Enhances reaction time',
      'Develops hand-eye coordination'
    ],
    url: 'https://www.crazygames.com/game/space-invaders',
    isExternal: true,
    provider: 'CrazyGames'
  }
];

export const gameCategories = [
  {
    id: 'action',
    name: 'Action Games',
    description: 'Engaging games that help improve focus and coordination'
  },
  {
    id: 'puzzle',
    name: 'Puzzle Games',
    description: 'Brain-training games that reduce stress while improving cognitive function'
  },
  {
    id: 'relaxation',
    name: 'Relaxation Games',
    description: 'Calming games designed for stress relief and mindfulness'
  },
  {
    id: 'strategy',
    name: 'Strategy Games',
    description: 'Games that challenge your mind and improve strategic thinking'
  },
  {
    id: 'quiz',
    name: 'Quiz Games',
    description: 'Test and expand your knowledge while having fun'
  },
  {
    id: 'arcade',
    name: 'Arcade Games',
    description: 'Classic retro games that provide nostalgic entertainment and quick reflexes training'
  }
];