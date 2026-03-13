'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type TicketType = 'standing' | 'backstage'

type PeopleDetail = {
  name?: string
  phone?: string
  instagram?: string
  ticket_type?: TicketType
  wave?: number | null
}

export default function EventSummaryPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    if (!params?.id) return
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('admin_auth') !== 'true'
    ) {
      router.push('/dashboard/login')
      return
    }
    load()
  }, [params?.id])

  const load = async () => {
    setLoading(true)
    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()
    const { data: res } = await supabase
      .from('reservations')
      .select('*')
      .eq('event_id', params.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
    setEventData(ev || null)
    setReservations(res || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050505',
          padding: '60px 24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <p
          style={{
            color: '#555',
            letterSpacing: '3px',
            fontSize: '12px',
          }}
        >
          LOADING...
        </p>
      </main>
    )
  }

  if (!eventData) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050505',
          padding: '60px 24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <p style={{ color: '#ef4444' }}>Event not found.</p>
      </main>
    )
  }

  // إجمالي عدد الأشخاص
  const ticketsSold = reservations.reduce(
    (s, r) => s + (r.num_people || 0),
    0,
  )
  const totalRevenue = reservations.reduce(
    (s, r) => s + (r.total_price || 0),
    0,
  )
  const TAX_RATE = 0.14
  const revenueBeforeTax = Math.round(totalRevenue / (1 + TAX_RATE))
  const taxAmount = totalRevenue - revenueBeforeTax

  // -----------------------------
  // تجميع عدد التذاكر حسب النوع و الـ Wave
  // نعتمد على people_details.ticket_type + people_details.wave
  // لو main guest ما فيهوش ticket_type، نستخدم reservation.main_ticket_type / main_wave لو موجودين
  // -----------------------------
  type Counter = {
    standing: number
    backstage: number
    standing_wave_1: number
    standing_wave_2: number
    standing_wave_3: number
    backstage_wave_1: number
    backstage_wave_2: number
    backstage_wave_3: number
  }

  const counts: Counter = reservations.reduce(
    (acc: Counter, r: any) => {
      // Main guest
      const mainTicketType: TicketType | undefined =
        r.main_ticket_type || r.ticket_type
      const mainWave: number | null =
        typeof r.main_wave === 'number' ? r.main_wave : r.wave ?? null

      const inc = (
        type: TicketType | undefined,
        wave: number | null | undefined,
      ) => {
        if (!type) return
        if (type === 'standing') acc.standing += 1
        if (type === 'backstage') acc.backstage += 1
        if (type === 'standing' && wave === 1) acc.standing_wave_1 += 1
        if (type === 'standing' && wave === 2) acc.standing_wave_2 += 1
        if (type === 'standing' && wave === 3) acc.standing_wave_3 += 1
        if (type === 'backstage' && wave === 1) acc.backstage_wave_1 += 1
        if (type === 'backstage' && wave === 2) acc.backstage_wave_2 += 1
        if (type === 'backstage' && wave === 3) acc.backstage_wave_3 += 1
      }

      inc(mainTicketType, mainWave)

      const extras: PeopleDetail[] = Array.isArray(r.people_details)
        ? r.people_details
        : []
      extras.forEach(p => {
        inc(p.ticket_type, p.wave ?? null)
      })

      return acc
    },
    {
      standing: 0,
      backstage: 0,
      standing_wave_1: 0,
      standing_wave_2: 0,
      standing_wave_3: 0,
      backstage_wave_1: 0,
      backstage_wave_2: 0,
      backstage_wave_3: 0,
    },
  )

  const handleDownload = () => {
    if (!reservations.length) return

    const maxExtraPeople = Math.max(
      ...reservations.map(r => (r.people_details?.length || 0)),
      0,
    )

    const header = [
      '#',
      'Booking ID',
      'Main Guest Name',
      'Main Guest Phone',
      'Main Guest Instagram',
      'Main Ticket Type',
      'Main Wave',
      'Total People Count',
      'Total Price (EGP)',
      'Entry Code',
      'Payment Sender Phone',
      'Booked At (Date)',
      'Booked At (Time)',
    ]

    for (let i = 2; i <= maxExtraPeople + 1; i++) {
      header.push(`Guest ${i} Name`)
      header.push(`Guest ${i} Phone`)
      header.push(`Guest ${i} Instagram`)
      header.push(`Guest ${i} Ticket Type`)
      header.push(`Guest ${i} Wave`)
    }

    const rows = reservations.map((r, index) => {
      const bookedDate = new Date(r.created_at)
      const dateStr = bookedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      const timeStr = bookedDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })

      const mainTicketType: TicketType | undefined =
        r.main_ticket_type || r.ticket_type
      const mainWave: number | null =
        typeof r.main_wave === 'number' ? r.main_wave : r.wave ?? null

      const row: any[] = [
        index + 1,
        r.id,
        r.name,
        r.phone,
        r.instagram,
        mainTicketType || '',
        mainWave ?? '',
        r.num_people,
        r.total_price ?? 0,
        r.entry_code ?? '',
        r.payment_sender_phone ?? '',
        dateStr,
        timeStr,
      ]

      const extraPeople: PeopleDetail[] = Array.isArray(r.people_details)
        ? r.people_details
        : []
      for (let i = 0; i < maxExtraPeople; i++) {
        if (extraPeople[i]) {
          row.push(extraPeople[i].name || '')
          row.push(extraPeople[i].phone || '')
          row.push(extraPeople[i].instagram || '')
          row.push(extraPeople[i].ticket_type || '')
          row.push(extraPeople[i].wave ?? '')
        } else {
          row.push('')
          row.push('')
          row.push('')
          row.push('')
          row.push('')
        }
      }

      return row
    })

    const csvContent = [header, ...rows]
      .map(row =>
        row
          .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeTitle = (eventData.title || 'event')
      .toString()
      .replace(/[^a-z0-9]+/gi, '_')
    a.download = `${safeTitle}_Confirmed_Reservations_${new Date()
      .toISOString()
      .split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const safeExtras = (r: any): PeopleDetail[] =>
    Array.isArray(r.people_details) ? r.people_details : []

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        padding: '60px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header + Download */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
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
              ● EVENT SUMMARY
            </p>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 6px',
                letterSpacing: '-0.5px',
              }}
            >
              {eventData.title}
            </h1>
            <p
              style={{
                color: '#555',
                fontSize: '12px',
                margin: 0,
              }}
            >
              📅{' '}
              {new Date(eventData.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC',
              })}{' '}
              · 📍 {eventData.location}
            </p>
            {eventData.transfer_number && (
              <p
                style={{
                  color: '#f59e0b',
                  fontSize: '12px',
                  fontWeight: 600,
                  margin: '4px 0 0',
                }}
              >
                💳 Transfer Number: {eventData.transfer_number}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleDownload}
              style={{
                backgroundColor: '#16a34a',
                border: '1px solid #16a34a',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '1px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ⬇ DOWNLOAD SUMMARY
            </button>

            <button
              onClick={() => router.push('/dashboard/events')}
              style={{
                backgroundColor: '#111',
                border: '1px solid #222',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '1px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ← BACK
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {[
            {
              label: 'CONFIRMED BOOKINGS',
              value: reservations.length,
              color: '#fff',
              border: '#1a1a1a',
            },
            {
              label: 'TICKETS SOLD',
              value: ticketsSold,
              color: '#fff',
              border: '#1a1a1a',
            },
            {
              label: 'STANDING TICKETS',
              value: counts.standing,
              color: '#22c55e',
              border: 'rgba(34,197,94,0.4)',
            },
            {
              label: 'BACKSTAGE TICKETS',
              value: counts.backstage,
              color: '#a855f7',
              border: 'rgba(168,85,247,0.4)',
            },
            {
              label: 'TOTAL REVENUE',
              value: `${totalRevenue.toLocaleString()} EGP`,
              color: '#10b981',
              border: 'rgba(16,185,129,0.3)',
            },
            {
              label: 'REVENUE (BEFORE TAX)',
              value: `${revenueBeforeTax.toLocaleString()} EGP`,
              color: '#3b82f6',
              border: 'rgba(59,130,246,0.3)',
            },
            {
              label: 'VAT (14%)',
              value: `${taxAmount.toLocaleString()} EGP`,
              color: '#dc2626',
              border: 'rgba(220,38,38,0.3)',
            },
          ].map(c => (
            <div
              key={c.label}
              style={{
                backgroundColor: '#0d0d0d',
                border: `1px solid ${c.border}`,
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <p
                style={{
                  color: '#555',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                {c.label}
              </p>
              <p
                style={{
                  color: c.color,
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Waves breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <p
              style={{
                color: '#444',
                fontSize: '10px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: '0 0 10px',
              }}
            >
              STANDING · WAVES
            </p>
            <p
              style={{
                color: '#22c55e',
                fontSize: '13px',
                margin: 0,
              }}
            >
              W1: {counts.standing_wave_1} · W2: {counts.standing_wave_2} · W3:{' '}
              {counts.standing_wave_3}
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '14px',
              padding: '16px',
            }}
          >
            <p
              style={{
                color: '#444',
                fontSize: '10px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: '0 0 10px',
              }}
            >
              BACKSTAGE · WAVES
            </p>
            <p
              style={{
                color: '#a855f7',
                fontSize: '13px',
                margin: 0,
              }}
            >
              W1: {counts.backstage_wave_1} · W2: {counts.backstage_wave_2} · W3:{' '}
              {counts.backstage_wave_3}
            </p>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #1a1a1a',
            }}
          >
            <p
              style={{
                color: '#555',
                fontSize: '11px',
                letterSpacing: '3px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              CONFIRMED RESERVATIONS — اضغط على أي حجز لعرض التفاصيل
            </p>
          </div>

          {reservations.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#333',
                fontSize: '12px',
                letterSpacing: '2px',
              }}
            >
              NO CONFIRMED RESERVATIONS YET
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {[
                      '#',
                      'NAME',
                      'PHONE',
                      'INSTAGRAM',
                      'TYPE',
                      'WAVE',
                      'PEOPLE',
                      'TOTAL',
                      'DATE',
                    ].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          color: '#444',
                          fontSize: '10px',
                          letterSpacing: '1.5px',
                          fontWeight: 700,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r, i) => {
                    const mainTicketType: TicketType | undefined =
                      r.main_ticket_type || r.ticket_type
                    const mainWave: number | null =
                      typeof r.main_wave === 'number'
                        ? r.main_wave
                        : r.wave ?? null

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        style={{
                          borderBottom: '1px solid #111',
                          backgroundColor:
                            i % 2 === 0
                              ? 'transparent'
                              : 'rgba(255,255,255,0.01)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.backgroundColor =
                            'rgba(220,38,38,0.05)')
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.backgroundColor =
                            i % 2 === 0
                              ? 'transparent'
                              : 'rgba(255,255,255,0.01)')
                        }
                      >
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#444',
                            fontSize: '11px',
                          }}
                        >
                          {i + 1}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#fff',
                            fontWeight: 600,
                          }}
                        >
                          {r.name}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#888',
                          }}
                        >
                          {r.phone}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#888',
                          }}
                        >
                          {r.instagram}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color:
                              mainTicketType === 'backstage'
                                ? '#a855f7'
                                : '#22c55e',
                            fontWeight: 700,
                          }}
                        >
                          {mainTicketType
                            ? mainTicketType.toUpperCase()
                            : '-'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#fff',
                          }}
                        >
                          {mainWave ? `W${mainWave}` : '-'}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#fff',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        >
                          {r.num_people}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#10b981',
                            fontWeight: 700,
                          }}
                        >
                          {(r.total_price || 0).toLocaleString()} EGP
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#555',
                            fontSize: '11px',
                          }}
                        >
                          {new Date(r.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              timeZone: 'UTC',
                            },
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reservation Detail Modal */}
        {selected && (
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #dc2626',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '520px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <p
                  style={{
                    color: '#dc2626',
                    fontSize: '11px',
                    letterSpacing: '3px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  ● RESERVATION DETAILS
                </p>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: 'none',
                    border: '1px solid #222',
                    color: '#555',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ✕ CLOSE
                </button>
              </div>

              {selected.entry_code && (
                <div
                  style={{
                    textAlign: 'center',
                    backgroundColor: '#111',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '14px',
                    padding: '20px',
                    marginBottom: '20px',
                  }}
                >
                  <p
                    style={{
                      color: '#444',
                      fontSize: '10px',
                      letterSpacing: '2px',
                      margin: '0 0 8px',
                    }}
                  >
                    ENTRY CODE
                  </p>
                  <p
                    style={{
                      color: '#10b981',
                      fontSize: '40px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      letterSpacing: '8px',
                      margin: 0,
                    }}
                  >
                    {selected.entry_code}
                  </p>
                </div>
              )}

              {/* Main booking info + ticket type / wave */}
              {[
                { label: 'NAME', value: selected.name },
                { label: 'PHONE', value: selected.phone },
                { label: 'INSTAGRAM', value: selected.instagram },
                {
                  label: 'MAIN TICKET',
                  value: `${
                    (selected.main_ticket_type ||
                      selected.ticket_type ||
                      ''
                    )?.toUpperCase() || '-'
                  } ${
                    selected.main_wave || selected.wave
                      ? `· W${selected.main_wave || selected.wave}`
                      : ''
                  }`,
                },
                {
                  label: 'TICKETS',
                  value: `${selected.num_people} person(s)`,
                },
                {
                  label: 'TOTAL PAID',
                  value: `${selected.total_price || 0} EGP`,
                },
                {
                  label: 'BOOKED ON',
                  value: new Date(
                    selected.created_at,
                  ).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #111',
                  }}
                >
                  <p
                    style={{
                      color: '#444',
                      fontSize: '10px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      margin: 0,
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
                      textAlign: 'right',
                      maxWidth: '60%',
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}

              {/* Guests + ticket types */}
              <div style={{ marginTop: '20px' }}>
                <p
                  style={{
                    color: '#444',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 10px',
                  }}
                >
                  GUESTS & TICKETS
                </p>

                {/* Main guest */}
                <div
                  style={{
                    backgroundColor: '#111',
                    border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                  }}
                >
                  <p
                    style={{
                      color: '#10b981',
                      fontSize: '11px',
                      margin: '0 0 4px',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}
                  >
                    MAIN GUEST
                  </p>
                  <p
                    style={{
                      color: '#fff',
                      fontSize: '13px',
                      margin: '0 0 4px',
                    }}
                  >
                    {selected.name} — {selected.phone} — @
                    {selected.instagram}
                  </p>
                  <p
                    style={{
                      color: '#888',
                      fontSize: '11px',
                      margin: 0,
                    }}
                  >
                    {(selected.main_ticket_type ||
                      selected.ticket_type ||
                      ''
                    )?.toUpperCase() || '-'}{' '}
                    {selected.main_wave || selected.wave
                      ? `· W${selected.main_wave || selected.wave}`
                      : ''}
                  </p>
                </div>

                {/* Extra attendees */}
                {safeExtras(selected).length > 0 &&
                  safeExtras(selected).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#111',
                        border: '1px solid #1a1a1a',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '8px',
                      }}
                    >
                      <p
                        style={{
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '13px',
                          margin: '0 0 4px',
                        }}
                      >
                        👤 {p.name} — {p.phone} — @{p.instagram}
                      </p>
                      <p
                        style={{
                          color:
                            p.ticket_type === 'backstage'
                              ? '#a855f7'
                              : '#22c55e',
                          fontSize: '11px',
                          margin: 0,
                          fontWeight: 700,
                        }}
                      >
                        {(p.ticket_type || '-').toUpperCase()}{' '}
                        {p.wave ? `· W${p.wave}` : ''}
                      </p>
                    </div>
                  ))}
              </div>

              {selected.payment_screenshot_url && (
                <div style={{ marginTop: '20px' }}>
                  <p
                    style={{
                      color: '#444',
                      fontSize: '10px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      margin: '0 0 12px',
                    }}
                  >
                    PAYMENT SCREENSHOT
                  </p>
                  <img
                    src={selected.payment_screenshot_url}
                    alt="payment"
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      border: '1px solid #1a1a1a',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}