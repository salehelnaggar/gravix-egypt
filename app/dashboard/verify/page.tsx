'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'

type Status = 'idle' | 'found' | 'notfound' | 'already'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlQr = searchParams.get('qr_code') || ''

  const [code, setCode] = useState(urlQr)
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [loading, setLoading] = useState(false)

  const [scannerOpen, setScannerOpen] = useState(false)
  const scannerInstanceRef = useRef<any>(null)

  // admin auth
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
    }
  }, [router])

  // لو فيه qr_code في ال URL نعمل verify
  useEffect(() => {
    if (urlQr) {
      verifyByQR(urlQr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQr])

  // تشغيل الكاميرا
  useEffect(() => {
    if (!scannerOpen) return

    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerInstanceRef.current = scanner

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            let qrCode = decodedText.trim()
            if (qrCode.includes('/')) {
              const parts = qrCode.split('/')
              qrCode = parts[parts.length - 1]
            }

            if (!qrCode) return

            await scanner.stop().catch(() => {})
            setScannerOpen(false)

            if (typeof window !== 'undefined') {
              window.location.href = `/dashboard/verify?qr_code=${encodeURIComponent(qrCode)}`
            }
          },
          () => {},
        )
      } catch (err) {
        console.error('Camera error:', err)
        setScannerOpen(false)
      }
    }

    startScanner()

    return () => {
      scannerInstanceRef.current?.stop().catch(() => {})
    }
  }, [scannerOpen])

  const verifyByQR = async (qrCode: string) => {
    setLoading(true)
    setResult(null)
    setStatus('idle')

    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        events (title, date, location),
        reservations (name, phone)
      `,
      )
      .eq('qr_code', qrCode.trim())
      .single()

    if (error || !data) {
      setStatus('notfound')
      setLoading(false)
      return
    }

    if (data.checked_in) {
      setResult(data)
      setStatus('already')
      setLoading(false)
      return
    }

    setResult(data)
    setStatus('found')
    setLoading(false)
  }

  const handleVerify = async () => {
    if (!code.trim()) return
    if (typeof window !== 'undefined') {
      window.location.href = `/dashboard/verify?qr_code=${encodeURIComponent(code.trim())}`
    }
  }

  const handleCheckIn = async () => {
    if (!result) return
    setLoading(true)

    await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', result.id)

    setResult({ ...result, checked_in: true, checked_in_at: new Date().toISOString() })
    setStatus('already')
    setLoading(false)
  }

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/verify'
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        color: '#fff',
        padding: 24,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 16 }}>VERIFY ENTRY</h1>

        <button
          onClick={() => setScannerOpen(true)}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 16,
            backgroundColor: '#dc2626',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          SCAN QR CODE
        </button>

        {scannerOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
            }}
          >
            <div
              id="qr-reader"
              style={{ width: 300, maxWidth: '100%', borderRadius: 8, overflow: 'hidden' }}
            />
            <button
              onClick={() => {
                scannerInstanceRef.current?.stop().catch(() => {})
                setScannerOpen(false)
              }}
              style={{
                padding: 10,
                borderRadius: 6,
                border: '1px solid #555',
                background: 'none',
                color: '#ccc',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 8,
            backgroundColor: '#111',
          }}
        >
          <p style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>OR ENTER QR CODE</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="GRV-XXXX-XXXX"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: '1px solid #333',
              backgroundColor: '#000',
              color: '#fff',
              marginBottom: 8,
            }}
          />
          <button
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 6,
              border: 'none',
              backgroundColor: loading || !code.trim() ? '#333' : '#dc2626',
              color: '#fff',
              fontWeight: 700,
              cursor: loading || !code.trim() ? 'default' : 'pointer',
            }}
          >
            {loading ? 'CHECKING...' : 'VERIFY'}
          </button>
        </div>

        {/* RESULTS */}

        {status === 'notfound' && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 8,
              backgroundColor: '#180000',
              border: '1px solid #7f1d1d',
            }}
          >
            <p style={{ margin: 0, color: '#fecaca' }}>INVALID TICKET</p>
          </div>
        )}

        {status !== 'idle' && result && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 8,
              backgroundColor: '#050816',
              border: '1px solid #1f2937',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>{result.events?.title}</p>
            <p style={{ margin: '4px 0', color: '#9ca3af', fontSize: 14 }}>
              Holder: {result.holder_name}
            </p>
            <p style={{ margin: '4px 0', color: '#9ca3af', fontSize: 14 }}>
              Ticket #{result.ticket_number} · {result.ticket_type}
            </p>

            {status === 'already' && (
              <p style={{ marginTop: 8, color: '#f59e0b', fontSize: 13 }}>
                ALREADY CHECKED IN at{' '}
                {result.checked_in_at
                  ? new Date(result.checked_in_at).toLocaleTimeString()
                  : ''}
              </p>
            )}

            {status === 'found' && (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                style={{
                  marginTop: 12,
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {loading ? 'CHECKING IN...' : 'CONFIRM ENTRY'}
              </button>
            )}

            <button
              onClick={handleReset}
              style={{
                marginTop: 8,
                width: '100%',
                padding: 8,
                borderRadius: 6,
                border: '1px solid #374151',
                background: 'none',
                color: '#9ca3af',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              RESET
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
