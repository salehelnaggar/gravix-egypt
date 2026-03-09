'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmailConfirmedPage() {
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/auth/login')
    }, 3000) // 3 ثواني قبل التحويل
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '2px',
              color: '#22c55e',
            }}
          >
            EMAIL CONFIRMED
          </h1>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '13px',
              letterSpacing: '1.5px',
              marginTop: '8px',
              textTransform: 'uppercase',
            }}
          >
            YOU&apos;RE READY TO SIGN IN
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '20px',
            padding: '32px 28px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#e5e7eb',
              fontSize: '14px',
              marginBottom: '10px',
            }}
          >
            Your email has been successfully confirmed.
          </p>
          <p
            style={{
              color: '#9ca3af',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            You will be redirected to the login page in a few seconds.
          </p>
          <p
            style={{
              color: '#6b7280',
              fontSize: '12px',
            }}
          >
            If nothing happens,{' '}
            <a
              href="/auth/login"
              style={{ color: '#dc2626', fontWeight: 600, textDecoration: 'none' }}
            >
              click here to sign in
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
