'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  reviewing: '#fb923c',
  awaiting_payment: '#3b82f6',
  payment_review: '#8b5cf6',
  confirmed: '#10b981',
  rejected: '#ef4444',
}

const allStatuses = [
  'pending',
  'reviewing',
  'awaiting_payment',
  'payment_review',
  'confirmed',
  'rejected',
]

export default function DashboardReservations() {
  const router = useRouter()
  const [reservations, setReservations] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('admin_auth') !== 'true'
    ) {
      router.push('/dashboard/login')
      return
    }
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('reservations')
      .select(
        `
        *,
        events (
          title,
          date,
          location,
          image_url
        )
      `,
      )
      .order('created_at', { ascending: false })

    setReservations(data || [])

    if (selected) {
      const updated = (data || []).find((r: any) => r.id === selected.id)
      if (updated) setSelected(updated)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    setLoading(true)
    const updateData: any = { status }
    if (status === 'awaiting_payment') {
      updateData.payment_deadline = new Date(
        Date.now() + 48 * 60 * 60 * 1000,
      ).toISOString()
    }
    const { error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
    if (error) {
      alert('Update failed: ' + error.message)
      setLoading(false)
      return
    }
    await load()
    setLoading(false)
  }

  const generateCode = async (id: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setLoading(true)

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'confirmed', entry_code: code })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
      return
    }

    await load()
    setLoading(false)
  }

  const filtered =
    filter === 'all'
      ? reservations
      : reservations.filter(r => r.status === filter)

  const btnStyle = (color: string, isActive = false): React.CSSProperties => ({
    backgroundColor: isActive ? color : `${color}18`,
    border: `1px solid ${color}50`,
    color: isActive ? '#fff' : color,
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '1px',
    fontFamily: 'Inter, sans-serif',
    opacity: loading ? 0.5 : 1,
    transition: 'all 0.15s',
  })

  // ─── DETAIL VIEW ────────────────────────────────────────
  if (selected) {
    const guests: any[] = Array.isArray(selected.people_details)
      ? selected.people_details
      : []

    const mainGuest = guests[0]
    const extraGuests = guests.slice(1)

    const standingCount = selected.standing_count ?? 0
    const backstageCount = selected.backstage_count ?? 0

    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050505',
          padding: '60px 24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => setSelected(null)}
            style={{
              background: 'none',
              border: '1px solid #1a1a1a',
              color: '#555',
              padding: '8px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              letterSpacing: '2px',
              fontFamily: 'Inter, sans-serif',
              marginBottom: '32px',
            }}
          >
            ← BACK
          </button>

          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '20px',
              padding: '32px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '28px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: 900,
                    margin: '0 0 6px',
                  }}
                >
                  {selected.events?.title}
                </h2>
                <p
                  style={{
                    color: '#333',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    margin: 0,
                  }}
                >
                  {selected.id}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: `${
                    statusColors[selected.status] || '#555'
                  }15`,
                  border: `1px solid ${
                    statusColors[selected.status] || '#555'
                  }40`,
                  color: statusColors[selected.status] || '#555',
                  padding: '8px 20px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                }}
              >
                {selected.status.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>

            {/* Flow Steps */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '32px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'pending', label: '1. PENDING' },
                { key: 'reviewing', label: '2. REVIEWING' },
                { key: 'awaiting_payment', label: '3. PAYMENT' },
                { key: 'payment_review', label: '4. REVIEW' },
                { key: 'confirmed', label: '5. CONFIRMED' },
              ].map((step, i, arr) => {
                const order = [
                  'pending',
                  'reviewing',
                  'awaiting_payment',
                  'payment_review',
                  'confirmed',
                ]
                const currentIdx = order.indexOf(selected.status)
                const stepIdx = order.indexOf(step.key)
                const isDone = currentIdx > stepIdx
                const isCurrent = currentIdx === stepIdx
                return (
                  <div
                    key={step.key}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <div
                      style={{
                        padding: '5px 12px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        backgroundColor: isCurrent
                          ? `${statusColors[step.key]}20`
                          : isDone
                          ? 'rgba(16,185,129,0.1)'
                          : '#111',
                        border: `1px solid ${
                          isCurrent
                            ? statusColors[step.key]
                            : isDone
                            ? 'rgba(16,185,129,0.4)'
                            : '#1a1a1a'
                        }`,
                        color: isCurrent
                          ? statusColors[step.key]
                          : isDone
                          ? '#10b981'
                          : '#333',
                      }}
                    >
                      {isDone ? '✓ ' : ''}
                      {step.label}
                    </div>
                    {i < arr.length - 1 && (
                      <span style={{ color: '#222' }}>→</span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  TOTAL PEOPLE
                </p>
                <p
                  style={{ color: '#fff', fontSize: '16px', margin: 0 }}
                >{`${selected.num_people} person${
                  selected.num_people > 1 ? 's' : ''
                }`}</p>
              </div>
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  STANDING
                </p>
                <p style={{ color: '#fff', fontSize: '16px', margin: 0 }}>
                  {standingCount}x @ {selected.standing_price_per_person} EGP
                </p>
              </div>
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  BACKSTAGE
                </p>
                <p style={{ color: '#fff', fontSize: '16px', margin: 0 }}>
                  {backstageCount}x @ {selected.backstage_price_per_person} EGP
                </p>
              </div>
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  TOTAL
                </p>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {selected.total_price} EGP
                </p>
              </div>
            </div>

            {/* Main guest + event info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.4fr 1.2fr',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  MAIN GUEST
                </p>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                    margin: '0 0 2px',
                  }}
                >
                  {mainGuest?.name || selected.name}
                </p>
                <p
                  style={{
                    color: '#888',
                    fontSize: '12px',
                    margin: '0 0 2px',
                  }}
                >
                  {selected.email}
                </p>
                <p
                  style={{
                    color: '#888',
                    fontSize: '12px',
                    margin: '0 0 2px',
                  }}
                >
                  {selected.phone}
                </p>
                <p
                  style={{
                    color: '#888',
                    fontSize: '12px',
                    margin: 0,
                  }}
                >
                  @{selected.instagram}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  MAIN GUEST TICKET
                </p>
                <p
                  style={{
                    color: '#f97316',
                    fontSize: '14px',
                    fontWeight: 700,
                    margin: '0 0 4px',
                  }}
                >
                  {mainGuest?.ticket_type
                    ? mainGuest.ticket_type.toUpperCase()
                    : standingCount > 0
                    ? 'STANDING'
                    : backstageCount > 0
                    ? 'BACKSTAGE'
                    : 'N/A'}
                </p>
                <p
                  style={{
                    color: '#666',
                    fontSize: '12px',
                    margin: 0,
                  }}
                >
                  Wave:{' '}
                  {mainGuest?.ticket_type === 'backstage'
                    ? selected.backstage_wave_label || 'N/A'
                    : selected.standing_wave_label || 'N/A'}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  padding: '14px 16px',
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
                  EVENT DATE
                </p>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                    margin: 0,
                  }}
                >
                  {selected.events?.date
                    ? new Date(selected.events.date).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Guests table */}
            {guests.length > 0 && (
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid #1a1a1a',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    color: '#333',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 12px',
                  }}
                >
                  ALL GUESTS ({guests.length})
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '0.5fr 1.4fr 1fr 1fr 1fr',
                    gap: '10px',
                    padding: '8px 10px',
                    borderBottom: '1px solid #1a1a1a',
                    fontSize: '10px',
                    color: '#555',
                    letterSpacing: '1px',
                  }}
                >
                  <span>#</span>
                  <span>NAME</span>
                  <span>TICKET TYPE</span>
                  <span>PHONE</span>
                  <span>INSTAGRAM</span>
                </div>

                {guests.map((p: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '0.5fr 1.4fr 1fr 1fr 1fr',
                      gap: '10px',
                      padding: '10px',
                      borderBottom:
                        i < guests.length - 1
                          ? '1px solid #1a1a1a'
                          : 'none',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ color: '#555' }}>{i + 1}</span>
                    <span style={{ color: '#fff' }}>{p.name}</span>
                    <span
                      style={{
                        color:
                          p.ticket_type === 'backstage'
                            ? '#a855f7'
                            : '#22c55e',
                        fontWeight: 600,
                      }}
                    >
                      {p.ticket_type
                        ? p.ticket_type.toUpperCase()
                        : 'UNKNOWN'}
                    </span>
                    <span style={{ color: '#ddd' }}>{p.phone}</span>
                    <span style={{ color: '#ddd' }}>
                      {p.instagram ? `@${p.instagram}` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment deadline */}
            {selected.payment_deadline && (
              <div
                style={{
                  backgroundColor: 'rgba(59,130,246,0.05)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    color: '#333',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 6px',
                  }}
                >
                  PAYMENT DEADLINE
                </p>
                <p
                  style={{
                    color: '#3b82f6',
                    fontSize: '16px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {new Date(
                    selected.payment_deadline,
                  ).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  at{' '}
                  {new Date(
                    selected.payment_deadline,
                  ).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            {/* Sender phone */}
            {selected.payment_sender_phone && (
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    color: '#333',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 6px',
                  }}
                >
                  📱 SENT FROM NUMBER
                </p>
                <p
                  style={{
                    color: '#3b82f6',
                    fontSize: '22px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    letterSpacing: '3px',
                    margin: 0,
                  }}
                >
                  {selected.payment_sender_phone}
                </p>
              </div>
            )}

            {/* Screenshot */}
            {selected.payment_screenshot_url && (
              <div
                style={{
                  backgroundColor: '#111',
                  border: '1px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    color: '#8b5cf6',
                    fontSize: '10px',
                    letterSpacing: '3px',
                    fontWeight: 700,
                    margin: '0 0 12px',
                  }}
                >
                  💸 PAYMENT SCREENSHOT
                </p>
                <a
                  href={selected.payment_screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={selected.payment_screenshot_url}
                    alt="Payment proof"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      cursor: 'zoom-in',
                    }}
                  />
                </a>
                <p
                  style={{
                    color: '#333',
                    fontSize: '11px',
                    margin: '8px 0 0',
                    textAlign: 'center',
                  }}
                >
                  Click to open full size
                </p>
              </div>
            )}

            {/* Entry code */}
            {selected.entry_code && (
              <div
                style={{
                  backgroundColor: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    color: '#444',
                    fontSize: '10px',
                    letterSpacing: '3px',
                    margin: '0 0 8px',
                  }}
                >
                  ENTRY CODE
                </p>
                <p
                  style={{
                    color: '#10b981',
                    fontSize: '36px',
                    fontWeight: 900,
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                    margin: 0,
                  }}
                >
                  {selected.entry_code}
                </p>
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                borderTop: '1px solid #1a1a1a',
                paddingTop: '24px',
              }}
            >
              <p
                style={{
                  color: '#333',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  marginBottom: '14px',
                }}
              >
                ACTIONS
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => updateStatus(selected.id, 'reviewing')}
                  style={btnStyle(
                    '#fb923c',
                    selected.status === 'reviewing',
                  )}
                  disabled={loading}
                >
                  🔎 MARK AS REVIEWING
                </button>
                <button
                  onClick={() =>
                    updateStatus(selected.id, 'awaiting_payment')
                  }
                  style={btnStyle(
                    '#3b82f6',
                    selected.status === 'awaiting_payment',
                  )}
                  disabled={loading}
                >
                  💳 REQUEST PAYMENT
                </button>
                <button
                  onClick={() => generateCode(selected.id)}
                  style={btnStyle('#10b981')}
                  disabled={loading}
                >
                  ✅ CONFIRM + SEND CODE
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'rejected')}
                  style={btnStyle('#ef4444')}
                  disabled={loading}
                >
                  ❌ REJECT
                </button>
              </div>
              {loading && (
                <p
                  style={{
                    color: '#555',
                    fontSize: '12px',
                    marginTop: '12px',
                    letterSpacing: '1px',
                  }}
                >
                  Updating...
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ─── LIST VIEW ─────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        padding: '60px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
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
              RESERVATIONS
            </h1>
          </div>
          <p
            style={{
              color: '#444',
              fontSize: '13px',
              margin: 0,
            }}
          >
            {reservations.length} total bookings
          </p>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          {['all', ...allStatuses].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                backgroundColor: filter === s ? '#dc2626' : '#111',
                color: filter === s ? '#fff' : '#444',
                border: `1px solid ${
                  filter === s ? '#dc2626' : '#1a1a1a'
                }`,
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {s.replace(/_/g, ' ').toUpperCase()}{' '}
              (
              {s === 'all'
                ? reservations.length
                : reservations.filter(r => r.status === s).length}
              )
            </button>
          ))}
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr',
              padding: '14px 24px',
              borderBottom: '1px solid #1a1a1a',
            }}
          >
            {['GUEST', 'EVENT', 'TICKETS', 'TOTAL', 'STATUS'].map(h => (
              <span
                key={h}
                style={{
                  color: '#333',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.map((r, i) => (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr',
                padding: '16px 24px',
                cursor: 'pointer',
                borderBottom:
                  i < filtered.length - 1
                    ? '1px solid #111'
                    : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = '#111')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor =
                  'transparent')
              }
            >
              <div>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    margin: '0 0 2px',
                  }}
                >
                  {r.name}
                </p>
                <p
                  style={{
                    color: '#444',
                    fontSize: '12px',
                    margin: 0,
                  }}
                >
                  {r.email}
                </p>
              </div>
              <span
                style={{
                  color: '#666',
                  fontSize: '13px',
                  alignSelf: 'center',
                }}
              >
                {r.events?.title}
              </span>
              <span
                style={{
                  color: '#666',
                  fontSize: '13px',
                  alignSelf: 'center',
                }}
              >
                {r.num_people}x
              </span>
              <span
                style={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  alignSelf: 'center',
                }}
              >
                {r.total_price} EGP
              </span>
              <div style={{ alignSelf: 'center' }}>
                <span
                  style={{
                    backgroundColor: `${
                      statusColors[r.status] || '#555'
                    }15`,
                    border: `1px solid ${
                      statusColors[r.status] || '#555'
                    }30`,
                    color: statusColors[r.status] || '#555',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                  }}
                >
                  {r.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '60px',
                color: '#333',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  letterSpacing: '3px',
                }}
              >
                NO RESERVATIONS FOUND
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
