'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-cyan-400">
      <h2 className="mb-4 text-2xl font-bold tracking-widest text-red-500">SYSTEM ANOMALY DETECTED</h2>
      <p className="mb-8 max-w-md text-center text-sm opacity-70">
        A disruption in the space-time continuum has occurred. The Architect protocol has halted execution to prevent corruption.
      </p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="rounded border border-cyan-500/30 bg-cyan-950/40 px-6 py-2 text-sm font-medium hover:bg-cyan-900/60 transition-colors"
      >
        RECALIBRATE SCENE
      </button>
    </div>
  )
}
