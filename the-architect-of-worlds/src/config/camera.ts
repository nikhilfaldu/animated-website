import { CameraState, CameraWaypoint, WorldId } from '@/types'

export const CAMERA_POSITIONS: Record<WorldId | 'overview', CameraState> = {
  overview: {
    position: [0, 10, 30],
    target: [0, 0, -20],
  },
  nexus: {
    position: [5, 3, 9],
    target: [0, 0, 0],
  },
  emerald: {
    position: [20, 7, -5],
    target: [14, 3, -12],
  },
  forge: {
    position: [-4, 2, -16],
    target: [-11, -2, -24],
  },
  ocean: {
    position: [17, 1, -30],
    target: [10, -3, -38],
  },
  crystal: {
    position: [-1, 9, -44],
    target: [-8, 5, -52],
  },
  singularity: {
    position: [9, 4, -58],
    target: [2, 0, -66],
  },
  secret: {
    position: [28, 14, -23],
    target: [22, 10, -30],
  },
}

export const INTRO_SEQUENCE: CameraWaypoint[] = [
  {
    position: [0, 2, 80],
    target: [0, 0, 0],
    duration: 3,
    ease: 'power2.inOut',
  },
  {
    position: [10, 8, 50],
    target: [0, 0, -10],
    duration: 3.5,
    ease: 'power1.inOut',
  },
  {
    position: [0, 10, 30],
    target: [0, 0, -20],
    duration: 3,
    ease: 'power2.out',
  },
]

export const TRANSITION_DURATION = 2.5
export const TRANSITION_EASE = 'power2.inOut'

// Subtle idle drift amplitude (camera sways gently when idle)
export const IDLE_DRIFT_AMPLITUDE = 0.3
export const IDLE_DRIFT_SPEED = 0.15
