'use client'

import { useEffect, useState, use, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'

export default function TicketPage({
  params,
}: {
  params: Promise<{ qr_code: string }>
}) {
  const { qr_code } = use(params)

  const [ticket, setTicket] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const ticketRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!qr_code) return
    const run = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, events(title, date, location, location_url, image_url, slug)')
        .eq('qr_code', qr_code)
        .single()
      if (error || !data) { setNotFound(true); setLoading(false); return }
      setTicket(data)
      setEvent(data.events)
      if (data.reservation_id) {
        const { data: res } = await supabase
          .from('reservations')
          .select('standing_price_per_person, backstage_price_per_person')
          .eq('id', data.reservation_id)
          .single()
        if (res) setReservation(res)
      }
      setLoading(false)
    }
    run()
    const channel = supabase
      .channel(`ticket-${qr_code}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `qr_code=eq.${qr_code}` },
        (payload) => setTicket((prev: any) => ({ ...prev, ...payload.new }))
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qr_code])

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return
    try {
      setDownloading(true)
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const el = ticketRef.current
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.97)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 0
      const maxW = pageW - margin * 2
      const maxH = pageH - margin * 2
      let finalW = maxW
      let finalH = (canvas.height * finalW) / canvas.width
      if (finalH > maxH) { finalH = maxH; finalW = (canvas.width * finalH) / canvas.height }
      const x = (pageW - finalW) / 2
      const y = (pageH - finalH) / 2
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pageW, pageH, 'F')
      pdf.addImage(imgData, 'JPEG', x, y, finalW, finalH)
      pdf.save(`GRAVIX-${ticket?.qr_code || 'ticket'}.pdf`)
    } catch (e) {
      console.error('PDF error', e)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <main style={S.page}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #111', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Loading ticket...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={S.page}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '48px 32px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🚫</p>
          <p style={{ color: '#dc2626', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>INVALID TICKET</p>
          <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>This ticket does not exist or has been revoked.</p>
        </div>
      </main>
    )
  }

  const isCheckedIn = ticket?.checked_in
  const isBackstage = ticket?.ticket_type === 'backstage'
  const typeLabel = isBackstage ? 'BACKSTAGE' : 'STANDING'
  const ticketPrice = isBackstage ? reservation?.backstage_price_per_person : reservation?.standing_price_per_person
  const priceDisplay = ticketPrice ? `${ticketPrice} EGP` : 'Paid'

  const eventDate = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      })
    : 'TBA'

  // رابط الايفنت
  const eventPageUrl = event?.slug
    ? `https://gravixegypt.online/events/${event.slug}`
    : event?.location_url || '#'

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '0',
      fontFamily: '"Segoe UI", Arial, sans-serif',
    }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; }
      `}</style>

      {/* ═══ TICKET WRAPPER ═══ */}
      <div
        ref={ticketRef}
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: '#ffffff',
          boxShadow: '0 6px 32px rgba(0,0,0,0.14)',
          margin: '0 auto',
        }}
      >

        {/* ── 1. EVENT BANNER IMAGE ── */}
        <div style={{ width: '100%', lineHeight: 0, position: 'relative', backgroundColor: '#111', overflow: 'hidden' }}>
          {event?.image_url ? (
            <img
              src={event.image_url}
              alt={event?.title || 'Event'}
              style={{
                width: '100%',
                maxHeight: '160px',
                objectFit: 'cover',
                display: 'block',
                filter: isCheckedIn ? 'grayscale(70%) brightness(0.6)' : 'none',
              }}
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{ width: '100%', height: '180px', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '28px', letterSpacing: '8px' }}>GRAVIX</span>
            </div>
          )}
          {isCheckedIn && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                color: '#ef4444', fontSize: '36px', fontWeight: 900,
                border: '4px solid #ef4444', padding: '6px 24px',
                backgroundColor: 'rgba(0,0,0,0.6)', letterSpacing: '6px',
                borderRadius: '4px',
              }}>
                USED
              </span>
            </div>
          )}
        </div>

       {/* ── 2. EVENT TITLE ── */}
<div style={{
  padding: '16px 24px 14px',
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'center',
  backgroundColor: '#fff',
}}>
  <h1 style={{
    color: '#111',
    fontSize: 'clamp(18px, 4vw, 24px)',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '0.5px',
    lineHeight: 1.2,
  }}>
    {event?.title?.toUpperCase() || 'GRAVIX EVENT'}
  </h1>
</div>


        {/* ── 3. NOTICE BAR ── */}
        <div style={{
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          padding: '10px 20px',
          textAlign: 'center',
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: 'clamp(9px, 2vw, 11px)',
            fontWeight: 600,
            letterSpacing: '0.3px',
            margin: 0,
            lineHeight: 1.6,
          }}>
            THIS FILE ACTS AS YOUR OFFICIAL SINGLE TICKET AND CAN BE SCANNED ONLY ONCE
            <br />SHOW THE QR CODE BELOW TO GAIN ACCESS
          </p>
        </div>

        {/* ── 4. BODY: INFO (left) + QR (right) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 180px',
          borderBottom: '1px solid #e5e7eb',
        }}>

          {/* LEFT: Info Sections */}
          <div style={{ padding: '18px 16px 18px 20px', borderRight: '1px solid #e5e7eb' }}>

            {/* Ticket Information */}
            <Section title="Ticket Information">
              <InfoLine label="Name" value={`${typeLabel} - ${ticket?.holder_name || 'Guest'}`} />
              <InfoLine label="Price" value={priceDisplay} />
              <InfoLine label="Status" value={isCheckedIn ? 'Used ⛔' : 'Paid ✓'} valueColor={isCheckedIn ? '#dc2626' : '#16a34a'} />
            </Section>
{/* Event Information */}
<Section title="Event Information">
  <InfoLine label="Event" value={event?.title || 'GRAVIX EVENT'} />
  <InfoLine label="Date" value={eventDate} />
</Section>


            {/* Venue Information */}
            <Section title="Venue Information">
              <InfoLine label="Name" value={event?.location || 'TBA'} />
              {event?.location_url && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                  <span style={{ color: '#6b7280', fontSize: '11px', minWidth: '110px', flexShrink: 0 }}>Venue Location:</span>
                  <a href={event.location_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '11px', textDecoration: 'none' }}>Get Directions</a>
                </div>
              )}
            </Section>

            {/* Ownership Details */}
            <Section title="Ownership Details">
              <InfoLine label="Name" value={ticket?.holder_name || '-'} />
              {ticket?.holder_phone && <InfoLine label="Phone Number" value={ticket.holder_phone} />}
              {ticket?.holder_instagram && (
                <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                  <span style={{ color: '#6b7280', fontSize: '11px', minWidth: '110px', flexShrink: 0 }}>Social Media:</span>
                  <a href={ticket.holder_instagram} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '11px', textDecoration: 'none' }}>Open Link</a>
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT: QR Section */}
          <div style={{
            padding: '18px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '10px',
          }}>

            {/* Type Badge */}
            <div style={{
              backgroundColor: isBackstage ? '#7c3aed' : '#1a1a1a',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '1px',
              padding: '5px 10px',
              width: '100%',
              textAlign: 'center',
              borderRadius: '2px',
            }}>
              {typeLabel}{ticket?.ticket_number ? ` - WAVE ${String(ticket.ticket_number).padStart(1, '0')}` : ''}
            </div>

            {/* QR Code */}
            <div style={{
              padding: '10px',
              border: isCheckedIn ? '2px solid #dc2626' : '2px solid #1a1a1a',
              borderRadius: '4px',
              backgroundColor: '#fff',
              position: 'relative',
            }}>
              {isCheckedIn ? (
                <>
                  <div style={{ opacity: 0.1 }}>
                    <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={120} fgColor="#000" bgColor="#fff" />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '52px', color: '#dc2626', lineHeight: 1 }}>✕</span>
                  </div>
                </>
              ) : (
                <QRCode
                  value={`https://gravixegypt.online/ticket/${ticket.qr_code}`}
                  size={120}
                  fgColor="#000"
                  bgColor="#fff"
                  level="H"
                />
              )}
            </div>

            {/* Price / Status */}
            <p style={{
              color: isCheckedIn ? '#dc2626' : '#111',
              fontSize: '12px',
              fontWeight: 700,
              margin: 0,
              textAlign: 'center',
            }}>
              {isCheckedIn ? 'Already Used' : priceDisplay}
            </p>

            {!isCheckedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', backgroundColor: '#16a34a', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ color: '#16a34a', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }}>VALID</span>
              </div>
            )}

            {isCheckedIn && ticket?.checked_in_at && (
              <p style={{ color: '#9ca3af', fontSize: '9px', margin: 0, textAlign: 'center' }}>
                Scanned at {new Date(ticket.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {/* QR code string (short) */}
            <p style={{
              color: '#d1d5db',
              fontSize: '7.5px',
              fontFamily: 'monospace',
              margin: 0,
              textAlign: 'center',
              wordBreak: 'break-all',
              lineHeight: 1.4,
              paddingTop: '6px',
              borderTop: '1px solid #e5e7eb',
              width: '100%',
            }}>
              {ticket?.qr_code}
            </p>
          </div>
        </div>

        {/* ── 5. FOOTER: Terms + Branding ── */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ color: '#6b7280', fontSize: '9.5px', margin: 0, lineHeight: 1.8 }}>
              1. This ticket is non-transferable and should only be used by the intended recipient.<br />
              2. The ticket is valid for a single scan and admits only one person.<br />
              3. An official document matching the name on the ticket must be presented for entry.
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ color: '#dc2626', fontWeight: 900, fontSize: '20px', letterSpacing: '5px', margin: 0, lineHeight: 1 }}>GRAVIX</p>
            <p style={{ color: '#9ca3af', fontSize: '8px', letterSpacing: '1.5px', margin: '3px 0 0', textAlign: 'right' }}>gravixegypt.online</p>
          </div>
        </div>
      </div>

      {/* ── Download Button (outside ticket, not in PDF) ── */}
      <div style={{ width: '100%', maxWidth: '680px', padding: '16px 0 40px' }}>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            width: '100%',
            borderRadius: '6px',
            background: downloading ? '#6b7280' : '#111',
            color: '#fff',
            padding: '14px 16px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '2px',
            border: 'none',
            cursor: downloading ? 'not-allowed' : 'pointer',
            fontFamily: '"Segoe UI", Arial, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
        >
          {downloading ? (
            <>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              GENERATING PDF...
            </>
          ) : (
            '⬇  DOWNLOAD TICKET PDF'
          )}
        </button>
      </div>
    </main>
  )
}

// ── Helper Components ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <p style={{
        color: '#111',
        fontSize: '12px',
        fontWeight: 700,
        margin: '0 0 5px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '4px',
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function InfoLine({
  label, value, valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '3px', flexWrap: 'wrap' }}>
      <span style={{ color: '#6b7280', fontSize: '11px', minWidth: '110px', flexShrink: 0 }}>{label}:</span>
      <span style={{ color: valueColor || '#111', fontSize: '11px', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 0',
    fontFamily: '"Segoe UI", Arial, sans-serif',
  },
}
