'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem('admin_auth', 'true')
      router.push('/dashboard')
    } else {
      setError('Wrong password!')
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '360px', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#dc2626', letterSpacing: '2px' }}>GRAVIX</h1>
          <p style={{ color: '#333', fontSize: '11px', letterSpacing: '3px', marginTop: '8px' }}>ADMIN ACCESS</p>
        </div>
        <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '40px' }}>
          {error && (
            <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>{error}</p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="password"
              placeholder="Admin password"
              required
              style={{
                width: '100%', backgroundColor: '#111', border: '1px solid #1a1a1a',
                borderRadius: '10px', padding: '14px 16px', color: '#fff',
                fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none',
                boxSizing: 'border-box'
              }}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="submit" style={{
              backgroundColor: '#dc2626', color: '#fff', border: 'none',
              padding: '14px', borderRadius: '10px', fontWeight: 700,
              fontSize: '13px', cursor: 'pointer', letterSpacing: '2px',
              fontFamily: 'Inter, sans-serif'
            }}>
              ENTER →
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
