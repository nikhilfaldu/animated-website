import { createNoise3D } from 'simplex-noise';
import * as THREE from 'three';

// Seeded random number generator
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const UNIVERSE_SEED = 42;
export const prng = mulberry32(UNIVERSE_SEED);
export const noise3D = createNoise3D(prng);

export interface ProceduralPlanetData {
  id: string;
  name: string;
  type: 'rocky' | 'ocean' | 'lava' | 'forest' | 'ice' | 'gas_giant' | 'crystal' | 'toxic' | 'desert';
  radius: number;
  distanceFromStar: number;
  orbitalSpeed: number;
  moons: ProceduralMoonData[];
  baseColor: string;
  hasRings: boolean;
}

export interface ProceduralMoonData {
  id: string;
  name: string;
  radius: number;
  distanceFromPlanet: number;
  orbitalSpeed: number;
  baseColor: string;
}

export interface StarSystemData {
  id: string;
  name: string;
  position: THREE.Vector3;
  starType: 'red_dwarf' | 'yellow_dwarf' | 'blue_giant' | 'red_giant' | 'white_dwarf' | 'neutron_star';
  starRadius: number;
  starColor: string;
  planets: ProceduralPlanetData[];
}

const STAR_TYPES = ['red_dwarf', 'yellow_dwarf', 'blue_giant', 'red_giant', 'white_dwarf', 'neutron_star'] as const;
const PLANET_TYPES = ['rocky', 'ocean', 'lava', 'forest', 'ice', 'gas_giant', 'crystal', 'toxic', 'desert'] as const;

function generatePlanets(systemId: string, starRadius: number, cellPrng: () => number): ProceduralPlanetData[] {
  const numPlanets = Math.floor(cellPrng() * 6) + 1; // 1 to 6 planets
  const planets: ProceduralPlanetData[] = [];
  
  let currentDistance = starRadius + 5.0;

  for (let i = 0; i < numPlanets; i++) {
    currentDistance += 2.0 + cellPrng() * 4.0; // Spacing between planets
    const type = PLANET_TYPES[Math.floor(cellPrng() * PLANET_TYPES.length)];
    const radius = 0.5 + cellPrng() * 1.5;
    const hasRings = type === 'gas_giant' || cellPrng() > 0.8;
    
    // Generate moons
    const numMoons = type === 'gas_giant' ? Math.floor(cellPrng() * 4) : Math.floor(cellPrng() * 2);
    const moons: ProceduralMoonData[] = [];
    let moonDistance = radius + 0.5;
    for (let j = 0; j < numMoons; j++) {
      moonDistance += 0.3 + cellPrng() * 0.5;
      moons.push({
        id: `${systemId}-p${i}-m${j}`,
        name: `Moon ${j + 1}`,
        radius: radius * (0.1 + cellPrng() * 0.2),
        distanceFromPlanet: moonDistance,
        orbitalSpeed: (0.5 + cellPrng() * 1.5) * (cellPrng() > 0.5 ? 1 : -1),
        baseColor: `hsl(${cellPrng() * 360}, 20%, ${30 + cellPrng() * 40}%)`
      });
    }

    planets.push({
      id: `${systemId}-p${i}`,
      name: `Planet ${i + 1}`,
      type,
      radius,
      distanceFromStar: currentDistance,
      orbitalSpeed: (0.1 + cellPrng() * 0.5) * (cellPrng() > 0.5 ? 1 : -1),
      moons,
      baseColor: `hsl(${cellPrng() * 360}, ${40 + cellPrng() * 60}%, ${40 + cellPrng() * 40}%)`,
      hasRings
    });
  }
  
  return planets;
}

export function generateSector(sectorX: number, sectorY: number, sectorZ: number): StarSystemData[] {
  const SECTOR_SIZE = 500;
  const STAR_DENSITY = 0.02; // Probability of star in a cell
  const CELL_SIZE = 50;
  
  const systems: StarSystemData[] = [];
  
  for (let x = 0; x < SECTOR_SIZE; x += CELL_SIZE) {
    for (let y = 0; y < SECTOR_SIZE; y += CELL_SIZE) {
      for (let z = 0; z < SECTOR_SIZE; z += CELL_SIZE) {
        
        const worldX = (sectorX * SECTOR_SIZE) + x;
        const worldY = (sectorY * SECTOR_SIZE) + y;
        const worldZ = (sectorZ * SECTOR_SIZE) + z;
        
        // Use noise to determine if a star exists here (create clustered galaxies)
        const n = noise3D(worldX * 0.005, worldY * 0.005, worldZ * 0.005);
        
        // Stable seed per cell
        const cellSeed = Math.abs(Math.floor(worldX * 73856093 ^ worldY * 19349663 ^ worldZ * 83492791));
        const cellPrng = mulberry32(cellSeed);
        
        // Increase density if noise is high (creating galaxy clusters)
        const densityThreshold = 1.0 - (STAR_DENSITY * (n > 0.5 ? 5 : 1));
        
        if (cellPrng() > densityThreshold) {
          const offsetX = (cellPrng() - 0.5) * CELL_SIZE;
          const offsetY = (cellPrng() - 0.5) * CELL_SIZE;
          const offsetZ = (cellPrng() - 0.5) * CELL_SIZE;
          
          const position = new THREE.Vector3(
            worldX + offsetX,
            worldY + offsetY,
            worldZ + offsetZ
          );
          
          const starType = STAR_TYPES[Math.floor(cellPrng() * STAR_TYPES.length)];
          const starRadius = 2.0 + cellPrng() * 8.0;
          const id = `sys-${sectorX}-${sectorY}-${sectorZ}-${systems.length}`;
          
          systems.push({
            id,
            name: `System ${id.slice(-4)}`,
            position,
            starType,
            starRadius,
            starColor: `hsl(${cellPrng() * 60 + (starType.includes('blue') ? 200 : 0)}, 80%, 60%)`,
            planets: generatePlanets(id, starRadius, cellPrng)
          });
        }
      }
    }
  }
  
  return systems;
}
