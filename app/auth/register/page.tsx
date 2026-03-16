'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputStyle: CSSProperties = {
  width: '100%',
  backgroundColor: '#111',
  border: '1px solid #1a1a1a',
  borderRadius: '10px',
  padding: '14px 16px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const widgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // حمّل Turnstile script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (widgetRef.current && (window as any).turnstile) {
        ;(window as any).turnstile.render(widgetRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          theme: 'dark',
          callback: (token: string) => setCaptchaToken(token),
          'expired-callback': () => setCaptchaToken(''),
          'error-callback': () => setCaptchaToken(''),
        })
      }
    }

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const password = form.password.trim()

    const hasMinLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*]/.test(password) // زوّد الرموز لو حابب

    if (!hasMinLength || !hasUpper || !hasNumber || !hasSpecial) {
      setError(
        'Password must be at least 8 characters and include: one uppercase letter, one number, and one special character like ! or @.'
      )
      return
    }

    if (!captchaToken) {
      setError('Please complete the captcha.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: 'https://gravixegypt.online/auth/email-confirmed',
        captchaToken,
      },
    })

    if (error) {
      setError(error.message)

      if ((window as any).turnstile) {
        ;(window as any).turnstile.reset(widgetRef.current)
      }

      setCaptchaToken('')
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/auth/register-success')
  }

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
            CREATE YOUR ACCOUNT
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '20px',
            padding: '40px',
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <p
                style={{
                  color: '#444',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                FULL NAME
              </p>
              <input
                style={inputStyle}
                type="text"
                placeholder="Your name"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <p
                style={{
                  color: '#444',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                EMAIL
              </p>
              <input
                style={inputStyle}
                type="email"
                placeholder="Email address"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <p
                style={{
                  color: '#444',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                PASSWORD
              </p>
              <input
                style={inputStyle}
                type="password"
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special (! or @)"
                required
                minLength={8}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {/* Turnstile Widget */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '4px 0',
              }}
            >
              <div ref={widgetRef} />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              style={{
                backgroundColor: loading || !captchaToken ? '#1a1a1a' : '#dc2626',
                color: loading || !captchaToken ? '#444' : '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading || !captchaToken ? 'not-allowed' : 'pointer',
                letterSpacing: '2px',
                fontFamily: 'Inter, sans-serif',
                marginTop: '8px',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '...' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              color: '#333',
              fontSize: '13px',
              marginTop: '24px',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/auth/login"
              style={{ color: '#dc2626', textDecoration: 'none', fontWeight: 700 }}
            >
              SIGN IN
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
