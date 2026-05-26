'use client'

import { useEffect, useState } from 'react'

export default function UpdatePage() {
  const [isMobile, setIsMobile] = useState(false)
  const [bars] = useState([10, 16, 20, 14, 18, 12, 20, 16, 10, 14, 18, 12])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #00E5FF; }
          50% { opacity: 0.3; box-shadow: 0 0 2px #00E5FF; }
        }
        @keyframes wave {
          0% { transform: scaleY(0.3); opacity: 0.3; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.6; }
          94% { opacity: 1; }
          96% { opacity: 0.7; }
          97% { opacity: 1; }
        }
      `}</style>

      {/* Glow background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,101,255,0.1) 0%, rgba(0,229,255,0.04) 40%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.012) 2px, rgba(0,229,255,0.012) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative',
        maxWidth: '560px',
        width: '100%',
        backgroundColor: '#0a0d14',
        border: '1px solid rgba(0,229,255,0.2)',
        borderRadius: '24px',
        padding: isMobile ? '36px 24px' : '52px 48px',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(0,101,255,0.15), 0 0 120px rgba(0,229,255,0.05)',
      }}>

        {/* SVG Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <svg
            width={isMobile ? 70 : 84}
            height={isMobile ? 70 : 84}
            viewBox="0 0 88 88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 16px rgba(0,229,255,0.7)) drop-shadow(0 0 40px rgba(0,101,255,0.4))' }}
          >
            <path d="M44 8 L80 76 L8 76 Z" stroke="url(#g1)" strokeWidth="3" fill="none" strokeLinejoin="round" />
            <rect x="30" y="54" width="4" height="14" rx="1.5" fill="url(#g2)" />
            <rect x="36.5" y="46" width="4" height="22" rx="1.5" fill="url(#g2)" />
            <rect x="43" y="50" width="4" height="18" rx="1.5" fill="url(#g2)" />
            <rect x="49.5" y="44" width="4" height="24" rx="1.5" fill="url(#g2)" />
            <rect x="56" y="52" width="4" height="16" rx="1.5" fill="url(#g2)" />
            <line x1="16" y1="76" x2="72" y2="76" stroke="url(#g1)" strokeWidth="2.5" />
            <defs>
              <linearGradient id="g1" x1="44" y1="8" x2="44" y2="76" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00E5FF" /><stop offset="1" stopColor="#0065FF" />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                <stop stopColor="#00E5FF" /><stop offset="1" stopColor="#1565FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          border: '1px solid rgba(0,229,255,0.3)',
          backgroundColor: 'rgba(0,229,255,0.06)',
          color: '#00E5FF', fontSize: '9px', fontWeight: 800,
          padding: '5px 14px', borderRadius: '999px',
          letterSpacing: '3px', marginBottom: '20px',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: '#00E5FF', flexShrink: 0,
            animation: 'pulse 1.8s ease-in-out infinite',
          }} />
          INCOMING UPDATE
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: isMobile ? '36px' : '52px',
          fontWeight: 900, color: '#fff',
          margin: '0 0 4px', lineHeight: 1.05,
          letterSpacing: '-2px',
          animation: 'flicker 6s ease-in-out infinite',
        }}>
          STAY
        </h1>
        <h1 style={{
          fontSize: isMobile ? '36px' : '52px',
          fontWeight: 900, margin: '0 0 24px', lineHeight: 1.05,
          letterSpacing: '-2px',
          background: 'linear-gradient(90deg, #00E5FF 0%, #1565FF 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'flicker 6s ease-in-out 0.3s infinite',
        }}>
          TUNED
        </h1>

        {/* Subtext */}
        <p style={{
          color: '#3a4a6a', fontSize: '11px',
          letterSpacing: '2.5px', fontWeight: 600,
          textTransform: 'uppercase', margin: '0 0 6px',
        }}>
          Something <span style={{ color: '#00E5FF' }}>BIG</span> is coming.
        </p>
        <p style={{
          color: '#3a4a6a', fontSize: '11px',
          letterSpacing: '2.5px', fontWeight: 600,
          textTransform: 'uppercase', margin: '0 0 32px',
        }}>
          A new <span style={{ color: '#00E5FF' }}>identity</span>. A new <span style={{ color: '#00E5FF' }}>experience</span>.
        </p>

        {/* Sound wave bars */}
        <div style={{
          display: 'flex', alignItems: 'flex-end',
          justifyContent: 'center', gap: '4px', height: '24px',
        }}>
          {bars.map((h, i) => (
            <div key={i} style={{
              width: '3px', height: `${h}px`, borderRadius: '2px',
              background: 'linear-gradient(180deg, #00E5FF, #1565FF)',
              animation: `wave 1.1s ease-in-out ${i * 0.09}s infinite alternate`,
            }} />
          ))}
        </div>

        {/* Divider */}
        <div style={{
          width: '40px', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
          margin: '28px auto 20px',
        }} />

        {/* Brand name */}
        <p style={{
          color: '#1a2a4a', fontSize: '10px',
          letterSpacing: '4px', fontWeight: 700,
        }}>
          GRAVIX · EGYPT
        </p>
      </div>
    </main>
  )
      }
