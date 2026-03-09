'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const linkStyle: React.CSSProperties = {
    color: '#555', textDecoration: 'none',
    fontSize: '13px', fontWeight: 600,
    letterSpacing: '2px', cursor: 'pointer',
    background: 'none', border: 'none',
    fontFamily: 'Inter, sans-serif', padding: 0
  }

  const scrollTo = (id: string) => {
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push(`/#${id}`)
    }
  }

  const displayName = user?.user_metadata?.full_name || ''

  return (
    <nav style={{
      backgroundColor: '#0a0a0a', borderBottom: '1px solid #111',
      padding: '16px 40px', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100
    }}>

      <Link href="/" style={{ color: '#dc2626', fontWeight: 900, fontSize: '20px', textDecoration: 'none', letterSpacing: '3px' }}>
        GRAVIX<span style={{ color: '#fff' }}> EGYPT</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>

        <button onClick={() => scrollTo('events')} style={linkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >EVENTS</button>

        <button onClick={() => scrollTo('about')} style={linkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >ABOUT US</button>

        <button onClick={() => scrollTo('contact')} style={linkStyle}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >CONTACT US</button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* ✅ Profile Icon + Name */}
            <Link href="/profile" title="My Profile" style={{
              display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: '#111', border: '1px solid #222',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', transition: 'border-color 0.2s', flexShrink: 0
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#dc2626')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#222')}
              >👤</div>
              {displayName && (
                <span style={{
                  color: '#888', fontSize: '12px', fontWeight: 700,
                  letterSpacing: '1px', maxWidth: '120px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {displayName}
                </span>
              )}
            </Link>

            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '12px', fontFamily: 'Inter, sans-serif', letterSpacing: '1px', fontWeight: 600, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#333')}
            >LOGOUT</button>

          </div>
        ) : (
          <Link href="/auth/login" style={{
            backgroundColor: '#dc2626', color: '#fff', padding: '10px 24px',
            borderRadius: '10px', fontWeight: 700, fontSize: '13px',
            textDecoration: 'none', letterSpacing: '1px'
          }}>LOGIN</Link>
        )}
      </div>
    </nav>
  )
}
