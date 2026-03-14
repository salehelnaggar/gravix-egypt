'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminTicketPage({
  params,
}: {
  params: Promise<{ qr_code: string }>
}) {
  const { qr_code } = use(params)

  const [ticket, setTicket] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!qr_code) return

    const load = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          events (title, date, location, image_url),
          reservations (name, phone, instagram, num_people, total_price)
        `)
        .eq('qr_code', qr_code)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTicket(data)
      setEvent(data.events)
      setLoading(false)
    }

    load()
  }, [qr_code])

  const handleCheckIn = async () => {
    if (!ticket || ticket.checked_in) return
    setSaving(true)

    const { error } = await supabase
      .from('tickets')
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id)

    if (!error) {
      setTicket({
        ...ticket,
        checked_in: true,
        checked_in_at: new Date().toISOString(),
      })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main style={A.main}>
        <p style={{ color: '#888', letterSpacing: '4px', fontSize: 12 }}>
          LOADING TICKET...
        </p>
      </main>
    )
  }

  if (notFound || !ticket) {
    return (
      <main style={A.main}>
        <div style={A.card}>
          <p style={{ fontSize: 40, margin: 0 }}>❌</p>
          <p style={{ color: '#ef4444', fontWeight: 800, marginTop: 12 }}>
            TICKET NOT FOUND
          </p>
        </div>
      </main>
    )
  }

  const isCheckedIn = ticket.checked_in

  return (
    <main style={A.main}>
      <div style={A.card}>
        <p
          style={{
            color: '#dc2626',
            fontSize: 11,
            letterSpacing: 4,
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          ● ADMIN · VERIFY ENTRY
        </p>

        <h1
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: 900,
            margin: '0 0 8px',
          }}
        >
          {event?.title}
        </h1>

        <p style={{ color: '#777', fontSize: 13, margin: '0 0 20px' }}>
          QR: {ticket.qr_code}
        </p>

        {/* تفاصيل التذكرة / الحجز */}
        <div
          style={{
            backgroundColor: '#111',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              color: '#555',
              fontSize: 10,
              letterSpacing: 2,
              margin: '0 0 8px',
            }}
          >
            TICKET HOLDER
          </p>
          <p
            style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: 800,
              margin: '0 0 12px',
            }}
          >
            {ticket.holder_name}
          </p>

          <p style={{ color: '#777', fontSize: 13, margin: '0 0 4px' }}>
            Ticket #{ticket.ticket_number} · {ticket.ticket_type?.toUpperCase()}
          </p>
          <p style={{ color: '#777', fontSize: 13, margin: 0 }}>
            Reservation: {ticket.reservations?.name} ·{' '}
            {ticket.reservations?.phone}
          </p>
        </div>

        {/* حالة الدخول */}
        {isCheckedIn ? (
          <div
            style={{
              backgroundColor: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                color: '#10b981',
                fontWeight: 800,
                letterSpacing: 3,
                fontSize: 13,
                margin: '0 0 6px',
              }}
            >
              ✅ ALREADY CHECKED IN
            </p>
            <p style={{ color: '#777', fontSize: 12, margin: 0 }}>
              At{' '}
              {ticket.checked_in_at &&
                new Date(ticket.checked_in_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
            </p>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={saving}
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              padding: 16,
              borderRadius: 12,
              fontWeight: 900,
              letterSpacing: 3,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            {saving ? 'CHECKING IN...' : '✅ CONFIRM ENTRY'}
          </button>
        )}

        <p
          style={{
            color: '#444',
            fontSize: 11,
            marginTop: 8,
          }}
        >
          This page تظهر فقط للـ admin من الداشبورد.
        </p>
      </div>
    </main>
  )
}

const A: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    backgroundColor: '#050505',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0b0b0b',
    borderRadius: 20,
    border: '1px solid #1f1f1f',
    padding: 24,
  },
}
