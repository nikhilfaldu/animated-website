'use client'

import React from 'react'
import { HolographicGlyph } from './HolographicGlyph'
import type { WorldId } from '@/types'
import type { Vector3Tuple } from 'three'

interface WorldLabelProps {
  worldId: WorldId
  position: Vector3Tuple
}

const WorldLabel: React.FC<WorldLabelProps> = ({ worldId, position }) => {
  return <HolographicGlyph worldId={worldId} position={position} />
}

export default React.memo(WorldLabel)
