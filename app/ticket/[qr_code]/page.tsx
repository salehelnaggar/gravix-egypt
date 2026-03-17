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

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }
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
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `qr_code=eq.${qr_code}` },
        (payload) => setTicket((prev: any) => ({ ...prev, ...payload.new })),
      )
      .subscribe()

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
        backgroundColor: '#0d0d0d',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 12
      const maxW = pageW - margin * 2
      const maxH = pageH - margin * 2

      let finalW = maxW
      let finalH = (canvas.height * finalW) / canvas.width
      if (finalH > maxH) {
        finalH = maxH
        finalW = (canvas.width * finalH) / canvas.height
      }

      const x = (pageW - finalW) / 2
      const y = (pageH - finalH) / 2

      pdf.setFillColor(8, 8, 8)
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
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid #1a1a1a', borderTop: '2px solid #dc2626',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#333', letterSpacing: '4px', fontSize: '11px', margin: 0 }}>LOADING</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={S.page}>
        <div style={{ ...S.ticket, textAlign: 'center', padding: '60px 32px' }}>
          <p style={{ fontSize: '56px', margin: '0 0 16px' }}>🚫</p>
          <p style={{ color: '#dc2626', fontWeight: 900, fontSize: '18px', letterSpacing: '3px', margin: '0 0 8px' }}>INVALID TICKET</p>
          <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>This ticket does not exist or has been revoked.</p>
        </div>
      </main>
    )
  }

  const isCheckedIn = ticket?.checked_in
  const isBackstage = ticket?.ticket_type === 'backstage'
  const accentColor = isCheckedIn ? '#ef4444' : isBackstage ? '#a855f7' : '#10b981'
  const typeLabel = isBackstage ? 'BACKSTAGE' : 'STANDING'

  const ticketPrice = isBackstage
    ? reservation?.backstage_price_per_person
    : reservation?.standing_price_per_person
  const priceDisplay = ticketPrice ? `${ticketPrice} EGP` : 'PAID'

  const eventDate = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
      })
    : 'TBA'

  const eventShortDate = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
      })
    : 'TBA'

  const accentGradient = isCheckedIn
    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
    : isBackstage
    ? 'linear-gradient(90deg, #a855f7, #7c3aed)'
    : 'linear-gradient(90deg, #10b981, #059669)'

  const InfoRow = ({ label, value, link, accent }: {
    label: string; value: string; link?: string; accent?: string
  }) => (
    <div style={{ marginBottom: '10px' }}>
      <p style={{ color: '#444', fontSize: '8px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 2px' }}>{label}</p>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
          {value} ↗
        </a>
      ) : (
        <p style={{ color: accent || '#e5e7eb', fontSize: '11px', fontWeight: accent ? 700 : 500, margin: 0, lineHeight: 1.4 }}>
          {value}
        </p>
      )}
    </div>
  )

  const SectionTitle = ({ children }: { children: string }) => (
    <p style={{
      color: accentColor, fontSize: '8px', letterSpacing: '3px', fontWeight: 900,
      margin: '0 0 10px', borderBottom: `1px solid ${accentColor}30`, paddingBottom: '5px',
    }}>
      {children}
    </p>
  )

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#080808',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '32px 16px 48px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ width: '100%', maxWidth: '880px', animation: 'fadeIn 0.4s ease' }}>

        {/* ═══ TICKET — LANDSCAPE ═══ */}
        {/* Scroll wrapper on small screens */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, borderRadius: '16px' }}>
          <div
            ref={ticketRef}
            style={{
              minWidth: '760px',
              backgroundColor: '#0d0d0d',
              border: `1px solid ${accentColor}30`,
              borderRadius: '16px',
              overflow: 'hidden',
              opacity: isCheckedIn ? 0.75 : 1,
              transition: 'opacity 0.5s',
            }}
          >
            {/* ── TOP COLOR BAR ── */}
            <div style={{ height: '4px', background: accentGradient }} />

            {/* ── MAIN ROW ── */}
            <div style={{ display: 'flex', alignItems: 'stretch' }}>

              {/* LEFT: Event Image */}
              {event?.image_url && (
                <div style={{
                  width: '190px',
                  flexShrink: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: '#111',
                }}>
                  {/* Left accent bar */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                    backgroundColor: accentColor, zIndex: 2,
                  }} />
                  <img
                    src={event.image_url}
                    alt={event?.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      opacity: isCheckedIn ? 0.2 : 0.9,
                      filter: isCheckedIn ? 'grayscale(100%)' : 'none',
                    }}
                  />
                  {/* Fade right */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, transparent 60%, #0d0d0d 100%)',
                    zIndex: 1,
                  }} />
                </div>
              )}

              {/* RIGHT CONTENT */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

                {/* Event Header */}
                <div style={{
                  padding: '14px 20px 10px',
                  borderBottom: '1px solid #1a1a1a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: accentColor, fontSize: '9px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 5px' }}>
                      ● GRAVIX · ELECTRONIC TICKET
                    </p>
                    <h1 style={{
                      color: isCheckedIn ? '#555' : '#fff',
                      fontSize: '22px', fontWeight: 900,
                      letterSpacing: '1.5px', margin: '0 0 3px', lineHeight: 1.05,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {event?.title?.toUpperCase() || 'GRAVIX EVENT'}
                    </h1>
                    <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>{eventDate}</p>
                  </div>
                  <div style={{
                    backgroundColor: `${accentColor}15`,
                    border: `1px solid ${accentColor}50`,
                    borderRadius: '999px', padding: '4px 14px',
                    color: accentColor, fontSize: '10px', fontWeight: 900, letterSpacing: '2px',
                    flexShrink: 0,
                  }}>
                    {isCheckedIn ? '⛔ USED' : typeLabel}
                  </div>
                </div>

                {/* Tear line */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '18px', height: '18px', backgroundColor: '#080808', borderRadius: '50%', flexShrink: 0, marginLeft: '-9px' }} />
                  <div style={{ flex: 1, borderTop: `2px dashed ${accentColor}18`, margin: '0 4px' }} />
                  <div style={{ width: '18px', height: '18px', backgroundColor: '#080808', borderRadius: '50%', flexShrink: 0, marginRight: '-9px' }} />
                </div>

                {/* Info Columns + QR */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 160px' }}>

                  {/* COL 1 */}
                  <div style={{ padding: '14px 16px', borderRight: '1px solid #1a1a1a' }}>
                    <SectionTitle>TICKET INFO</SectionTitle>
                    <InfoRow label="TYPE" value={typeLabel} accent={accentColor} />
                    <InfoRow label="PRICE" value={priceDisplay} accent="#10b981" />
                    <InfoRow
                      label="STATUS"
                      value={isCheckedIn ? 'USED ⛔' : 'CONFIRMED ✓'}
                      accent={isCheckedIn ? '#ef4444' : '#10b981'}
                    />
                    <InfoRow label="TICKET #" value={`#${String(ticket?.ticket_number).padStart(3, '0')}`} />
                  </div>

                  {/* COL 2 */}
                  <div style={{ padding: '14px 16px', borderRight: '1px solid #1a1a1a' }}>
                    <SectionTitle>EVENT INFO</SectionTitle>
                    <InfoRow label="EVENT" value={event?.title || 'GRAVIX EVENT'} />
                    <InfoRow label="DATE" value={eventShortDate} />
                    <div style={{ marginTop: '10px' }}>
                      <SectionTitle>VENUE</SectionTitle>
                      <InfoRow label="LOCATION" value={event?.location || 'TBA'} link={event?.location_url} />
                    </div>
                  </div>

                  {/* COL 3 */}
                  <div style={{ padding: '14px 16px', borderRight: '1px solid #1a1a1a' }}>
                    <SectionTitle>OWNERSHIP</SectionTitle>
                    <InfoRow label="HOLDER NAME" value={ticket?.holder_name || '-'} />
                    {ticket?.holder_phone && <InfoRow label="PHONE" value={ticket.holder_phone} />}
                    {ticket?.holder_instagram && (
                      <div style={{ marginTop: '4px' }}>
                        <p style={{ color: '#444', fontSize: '8px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 2px' }}>SOCIAL MEDIA</p>
                        <a href={ticket.holder_instagram} target="_blank" rel="noreferrer" style={{ color: '#e1306c', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                          Instagram ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* COL 4: QR */}
                  <div style={{
                    padding: '14px 16px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '10px',
                  }}>
                    {isCheckedIn ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div style={{ opacity: 0.07, filter: 'grayscale(100%)' }}>
                          <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={100} bgColor="transparent" fgColor="#ffffff" />
                        </div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '50px', color: '#ef4444', lineHeight: 1 }}>✕</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        backgroundColor: '#fff', borderRadius: '10px', padding: '8px',
                        border: `2px solid ${accentColor}`,
                        boxShadow: `0 0 20px ${accentColor}35`,
                      }}>
                        <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={100} fgColor="#000" bgColor="#fff" level="H" />
                      </div>
                    )}

                    {isCheckedIn ? (
                      <div style={{
                        color: '#ef4444', fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px',
                        textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '999px', padding: '3px 10px',
                      }}>
                        ALREADY USED
                        {ticket.checked_in_at && (
                          <span style={{ display: 'block', fontSize: '8px', opacity: 0.6, marginTop: '1px' }}>
                            {new Date(ticket.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        color: '#10b981', fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px',
                        border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '3px 10px',
                      }}>
                        <span style={{
                          width: '5px', height: '5px', backgroundColor: '#10b981',
                          borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite',
                        }} />
                        VALID ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{
              borderTop: '1px solid #141414',
              padding: '10px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: '#0a0a0a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '14px', letterSpacing: '5px' }}>GRAVIX</span>
                <span style={{ color: '#1c1c1c' }}>|</span>
                <span style={{ color: '#2a2a2a', fontSize: '9px', letterSpacing: '2px' }}>ELECTRONIC TICKET</span>
              </div>
              <p style={{
                color: '#1e1e1e', fontSize: '8px', fontFamily: 'monospace',
                letterSpacing: '1px', margin: 0,
                maxWidth: '300px', textAlign: 'center',
                wordBreak: 'break-all' as const,
              }}>
                {ticket.qr_code}
              </p>
              <span style={{ color: '#2a2a2a', fontSize: '9px', letterSpacing: '2px' }}>gravixegypt.online</span>
            </div>
          </div>
        </div>

        {/* ── Download Button ── */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            marginTop: '16px', width: '100%', borderRadius: '999px',
            background: downloading
              ? 'linear-gradient(135deg, #7f1d1d, #450a0a)'
              : 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff', padding: '14px 16px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '3px',
            border: 'none', cursor: downloading ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          {downloading ? (
            <>
              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              GENERATING PDF...
            </>
          ) : (
            '⬇ DOWNLOAD TICKET PDF'
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        <p style={{ color: '#1c1c1c', fontSize: '11px', textAlign: 'center', marginTop: '14px', lineHeight: 1.7 }}>
          This ticket is non-transferable and valid for one person only.
          A valid ID matching the holder name must be presented at entry.
        </p>
      </div>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', backgroundColor: '#050505',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px', fontFamily: 'Inter, sans-serif',
  },
  ticket: {
    backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: '24px', width: '100%', maxWidth: '900px',
  },
}
