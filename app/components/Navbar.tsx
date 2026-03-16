'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, session) => setUser(session?.user || null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const scrollTo = (id: string) => {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(`/#${id}`)
    }
    setMenuOpen(false)
  }

  const displayName = user?.user_metadata?.full_name || ''

  const navLinks = [
    { label: 'EVENTS', id: 'events' },
    { label: 'DJS', id: 'djs' },
    { label: 'PARTNERS', id: 'partners' },
    { label: 'ABOUT US', id: 'about' },
    { label: 'CONTACT US', id: 'contact' },
  ]

  const linkBtn: React.CSSProperties = {
    color: '#555',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '2px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    padding: 0,
    textDecoration: 'none',
  }

  return (
    <>
      {/* ── CSS للـ responsive ── */}
      <style>{`
        .nav-desktop { display: flex; }
        .nav-hamburger { display: none; }
        .nav-mobile-profile { display: none; }

        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-profile { display: flex !important; }
        }
      `}</style>

      <nav
        style={{
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #111',
          padding: '10px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* ── Top Row ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              color: '#dc2626',
              fontWeight: 900,
              fontSize: '20px',
              textDecoration: 'none',
              letterSpacing: '3px',
              whiteSpace: 'nowrap',
            }}
          >
            GRAVIX<span style={{ color: '#fff' }}> EGYPT</span>
          </Link>

          {/* Desktop Links */}
          <div
            className="nav-desktop"
            style={{ alignItems: 'center', gap: '24px' }}
          >
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={linkBtn}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                {link.label}
              </button>
            ))}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  href="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <div
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      backgroundColor: '#111', border: '1px solid #222',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', transition: 'border-color 0.2s', flexShrink: 0,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}
                  >
                    👤
                  </div>
                  {displayName && (
                    <span style={{
                      color: '#888', fontSize: '12px', fontWeight: 700,
                      letterSpacing: '1px', maxWidth: '120px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {displayName}
                    </span>
                  )}
                </Link>
                <button
                  onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                  style={{ ...linkBtn, color: '#333', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                style={{
                  backgroundColor: '#dc2626', color: '#fff',
                  padding: '8px 18px', borderRadius: '10px',
                  fontWeight: 700, fontSize: '12px',
                  textDecoration: 'none', letterSpacing: '1px', whiteSpace: 'nowrap',
                }}
              >
                LOGIN
              </Link>
            )}
          </div>

          {/* Mobile: profile + hamburger */}
          <div
            className="nav-hamburger"
            style={{ alignItems: 'center', gap: '10px' }}
          >
            {user && (
              <Link
                href="/profile"
                className="nav-mobile-profile"
                style={{ alignItems: 'center', textDecoration: 'none' }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  backgroundColor: '#111', border: '1px solid #222',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}>
                  👤
                </div>
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: 'none',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                width: '38px', height: '38px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="1" y1="1" x2="15" y2="15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                  <line x1="15" y1="1" x2="1" y2="15" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <rect width="20" height="2" rx="1" fill="#fff" />
                  <rect y="6" width="20" height="2" rx="1" fill="#fff" />
                  <rect y="12" width="20" height="2" rx="1" fill="#fff" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Dropdown ── */}
        {menuOpen && (
          <div
            style={{
              marginTop: '12px',
              borderTop: '1px solid #111',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                style={{
                  ...linkBtn,
                  textAlign: 'left',
                  padding: '10px 8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  letterSpacing: '2.5px',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.06)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#555'
                }}
              >
                {link.label}
              </button>
            ))}

            <div style={{ height: '1px', backgroundColor: '#111', margin: '6px 0' }} />

            {user ? (
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '6px 8px',
              }}>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    backgroundColor: '#111', border: '1px solid #222',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px',
                  }}>
                    👤
                  </div>
                  {displayName && (
                    <span style={{
                      color: '#888', fontSize: '12px', fontWeight: 700,
                      maxWidth: '140px', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {displayName}
                    </span>
                  )}
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                    setMenuOpen(false)
                  }}
                  style={{ ...linkBtn, color: '#f87171', fontSize: '11px', letterSpacing: '1.5px', fontWeight: 700 }}
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  backgroundColor: '#dc2626', color: '#fff',
                  padding: '12px 0', borderRadius: '10px',
                  fontWeight: 700, fontSize: '13px',
                  textDecoration: 'none', letterSpacing: '1px',
                  textAlign: 'center', margin: '4px 0 2px', display: 'block',
                }}
              >
                LOGIN
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
