'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .eq('password', password)
      .single()

    if (dbError || !data) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    localStorage.setItem('admin_auth', 'true')
    localStorage.setItem('admin_role', data.role)
    localStorage.setItem('admin_username', data.username)
    localStorage.setItem('admin_id', data.id)

    router.push('/dashboard')
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '6px', fontWeight: 700, margin: '0 0 12px' }}>● GRAVIX</p>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>ADMIN ACCESS</h1>
        </div>

        <form onSubmit={handleLogin} style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>USERNAME</p>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>PASSWORD</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{ width: '100%', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px' }}>
              <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>⚠ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif', marginTop: '8px' }}
          >
            {loading ? 'VERIFYING...' : 'ENTER DASHBOARD'}
          </button>
        </form>
      </div>
    </main>
  )
}
