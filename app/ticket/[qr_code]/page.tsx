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
  const [isMobile, setIsMobile] = useState(false)

  const ticketRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  const handleDownloadPDF = () => {
    setDownloading(true)
    setTimeout(() => {
      window.print()
      setDownloading(false)
    }, 150)
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
          <p style={{ color: '#dc2626', fontWeight: 900, fontSize: '18px', letterSpacing: '3px', margin: '0 0 8px' }}>
            INVALID TICKET
          </p>
          <p style={{ color: '#333', fontSize: '13px', margin: 0 }}>
            This ticket does not exist or has been revoked.
          </p>
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

  const InfoRow = ({ label, value, link, accent }: {
    label: string; value: string; link?: string; accent?: string
  }) => (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 3px' }}>
        {label}
      </p>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer"
          style={{ color: '#3b82f6', fontSize: isMobile ? '13px' : '12px', fontWeight: 600, textDecoration: 'none' }}>
          {value} ↗
        </a>
      ) : (
        <p style={{ color: accent || '#fff', fontSize: isMobile ? '13px' : '12px', fontWeight: accent ? 700 : 500, margin: 0, lineHeight: 1.4 }}>
          {value}
        </p>
      )}
    </div>
  )

  const SectionTitle = ({ children }: { children: string }) => (
    <p style={{
      color: accentColor, fontSize: '9px', letterSpacing: '3px', fontWeight: 900,
      margin: '0 0 12px', borderBottom: `1px solid ${accentColor}30`, paddingBottom: '6px',
    }}>
      {children}
    </p>
  )

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: isMobile ? '24px 12px 40px' : '40px 20px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > * { visibility: hidden !important; }
          #ticket-print-area, #ticket-print-area * { visibility: visible !important; }
          #ticket-print-area {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            padding: 24px !important;
            margin: 0 !important;
            background: #080808 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 9999 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* المنطقة اللي بتتطبع */}
      <div id="ticket-print-area" style={{ width: '100%', maxWidth: isMobile ? '100%' : '900px', animation: 'fadeIn 0.4s ease' }}>

        {/* ══ TICKET CARD ══ */}
        <div
          ref={ticketRef}
          style={{
            borderRadius: '20px', overflow: 'hidden',
            border: `1px solid ${accentColor}25`,
            boxShadow: `0 0 60px ${accentColor}12`,
            backgroundColor: '#0d0d0d',
            opacity: isCheckedIn ? 0.75 : 1,
            transition: 'opacity 0.5s',
          }}
        >
          {/* ══ EVENT IMAGE ══ */}
          {event?.image_url && (
            <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px', zIndex: 2,
                background: isCheckedIn
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : isBackstage
                  ? 'linear-gradient(90deg, #a855f7, #7c3aed)'
                  : 'linear-gradient(90deg, #10b981, #059669)',
              }} />
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px',
                backgroundColor: accentColor, zIndex: 2,
              }} />
              <div style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 3,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderRadius: '8px', padding: '4px 14px',
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: isMobile ? '14px' : '18px', letterSpacing: '5px' }}>
                  GRAVIX
                </span>
              </div>
              <div style={{
                position: 'absolute', top: '16px', left: '20px', zIndex: 3,
                backgroundColor: `${accentColor}25`,
                border: `1px solid ${accentColor}70`, borderRadius: '999px',
                padding: '4px 14px',
                color: accentColor, fontSize: '10px', fontWeight: 900, letterSpacing: '2.5px',
              }}>
                {isCheckedIn ? '⛔ USED' : typeLabel}
              </div>
              <img
                src={event.image_url}
                alt={event?.title}
                style={{
                  width: '100%', height: 'auto', display: 'block', objectFit: 'contain',
                  opacity: isCheckedIn ? 0.25 : 1,
                  filter: isCheckedIn ? 'grayscale(100%)' : 'none',
                  transition: 'all 0.6s ease',
                }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                background: 'linear-gradient(to bottom, transparent, #0d0d0d)',
                pointerEvents: 'none', zIndex: 2,
              }} />
            </div>
          )}

          {/* ── Title Bar ── */}
          <div style={{
            padding: isMobile ? '16px 16px 12px' : '20px 28px 14px',
            borderBottom: '1px solid #1a1a1a',
            background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{
                  color: isCheckedIn ? '#555' : '#fff',
                  fontSize: isMobile ? '20px' : '26px',
                  fontWeight: 900,
                  letterSpacing: isMobile ? '1px' : '2px',
                  margin: '0 0 4px', lineHeight: 1.1,
                  transition: 'color 0.5s',
                }}>
                  {event?.title?.toUpperCase() || 'GRAVIX EVENT'}
                </h1>
                <p style={{ color: '#666', fontSize: isMobile ? '11px' : '13px', margin: 0 }}>{eventDate}</p>
              </div>
              <div style={{
                backgroundColor: `${accentColor}15`,
                border: `1px solid ${accentColor}50`,
                borderRadius: '999px', padding: '5px 16px',
                color: accentColor, fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
                alignSelf: 'center',
              }}>
                {isCheckedIn ? '⛔ USED' : typeLabel}
              </div>
            </div>
          </div>

          {/* ── TEAR LINE ── */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <div style={{
              width: '22px', height: '22px', backgroundColor: '#080808',
              borderRadius: '50%', flexShrink: 0, marginLeft: '-11px',
            }} />
            <div style={{ flex: 1, borderTop: `2px dashed ${accentColor}20`, margin: '0 6px' }} />
            <div style={{
              width: '22px', height: '22px', backgroundColor: '#080808',
              borderRadius: '50%', flexShrink: 0, marginRight: '-11px',
            }} />
          </div>

          {/* ── BODY ── */}
          {isMobile ? (
            <div style={{ padding: '20px 16px' }}>
              {/* QR */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                {isCheckedIn ? (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
                    <div style={{ opacity: 0.08, filter: 'grayscale(100%)' }}>
                      <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={140} bgColor="transparent" fgColor="#ffffff" />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '64px', color: '#ef4444', lineHeight: 1, opacity: 0.9 }}>✕</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#fff', borderRadius: '14px', padding: '14px',
                    border: `3px solid ${accentColor}`,
                    boxShadow: `0 0 28px ${accentColor}35`,
                    marginBottom: '12px',
                  }}>
                    <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={160} fgColor="#000" bgColor="#fff" level="H" />
                  </div>
                )}
                {isCheckedIn ? (
                  <div style={{
                    color: '#ef4444', fontSize: '11px', fontWeight: 900, letterSpacing: '2px', textAlign: 'center',
                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '999px', padding: '5px 16px',
                  }}>
                    ALREADY USED
                    {ticket.checked_in_at && (
                      <span style={{ display: 'block', fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>
                        {new Date(ticket.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#10b981', fontSize: '11px', fontWeight: 900, letterSpacing: '2px',
                    border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '5px 16px',
                  }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    VALID ✓
                  </div>
                )}
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid #1a1a1a` }}>
                <div style={{ padding: '16px 12px 16px 0', borderRight: '1px solid #1a1a1a' }}>
                  <SectionTitle>TICKET INFO</SectionTitle>
                  <InfoRow label="TYPE" value={typeLabel} accent={accentColor} />
                  <InfoRow label="PRICE" value={priceDisplay} accent="#10b981" />
                  <InfoRow label="STATUS" value={isCheckedIn ? 'USED ⛔' : 'CONFIRMED ✓'} accent={isCheckedIn ? '#ef4444' : '#10b981'} />
                  <InfoRow label="TICKET #" value={`#${String(ticket?.ticket_number).padStart(3, '0')}`} />
                </div>
                <div style={{ padding: '16px 0 16px 12px' }}>
                  <SectionTitle>EVENT INFO</SectionTitle>
                  <InfoRow label="EVENT" value={event?.title || 'GRAVIX EVENT'} />
                  <InfoRow label="DATE" value={event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'TBA'} />
                  <div style={{ marginTop: '14px' }}>
                    <SectionTitle>VENUE</SectionTitle>
                    <InfoRow label="LOCATION" value={event?.location || 'TBA'} link={event?.location_url} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '16px', marginTop: '4px' }}>
                <SectionTitle>OWNERSHIP DETAILS</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <InfoRow label="HOLDER NAME" value={ticket?.holder_name || '-'} />
                  {ticket?.holder_phone && <InfoRow label="PHONE NUMBER" value={ticket.holder_phone} />}
                </div>
                {ticket?.holder_instagram && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 3px' }}>SOCIAL MEDIA</p>
                    <a href={ticket.holder_instagram} target="_blank" rel="noreferrer" style={{ color: '#e1306c', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Instagram Profile ↗</a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── DESKTOP ── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
              <div style={{ padding: '24px 20px 24px 28px', borderRight: '1px solid #1a1a1a' }}>
                <SectionTitle>TICKET INFORMATION</SectionTitle>
                <InfoRow label="TYPE" value={typeLabel} accent={accentColor} />
                <InfoRow label="PRICE" value={priceDisplay} accent="#10b981" />
                <InfoRow label="STATUS" value={isCheckedIn ? 'USED ⛔' : 'CONFIRMED ✓'} accent={isCheckedIn ? '#ef4444' : '#10b981'} />
                <InfoRow label="TICKET #" value={`#${String(ticket?.ticket_number).padStart(3, '0')}`} />
              </div>
              <div style={{ padding: '24px 20px', borderRight: '1px solid #1a1a1a' }}>
                <SectionTitle>EVENT INFORMATION</SectionTitle>
                <InfoRow label="EVENT" value={event?.title || 'GRAVIX EVENT'} />
                <InfoRow label="DATE" value={event?.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'TBA'} />
                <div style={{ marginBottom: '14px' }} />
                <SectionTitle>VENUE INFORMATION</SectionTitle>
                <InfoRow label="LOCATION" value={event?.location || 'TBA'} link={event?.location_url} />
              </div>
              <div style={{ padding: '24px 20px', borderRight: '1px solid #1a1a1a' }}>
                <SectionTitle>OWNERSHIP DETAILS</SectionTitle>
                <InfoRow label="HOLDER NAME" value={ticket?.holder_name || '-'} />
                {ticket?.holder_phone && <InfoRow label="PHONE NUMBER" value={ticket.holder_phone} />}
                {ticket?.holder_instagram && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 3px' }}>SOCIAL MEDIA</p>
                    <a href={ticket.holder_instagram} target="_blank" rel="noreferrer" style={{ color: '#e1306c', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Instagram Profile ↗</a>
                  </div>
                )}
              </div>
              <div style={{ padding: '24px 28px 24px 20px', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}40`,
                  borderRadius: '8px', padding: '5px 16px', marginBottom: '12px',
                  color: accentColor, fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
                  textAlign: 'center', width: '100%', boxSizing: 'border-box' as const,
                }}>
                  {isCheckedIn ? '⛔ USED' : typeLabel}
                </div>
                {isCheckedIn ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ opacity: 0.08, filter: 'grayscale(100%)' }}>
                      <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={130} bgColor="transparent" fgColor="#ffffff" />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '60px', color: '#ef4444', lineHeight: 1, opacity: 0.9 }}>✕</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '12px', border: `3px solid ${accentColor}`, boxShadow: `0 0 24px ${accentColor}30` }}>
                    <QRCode value={`https://gravixegypt.online/ticket/${ticket.qr_code}`} size={130} fgColor="#000" bgColor="#fff" level="H" />
                  </div>
                )}
                {isCheckedIn ? (
                  <div style={{ marginTop: '12px', color: '#ef4444', fontSize: '10px', fontWeight: 900, letterSpacing: '2px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '999px', padding: '4px 14px' }}>
                    ALREADY USED
                    {ticket.checked_in_at && (
                      <span style={{ display: 'block', fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>
                        {new Date(ticket.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '10px', fontWeight: 900, letterSpacing: '2px', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '4px 14px' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    VALID ✓
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{
            borderTop: '1px solid #1a1a1a',
            padding: isMobile ? '12px 16px' : '14px 28px',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', alignItems: 'center',
            gap: isMobile ? '8px' : 0,
            backgroundColor: '#0a0a0a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '16px', letterSpacing: '6px' }}>GRAVIX</span>
              <span style={{ color: '#1c1c1c', fontSize: '12px' }}>|</span>
              <span style={{ color: '#333', fontSize: '10px', letterSpacing: '2px' }}>ELECTRONIC TICKET</span>
            </div>
            <p style={{
              color: '#222', fontSize: '9px', fontFamily: 'monospace',
              letterSpacing: '1px', margin: 0,
              wordBreak: 'break-all' as const,
              maxWidth: isMobile ? '100%' : '340px',
              textAlign: 'center' as const,
            }}>
              {ticket.qr_code}
            </p>
            <span style={{ color: '#222', fontSize: '10px', letterSpacing: '2px' }}>gravixegypt.online</span>
          </div>
        </div>

        {/* ── PDF Button ── */}
        <button
          className="no-print"
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            marginTop: '16px', width: '100%', borderRadius: '999px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff', padding: '14px 16px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '3px',
            border: 'none', cursor: downloading ? 'default' : 'pointer',
            fontFamily: 'Inter, sans-serif',
            opacity: downloading ? 0.7 : 1,
          }}
        >
          {downloading ? 'OPENING PRINT...' : 'DOWNLOAD TICKET PDF'}
        </button>

        <p className="no-print" style={{ color: '#1c1c1c', fontSize: '11px', textAlign: 'center', marginTop: '16px', lineHeight: 1.7 }}>
          This ticket is non-transferable and valid for one person only.
          A valid ID matching the holder name must be presented at entry.
          This ticket can be scanned only once.
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
