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
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
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
    <main className="min-h-screen bg-[#050505] text-white px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-semibold tracking-[0.25em] text-center">
          VERIFY ENTRY
        </h1>

        <button
          onClick={() => setScannerOpen(true)}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold tracking-[0.2em] hover:bg-red-500"
        >
          SCAN QR CODE
        </button>

        {scannerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
            <div
              id="qr-reader"
              className="w-[280px] h-[280px] rounded-xl overflow-hidden border border-red-500"
            />
            <button
              onClick={() => {
                scannerInstanceRef.current?.stop().catch(() => {})
                setScannerOpen(false)
              }}
              className="mt-4 px-4 py-2 text-xs rounded-lg border border-zinc-600"
            >
              CLOSE
            </button>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-black p-4 space-y-2">
          <p className="text-[11px] text-zinc-500">OR ENTER QR CODE</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="GRV-XXXX-XXXX"
            className="w-full rounded-lg bg-[#050505] border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-red-600"
          />
          <button
            onClick={handleVerify}
            disabled={loading || !code.trim()}
            className="w-full rounded-lg bg-zinc-100 py-2 text-[11px] font-semibold tracking-[0.2em] text-black disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? 'CHECKING...' : 'VERIFY'}
          </button>
        </div>

        {status === 'notfound' && (
          <div className="rounded-xl border border-red-900 bg-red-950/60 p-3">
            <p className="text-xs font-semibold text-red-300">INVALID TICKET</p>
          </div>
        )}

        {status !== 'idle' && result && (
          <div className="rounded-xl border border-zinc-800 bg-black p-4 space-y-2">
            <p className="text-xs text-zinc-500">EVENT</p>
            <p className="text-sm font-semibold">{result.events?.title}</p>
            <p className="text-[11px] text-zinc-400">
              Holder: {result.holder_name || result.reservations?.name}
            </p>
            <p className="text-[11px] text-zinc-500">
              Ticket #{result.ticket_number} · {result.ticket_type}
            </p>

            {status === 'already' && (
              <p className="mt-2 text-[11px] text-amber-300">
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
                className="mt-3 w-full rounded-lg bg-emerald-500 py-2 text-[11px] font-semibold tracking-[0.2em] text-black disabled:bg-emerald-900 disabled:text-emerald-300"
              >
                {loading ? 'CHECKING IN...' : 'CONFIRM ENTRY'}
              </button>
            )}

            <button
              onClick={handleReset}
              className="mt-2 w-full rounded-lg border border-zinc-800 py-2 text-[11px] tracking-[0.2em] text-zinc-400"
            >
              RESET
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
