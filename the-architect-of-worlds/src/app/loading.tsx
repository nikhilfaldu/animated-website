export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Simple glowing orb loader */}
        <div className="absolute h-full w-full animate-ping rounded-full bg-cyan-500 opacity-20"></div>
        <div className="absolute h-12 w-12 rounded-full bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.6)]"></div>
      </div>
      <p className="mt-8 text-sm font-medium tracking-[0.2em] text-cyan-500/70 uppercase">
        Initializing Sector...
      </p>
    </div>
  )
}
