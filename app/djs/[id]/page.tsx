'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type DJ = {
  id: string
  name: string
  bio?: string
  image_url?: string
  whatsapp_number?: string
}

export default function DJProfilePage() {
  const { id } = useParams()
  const [dj, setDj] = useState<DJ | null>(null)
  const [loading, setLoading] = useState(true)

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640

  useEffect(() => {
    if (!id) return
    supabase
      .from('djs')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setDj(data as DJ)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <main style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#333' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎧</div>
          <p style={{ letterSpacing: '2px', fontSize: '13px' }}>LOADING...</p>
        </div>
      </main>
    )
  }

  if (!dj) {
    return (
      <main style={{ backgroundColor: '#050505', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#333' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎧</div>
          <p style={{ letterSpacing: '2px', fontSize: '13px' }}>DJ NOT FOUND</p>
          <Link href="/djs" style={{ color: '#dc2626', textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', fontWeight: 700 }}>
            ← BACK TO DJs
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#050505', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          minHeight: isMobile ? '60vh' : '70vh',
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'hidden',
        }}
      >
        {/* Background Image */}
        {dj.image_url ? (
          <img
            src={dj.image_url}
            alt={dj.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.35)',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1a0000, #0d0d0d)',
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #050505 0%, transparent 60%)',
          }}
        />

        {/* Back Button */}
        <Link
          href="/djs"
          style={{
            position: 'absolute',
            top: '24px',
            left: '20px',
            color: 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            fontSize: '12px',
            letterSpacing: '2px',
            fontWeight: 700,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        >
          ← BACK
        </Link>

        {/* DJ Info */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: isMobile ? '0 16px 40px' : '0 48px 56px',
            width: '100%',
            maxWidth: '900px',
          }}
        >
          <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 12px' }}>
            ● DJ / ARTIST
          </p>
          <h1
            style={{
              fontSize: isMobile ? '40px' : '72px',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 16px',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            {dj.name}
          </h1>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {dj.whatsapp_number && (
              <a
                href={`https://wa.me/${dj.whatsapp_number}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '13px',
                  letterSpacing: '1px',
                  boxShadow: '0 0 24px rgba(22,163,74,0.25)',
                }}
              >
                💬 BOOK VIA WHATSAPP
              </a>
            )}
          </div>
        </div>
      </section>

      {/* BIO */}
      {dj.bio && (
        <section
          style={{
            padding: isMobile ? '40px 16px' : '56px 48px',
            maxWidth: '900px',
            margin: '0 auto',
            borderBottom: '1px solid #111',
          }}
        >
          <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 16px' }}>
            ● ABOUT
          </p>
          <p
            style={{
              color: '#888',
              fontSize: isMobile ? '15px' : '17px',
              lineHeight: 1.9,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {dj.bio}
          </p>
        </section>
      )}

      {/* CONTACT CARD */}
      <section
        style={{
          padding: isMobile ? '40px 16px' : '56px 48px',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 20px' }}>
          ● CONTACT
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {dj.whatsapp_number && (
            <a
              href={`https://wa.me/${dj.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '16px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s, transform 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = '#10b981'
                  el.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = 'rgba(16,185,129,0.2)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <p style={{ fontSize: '32px', margin: '0 0 12px' }}>💬</p>
                <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>WHATSAPP</p>
                <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 700, margin: 0 }}>
                  +{dj.whatsapp_number}
                </p>
              </div>
            </a>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #111', padding: '32px 16px', textAlign: 'center', backgroundColor: '#050505', marginTop: '40px' }}>
        <Link href="/" style={{ color: '#dc2626', fontWeight: 900, fontSize: '22px', letterSpacing: '2px', textDecoration: 'none' }}>
          GRAVIX
        </Link>
        <p style={{ color: '#222', fontSize: '10px', letterSpacing: '1.6px', margin: '12px 0 0' }}>
          © 2026 GRAVIX EGYPT. ALL RIGHTS RESERVED.
        </p>
      </footer>

    </main>
  )
}
