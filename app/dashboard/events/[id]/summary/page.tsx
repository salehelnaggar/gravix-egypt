'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EventSummaryPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    if (!params?.id) return
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
      return
    }
    load()
  }, [params?.id])

  const load = async () => {
    setLoading(true)
    const { data: ev } = await supabase.from('events').select('*').eq('id', params.id).single()
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
      <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#555', letterSpacing: '3px', fontSize: '12px' }}>LOADING...</p>
      </main>
    )
  }

  if (!eventData) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#ef4444' }}>Event not found.</p>
      </main>
    )
  }

  const ticketsSold = reservations.reduce((s, r) => s + (r.num_people || 0), 0)
  const totalRevenue = reservations.reduce((s, r) => s + (r.total_price || 0), 0)
  const TAX_RATE = 0.14
  const revenueBeforeTax = Math.round(totalRevenue / (1 + TAX_RATE))
  const taxAmount = totalRevenue - revenueBeforeTax

const handleDownload = () => {
  if (!reservations.length) return

  // حساب أقصى عدد من الناس الزيادة
  const maxExtraPeople = Math.max(
    ...reservations.map(r => (r.people_details?.length || 0))
  )

  // بناء الـ header
  const header = [
    '#',
    'Booking ID',
    'Main Guest Name',
    'Main Guest Phone',
    'Main Guest Instagram',
    'Total People Count',
    'Total Price (EGP)',
    'Entry Code',
    'Payment Sender Phone',
    'Booked At (Date)',
    'Booked At (Time)',
  ]

  // إضافة أعمدة الناس الزيادة
  for (let i = 2; i <= maxExtraPeople + 1; i++) {
    header.push(`Guest ${i} Name`)
    header.push(`Guest ${i} Phone`)
    header.push(`Guest ${i} Instagram`)
  }

  // بناء الـ rows
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

    const row = [
      index + 1,
      r.id,
      r.name,
      r.phone,
      r.instagram,
      r.num_people,
      r.total_price ?? 0,
      r.entry_code ?? '',
      r.payment_sender_phone ?? '',
      dateStr,
      timeStr,
    ]

    // إضافة بيانات الناس الزيادة
    const extraPeople = r.people_details || []
    for (let i = 0; i < maxExtraPeople; i++) {
      if (extraPeople[i]) {
        row.push(extraPeople[i].name || '')
        row.push(extraPeople[i].phone || '')
        row.push(extraPeople[i].instagram || '')
      } else {
        row.push('')
        row.push('')
        row.push('')
      }
    }

    return row
  })

  // تحويل لـ CSV
  const csvContent = [header, ...rows]
    .map(row =>
      row
        .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n')

  // إضافة BOM لدعم الأحرف العربية في Excel
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
  a.download = `${safeTitle}_Confirmed_Reservations_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header + Download */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>● EVENT SUMMARY</p>
            <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{eventData.title}</h1>
            <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
              📅 {new Date(eventData.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · 📍 {eventData.location}
            </p>
            {eventData.transfer_number && (
              <p style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, margin: '4px 0 0' }}>
                💳 Transfer Number: {eventData.transfer_number}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'CONFIRMED BOOKINGS', value: reservations.length, color: '#fff', border: '#1a1a1a' },
            { label: 'TICKETS SOLD', value: ticketsSold, color: '#fff', border: '#1a1a1a' },
            { label: 'TOTAL REVENUE', value: `${totalRevenue.toLocaleString()} EGP`, color: '#10b981', border: 'rgba(16,185,129,0.3)' },
            { label: 'REVENUE (BEFORE TAX)', value: `${revenueBeforeTax.toLocaleString()} EGP`, color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
            { label: 'VAT (14%)', value: `${taxAmount.toLocaleString()} EGP`, color: '#dc2626', border: 'rgba(220,38,38,0.3)' },
          ].map(c => (
            <div key={c.label} style={{ backgroundColor: '#0d0d0d', border: `1px solid ${c.border}`, borderRadius: '14px', padding: '20px' }}>
              <p style={{ color: '#555', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>{c.label}</p>
              <p style={{ color: c.color, fontSize: '20px', fontWeight: 800, margin: 0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }}>
            <p style={{ color: '#555', fontSize: '11px', letterSpacing: '3px', fontWeight: 700, margin: 0 }}>
              CONFIRMED RESERVATIONS — اضغط على أي حجز لعرض التفاصيل
            </p>
          </div>

          {reservations.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#333', fontSize: '12px', letterSpacing: '2px' }}>
              NO CONFIRMED RESERVATIONS YET
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {['#', 'NAME', 'PHONE', 'INSTAGRAM', 'PEOPLE', 'TOTAL', 'DATE'].map(h => (
                      <th
                        key={h}
                        style={{ padding: '12px 16px', textAlign: 'left', color: '#444', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 700 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r, i) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(r)}
                      style={{
                        borderBottom: '1px solid #111',
                        backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                    >
                      <td style={{ padding: '12px 16px', color: '#444', fontSize: '11px' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '12px 16px', color: '#888' }}>{r.phone}</td>
                      <td style={{ padding: '12px 16px', color: '#888' }}>{r.instagram}</td>
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 700, textAlign: 'center' }}>{r.num_people}</td>
                      <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700 }}>{(r.total_price || 0).toLocaleString()} EGP</td>
                      <td style={{ padding: '12px 16px', color: '#555', fontSize: '11px' }}>
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      </td>
                    </tr>
                  ))}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '3px', fontWeight: 700, margin: 0 }}>● RESERVATION DETAILS</p>
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
                  <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', margin: '0 0 8px' }}>ENTRY CODE</p>
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

              {[
                { label: 'NAME', value: selected.name },
                { label: 'PHONE', value: selected.phone },
                { label: 'INSTAGRAM', value: selected.instagram },
                { label: 'TICKETS', value: `${selected.num_people} person(s)` },
                { label: 'TOTAL PAID', value: `${selected.total_price || 0} EGP` },
                {
                  label: 'BOOKED ON',
                  value: new Date(selected.created_at).toLocaleDateString('en-US', {
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
                  <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: 0 }}>{item.label}</p>
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

              {selected.people_details && selected.people_details.length > 0 && (
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
                    EXTRA ATTENDEES
                  </p>
                  {selected.people_details.map((p: any, i: number) => (
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
                        👤 {p.name}
                      </p>
                      <p style={{ color: '#555', fontSize: '12px', margin: '0 0 2px' }}>📱 {p.phone}</p>
                      <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>@ {p.instagram}</p>
                    </div>
                  ))}
                </div>
              )}

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
                    style={{ width: '100%', borderRadius: '10px', border: '1px solid #1a1a1a' }}
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
