'use client'

import Link from 'next/link'

export default function CheckEmailPage() {
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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 900,
              letterSpacing: '2px',
              color: '#dc2626',
            }}
          >
            GRAVIX
          </h1>
          <p
            style={{
              color: '#444',
              fontSize: '13px',
              letterSpacing: '2px',
              marginTop: '8px',
            }}
          >
            CHECK YOUR EMAIL
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
          <h2
            style={{
              color: '#fff',
              fontSize: '18px',
              marginBottom: '12px',
              fontWeight: 700,
            }}
          >
            Registration successful
          </h2>
          <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>
            We have sent a confirmation link to your email address.
          </p>
          <p style={{ color: '#777', fontSize: '12px', lineHeight: 1.6 }}>
            Please open your inbox, click on the confirmation link,
            then come back and sign in to your account.
          </p>

          <p style={{ marginTop: '24px', fontSize: '13px', color: '#555' }}>
            Already confirmed your email?{' '}
            <Link
              href="/auth/login"
              style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'none' }}
            >
              Go to login
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
