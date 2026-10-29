/**
 * Script to extract blade vertices from white_emblem.svg
 * Run with: node scripts/extractBladeVertices.js
 */

const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '../src/assets/white_emblem.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// SVG viewBox dimensions
const viewBoxWidth = 587.72;
const viewBoxHeight = 586.76;

// The emblem center based on inner edge positions:
// - blade-25 inner at x≈259, blade-09 inner at x≈493 → centerX = (259+493)/2 = 376
// - blade-01 inner at y≈177, blade-17 inner at y≈410 → centerY = (177+410)/2 = 293.5
const centerX = 376;
const centerY = 293.5;

// Use the actual maximum extent from center for normalization
// Left extent: 376 - 0 = 376, Right extent: 587.5 - 376 = 211.5
// To keep proportions correct, normalize by the larger extent
const maxExtent = 376;

// Parse SVG numbers (handles compact notation like "-6.61.55" = [-6.61, 0.55])
function parseNumbers(str) {
  const numbers = [];
  const regex = /-?(?:\d+\.?\d*|\.\d+)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const num = parseFloat(match[0]);
    if (!isNaN(num)) {
      numbers.push(num);
    }
  }
  return numbers;
}

// Parse SVG path to get ONLY endpoint waypoints (not bezier control points)
function parsePath(d) {
  const points = [];
  let currentX = 0;
  let currentY = 0;

  // Split into commands
  const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  for (const cmd of commands) {
    const type = cmd[0];
    const numbers = parseNumbers(cmd.slice(1));

    switch (type) {
      case 'M': // Absolute moveto
        for (let i = 0; i < numbers.length; i += 2) {
          currentX = numbers[i];
          currentY = numbers[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'm': // Relative moveto
        for (let i = 0; i < numbers.length; i += 2) {
          currentX += numbers[i];
          currentY += numbers[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'L': // Absolute lineto
        for (let i = 0; i < numbers.length; i += 2) {
          currentX = numbers[i];
          currentY = numbers[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'l': // Relative lineto
        for (let i = 0; i < numbers.length; i += 2) {
          currentX += numbers[i];
          currentY += numbers[i + 1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'H': // Absolute horizontal
        for (const num of numbers) {
          currentX = num;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'h': // Relative horizontal
        for (const num of numbers) {
          currentX += num;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'V': // Absolute vertical
        for (const num of numbers) {
          currentY = num;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'v': // Relative vertical
        for (const num of numbers) {
          currentY += num;
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'C': // Absolute cubic bezier - ONLY capture endpoint, skip control points
        for (let i = 0; i < numbers.length; i += 6) {
          // Skip control points [i], [i+1], [i+2], [i+3]
          // Only capture end point
          currentX = numbers[i + 4];
          currentY = numbers[i + 5];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'c': // Relative cubic bezier - ONLY capture endpoint, skip control points
        for (let i = 0; i < numbers.length; i += 6) {
          // Skip control points, only capture end point
          currentX += numbers[i + 4];
          currentY += numbers[i + 5];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'Z':
      case 'z':
        // Close path - don't add point
        break;
      default:
        console.warn(`Unknown command: ${type}`);
    }
  }

  return points;
}

// Get 4 corner vertices from path waypoints
// Blade paths follow pattern: outer1 → inner1 → [inner intermediates] → inner2 → outer2 → [close]
function getCornerVertices(points) {
  if (points.length < 4) {
    console.warn('Not enough points:', points.length);
    return null;
  }

  // Remove duplicates (within tolerance)
  const uniquePoints = [];
  const tolerance = 0.5;
  for (const p of points) {
    const isDuplicate = uniquePoints.some(
      u => Math.abs(u.x - p.x) < tolerance && Math.abs(u.y - p.y) < tolerance
    );
    if (!isDuplicate) {
      uniquePoints.push(p);
    }
  }

  if (uniquePoints.length < 4) {
    console.warn('Not enough unique points:', uniquePoints.length);
    return null;
  }

  // Calculate distance from center for each point
  const withDistance = uniquePoints.map((p, idx) => ({
    ...p,
    idx,
    dist: Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
  }));

  // Find the median distance to separate inner from outer
  const sortedByDist = [...withDistance].sort((a, b) => a.dist - b.dist);
  const medianDist = sortedByDist[Math.floor(sortedByDist.length / 2)].dist;

  // Classify points as inner or outer based on median
  const innerPoints = withDistance.filter(p => p.dist < medianDist);
  const outerPoints = withDistance.filter(p => p.dist >= medianDist);

  // If we don't have at least 2 of each, fall back to simple selection
  if (innerPoints.length < 2 || outerPoints.length < 2) {
    const inner = sortedByDist.slice(0, 2);
    const outer = sortedByDist.slice(-2);
    const getAngle = (p) => Math.atan2(p.y - centerY, p.x - centerX);
    inner.sort((a, b) => getAngle(a) - getAngle(b));
    outer.sort((a, b) => getAngle(a) - getAngle(b));
    return [inner[0], outer[0], outer[1], inner[1]];
  }

  // For inner points, take the first and last by original path order
  // (these are the actual corners, not intermediate bezier endpoints)
  innerPoints.sort((a, b) => a.idx - b.idx);
  const inner1 = innerPoints[0];
  const inner2 = innerPoints[innerPoints.length - 1];

  // For outer points, take the first and last by original path order
  outerPoints.sort((a, b) => a.idx - b.idx);
  const outer1 = outerPoints[0];
  const outer2 = outerPoints[outerPoints.length - 1];

  // Sort by angle to ensure proper winding
  const getAngle = (p) => Math.atan2(p.y - centerY, p.x - centerX);
  const inners = [inner1, inner2].sort((a, b) => getAngle(a) - getAngle(b));
  const outers = [outer1, outer2].sort((a, b) => getAngle(a) - getAngle(b));

  // Wind as: inner1 → outer1 → outer2 → inner2 (creates proper quad)
  return [inners[0], outers[0], outers[1], inners[1]];
}

// Normalize coordinates to -1 to 1 range (Y flipped for Three.js)
function normalizeVertex(v) {
  return {
    x: parseFloat(((v.x - centerX) / maxExtent).toFixed(4)),
    y: parseFloat((-(v.y - centerY) / maxExtent).toFixed(4)) // Flip Y
  };
}

// Extract all blade paths from SVG
const pathRegex = /<path[^>]*id="blade-(\d+)"[^>]*d="([^"]+)"/g;
const blades = new Map();

let match;
while ((match = pathRegex.exec(svgContent)) !== null) {
  const bladeNum = parseInt(match[1], 10);
  const d = match[2];

  // Parse path and get corners
  const points = parsePath(d);
  const corners = getCornerVertices(points);

  if (corners) {
    const normalized = corners.map(normalizeVertex);
    blades.set(bladeNum, {
      num: bladeNum,
      vertices: normalized
    });
  } else {
    console.error(`Failed to extract corners for blade-${bladeNum}`);
  }
}

// Sort by blade number and generate output
const sortedBlades = Array.from(blades.values()).sort((a, b) => a.num - b.num);

console.log(`\nFound ${sortedBlades.length} unique blades\n`);

// Check for missing blades
for (let i = 1; i <= 32; i++) {
  if (!blades.has(i)) {
    console.error(`Missing blade-${i}!`);
  }
}

// Generate TypeScript output
let output = `/**
 * Blade vertices extracted from white_emblem.svg
 * Blades 01-32 in clockwise order around the emblem
 * Winding: inner1 → outer1 → outer2 → inner2
 */
export const BLADE_VERTICES: Array<{ x: number; y: number }[]> = [
`;

for (const blade of sortedBlades) {
  const verts = blade.vertices
    .map(v => `{ x: ${v.x}, y: ${v.y} }`)
    .join(', ');
  output += `  [${verts}], // blade-${String(blade.num).padStart(2, '0')}\n`;
}

output += `];
`;

// Write to file
const outputPath = path.join(__dirname, '../src/components/emblem/ApertureEmblem/bladeVertices.ts');
fs.writeFileSync(outputPath, output);
console.log(`Written to ${outputPath}`);
