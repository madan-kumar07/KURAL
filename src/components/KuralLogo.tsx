// KuralLogo.tsx — The KURAL wordmark and logo

interface KuralLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
}

const sizes = {
  sm: { logo: 'text-lg', tagline: 'text-xs' },
  md: { logo: 'text-2xl', tagline: 'text-sm' },
  lg: { logo: 'text-4xl', tagline: 'text-base' },
}

export function KuralLogo({ size = 'md', showTagline = false }: KuralLogoProps) {
  const s = sizes[size]
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1">
        <span
          className={`${s.logo} font-bold tracking-tight`}
          style={{
            background: 'linear-gradient(135deg, #005299 0%, #0088ff 60%, #33a0ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          KURAL
        </span>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-full ml-1"
          style={{ background: 'rgba(0,136,255,0.10)', color: '#005299' }}
        >
          β
        </span>
      </div>
      {showTagline && (
        <p className={`${s.tagline} text-ink-secondary font-medium mt-0.5`}>
          Your multilingual AI assistant
        </p>
      )}
    </div>
  )
}
