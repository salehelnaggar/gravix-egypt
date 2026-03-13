'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type TicketType = 'standing' | 'backstage'

export default function VerifyEntryPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<'idle' | 'found' | 'notfound' | 'already'>('idle')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
    }
  }, [router])

  const handleVerify = async () => {
    if (!code.trim()) return
    setLoading(true)
    setResult(null)
    setStatus('idle')

    const { data } = await supabase
      .from('reservations')
      .select('*, events(title, date, location)')
      .eq('entry_code', code.trim().toUpperCase())
      .single()

    if (!data) {
      setStatus('notfound')
      setLoading(false)
      return
    }

    const eventDate = data.events?.date ? new Date(data.events.date) : null
    const now = new Date()
    if (!eventDate || eventDate < now) {
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

  const handleCheckIn = async () => {
    if (!result) return
    setLoading(true)
    await supabase
      .from('reservations')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', result.id)
    setResult({ ...result, checked_in: true })
    setStatus('already')
    setLoading(false)
  }

  const handleReset = () => {
    setCode('')
    setResult(null)
    setStatus('idle')
  }

  const guests: any[] = Array.isArray(result?.people_details) ? result.people_details : []
  const mainGuest = guests[0]
  const extraGuests = guests.slice(1)

  const standingCount = result?.standing_count ?? 0
  const backstageCount = result?.backstage_count ?? 0

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        padding: '60px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <p
            style={{
              color: '#dc2626',
              fontSize: '11px',
              letterSpacing: '4px',
              fontWeight: 700,
              margin: '0 0 8px',
            }}
          >
            ● ADMIN
          </p>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 900,
              color: '#fff',
              margin: 0,
              letterSpacing: '-1px',
            }}
          >
            VERIFY ENTRY
          </h1>
        </div>

        {/* Input */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              color: '#444',
              fontSize: '10px',
              letterSpacing: '2px',
              fontWeight: 700,
              margin: '0 0 16px',
            }}
          >
            ENTER ENTRY CODE
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="123456"
              maxLength={10}
              style={{
                flex: 1,
                backgroundColor: '#111',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: '16px 20px',
                color: '#fff',
                fontSize: '28px',
                fontFamily: 'monospace',
                fontWeight: 900,
                letterSpacing: '8px',
                outline: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
          </div>
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
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '48px', margin: '0 0 16px' }}>❌</p>
            <p
              style={{
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: 900,
                letterSpacing: '2px',
                margin: '0 0 8px',
              }}
            >
              INVALID / EXPIRED CODE
            </p>
            <p
              style={{
                color: '#555',
                fontSize: '13px',
                margin: '0 0 24px',
              }}
            >
              No active reservation found with this code.
            </p>
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid #333',
                color: '#555',
                padding: '10px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                letterSpacing: '2px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* Already Checked In */}
        {status === 'already' && result && (
          <div
            style={{
              backgroundColor: 'rgba(245,158,11,0.05)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <p style={{ fontSize: '48px', margin: '0 0 16px' }}>⚠️</p>
              <p
                style={{
                  color: '#f59e0b',
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  margin: '0 0 8px',
                }}
              >
                ALREADY CHECKED IN
              </p>
              <p
                style={{
                  color: '#555',
                  fontSize: '13px',
                  margin: 0,
                }}
              >
                Checked in at:{' '}
                {result.checked_in_at
                  ? new Date(result.checked_in_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>

            {/* Summary */}
            <div
              style={{
                backgroundColor: '#111',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  color: '#333',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 4px',
                }}
              >
                EVENT
              </p>
              <p
                style={{
                  color: '#fff',
                  fontSize: '14px',
                  margin: '0 0 8px',
                }}
              >
                {result.events?.title}
              </p>
              <p
                style={{
                  color: '#333',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 4px',
                }}
              >
                CODE
              </p>
              <p
                style={{
                  color: '#fff',
                  fontSize: '18px',
                  fontFamily: 'monospace',
                  letterSpacing: '4px',
                  margin: 0,
                }}
              >
                {result.entry_code}
              </p>
            </div>

            {/* Guests + ticket types */}
            <GuestsBlock
              mainGuest={mainGuest}
              fallbackMain={{
                name: result.name,
                phone: result.phone,
                instagram: result.instagram,
              }}
              extraGuests={extraGuests}
            />

            <button
              onClick={handleReset}
              style={{
                width: '100%',
                background: 'none',
                border: '1px solid #222',
                color: '#555',
                padding: '12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12px',
                letterSpacing: '2px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
              }}
            >
              VERIFY ANOTHER →
            </button>
          </div>
        )}

        {/* Found — Confirm Entry */}
        {status === 'found' && result && (
          <div
            style={{
              backgroundColor: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <p style={{ fontSize: '48px', margin: '0 0 16px' }}>✅</p>
              <p
                style={{
                  color: '#10b981',
                  fontSize: '16px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  margin: '0 0 4px',
                }}
              >
                VALID TICKET
              </p>
              <p
                style={{
                  color: '#555',
                  fontSize: '13px',
                  margin: 0,
                }}
              >
                {result.events?.title} ·{' '}
                {standingCount} Standing / {backstageCount} Backstage
              </p>
            </div>

            {/* Booking Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              {[
                { label: 'MAIN GUEST', value: result.name },
                { label: 'INSTAGRAM', value: `@${result.instagram}` },
                { label: 'PHONE', value: result.phone },
                {
                  label: 'TICKETS',
                  value: `${result.num_people} person${
                    result.num_people > 1 ? 's' : ''
                  }`,
                },
                {
                  label: 'STANDING',
                  value: `${standingCount}x @ ${result.standing_price_per_person} EGP`,
                },
                {
                  label: 'BACKSTAGE',
                  value: `${backstageCount}x @ ${result.backstage_price_per_person} EGP`,
                },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    backgroundColor: '#111',
                    border: '1px solid #1a1a1a',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <p
                    style={{
                      color: '#333',
                      fontSize: '9px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      margin: '0 0 4px',
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Guests + ticket types */}
            <GuestsBlock
              mainGuest={mainGuest}
              fallbackMain={{
                name: result.name,
                phone: result.phone,
                instagram: result.instagram,
              }}
              extraGuests={extraGuests}
            />

            <button
              onClick={handleCheckIn}
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '18px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '15px',
                letterSpacing: '3px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '12px',
              }}
            >
              {loading ? 'CHECKING IN...' : '✅ CONFIRM ENTRY →'}
            </button>

            <button
              onClick={handleReset}
              style={{
                width: '100%',
                background: 'none',
                border: '1px solid #222',
                color: '#555',
                padding: '12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12px',
                letterSpacing: '2px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
              }}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

type GuestsBlockProps = {
  mainGuest?: { name?: string; phone?: string; instagram?: string; ticket_type?: TicketType }
  fallbackMain: { name: string; phone: string; instagram: string }
  extraGuests: any[]
}

function GuestsBlock({ mainGuest, fallbackMain, extraGuests }: GuestsBlockProps) {
  const mainName = mainGuest?.name || fallbackMain.name
  const mainPhone = mainGuest?.phone || fallbackMain.phone
  const mainInsta = mainGuest?.instagram || fallbackMain.instagram
  const mainType: TicketType | undefined = mainGuest?.ticket_type

  return (
    <div
      style={{
        backgroundColor: '#111',
        borderRadius: '12px',
        padding: '18px 16px',
        marginBottom: '20px',
      }}
    >
      <p
        style={{
          color: '#333',
          fontSize: '10px',
          letterSpacing: '2px',
          fontWeight: 700,
          margin: '0 0 10px',
        }}
      >
        GUESTS & TICKETS
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Main guest */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid rgba(16,185,129,0.4)',
          }}
        >
          <p
            style={{
              color: '#10b981',
              fontSize: '10px',
              margin: '0 0 4px',
              letterSpacing: '1px',
              fontWeight: 700,
            }}
          >
            1) MAIN GUEST{' '}
            {mainType && (
              <span
                style={{
                  color: mainType === 'backstage' ? '#a855f7' : '#22c55e',
                  fontWeight: 700,
                }}
              >
                · {mainType.toUpperCase()}
              </span>
            )}
          </p>
          <p
            style={{
              color: '#fff',
              fontSize: '13px',
              margin: 0,
            }}
          >
            {mainName} — {mainPhone} — @{mainInsta}
          </p>
        </div>

        {/* Extra guests */}
        {extraGuests.map((p: any, i: number) => (
          <div
            key={i}
            style={{
              backgroundColor: '#0d0d0d',
              borderRadius: '8px',
              padding: '10px 12px',
              border: '1px solid #1f2933',
            }}
          >
            <p
              style={{
                color: '#888',
                fontSize: '10px',
                margin: '0 0 4px',
              }}
            >
              {i + 2}) GUEST{' '}
              {p.ticket_type && (
                <span
                  style={{
                    color:
                      p.ticket_type === 'backstage' ? '#a855f7' : '#22c55e',
                    fontWeight: 700,
                  }}
                >
                  · {p.ticket_type.toUpperCase()}
                </span>
              )}
            </p>
            <p
              style={{
                color: '#fff',
                fontSize: '13px',
                margin: 0,
              }}
            >
              {p.name} — {p.phone} — @{p.instagram}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
