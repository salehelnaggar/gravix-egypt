'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/')
    }, 4000) // 4 ثواني وبعدين يروح الهوم

    return () => clearTimeout(timer)
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
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0d0d0d',
          border: '1px solid #1a1a1a',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 900,
            letterSpacing: '2px',
            color: '#22c55e',
            marginBottom: '8px',
          }}
        >
          ACCOUNT CREATED
        </h1>
        <p
          style={{
            color: '#666',
            fontSize: '13px',
            lineHeight: 1.7,
            marginBottom: '20px',
          }}
        >
          Your GRAVIX account has been created successfully.
          You&apos;ll be redirected to the home page in a few seconds.
        </p>

        <div
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '999px',
            background:
              'linear-gradient(90deg, #22c55e, rgba(34,197,94,0.1))',
            marginBottom: '24px',
          }}
        />

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            borderRadius: '999px',
            background:
              'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '2px',
            textDecoration: 'none',
          }}
        >
          GO TO HOME →
        </Link>

        <p
          style={{
            marginTop: '16px',
            color: '#333',
            fontSize: '11px',
            letterSpacing: '2px',
          }}
        >
          REDIRECTING...
        </p>
      </div>
    </main>
  )
}
