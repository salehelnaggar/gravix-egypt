'use client'

import Navbar from '@/components/Navbar'

export default function Page() {
  const bars = [10, 16, 22, 14, 18, 12, 20, 16, 10, 14, 20, 12]

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: '#03050a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 10px #00E5FF; }
            50% { opacity: 0.35; box-shadow: 0 0 2px #00E5FF; }
          }

          @keyframes wave {
            0% { transform: scaleY(0.35); opacity: 0.35; }
            100% { transform: scaleY(1); opacity: 1; }
          }

          @keyframes flicker {
            0%, 100% { opacity: 1; }
            94% { opacity: 1; }
            95% { opacity: 0.65; }
            96% { opacity: 1; }
            97% { opacity: 0.8; }
            98% { opacity: 1; }
          }
        `}</style>

        {/* main glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at center, rgba(0,101,255,0.15) 0%, rgba(0,229,255,0.05) 35%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />

        {/* left light */}
        <div
          style={{
            position: 'absolute',
            left: '-5%',
            top: '8%',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(0,101,255,0.2), transparent 70%)',
            filter: 'blur(22px)',
            pointerEvents: 'none',
          }}
        />

        {/* right light */}
        <div
          style={{
            position: 'absolute',
            right: '-5%',
            top: '8%',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)',
            filter: 'blur(22px)',
            pointerEvents: 'none',
          }}
        />

        {/* scanlines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.012) 2px, rgba(0,229,255,0.012) 4px)',
            pointerEvents: 'none',
          }}
        />

        <section
          style={{
            width: '100%',
            maxWidth: '760px',
            textAlign: 'center',
            padding: '56px 24px',
            borderRadius: '28px',
            border: '1px solid rgba(0,229,255,0.14)',
            background:
              'linear-gradient(180deg, rgba(7,10,20,0.96) 0%, rgba(3,5,10,0.98) 100%)',
            boxShadow:
              '0 0 70px rgba(0,101,255,0.14), inset 0 0 40px rgba(0,229,255,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* hidden logo mark */}
          <div
            style={{
              position: 'absolute',
              top: '34px',
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: 0.07,
              pointerEvents: 'none',
            }}
          >
            <svg width="140" height="140" viewBox="0 0 88 88" fill="none">
              <path d="M44 8 L80 76 L8 76 Z" stroke="#00E5FF" strokeWidth="3" />
              <rect x="30" y="54" width="4" height="14" rx="1.5" fill="#00E5FF" />
              <rect x="36.5" y="46" width="4" height="22" rx="1.5" fill="#00E5FF" />
              <rect x="43" y="50" width="4" height="18" rx="1.5" fill="#00E5FF" />
              <rect x="49.5" y="44" width="4" height="24" rx="1.5" fill="#00E5FF" />
              <rect x="56" y="52" width="4" height="16" rx="1.5" fill="#00E5FF" />
            </svg>
          </div>

          {/* badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(0,229,255,0.24)',
              backgroundColor: 'rgba(0,229,255,0.05)',
              color: '#00E5FF',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '3px',
              marginBottom: '24px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#00E5FF',
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />
            NEW UPDATE
          </div>

          <h1
            style={{
              fontSize: 'clamp(46px, 12vw, 92px)',
              lineHeight: 0.95,
              fontWeight: 900,
              margin: '0',
              letterSpacing: '-3px',
              color: '#ffffff',
              textShadow: '0 0 18px rgba(120,180,255,0.35)',
              animation: 'flicker 6s ease-in-out infinite',
              position: 'relative',
              zIndex: 1,
            }}
          >
            STAY
          </h1>

          <h1
            style={{
              fontSize: 'clamp(46px, 12vw, 92px)',
              lineHeight: 0.95,
              fontWeight: 900,
              margin: '0 0 18px',
              letterSpacing: '-3px',
              background: 'linear-gradient(90deg, #00E5FF 0%, #1565FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'flicker 6s ease-in-out 0.25s infinite',
              position: 'relative',
              zIndex: 1,
            }}
          >
            TUNED
          </h1>

          <p
            style={{
              color: '#e5f3ff',
              fontSize: '12px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              margin: '0 0 10px',
              opacity: 0.92,
              position: 'relative',
              zIndex: 1,
            }}
          >
            Something big is coming.
          </p>

          <p
            style={{
              color: '#7c8aa5',
              fontSize: '12px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              margin: '0 0 30px',
              lineHeight: 1.8,
              position: 'relative',
              zIndex: 1,
            }}
          >
            A new <span style={{ color: '#00E5FF' }}>identity</span>. A new{' '}
            <span style={{ color: '#00E5FF' }}>experience</span>.
          </p>

          {/* sound wave */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '4px',
              height: '30px',
              marginBottom: '30px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${h}px`,
                  borderRadius: '2px',
                  background: 'linear-gradient(180deg, #00E5FF, #1565FF)',
                  animation: `wave 1.1s ease-in-out ${i * 0.08}s infinite alternate`,
                  boxShadow: '0 0 8px rgba(0,229,255,0.35)',
                }}
              />
            ))}
          </div>

          <div
            style={{
              width: '58px',
              height: '1px',
              margin: '0 auto 18px',
              background:
                'linear-gradient(90deg, transparent, rgba(0,229,255,0.65), transparent)',
              position: 'relative',
              zIndex: 1,
            }}
          />

          <p
            style={{
              margin: 0,
              color: '#3d4a64',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '4px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            GRAVIX EGYPT
          </p>
        </section>
      </main>
    </>
  )
        }
