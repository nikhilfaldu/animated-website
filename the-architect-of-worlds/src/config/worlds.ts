import { WorldConfig, WorldId } from '@/types'

export const WORLD_ORDER: WorldId[] = [
  'nexus',
  'emerald',
  'forge',
  'ocean',
  'crystal',
  'singularity',
]

export const WORLDS: Record<WorldId, WorldConfig> = {
  nexus: {
    id: 'nexus',
    name: 'The Nexus',
    subtitle: 'Where Everything Begins',
    description: `At the center of the architecture lies The Nexus, a pulsating core of pure golden energy where logic and origin intertwine. It represents the foundation of the digital cosmos, the initial commit from which all other realities spawn.\n\nHere, the raw essence of structure is maintained. Luminous data streams bridge the gap between abstract thought and tangible reality, anchoring the chaotic void into a stable matrix of design and purpose.\n\nTo gaze into The Nexus is to see the very architecture of existence—the root directory of the universe where every path begins and every algorithm converges.`,
    position: [0, 0, 0],
    colors: {
      primary: '#FFB800',
      secondary: '#FF8C00',
      atmosphere: '#FFF4E0',
      accent: '#FFE066',
    },
    orbitSpeed: 0.08,
    scale: 2.2,
  },

  emerald: {
    id: 'emerald',
    name: 'Terra Earth',
    subtitle: 'The Living World',
    description: `Terra Earth floats as a lush, verdant sanctuary teeming with procedural forests, continents, oceans, and swirling cloud systems. It is the manifestation of identity, nature, and organic life in the cosmos.\n\nEvery leaf and rushing river tells a story of adaptation and growth. It serves as the living biosphere of the cosmos, breathing life into cold logic and providing a warm, organic contrast to the structured void.\n\nHere, you will find the human element—the spark of creativity that transforms mere syntax into a living, breathing experience that resonates with visitors.`,
    position: [14, 3, -12],
    colors: {
      primary: '#00D68F',
      secondary: '#006644',
      atmosphere: '#B8F0D8',
      accent: '#7DFFC4',
    },
    orbitSpeed: 0.12,
    scale: 1.8,
  },

  forge: {
    id: 'forge',
    name: 'Forge Planet',
    subtitle: 'Where Ideas Are Forged',
    description: `A harsh but magnificent world of molten rock and glowing lava rivers, Forge Planet is the crucible of experience. It is here that raw, unpolished code is relentlessly hammered into robust, scalable structures.\n\nEvery fiery eruption and tectonic shift represents a challenge overcome, a bug squashed, or a system optimized. It is a testament to the sweat, discipline, and rigorous testing required to build resilient architectures.\n\nIn the fiery depths of this world, ideas are tested by extreme heat, emerging as hardened steel ready to support the weight of complex digital ecosystems.`,
    position: [-11, -2, -24],
    colors: {
      primary: '#FF4500',
      secondary: '#8B0000',
      atmosphere: '#FF6B35',
      accent: '#FFD700',
    },
    orbitSpeed: 0.06,
    scale: 2.0,
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean of Knowledge',
    subtitle: 'Depths of Understanding',
    description: `An endless sapphire ocean world with bioluminescent depths, where projects and ideas flow like powerful currents. The Ocean of Knowledge is vast, deep, and constantly in motion, reflecting a continuous journey of learning and discovery.\n\nBelow its serene surface lie intricate trench networks of complex applications and hidden reefs of experimental design. Each wave that crashes is a new project deployed, a new concept realized and cast out into the digital sea.\n\nNavigating these waters requires both intuition and skill, as the tides of technology shift. It is a repository of past triumphs and a breeding ground for future innovations.`,
    position: [10, -3, -38],
    colors: {
      primary: '#0077B6',
      secondary: '#023E8A',
      atmosphere: '#90E0EF',
      accent: '#00F5D4',
    },
    orbitSpeed: 0.1,
    scale: 1.9,
  },

  crystal: {
    id: 'crystal',
    name: 'Crystal Moon',
    subtitle: 'Facets of Experience',
    description: `Orbiting silently in the void, the Crystal Moon is encrusted with enormous, multifaceted crystalline formations that pulse with violet energy. It embodies the sharp, clear precision of technical skills and specialized knowledge.\n\nEach crystal facet reflects a different discipline—from front-end aesthetics to back-end architecture. The light refracting through these formations illustrates the diverse toolkit required to craft seamless digital experiences.\n\nHere, clarity and focus are paramount. The crystal structures grow slowly but form unbreakable bonds, representing the accumulation of expertise and the sharp edge of modern web development.`,
    position: [-8, 5, -52],
    colors: {
      primary: '#9B5DE5',
      secondary: '#6930C3',
      atmosphere: '#E0B0FF',
      accent: '#F0E6FF',
    },
    orbitSpeed: 0.15,
    scale: 1.4,
  },

  singularity: {
    id: 'singularity',
    name: 'Singularity',
    subtitle: 'The Event Horizon',
    description: `At the absolute edge of space lies the Singularity—a dark, mesmerizing vortex where the inescapable gravity of connection draws all things together. It is the ultimate point of convergence, serving as the cosmic 'Contact' terminal.\n\nMessages and signals from across dimensions are pulled into its event horizon, transmitting intent and collaboration across the void. It bends time and space to ensure that communication bridges the gap between creator and explorer.\n\nTo approach the Singularity is to initiate a dialogue, crossing the threshold from observation into active engagement. It is the final destination, where separate entities merge into shared endeavors.`,
    position: [2, 0, -66],
    colors: {
      primary: '#1A0033',
      secondary: '#000011',
      atmosphere: '#4A00E0',
      accent: '#7B2FBE',
    },
    orbitSpeed: 0.04,
    scale: 2.4,
  },

  secret: {
    id: 'secret',
    name: '???',
    subtitle: 'You Found It',
    description: `A tiny forgotten world, hidden in the narrow seams between dimensions. It remains off the cosmic charts, accessible only to those who look beyond the obvious paths.\n\nThis hidden realm is a playground for Easter eggs, unreleased experiments, and raw, unfiltered creativity. It operates on its own strange physics, detached from the rigid rules of the primary universe.\n\nNot everyone finds this place, but those who do are rewarded with a glimpse into the chaotic, playful mind of the architect—a secret garden of code waiting to be discovered.`,
    position: [22, 10, -30],
    colors: {
      primary: '#FF69B4',
      secondary: '#FF1493',
      atmosphere: '#FFB6C1',
      accent: '#FF00FF',
    },
    orbitSpeed: 0.2,
    scale: 0.8,
  },
}
