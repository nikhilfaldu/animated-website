'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useWorldStore } from '@/stores/useWorldStore'

export function TransitionWipe() {
  const { isTransitioning } = useWorldStore()

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-20 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
          }}
        />
      )}
    </AnimatePresence>
  )
}
