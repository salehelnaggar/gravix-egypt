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
      console.error('verify error', error)
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
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', result.id)
      .select()
      .single()

    if (error) {
      console.error('checkin error', error)
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
      <div className="mx-auto flex max-w-3xl flex-col gap-6 md:flex-row">
        {/* LEFT: controls */}
        <section className="flex-1 space-y-4">
          <header className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.35em] text-red-500">
              gravix · gate control
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">VERIFY ENTRY</h1>
            <p className="text-xs text-zinc-500">
              Scan ticket QR or enter code to validate and confirm entry in real time.
            </p>
          </header>

          <div className="rounded-2xl border border-red-900/70 bg-gradient-to-br from-red-950/60 via-black to-black p-4 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
            <button
              onClick={() => setScannerOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-red-500 active:scale-[0.98]"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              SCAN QR CODE
            </button>
            <p className="mt-3 text-[11px] text-red-100/80">
              وجّه التذكرة ناحية الكاميرا. لو الكود URL كامل، السيستم هيلقط الـ ID تلقائيًا.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-black p-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="uppercase tracking-[0.3em] text-zinc-500">manual entry</span>
              <span className="text-zinc-600">GRV-XXXX-XXXX</span>
            </div>

            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="GRV-2K26-0001"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none ring-red-600/40 placeholder:text-zinc-600 focus:border-red-600/70 focus:ring-1"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !code.trim()}
                className="flex w-full items-center justify-center rounded-xl bg-zinc-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-900 disabled:text-zinc-500"
              >
                {loading ? 'CHECKING...' : 'VERIFY'}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: status / ticket */}
        <section className="flex-1 space-y-3">
          {status === 'notfound' && (
            <div className="rounded-2xl border border-red-900 bg-gradient-to-br from-red-950 via-black to-black p-4">
              <p className="text-xs font-semibold tracking-[0.25em] text-red-400">
                INVALID TICKET
              </p>
              <p className="mt-2 text-[11px] text-red-100/80">
                QR code غير مسجّل على أي تذكرة. تأكد إنك بتسكان كود Gravix الصحيح أو من النظام
                الرسمي فقط.
              </p>
            </div>
          )}

          {status !== 'idle' && result && (
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-black p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">event</p>
                  <p className="text-sm font-semibold tracking-tight">
                    {result.events?.title}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Holder: {result.holder_name || result.reservations?.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Ticket #{result.ticket_number} · {result.ticket_type}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 px-3 py-2 text-right">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">status</p>
                  <p
                    className={`mt-1 text-[11px] font-semibold ${
                      status === 'found'
                        ? 'text-emerald-400'
                        : status === 'already'
                        ? 'text-amber-300'
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
                <p className="text-[11px] text-amber-300">
                  ALREADY CHECKED IN{' '}
                  {result.checked_in_at
                    ? `at ${new Date(result.checked_in_at).toLocaleTimeString()}`
                    : ''}
                </p>
              )}

              {status === 'found' && (
                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-300"
                >
                  {loading ? 'CHECKING IN...' : 'CONFIRM ENTRY'}
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full rounded-xl border border-zinc-800 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-zinc-400 hover:bg-zinc-950/70"
              >
                RESET
              </button>
            </div>
          )}

          {status === 'idle' && (
            <div className="rounded-2xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-black to-black p-4 text-[11px] text-zinc-500">
              Ready to scan. Use camera or manual code to verify tickets at the door.
            </div>
          )}
        </section>
      </div>

      {/* Scanner overlay */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 px-4">
          <div className="rounded-2xl border border-red-500/60 bg-black/70 p-3">
            <div
              id="qr-reader"
              className="h-[260px] w-[260px] overflow-hidden rounded-xl border border-red-500/60"
            />
          </div>
          <button
            onClick={() => {
              scannerInstanceRef.current?.stop().catch(() => {})
              setScannerOpen(false)
            }}
            className="rounded-full border border-zinc-700 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-zinc-300 hover:bg-zinc-900"
          >
            CLOSE
          </button>
        </div>
      )}
    </main>
  )
}
