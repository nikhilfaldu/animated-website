import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import gsap from 'gsap'
import { useWorldStore } from '@/stores/useWorldStore'
import {
  CAMERA_POSITIONS,
  INTRO_SEQUENCE,
  TRANSITION_DURATION,
  TRANSITION_EASE,
  IDLE_DRIFT_AMPLITUDE,
  IDLE_DRIFT_SPEED
} from '@/config/camera'
import { WORLD_ORDER } from '@/config/worlds'

export function CinematicCamera() {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const isTransitioningRef = useRef(false)

  const {
    activeWorld,
    activeObject,
    isIntroStarted,
    isIntroComplete,
    setTransitioning,
    completeIntro,
    autoTour,
    navigateToWorld
  } = useWorldStore()

  // Run intro flythrough
  const runIntro = useCallback(() => {
    if (timelineRef.current) timelineRef.current.kill()

    isTransitioningRef.current = true
    setTransitioning(true)

    const tl = gsap.timeline({
      onComplete: () => {
        completeIntro()
        isTransitioningRef.current = false
        setTransitioning(false)
      },
    })
    timelineRef.current = tl

    const dummyPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const dummyTarget = { x: 0, y: 0, z: 0 }

    INTRO_SEQUENCE.forEach((wp) => {
      tl.to(
        dummyPos,
        {
          x: wp.position[0],
          y: wp.position[1],
          z: wp.position[2],
          duration: wp.duration,
          ease: wp.ease || 'power2.inOut',
          onUpdate: () => {
            camera.position.set(dummyPos.x, dummyPos.y, dummyPos.z)
          },
        },
        tl.duration() > 0 ? '<' : undefined,
      )
      tl.to(
        dummyTarget,
        {
          x: wp.target[0],
          y: wp.target[1],
          z: wp.target[2],
          duration: wp.duration,
          ease: wp.ease || 'power2.inOut',
          onUpdate: () => {
            if (controlsRef.current) {
              controlsRef.current.target.set(dummyTarget.x, dummyTarget.y, dummyTarget.z)
              controlsRef.current.update()
            }
          },
        },
        '<',
      )
    })
  }, [camera, completeIntro, setTransitioning])

  // Trigger intro when started
  useEffect(() => {
    if (isIntroStarted && !isIntroComplete) {
      runIntro()
    }
  }, [isIntroStarted, isIntroComplete, runIntro])

  // Navigate to world, object, or overview
  useEffect(() => {
    if (!isIntroComplete) return

    const targetCam = { position: [0, 0, 0] as [number, number, number], target: [0, 0, 0] as [number, number, number] }

    if (activeObject) {
      const p = activeObject.position
      // Increase distance drastically so we can see the massive anomalies properly
      const offset = activeObject.type === 'pulsar' ? 30 : activeObject.type === 'ruins' ? 25 : 20
      targetCam.position = [p.x + offset, p.y + offset/2, p.z + offset]
      targetCam.target = [p.x, p.y, p.z]
    } else {
      const key = activeWorld || 'overview'
      const cam = CAMERA_POSITIONS[key]
      if (!cam) return
      targetCam.position = cam.position
      targetCam.target = cam.target
    }

    if (timelineRef.current) timelineRef.current.kill()

    isTransitioningRef.current = true
    setTransitioning(true)
    const tl = gsap.timeline({
      onComplete: () => {
        isTransitioningRef.current = false
        setTransitioning(false)
      },
    })
    timelineRef.current = tl

    const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
    const startTgt = { 
      x: controlsRef.current?.target.x || 0, 
      y: controlsRef.current?.target.y || 0, 
      z: controlsRef.current?.target.z || 0 
    }

    tl.to(startPos, {
      x: targetCam.position[0],
      y: targetCam.position[1],
      z: targetCam.position[2],
      duration: TRANSITION_DURATION,
      ease: TRANSITION_EASE,
      onUpdate: () => {
        camera.position.set(startPos.x, startPos.y, startPos.z)
      }
    })
    tl.to(
      startTgt,
      {
        x: targetCam.target[0],
        y: targetCam.target[1],
        z: targetCam.target[2],
        duration: TRANSITION_DURATION,
        ease: TRANSITION_EASE,
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.set(startTgt.x, startTgt.y, startTgt.z)
            controlsRef.current.update()
          }
        }
      },
      '<',
    )
  }, [activeWorld, activeObject, isIntroComplete, setTransitioning, camera])

  // Auto Tour logic
  useEffect(() => {
    if (!autoTour || !isIntroComplete) return
    let index = activeWorld ? WORLD_ORDER.indexOf(activeWorld) : -1
    
    const interval = setInterval(() => {
      index = (index + 1) % WORLD_ORDER.length
      navigateToWorld(WORLD_ORDER[index])
    }, 15000)

    return () => clearInterval(interval)
  }, [autoTour, isIntroComplete, activeWorld, navigateToWorld])

  // Gentle idle drift ONLY when in overview and not transitioning
  useFrame((state) => {
    if (!activeWorld && !activeObject && !isTransitioningRef.current && isIntroComplete && controlsRef.current) {
      const t = state.clock.elapsedTime
      // Extremely subtle slow orbit by slightly adjusting the camera around its base overview position
      const basePos = CAMERA_POSITIONS['overview'].position
      camera.position.x = basePos[0] + Math.sin(t * IDLE_DRIFT_SPEED) * IDLE_DRIFT_AMPLITUDE
      camera.position.y = basePos[1] + Math.cos(t * IDLE_DRIFT_SPEED) * IDLE_DRIFT_AMPLITUDE
      camera.position.z = basePos[2] + Math.sin(t * IDLE_DRIFT_SPEED * 0.8) * IDLE_DRIFT_AMPLITUDE
      // Do not force lookAt constantly so the user can still pan around if they want
    }
  })

  return (
    <OrbitControls 
      ref={controlsRef} 
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxDistance={2000}
      minDistance={1}
      makeDefault
      enabled={!isTransitioningRef.current}
    />
  )
}
