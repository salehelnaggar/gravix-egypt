'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function VerifyEntryPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<'idle' | 'found' | 'notfound' | 'already'>('idle')
  const [loading, setLoading] = useState(false)

  // Scanner states
  const [scannerOpen, setScannerOpen] = useState(false)
  const scannerInstanceRef = useRef<any>(null)

  // check admin auth
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
    }
  }, [router])

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
            console.log('SCANNED TEXT:', decodedText)

            let qrCode = decodedText.trim()
            if (qrCode.includes('/')) {
              const parts = qrCode.split('/')
              qrCode = parts[parts.length - 1]
            }

            if (!qrCode) {
              console.error('NO QR CODE PARSED')
              return
            }

            await scanner.stop().catch(() => {})
            setScannerOpen(false)

            setCode(qrCode)
            await verifyByQR(qrCode)
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

  // verify من جدول tickets
  const verifyByQR = async (qrCode: string) => {
    setLoading(true)
    setResult(null)
    setStatus('idle')

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (title, date, location, image_url),
        reservations (name, phone, instagram, num_people, total_price, standing_count, backstage_count, standing_price_per_person, backstage_price_per_person)
      `)
      .eq('qr_code', qrCode.trim())
      .single()

    console.log('VERIFY RESPONSE', { data, error })

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

  // verify يدوي بالكود
  const handleVerify = async () => {
    if (!code.trim()) return
    await verifyByQR(code.trim())
  }

  // check-in على جدول tickets
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
    setCode('')
    setResult(null)
    setStatus('idle')
    setScannerOpen(false)
  }

  const closeScanner = () => {
    scannerInstanceRef.current?.stop().catch(() => {})
    setScannerOpen(false)
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>● ADMIN</p>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-1px' }}>VERIFY ENTRY</h1>
        </div>

        {/* زرار فتح الكاميرا */}
        <button
          onClick={() => { handleReset(); setScannerOpen(true) }}
          style={{
            width: '100%',
            backgroundColor: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#dc2626',
            padding: '18px',
            borderRadius: '14px',
            fontWeight: 900,
            fontSize: '14px',
            letterSpacing: '3px',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '20px' }}>📷</span> SCAN QR CODE
        </button>

        {/* QR Scanner Modal */}
        {scannerOpen && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}>
            <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, marginBottom: '24px' }}>● SCANNING QR CODE</p>

            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <div
                id="qr-reader"
                style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}
              />

              {[
                { top: 0, left: 0, borderTop: '3px solid #dc2626', borderLeft: '3px solid #dc2626' },
                { top: 0, right: 0, borderTop: '3px solid #dc2626', borderRight: '3px solid #dc2626' },
                { bottom: 0, left: 0, borderBottom: '3px solid #dc2626', borderLeft: '3px solid #dc2626' },
                { bottom: 0, right: 0, borderBottom: '3px solid #dc2626', borderRight: '3px solid #dc2626' },
              ].map((corner, i) => (
                <div key={i} style={{ position: 'absolute', width: '24px', height: '24px', borderRadius: '2px', ...corner }} />
              ))}
            </div>

            <p style={{ color: '#444', fontSize: '12px', letterSpacing: '2px', margin: '24px 0 20px', textAlign: 'center' }}>
              Point camera at the QR code
            </p>

            <button
              onClick={closeScanner}
              style={{ background: 'none', border: '1px solid #333', color: '#555', padding: '12px 32px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Manual Input */}
        <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
          <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 16px' }}>OR ENTER QR CODE MANUALLY</p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="GRV-XXXX-XXXX"
            style={{
              width: '100%',
              backgroundColor: '#111',
              border: '1px solid #222',
              borderRadius: '12px',
              padding: '16px 20px',
              color: '#fff',
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 900,
              letterSpacing: '4px',
              outline: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            style={{
              width: '100%',
              marginTop: '16px',
              backgroundColor: code.trim() && !loading ? '#dc2626' : '#111',
              color: code.trim() && !loading ? '#fff' : '#333',
              border: 'none',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '3px',
              cursor: code.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'CHECKING...' : 'VERIFY →'}
          </button>
        </div>

        {/* Not Found */}
        {status === 'notfound' && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>❌</p>
            <p style={{ color: '#ef4444', fontSize: '16px', fontWeight: 900, letterSpacing: '2px', margin: '0 0 8px' }}>INVALID TICKET</p>
            <p style={{ color: '#555', fontSize: '13px', margin: '0 0 24px' }}>No ticket found with this QR code.</p>
            <button onClick={handleReset} style={{ background: 'none', border: '1px solid #333', color: '#555', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif' }}>
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Already Checked In */}
        {status === 'already' && result && (
          <div style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⚠️</p>
              <p style={{ color: '#f59e0b', fontSize: '16px', fontWeight: 900, letterSpacing: '2px', margin: '0 0 8px' }}>ALREADY CHECKED IN</p>
              <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
                Entered at{' '}
                {result.checked_in_at
                  ? new Date(result.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>

            <TicketBlock ticket={result} />

            <button onClick={handleReset} style={{ width: '100%', background: 'none', border: '1px solid #222', color: '#555', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
              VERIFY ANOTHER →
            </button>
          </div>
        )}

        {/* Found — Confirm Entry */}
        {status === 'found' && result && (
          <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px' }}>✅</p>
              <p style={{ color: '#10b981', fontSize: '16px', fontWeight: 900, letterSpacing: '2px', margin: '0 0 4px' }}>VALID TICKET</p>
              <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{result.events?.title}</p>
            </div>

            <TicketBlock ticket={result} />

            <button
              onClick={handleCheckIn}
              disabled={loading}
              style={{ width: '100%', backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '18px', borderRadius: '12px', fontWeight: 900, fontSize: '15px', letterSpacing: '3px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '12px' }}
            >
              {loading ? 'CHECKING IN...' : '✅ CONFIRM ENTRY →'}
            </button>

            <button onClick={handleReset} style={{ width: '100%', background: 'none', border: '1px solid #222', color: '#555', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
              CANCEL
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

// Ticket details block
function TicketBlock({ ticket }: { ticket: any }) {
  return (
    <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
      <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 14px' }}>TICKET DETAILS</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { label: 'HOLDER', value: ticket.holder_name },
          {
            label: 'TICKET TYPE',
            value: ticket.ticket_type?.toUpperCase(),
            color: ticket.ticket_type === 'backstage' ? '#a855f7' : '#22c55e',
          },
          { label: 'TICKET #', value: `#${ticket.ticket_number}` },
          { label: 'EVENT', value: ticket.events?.title },
          { label: 'PHONE', value: ticket.holder_phone || '—' },
          { label: 'INSTAGRAM', value: ticket.holder_instagram ? `@${ticket.holder_instagram}` : '—' },
        ].map((item) => (
          <div key={item.label} style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 12px' }}>
            <p style={{ color: '#333', fontSize: '9px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 4px' }}>{item.label}</p>
            <p style={{ color: (item as any).color || '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
