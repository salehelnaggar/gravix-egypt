'use client'

import Link from 'next/link'

export default function UpdatePage() {
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth <= 640

  return (
    <main
      style={{
        backgroundColor: '#050505',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#fff',
      }}
    >
      {/* HERO UPDATE MODE */}
      <section
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #050505 0%, #140000 45%, #050505 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* glow */}
        <div
          style={{
            position: 'absolute',
            width: isMobile ? '420px' : '720px',
            height: isMobile ? '420px' : '720px',
            background:
              'radial-gradient(circle, rgba(220,38,38,0.18) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            filter: 'blur(1px)',
          }}
        />

        {/* top pill */}
        <div
          style={{
            border: '1px solid rgba(220,38,38,0.5)',
            color: '#dc2626',
            fontSize: '10px',
            fontWeight: 700,
            padding: '6px 18px',
            borderRadius: '999px',
            marginBottom: '24px',
            letterSpacing: '3px',
            backgroundColor: 'rgba(220,38,38,0.08)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '999px',
              backgroundColor: '#dc2626',
              boxShadow: '0 0 16px rgba(220,38,38,0.8)',
            }}
          />
          SYSTEM UPDATE · LIVE
        </div>

        {/* logo / title */}
        <h1
          style={{
            fontSize: 'clamp(40px, 14vw, 96px)',
            fontWeight: 900,
            lineHeight: 1,
            margin: '0 0 10px',
            letterSpacing: '-3px',
            color: '#fff',
            position: 'relative',
            zIndex: 2,
          }}
        >
          GRAVIX
        </h1>

        <div
          style={{
            width: '90px',
            height: '3px',
            background:
              'linear-gradient(90deg, #dc2626, #ff6b6b, transparent)',
            borderRadius: '2px',
            margin: '0 auto 24px',
            position: 'relative',
            zIndex: 2,
          }}
        />

        {/* main message */}
        <h2
          style={{
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: 700,
            letterSpacing: '2px',
            margin: '0 0 16px',
            textTransform: 'uppercase',
            color: '#f4f4f5',
            position: 'relative',
            zIndex: 2,
          }}
        >
          WE&apos;RE UPGRADING YOUR LIVE EVENTS EXPERIENCE
        </h2>

        <p
          style={{
            color: '#6b7280',
            fontSize: '14px',
            maxWidth: '460px',
            lineHeight: 1.8,
            marginBottom: '20px',
            fontWeight: 400,
            position: 'relative',
            zIndex: 2,
          }}
        >
          gravixegypt.online is temporarily offline while we roll out a
          faster, smoother booking flow and new features for upcoming
          shows &amp; concerts. We&apos;ll be back very soon.
        </p>

        <p
          style={{
            color: '#4b5563',
            fontSize: '12px',
            maxWidth: '420px',
            lineHeight: 1.7,
            marginBottom: '30px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          You can still reach us for bookings, collaborations and
          partnerships through our social channels below.
        </p>

        {/* fake progress bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '360px',
            marginBottom: '28px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 999,
              backgroundColor: '#111827',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '68%',
                height: '100%',
                background:
                  'linear-gradient(90deg, #dc2626, #f97373, #dc2626)',
                boxShadow: '0 0 20px rgba(220,38,38,0.8)',
                transition: 'width 0.4s ease-out',
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            <span>UPDATING</span>
            <span>~ ALMOST READY</span>
          </div>
        </div>

        {/* socials same as home */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <a
            href="https://instagram.com/gravix_eg"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#f9fafb',
              fontSize: 11,
              letterSpacing: '2px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(220,38,38,0.08)',
            }}
          >
            INSTAGRAM
          </a>
          <a
            href="https://wa.me/201093379437"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(16,185,129,0.4)',
              color: '#6ee7b7',
              fontSize: 11,
              letterSpacing: '2px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(6,95,70,0.35)',
            }}
          >
            WHATSAPP
          </a>
          <a
            href="mailto:gravixegypt@gmail.com"
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.4)',
              color: '#e5e7eb',
              fontSize: 11,
              letterSpacing: '2px',
              textDecoration: 'none',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(15,23,42,0.7)',
            }}
          >
            EMAIL
          </a>
        </div>

        {/* small footer line */}
        <p
          style={{
            marginTop: 24,
            fontSize: 10,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: '#374151',
            position: 'relative',
            zIndex: 2,
          }}
        >
          EGYPT&apos;S #1 LIVE EVENTS PLATFORM
        </p>
      </section>

      {/* optional minimal footer */}
      <footer
        style={{
          borderTop: '1px solid #111',
          padding: '18px 16px',
          textAlign: 'center',
          backgroundColor: '#050505',
        }}
      >
        <p
          style={{
            color: '#1f2933',
            fontSize: 10,
            letterSpacing: '1.8px',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          © 2026 GRAVIX EGYPT · ALL RIGHTS RESERVED
        </p>
      </footer>
    </main>
  )
}
