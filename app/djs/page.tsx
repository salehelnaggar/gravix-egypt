'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type DJ = {
  id: string
  name: string
  bio?: string
  image_url?: string
  whatsapp_number?: string
}

export default function DJsPage() {
  const [djs, setDjs] = useState<DJ[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640

  useEffect(() => {
    supabase
      .from('djs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDjs((data as DJ[]) || [])
        setLoading(false)
      })
  }, [])

  const filtered = djs.filter(dj =>
    dj.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <section
        style={{
          background: 'linear-gradient(135deg, #050505 0%, #110000 50%, #050505 100%)',
          padding: isMobile ? '80px 16px 48px' : '100px 16px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid #111',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Back */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '24px',
            left: '20px',
            color: '#444',
            textDecoration: 'none',
            fontSize: '12px',
            letterSpacing: '2px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
          onMouseLeave={e => (e.currentTarget.style.color = '#444')}
        >
          ← BACK
        </Link>

        <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 12px' }}>
          ● FEATURED ARTISTS
        </p>
        <h1
          style={{
            fontSize: isMobile ? '36px' : '56px',
            fontWeight: 900,
            color: '#fff',
            margin: '0 0 8px',
            letterSpacing: '-2px',
          }}
        >
          ALL DJs
        </h1>
        <div
          style={{
            width: '60px',
            height: '3px',
            background: 'linear-gradient(90deg, #dc2626, #ff6b6b)',
            borderRadius: '2px',
            margin: '0 auto 20px',
          }}
        />
        <p style={{ color: '#555', fontSize: '14px', margin: '0 0 32px' }}>
          {djs.length} artist{djs.length !== 1 ? 's' : ''} on the roster
        </p>

        {/* Search */}
        <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="SEARCH DJs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '12px 16px 12px 42px',
              color: '#fff',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '1px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
            onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
          />
        </div>
      </section>

      {/* GRID */}
      <section style={{ padding: isMobile ? '40px 16px' : '56px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#333' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎧</div>
            <p style={{ letterSpacing: '2px', fontSize: '13px' }}>LOADING...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#333' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎧</div>
            <p style={{ letterSpacing: '2px', fontSize: '13px' }}>
              {search ? 'NO DJs FOUND' : 'NO DJs YET'}
            </p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {filtered.map(dj => (
            <div
              key={dj.id}
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '20px',
                overflow: 'hidden',
                transition: 'all 0.3s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = '#dc2626'
                el.style.transform = 'translateY(-6px)'
                el.style.boxShadow = '0 24px 48px rgba(220,38,38,0.1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = '#1a1a1a'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}
            >
              {dj.image_url ? (
  <div
    style={{
      width: '100%',
      aspectRatio: '1/1',
      backgroundColor: '#111',
      overflow: 'hidden',
    }}
  >
    <img
      src={dj.image_url}
      alt={dj.name}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  </div>
) : (
  <div
    style={{
      width: '100%',
      aspectRatio: '1/1',
      background: 'linear-gradient(135deg, #1a0000, #0d0d0d)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '64px',
    }}
  >
    🎧
  </div>
)}

              <div style={{ padding: '20px' }}>
                <p style={{ color: '#dc2626', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 6px' }}>
                  ● DJ
                </p>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 900,
                    color: '#fff',
                    margin: '0 0 8px',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {dj.name}
                </h3>
                {dj.bio && (
                  <p
                    style={{
                      color: '#555',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      margin: '0 0 16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {dj.bio}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    href={`/djs/${dj.id}`}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: '13px',
                      letterSpacing: '1px',
                    }}
                  >
                    VIEW PROFILE
                  </Link>
                  {dj.whatsapp_number && (
                    <a
                      href={`https://wa.me/${dj.whatsapp_number}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(16,185,129,0.4)',
                        color: '#10b981',
                        padding: '10px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        fontSize: '13px',
                        letterSpacing: '1px',
                      }}
                    >
                      CONTACT NOW
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #111', padding: '32px 16px', textAlign: 'center', backgroundColor: '#050505' }}>
        <div style={{ color: '#dc2626', fontWeight: 900, fontSize: '22px', letterSpacing: '2px', marginBottom: '12px' }}>GRAVIX</div>
        <p style={{ color: '#222', fontSize: '10px', letterSpacing: '1.6px', margin: 0 }}>
          © 2026 GRAVIX EGYPT. ALL RIGHTS RESERVED.
        </p>
      </footer>

    </main>
  )
}
