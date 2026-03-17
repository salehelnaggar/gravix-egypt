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
        .select('*, events(title, date, location, location_url, image_url)')
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
      const margin = 10
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
      <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
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
      <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '48px 32px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🚫</p>
          <p style={{ color: '#dc2626', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>INVALID TICKET</p>
          <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>This ticket does not exist or has been revoked.</p>
        </div>
      </main>
    )
  }

  const isCheckedIn = ticket?.checked_in
  const isBackstage = ticket?.ticket_type === 'backstage'
  const accentColor = isBackstage ? '#7c3aed' : '#111111'
  const typeLabel = isBackstage ? 'BACKSTAGE' : 'STANDING'
  const ticketPrice = isBackstage ? reservation?.backstage_price_per_person : reservation?.standing_price_per_person
  const priceDisplay = ticketPrice ? `${ticketPrice} EGP` : 'PAID'
  const eventDate = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : 'TBA'

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '32px 16px 48px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      <div style={{ width: '100%', maxWidth: '600px' }}>

        {/* ═══ TICKET CARD ═══ */}
        <div
          ref={ticketRef}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            border: '1px solid #e5e7eb',
          }}
        >
          {/* ── Event Banner Image ── */}
          {event?.image_url && (
            <div style={{ width: '100%', lineHeight: 0, position: 'relative' }}>
              <img
                src={event.image_url}
                alt={event?.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '220px',
                  objectFit: 'cover',
                  display: 'block',
                  filter: isCheckedIn ? 'grayscale(60%)' : 'none',
                  opacity: isCheckedIn ? 0.7 : 1,
                }}
              />
              {isCheckedIn && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#ef4444', fontSize: '32px', fontWeight: 900, letterSpacing: '4px', border: '3px solid #ef4444', padding: '4px 20px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    USED
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Event Title ── */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', backgroundColor: '#fff' }}>
            <h1 style={{ color: '#111', fontSize: '22px', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.5px' }}>
              {event?.title?.toUpperCase() || 'GRAVIX EVENT'}
            </h1>
            <a
              href={event?.location_url || '#'}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2563eb', fontSize: '12px', textDecoration: 'none' }}
            >
              Open Updated Event Details Page
            </a>
          </div>

          {/* ── Notice ── */}
          <div style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '10px 20px', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', margin: 0, lineHeight: 1.5 }}>
              THIS FILE ACTS AS YOUR OFFICIAL SINGLE TICKET AND CAN BE SCANNED ONLY ONCE
              <br />SHOW THE QR CODE BELOW TO GAIN ACCESS
            </p>
          </div>

          {/* ── Main Body: Info + QR ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0', padding: '0' }}>

            {/* LEFT: Info */}
            <div style={{ padding: '20px 16px 20px 20px', borderRight: '1px solid #e5e7eb' }}>

              {/* Ticket Information */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#111', fontSize: '12px', fontWeight: 700, margin: '0 0 6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  Ticket Information
                </p>
                <InfoLine label="Name" value={`${typeLabel} - ${ticket?.holder_name || 'Guest'}`} />
                <InfoLine label="Price" value={priceDisplay} />
                <InfoLine label="Status" value={isCheckedIn ? 'Used ⛔' : 'Paid ✓'} valueColor={isCheckedIn ? '#dc2626' : '#16a34a'} />
              </div>

              {/* Event Information */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#111', fontSize: '12px', fontWeight: 700, margin: '0 0 6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  Event Information
                </p>
                <InfoLine label="Event" value={event?.title || 'GRAVIX EVENT'} />
                <InfoLine label="Date and Time" value={eventDate} isLink linkHref={event?.location_url} linkText="Open Updated Event Details Page" />
              </div>

              {/* Venue Information */}
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#111', fontSize: '12px', fontWeight: 700, margin: '0 0 6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  Venue Information
                </p>
                <InfoLine label="Name" value={event?.location || 'TBA'} />
                {event?.location_url && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '3px' }}>
                    <span style={{ color: '#6b7280', fontSize: '11px', minWidth: '80px' }}>Venue Location:</span>
                    <a href={event.location_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '11px', textDecoration: 'none' }}>Get Directions</a>
                  </div>
                )}
              </div>

              {/* Ownership Details */}
              <div>
                <p style={{ color: '#111', fontSize: '12px', fontWeight: 700, margin: '0 0 6px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  Ownership Details
                </p>
                <InfoLine label="Name" value={ticket?.holder_name || '-'} />
                {ticket?.holder_instagram && <InfoLine label="Social Media" value="Open Link" isLink linkHref={ticket.holder_instagram} linkText="Open Link" />}
                {ticket?.holder_phone && <InfoLine label="Phone Number" value={ticket.holder_phone} />}
              </div>
            </div>

            {/* RIGHT: QR + Type */}
            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', minWidth: '160px' }}>

              {/* Type Badge */}
              <div style={{
                backgroundColor: isBackstage ? '#7c3aed' : '#111',
                color: '#fff', fontSize: '11px', fontWeight: 700,
                letterSpacing: '1.5px', padding: '5px 14px',
                borderRadius: '2px', textAlign: 'center', width: '100%',
                boxSizing: 'border-box' as const,
              }}>
                {typeLabel} {isBackstage ? '' : `- #${String(ticket?.ticket_number).padStart(3, '0')}`}
              </div>

              {/* QR Code */}
              {isCheckedIn ? (
                <div style={{ position: 'relative', display: 'inline-block', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <div style={{ opacity: 0.15 }}>
                    <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={110} bgColor="#ffffff" fgColor="#000000" />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '44px', color: '#dc2626', lineHeight: 1 }}>✕</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '10px', border: '2px solid #111', borderRadius: '4px', backgroundColor: '#fff' }}>
                  <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={110} fgColor="#000" bgColor="#fff" level="H" />
                </div>
              )}

              {/* Price / Status */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: isCheckedIn ? '#dc2626' : '#16a34a', fontSize: '12px', fontWeight: 700, margin: 0 }}>
                  {isCheckedIn ? 'Already Used' : priceDisplay}
                </p>
                {!isCheckedIn && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#16a34a', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    <span style={{ color: '#16a34a', fontSize: '10px', fontWeight: 600 }}>VALID</span>
                  </div>
                )}
                {isCheckedIn && ticket?.checked_in_at && (
                  <p style={{ color: '#9ca3af', fontSize: '9px', margin: '4px 0 0' }}>
                    {new Date(ticket.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>

              {/* Ticket # */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', width: '100%', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '9px', margin: 0, letterSpacing: '1px', wordBreak: 'break-all' as const }}>
                  {ticket?.qr_code?.slice(0, 20)}...
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer / Terms ── */}
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '14px 20px', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#6b7280', fontSize: '9.5px', margin: 0, lineHeight: 1.7 }}>
                1. This ticket is non-transferable and should only be used by the intended recipient.<br />
                2. The ticket is valid for a single scan and admits only one person.<br />
                3. An official document matching the name on the ticket must be presented for entry.
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <p style={{ color: '#dc2626', fontWeight: 900, fontSize: '18px', letterSpacing: '4px', margin: 0, lineHeight: 1 }}>GRAVIX</p>
              <p style={{ color: '#9ca3af', fontSize: '8px', letterSpacing: '1px', margin: '2px 0 0', textAlign: 'right' }}>gravixegypt.online</p>
            </div>
          </div>
        </div>

        {/* ── Download Button ── */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            marginTop: '16px', width: '100%', borderRadius: '6px',
            background: downloading ? '#6b7280' : '#111',
            color: '#fff', padding: '14px 16px',
            fontSize: '12px', fontWeight: 700, letterSpacing: '2px',
            border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
            fontFamily: 'Arial, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
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

// ── Helper Component ──
function InfoLine({ label, value, valueColor, isLink, linkHref, linkText }: {
  label: string
  value: string
  valueColor?: string
  isLink?: boolean
  linkHref?: string
  linkText?: string
}) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '3px', flexWrap: 'wrap' as const }}>
      <span style={{ color: '#6b7280', fontSize: '11px', minWidth: '80px', flexShrink: 0 }}>{label}:</span>
      {isLink && linkHref ? (
        <a href={linkHref} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '11px', textDecoration: 'none' }}>{linkText || value}</a>
      ) : (
        <span style={{ color: valueColor || '#111', fontSize: '11px', fontWeight: 500 }}>{value}</span>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', backgroundColor: '#f0f0f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px', fontFamily: 'Arial, sans-serif',
  },
  ticket: {
    backgroundColor: '#fff', border: '1px solid #e5e7eb',
    borderRadius: '4px', width: '100%', maxWidth: '600px',
  },
}
