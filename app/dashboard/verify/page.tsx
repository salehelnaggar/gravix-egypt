'use client'

import { useEffect, useState, useRef } from 'react'
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
  const scannerInstanceRef = useRef<any>(null)

  // admin auth
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
    }
  }, [router])

  // لو فيه qr_code في ال URL نعمل verify
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
          { fps: 10, qrbox: { width: 220, height: 220 } },
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

    const { data, error } = await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', result.id)
      .select()
      .single()

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

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
    <main className="min-h-screen bg-black text-white px-4 py-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-red-500">gravix gate</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">VERIFY ENTRY</h1>
          </div>
          <span className="rounded-full border border-red-600/60 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-red-400">
            door control
          </span>
        </div>

        {/* Scan button */}
        <div className="rounded-2xl border border-red-900/40 bg-gradient-to-br from-red-950/60 via-black to-black p-4 shadow-[0_0_40px_rgba(220,38,38,0.25)]">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold tracking-[0.2em] text-white transition hover:bg-red-500 active:scale-[0.98]"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            SCAN QR CODE
          </button>

          <p className="mt-3 text-[11px] text-red-200/80">
            وجّه التذكرة ناحية الكاميرا. لو الكود URL كامل، السيستم هيلقط الـ ID تلقائيًا.
          </p>
        </div>

        {/* Scanner overlay */}
        {scannerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 px-4">
            <div className="rounded-2xl border border-red-500/40 bg-black/60 p-3">
              <div
                id="qr-reader"
                className="h-[260px] w-[260px] overflow-hidden rounded-xl border border-red-500/40"
              />
            </div>
            <button
              onClick={() => {
                scannerInstanceRef.current?.stop().catch(() => {})
                setScannerOpen(false)
              }}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-300 hover:bg-zinc-900"
            >
              CLOSE
            </button>
          </div>
        )}

        {/* Manual input */}
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-black p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-400">
              OR ENTER CODE
            </p>
            <span className="text-[10px] text-zinc-500">FORMAT: GRV-XXXX-XXXX</span>
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="GRV-2K26-0001"
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none ring-red-600/40 placeholder:text-zinc-600 focus:border-red-600/60 focus:ring-1"
            />
            <button
              onClick={handleVerify}
              disabled={loading || !code.trim()}
              className="flex w-full items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {loading ? 'CHECKING...' : 'VERIFY'}
            </button>
          </div>
        </div>

        {/* Status: invalid */}
        {status === 'notfound' && (
          <div className="rounded-2xl border border-red-900/70 bg-gradient-to-br from-red-950/80 via-black to-black p-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-red-400">
              INVALID TICKET
            </p>
            <p className="mt-1 text-[11px] text-red-200/80">
              QR code غير مسجّل على أي تذكرة. تأكد إنك بتسكان كود Gravix الصحيح.
            </p>
          </div>
        )}

        {/* Ticket card */}
        {status !== 'idle' && result && (
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-black p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">EVENT</p>
                <p className="mt-1 text-sm font-semibold tracking-tight">
                  {result.events?.title}
                </p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Holder: {result.holder_name || result.reservations?.name}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Ticket #{result.ticket_number} · {result.ticket_type}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 px-2 py-1 text-right">
                <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  STATUS
                </p>
                <p
                  className={`mt-1 text-[11px] font-semibold ${
                    status === 'found'
                      ? 'text-emerald-400'
                      : status === 'already'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {status === 'found'
                    ? 'VALID'
                    : status === 'already'
                    ? 'CHECKED IN'
                    : 'INVALID'}
                </p>
              </div>
            </div>

            {status === 'already' && (
              <p className="mt-3 text-[11px] text-amber-300">
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
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-300"
              >
                {loading ? 'CHECKING IN...' : 'CONFIRM ENTRY'}
              </button>
            )}

            <button
              onClick={handleReset}
              className="mt-2 w-full rounded-xl border border-zinc-800 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-zinc-400 hover:bg-zinc-950/70"
            >
              RESET
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
