// KuralLogo.tsx — Glowing KURAL wordmark

interface KuralLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}

const sizes = {
  sm: { logo: 'text-lg', tagline: 'text-xs' },
  md: { logo: 'text-xl', tagline: 'text-xs' },
  lg: { logo: 'text-3xl', tagline: 'text-sm' },
}

export function KuralLogo({ size = 'md', showTagline = false }: KuralLogoProps) {
  const s = sizes[size]
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5">
        <span
          className={`${s.logo} font-extrabold tracking-tight`}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 2px 8px rgba(56,189,248,0.3))',
          }}
        >
          KURAL
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
        >
          β
        </span>
      </div>
      {showTagline && (
        <p className={`${s.tagline} text-slate-400 font-medium mt-0.5`}>
          Your multilingual AI assistant
        </p>
      )}
    </div>
  )
}
