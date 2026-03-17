'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Status = 'idle' | 'found' | 'notfound' | 'already'

export default function VerifyPage() {
  const router = useRouter()

  const [code, setCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [loading, setLoading] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const scannerInstanceRef = useRef<any>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
    }
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const qr = params.get('qr_code')
    if (qr) {
      setCode(qr)
      verifyByQR(qr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!scannerOpen) return
    const startScanner = async () => {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerInstanceRef.current = scanner
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
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
    return () => { scannerInstanceRef.current?.stop().catch(() => {}) }
  }, [scannerOpen])

  const verifyByQR = async (qrCode: string) => {
    setLoading(true)
    setResult(null)
    setStatus('idle')
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id, reservation_id, event_id, user_id,
        holder_name, holder_phone, holder_instagram,
        ticket_type, ticket_number, qr_code,
        checked_in, checked_in_at, created_at,
        events (title, date, location),
        reservations (name, phone)
      `)
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
    const { data, error } = await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', result.id)
      .select(`
        id, reservation_id, event_id, user_id,
        holder_name, holder_phone, holder_instagram,
        ticket_type, ticket_number, qr_code,
        checked_in, checked_in_at, created_at,
        events (title, date, location),
        reservations (name, phone)
      `)
      .single()

    if (error) { console.error('checkin error', error); setLoading(false); return }
    setResult(data)
    setStatus('already')
    setLoading(false)
  }

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/verify'
    }
  }

  return (
    <main style={{
      backgroundColor: '#050505',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      padding: isMobile ? '16px 12px' : '24px 16px',
    }}>
      {/* BACKGROUND GLOW */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at top, rgba(220,38,38,0.18) 0, transparent 55%)',
        opacity: 0.9,
      }} />

      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '24px',
      }}>

        {/* LEFT: title + controls */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#dc2626',
              fontSize: '10px',
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: '999px',
              marginBottom: '16px',
              letterSpacing: '3px',
              backgroundColor: 'rgba(220,38,38,0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '999px',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 12px rgba(34,197,94,0.8)',
              }} />
              GATE CONTROL
            </div>

            <h1 style={{
              fontSize: isMobile ? '26px' : '36px',
              fontWeight: 900,
              color: '#fff',
              margin: 0,
              letterSpacing: '-1px',
            }}>
              VERIFY ENTRY
            </h1>
            <p style={{
              color: '#666', fontSize: '13px',
              maxWidth: '420px', lineHeight: 1.7, marginTop: '8px',
            }}>
              Scan ticket QR or enter code to validate and confirm entry in real time at the gate.
            </p>
          </div>

          {/* Scan card */}
          <div style={{
            borderRadius: '20px',
            border: '1px solid rgba(220,38,38,0.35)',
            background: 'linear-gradient(135deg, rgba(24,0,0,0.9), rgba(10,10,10,0.95))',
            padding: '16px',
            boxShadow: '0 20px 40px rgba(220,38,38,0.25)',
          }}>
            <button
              onClick={() => setScannerOpen(true)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff',
                padding: isMobile ? '14px 20px' : '12px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: isMobile ? '13px' : '12px',
                border: 'none',
                letterSpacing: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: '999px',
                backgroundColor: '#fff',
                boxShadow: '0 0 18px rgba(255,255,255,0.9)',
              }} />
              SCAN QR CODE
            </button>
            <p style={{ color: '#fca5a5', fontSize: '11px', marginTop: '10px' }}>
              Face The Camera To Scan The QR Code
            </p>
          </div>

          {/* Manual code card */}
          <div style={{
            borderRadius: '20px',
            border: '1px solid #1a1a1a',
            backgroundColor: '#0b0b0b',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '10px',
            }}>
              <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>MANUAL ENTRY</div>
              <div style={{ color: '#333', fontSize: '11px', letterSpacing: '2px' }}>GRV-XXXX-XXXX</div>
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="GRV-2K26-0001"
              style={{
                width: '100%',
                borderRadius: '12px',
                backgroundColor: '#050505',
                border: '1px solid #1f1f1f',
                padding: isMobile ? '12px 14px' : '10px 12px',
                color: '#fff',
                fontSize: isMobile ? '16px' : '13px',
                outline: 'none',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleVerify}
              disabled={loading || !code.trim()}
              style={{
                width: '100%',
                borderRadius: '12px',
                backgroundColor: loading || !code.trim() ? '#111' : '#e5e5e5',
                color: loading || !code.trim() ? '#555' : '#050505',
                padding: isMobile ? '12px' : '10px 12px',
                fontSize: isMobile ? '13px' : '11px',
                fontWeight: 700,
                letterSpacing: '2px',
                border: 'none',
                cursor: loading || !code.trim() ? 'default' : 'pointer',
              }}
            >
              {loading ? 'CHECKING...' : 'VERIFY'}
            </button>
          </div>
        </section>

        {/* RIGHT: ticket status + full details */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {status === 'idle' && (
            <div style={{
              borderRadius: '20px',
              border: '1px solid #141414',
              backgroundColor: '#050505',
              padding: '20px',
              color: '#444',
              fontSize: '13px',
            }}>
              Ready to scan. Use camera or manual code to verify tickets at the door.
            </div>
          )}

          {status === 'notfound' && (
            <div style={{
              borderRadius: '20px',
              border: '1px solid #7f1d1d',
              background: 'linear-gradient(135deg, #220000, #050505)',
              padding: '20px',
            }}>
              <div style={{ color: '#fecaca', fontSize: '12px', letterSpacing: '2px', fontWeight: 700, marginBottom: '4px' }}>
                INVALID TICKET
              </div>
              <div style={{ color: '#fca5a5', fontSize: '11px' }}>
                QR code غير مسجّل على أي تذكرة. تأكد إنك بتسكان كود Gravix الصحيح أو من النظام الرسمي فقط.
              </div>
            </div>
          )}

          {status !== 'idle' && result && (
            <div style={{
              borderRadius: '20px',
              border: '1px solid #1a1a1a',
              backgroundColor: '#050505',
              padding: '20px',
            }}>
              {/* TOP: event + status */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                gap: '16px', marginBottom: '12px',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px', marginBottom: '4px' }}>EVENT</div>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.5px' }}>
                    {result.events?.title}
                  </div>
                  <div style={{ color: '#777', fontSize: '12px', marginTop: '4px' }}>
                    {result.events?.date ? new Date(result.events.date).toLocaleString() : ''}
                  </div>
                  <div style={{ color: '#777', fontSize: '12px', marginTop: '2px' }}>
                    📍 {result.events?.location}
                  </div>
                </div>

                <div style={{
                  borderRadius: '12px', border: '1px solid #1f1f1f',
                  padding: '8px 10px', textAlign: 'right', minWidth: 110,
                }}>
                  <div style={{ color: '#666', fontSize: '10px', letterSpacing: '2px', marginBottom: '4px' }}>STATUS</div>
                  <div style={{
                    fontSize: '11px', fontWeight: 700,
                    color: status === 'found' ? '#22c55e' : status === 'already' ? '#fbbf24' : '#ef4444',
                  }}>
                    {status === 'found' ? 'VALID' : status === 'already' ? 'CHECKED IN' : 'INVALID'}
                  </div>
                  {status === 'already' && (
                    <div style={{ color: '#facc15', fontSize: '10px', marginTop: '4px' }}>
                      {result.checked_in_at ? new Date(result.checked_in_at).toLocaleTimeString() : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* MIDDLE: ticket + holder details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '12px',
                marginTop: '8px',
                fontSize: '12px',
                color: '#ddd',
              }}>
                {/* HOLDER card مع زرار OPEN INSTAGRAM */}
                <div style={{
                  borderRadius: '12px', border: '1px solid #151515',
                  padding: '10px', backgroundColor: '#050505',
                }}>
                  <div style={{ color: '#666', fontSize: '10px', letterSpacing: '2px', marginBottom: '4px' }}>HOLDER</div>
                  <div style={{ fontWeight: 600 }}>
                    {result.holder_name || result.reservations?.name || '—'}
                  </div>
                  <div style={{ color: '#777', fontSize: '11px', marginTop: '2px' }}>
                    PHONE: {result.holder_phone || result.reservations?.phone || '—'}
                  </div>

                  {result.holder_instagram ? (
                    <a
                      href={result.holder_instagram}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-block',
                        marginTop: '6px',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220,38,38,0.4)',
                        backgroundColor: 'rgba(220,38,38,0.08)',
                        color: '#fca5a5',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      OPEN INSTAGRAM
                    </a>
                  ) : (
                    <div style={{ color: '#777', fontSize: '11px', marginTop: '2px' }}>
                      INSTAGRAM: —
                    </div>
                  )}
                </div>

                <div style={{
                  borderRadius: '12px', border: '1px solid #151515',
                  padding: '10px', backgroundColor: '#050505',
                }}>
                  <div style={{ color: '#666', fontSize: '10px', letterSpacing: '2px', marginBottom: '4px' }}>TICKET</div>
                  <div style={{ fontWeight: 600 }}>#{result.ticket_number} · {result.ticket_type}</div>
                  <div style={{ color: '#777', fontSize: '11px', marginTop: '2px', wordBreak: 'break-all' }}>
                    QR: {result.qr_code}
                  </div>
                  <div style={{ color: '#777', fontSize: '11px', marginTop: '2px' }}>
                    CREATED: {result.created_at ? new Date(result.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              </div>

              {/* BOTTOM: actions */}
              {status === 'found' && (
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#050505',
                    padding: isMobile ? '14px 12px' : '10px 12px',
                    borderRadius: '12px',
                    fontSize: isMobile ? '13px' : '11px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    border: 'none',
                    cursor: loading ? 'default' : 'pointer',
                    marginTop: '12px',
                  }}
                >
                  {loading ? 'CHECKING IN...' : 'CONFIRM ENTRY'}
                </button>
              )}

              <button
                onClick={handleReset}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#666',
                  padding: isMobile ? '14px 12px' : '10px 12px',
                  borderRadius: '12px',
                  fontSize: isMobile ? '13px' : '11px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  border: '1px solid #1a1a1a',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                RESET
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Scanner overlay */}
      {scannerOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16, zIndex: 50,
        }}>
          <div style={{
            borderRadius: '20px',
            border: '1px solid rgba(220,38,38,0.6)',
            backgroundColor: '#050505',
            padding: 16,
          }}>
            <div
              id="qr-reader"
              style={{
                width: isMobile ? Math.min(window.innerWidth - 80, 280) : 260,
                height: isMobile ? Math.min(window.innerWidth - 80, 280) : 260,
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(220,38,38,0.7)',
                backgroundColor: '#000',
              }}
            />
          </div>
          <button
            onClick={() => {
              scannerInstanceRef.current?.stop().catch(() => {})
              setScannerOpen(false)
            }}
            style={{
              padding: '10px 24px',
              borderRadius: '999px',
border: '1px solid #444',
              backgroundColor: 'transparent',
              color: '#e5e5e5',
              fontSize: isMobile ? '13px' : '11px',
              letterSpacing: '2px',
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
        </div>
      )}
    </main>
  )
}
