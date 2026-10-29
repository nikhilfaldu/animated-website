import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-cyan-400">
      <h2 className="mb-4 text-4xl font-bold tracking-widest text-cyan-300">404 : VOID SECTOR</h2>
      <p className="mb-8 max-w-md text-center text-sm opacity-70">
        The celestial coordinates you are attempting to reach do not exist in the Architect's current simulation.
      </p>
      <Link 
        href="/"
        className="rounded border border-cyan-500/30 bg-cyan-950/40 px-6 py-2 text-sm font-medium hover:bg-cyan-900/60 transition-colors"
      >
        RETURN TO NEXUS
      </Link>
    </div>
  )
}
