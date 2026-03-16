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
      .select(`*, events (title, date, location, image_url)`)
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

  // ✅ Confirm + WhatsApp
  const handleConfirmAndSendTickets = async (reservation: any) => {
    setLoading(true)

    const { error: confirmError } = await supabase
      .from('reservations')
      .update({ status: 'confirmed' })
      .eq('id', reservation.id)

    if (confirmError) {
      alert('Error confirming: ' + confirmError.message)
      setLoading(false)
      return
    }

    const people: any[] = Array.isArray(reservation.people_details)
      ? reservation.people_details
      : []

    const allPeople =
      people.length > 0
        ? people
        : [{
            name: reservation.name,
            phone: reservation.phone,
            instagram: reservation.instagram,
            ticket_type: 'standing',
          }]

    const ticketsToInsert = allPeople.map((person: any, index: number) => ({
      reservation_id: reservation.id,
      event_id: reservation.event_id,
      user_id: reservation.user_id,
      holder_name: person.name || reservation.name,
      holder_phone: person.phone || null,
      holder_instagram: person.instagram || null,
      ticket_type: person.ticket_type || 'standing',
      ticket_number: index + 1,
      qr_code: `GRV-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}-${index}`,
    }))

    const { data: createdTickets, error: ticketsError } = await supabase
      .from('tickets')
      .insert(ticketsToInsert)
      .select()

    if (ticketsError) {
      alert('Error creating tickets: ' + ticketsError.message)
      setLoading(false)
      return
    }

    const eventTitle  = reservation.events?.title || 'GRAVIX EVENT'
    const eventDate   = reservation.events?.date
      ? new Date(reservation.events.date).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        })
      : 'TBA'
    const eventLocation = reservation.events?.location || 'TBA'

    const ticketBlock = (createdTickets || [])
      .map((t: any) =>
        `  [${String(t.ticket_number).padStart(2, '0')}]  ${t.holder_name}\n` +
        `Type: ${t.ticket_type.toUpperCase()}\n` +
        `Ticket Link : https://gravixegypt.online/ticket/${t.qr_code}`,
      )
      .join('\n\n')

    const waMessage = encodeURIComponent(
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `GRAVIX — BOOKING CONFIRMED\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Dear ${reservation.name},\n\n` +
      `Your reservation has been officially confirmed.\n\n` +
      `Event: ${eventTitle}\n` +
      `Date: ${eventDate}\n` +
      `Venue: ${eventLocation}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `YOUR TICKETS (${(createdTickets || []).length})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${ticketBlock}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Open your QR link at the door\n` +
      `Valid ID required at entry\n` +
      `Non-transferable — one scan only\n\n` +
      `See you on the floor.\n` +
      `GRAVIX — gravixegypt.online`,
    )

    const phone = reservation.phone?.replace(/\D/g, '')
    window.open(`https://wa.me/2${phone}?text=${waMessage}`, '_blank')

    await load()
    setLoading(false)
  }

  // ✅ Gmail منفصل
  const handleSendGmail = async (reservation: any) => {
    if (!reservation.email) {
      alert('No email found for this reservation')
      return
    }

    const eventTitle    = reservation.events?.title || 'GRAVIX EVENT'
    const eventDate     = reservation.events?.date
      ? new Date(reservation.events.date).toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        })
      : 'TBA'
    const eventLocation = reservation.events?.location || 'TBA'

    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('reservation_id', reservation.id)
      .order('ticket_number', { ascending: true })

    const ticketBlock = (tickets || [])
      .map((t: any) =>
`[${String(t.ticket_number).padStart(2, '0')}]  ${t.holder_name}\n` +
`Type: ${t.ticket_type.toUpperCase()}\n` +
`Ticket #: ${String(t.ticket_number).padStart(3, '0')}\n` +
`Ticket Link: https://gravixegypt.online/ticket/${t.qr_code}`,
      )
      .join('\n\n')

    const subject = encodeURIComponent(
      `🎫 Booking Confirmed — ${eventTitle} | GRAVIX`,
    )

    const body = encodeURIComponent(
      `Dear ${reservation.name},\n\n` +
      `Thank you for choosing GRAVIX.\n` +
      `Your reservation has been reviewed and officially confirmed.\n` +
      `Please find your ticket details below.\n\n` +

      `════════════════════════════════\n` +
      `   EVENT DETAILS\n` +
      `════════════════════════════════\n\n` +
      `Event: ${eventTitle}\n` +
      `Date: ${eventDate}\n` +
      `Venue: ${eventLocation}\n\n` +

      `════════════════════════════════\n` +
      `   YOUR TICKETS  (${(tickets || []).length} ticket${(tickets || []).length > 1 ? 's' : ''})\n` +
      `════════════════════════════════\n\n` +

      `${ticketBlock}\n\n` +

      `════════════════════════════════\n` +
      `   ENTRY INSTRUCTIONS\n` +
      `════════════════════════════════\n\n` +
      `📲 Open your QR link on your phone at the entrance.\n` +
      `🪪 A valid photo ID matching the ticket holder\n` +
      `name is required for entry.\n` +
      `⚠️ Each QR code is valid for one scan only.\n` +
      `🚫 Tickets are strictly non-transferable.\n` +
      `🔁 No refunds or date changes after confirmation.\n\n` +

      `════════════════════════════════\n\n` +
      `We look forward to seeing you at the event.\n\n` +
      `Best regards,\n` +
      `GRAVIX Team\n` +
      `gravixegypt.online\n`,
    )

    window.open(
      `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(reservation.email)}&su=${subject}&body=${body}`,
      '_blank',
    )
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

    const mainGuest     = guests[0]
    const standingCount  = selected.standing_count ?? 0
    const backstageCount = selected.backstage_count ?? 0
    const alreadySent    = selected.status === 'confirmed'

    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => setSelected(null)}
            style={{ background: 'none', border: '1px solid #1a1a1a', color: '#555', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif', marginBottom: '32px' }}
          >
            ← BACK
          </button>

          <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, margin: '0 0 6px' }}>{selected.events?.title}</h2>
                <p style={{ color: '#333', fontSize: '12px', fontFamily: 'monospace', margin: 0 }}>{selected.id}</p>
              </div>
              <div style={{ backgroundColor: `${statusColors[selected.status] || '#555'}15`, border: `1px solid ${statusColors[selected.status] || '#555'}40`, color: statusColors[selected.status] || '#555', padding: '8px 20px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px' }}>
                {selected.status.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>

            {/* Flow Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', flexWrap: 'wrap' }}>
              {[
                { key: 'pending',          label: '1. PENDING'   },
                { key: 'reviewing',        label: '2. REVIEWING' },
                { key: 'awaiting_payment', label: '3. PAYMENT'   },
                { key: 'payment_review',   label: '4. REVIEW'    },
                { key: 'confirmed',        label: '5. CONFIRMED' },
              ].map((step, i, arr) => {
                const order = ['pending','reviewing','awaiting_payment','payment_review','confirmed']
                const currentIdx = order.indexOf(selected.status)
                const stepIdx    = order.indexOf(step.key)
                const isDone     = currentIdx > stepIdx
                const isCurrent  = currentIdx === stepIdx
                return (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', backgroundColor: isCurrent ? `${statusColors[step.key]}20` : isDone ? 'rgba(16,185,129,0.1)' : '#111', border: `1px solid ${isCurrent ? statusColors[step.key] : isDone ? 'rgba(16,185,129,0.4)' : '#1a1a1a'}`, color: isCurrent ? statusColors[step.key] : isDone ? '#10b981' : '#333' }}>
                      {isDone ? '✓ ' : ''}{step.label}
                    </div>
                    {i < arr.length - 1 && <span style={{ color: '#222' }}>→</span>}
                  </div>
                )
              })}
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'TOTAL PEOPLE', value: `${selected.num_people} person${selected.num_people > 1 ? 's' : ''}` },
                { label: 'STANDING',     value: `${standingCount}x @ ${selected.standing_price_per_person} EGP`      },
                { label: 'BACKSTAGE',    value: `${backstageCount}x @ ${selected.backstage_price_per_person} EGP`    },
                { label: 'TOTAL',        value: `${selected.total_price} EGP`                                         },
              ].map(card => (
                <div key={card.label} style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px 16px' }}>
                  <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 4px' }}>{card.label}</p>
                  <p style={{ color: '#fff', fontSize: '16px', margin: 0 }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Main guest + event info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1.2fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px 16px' }}>
                <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 4px' }}>MAIN GUEST</p>
                <p style={{ color: '#fff', fontSize: '14px', margin: '0 0 2px' }}>{mainGuest?.name || selected.name}</p>
                <p style={{ color: '#888', fontSize: '12px', margin: '0 0 2px' }}>{selected.email}</p>
                <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px' }}>{selected.phone}</p>
                {selected.instagram ? (
                  <a href={selected.instagram} target="_blank" rel="noreferrer" style={{ color: '#e1306c', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(225,48,108,0.3)', borderRadius: '6px', padding: '3px 8px' }}>
                    📸 Instagram Profile
                  </a>
                ) : (
                  <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>No Instagram</p>
                )}
              </div>

              <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px 16px' }}>
                <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 4px' }}>MAIN GUEST TICKET</p>
                <p style={{ color: '#f97316', fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>
                  {mainGuest?.ticket_type ? mainGuest.ticket_type.toUpperCase() : standingCount > 0 ? 'STANDING' : backstageCount > 0 ? 'BACKSTAGE' : 'N/A'}
                </p>
                <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                  Wave: {mainGuest?.ticket_type === 'backstage' ? selected.backstage_wave_label || 'N/A' : selected.standing_wave_label || 'N/A'}
                </p>
              </div>

              <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '14px 16px' }}>
                <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 4px' }}>EVENT DATE</p>
                <p style={{ color: '#fff', fontSize: '14px', margin: 0 }}>
                  {selected.events?.date ? new Date(selected.events.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Guests table */}
            {guests.length > 0 && (
              <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 12px' }}>ALL GUESTS ({guests.length})</p>
                <div style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.4fr 1fr 1fr 1fr', gap: '10px', padding: '8px 10px', borderBottom: '1px solid #1a1a1a', fontSize: '10px', color: '#555', letterSpacing: '1px' }}>
                  <span>#</span><span>NAME</span><span>TICKET TYPE</span><span>PHONE</span><span>INSTAGRAM</span>
                </div>
                {guests.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.5fr 1.4fr 1fr 1fr 1fr', gap: '10px', padding: '10px', borderBottom: i < guests.length - 1 ? '1px solid #1a1a1a' : 'none', fontSize: '13px', alignItems: 'center' }}>
                    <span style={{ color: '#555' }}>{i + 1}</span>
                    <span style={{ color: '#fff' }}>{p.name}</span>
                    <span style={{ color: p.ticket_type === 'backstage' ? '#a855f7' : '#22c55e', fontWeight: 600 }}>
                      {p.ticket_type ? p.ticket_type.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <span style={{ color: '#ddd' }}>{p.phone}</span>
                    <span>
                      {p.instagram ? (
                        <a href={p.instagram} target="_blank" rel="noreferrer" style={{ color: '#e1306c', fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(225,48,108,0.3)', borderRadius: '6px', padding: '3px 8px' }}>
                          📸 Instagram Profile
                        </a>
                      ) : <span style={{ color: '#444' }}>-</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment deadline */}
            {selected.payment_deadline && (
              <div style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 6px' }}>PAYMENT DEADLINE</p>
                <p style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  {new Date(selected.payment_deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  at {new Date(selected.payment_deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {/* Sender phone */}
            {selected.payment_sender_phone && (
              <div style={{ backgroundColor: '#111', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
                <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 6px' }}>📱 SENT FROM NUMBER</p>
                <p style={{ color: '#3b82f6', fontSize: '22px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '3px', margin: 0 }}>
                  {selected.payment_sender_phone}
                </p>
              </div>
            )}

            {/* Screenshot */}
            {selected.payment_screenshot_url && (
              <div style={{ backgroundColor: '#111', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                <p style={{ color: '#8b5cf6', fontSize: '10px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 12px' }}>💸 PAYMENT SCREENSHOT</p>
                <a href={selected.payment_screenshot_url} target="_blank" rel="noreferrer">
                  <img src={selected.payment_screenshot_url} alt="Payment proof" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', cursor: 'zoom-in' }} />
                </a>
                <p style={{ color: '#333', fontSize: '11px', margin: '8px 0 0', textAlign: 'center' }}>Click to open full size</p>
              </div>
            )}

            {/* Tickets sent indicator */}
            {alreadySent && (
              <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>✅</span>
                <div>
                  <p style={{ color: '#10b981', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', margin: '0 0 2px' }}>TICKETS CONFIRMED</p>
                  <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>Tickets were already confirmed and sent to this guest.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '24px' }}>
              <p style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, marginBottom: '14px' }}>ACTIONS</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

                <button onClick={() => updateStatus(selected.id, 'reviewing')}
                  style={btnStyle('#fb923c', selected.status === 'reviewing')} disabled={loading}>
                  🔎 MARK AS REVIEWING
                </button>

                <button onClick={() => updateStatus(selected.id, 'awaiting_payment')}
                  style={btnStyle('#3b82f6', selected.status === 'awaiting_payment')} disabled={loading}>
                  💳 REQUEST PAYMENT
                </button>

                <button
                  onClick={() => handleConfirmAndSendTickets(selected)}
                  style={{ ...btnStyle('#10b981'), opacity: alreadySent ? 0.4 : loading ? 0.5 : 1, cursor: alreadySent || loading ? 'not-allowed' : 'pointer' }}
                  disabled={loading || alreadySent}
                  title={alreadySent ? 'Tickets already sent' : ''}
                >
                  🎫 CONFIRM + WHATSAPP
                </button>

                {selected.email && (
                  <button
                    onClick={() => handleSendGmail(selected)}
                    style={{ backgroundColor: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.4)', color: '#ea4335', padding: '9px 18px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '1px', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
                  >
                    📧 SEND EMAIL
                  </button>
                )}

                <button onClick={() => updateStatus(selected.id, 'rejected')}
                  style={btnStyle('#ef4444')} disabled={loading}>
                  ❌ REJECT
                </button>

              </div>
              {loading && (
                <p style={{ color: '#555', fontSize: '12px', marginTop: '12px', letterSpacing: '1px' }}>Updating...</p>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ─── LIST VIEW ─────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>● ADMIN</p>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-1px' }}>RESERVATIONS</h1>
          </div>
          <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>{reservations.length} total bookings</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {['all', ...allStatuses].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ backgroundColor: filter === s ? '#dc2626' : '#111', color: filter === s ? '#fff' : '#444', border: `1px solid ${filter === s ? '#dc2626' : '#1a1a1a'}`, padding: '7px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {s.replace(/_/g, ' ').toUpperCase()}{' '}
              ({s === 'all' ? reservations.length : reservations.filter(r => r.status === s).length})
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', padding: '14px 24px', borderBottom: '1px solid #1a1a1a' }}>
            {['GUEST', 'EVENT', 'TICKETS', 'TOTAL', 'STATUS'].map(h => (
              <span key={h} style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700 }}>{h}</span>
            ))}
          </div>

          {filtered.map((r, i) => (
            <div key={r.id} onClick={() => setSelected(r)}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1.5fr', padding: '16px 24px', cursor: 'pointer', borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#111')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 2px' }}>{r.name}</p>
                <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>{r.email}</p>
              </div>
              <span style={{ color: '#666', fontSize: '13px', alignSelf: 'center' }}>{r.events?.title}</span>
              <span style={{ color: '#666', fontSize: '13px', alignSelf: 'center' }}>{r.num_people}x</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, alignSelf: 'center' }}>{r.total_price} EGP</span>
              <div style={{ alignSelf: 'center' }}>
                <span style={{ backgroundColor: `${statusColors[r.status] || '#555'}15`, border: `1px solid ${statusColors[r.status] || '#555'}30`, color: statusColors[r.status] || '#555', padding: '4px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>
                  {r.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#333' }}>
              <p style={{ fontSize: '12px', letterSpacing: '3px' }}>NO RESERVATIONS FOUND</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
