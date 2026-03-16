'use client'

import { useEffect, useState, use, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#050505' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 80
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const x = 40
      const y = (pageHeight - imgHeight) / 2
      pdf.setFillColor(5, 5, 5)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
      pdf.save(`GRAVIX-${ticket?.qr_code || 'ticket'}.pdf`)
    } catch (e) {
      console.error('PDF error', e)
    } finally {
      setDownloading(false)
    }
  }

  // ─── LOADING
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

  // ─── NOT FOUND
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
    <div style={{ marginBottom: '10px' }}>
      <p style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 3px' }}>
        {label}
      </p>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer"
          style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          {value} ↗
        </a>
      ) : (
        <p style={{ color: accent || '#fff', fontSize: '12px', fontWeight: accent ? 700 : 500, margin: 0, lineHeight: 1.4 }}>
          {value}
        </p>
      )}
    </div>
  )

  const SectionTitle = ({ children }: { children: string }) => (
    <p style={{
      color: accentColor, fontSize: '9px', letterSpacing: '3px', fontWeight: 900,
      margin: '0 0 10px', borderBottom: `1px solid ${accentColor}30`, paddingBottom: '6px',
    }}>
      {children}
    </p>
  )

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ width: '100%', maxWidth: '900px', animation: 'fadeIn 0.4s ease' }}>

        {/* ══ TICKET CARD ══ */}
        <div
          ref={ticketRef}
          style={{
            borderRadius: '20px', overflow: 'hidden',
            border: `1px solid ${accentColor}25`,
            boxShadow: `0 0 80px ${accentColor}15, 0 0 160px ${accentColor}08`,
            backgroundColor: '#0d0d0d',
            opacity: isCheckedIn ? 0.7 : 1,
            transition: 'opacity 0.5s',
          }}
        >
          {/* ── TOP: EVENT IMAGE BANNER ── */}
          <div style={{ position: 'relative', height: '200px', overflow: 'hidden', backgroundColor: '#111' }}>
            {event?.image_url && (
              <img
                src={event.image_url}
                alt={event?.title}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: isCheckedIn ? 0.2 : 0.5,
                  filter: isCheckedIn ? 'grayscale(100%)' : 'saturate(0.7)',
                  transition: 'all 0.6s ease',
                }}
              />
            )}
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(13,13,13,0.95) 100%)',
            }} />
            {/* Accent left bar */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '5px', backgroundColor: accentColor,
            }} />
            {/* Top accent gradient bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: isCheckedIn
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : isBackstage
                ? 'linear-gradient(90deg, #a855f7, #7c3aed)'
                : 'linear-gradient(90deg, #10b981, #059669)',
            }} />

            {/* Event title bottom-left */}
            <div style={{ position: 'absolute', bottom: '24px', left: '32px', right: '200px' }}>
              <p style={{ color: accentColor, fontSize: '10px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 6px' }}>
              </p>
              <h1 style={{
                color: isCheckedIn ? '#555' : '#fff',
                fontSize: '30px', fontWeight: 900,
                letterSpacing: '2px', margin: '0 0 4px', lineHeight: 1,
                transition: 'color 0.5s',
              }}>
                {event?.title?.toUpperCase() || 'GRAVIX EVENT'}
              </h1>
              <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{eventDate}</p>
            </div>

            {/* GRAVIX top-right */}
            <div style={{ position: 'absolute', top: '20px', right: '24px' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: '22px', letterSpacing: '8px', opacity: 0.9 }}>
                GRAVIX
              </span>
            </div>

            {/* Ticket type badge bottom-right */}
            <div style={{
              position: 'absolute', bottom: '24px', right: '24px',
              backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}60`,
              borderRadius: '999px', padding: '6px 18px',
              color: accentColor, fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
            }}>
              {isCheckedIn ? '⛔ USED' : typeLabel}
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

          {/* ── BODY: 3 INFO COLS + QR ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto' }}>

            {/* COL 1: Ticket Information */}
            <div style={{ padding: '24px 20px 24px 28px', borderRight: '1px solid #1a1a1a' }}>
              <SectionTitle>TICKET INFORMATION</SectionTitle>
              <InfoRow label="TYPE" value={typeLabel} accent={accentColor} />
              <InfoRow label="PRICE" value={priceDisplay} accent="#10b981" />
              <InfoRow
                label="STATUS"
                value={isCheckedIn ? 'USED ⛔' : 'CONFIRMED ✓'}
                accent={isCheckedIn ? '#ef4444' : '#10b981'}
              />
              <InfoRow label="TICKET #" value={`#${String(ticket?.ticket_number).padStart(3, '0')}`} />
            </div>

            {/* COL 2: Event + Venue */}
            <div style={{ padding: '24px 20px', borderRight: '1px solid #1a1a1a' }}>
              <SectionTitle>EVENT INFORMATION</SectionTitle>
              <InfoRow label="EVENT" value={event?.title || 'GRAVIX EVENT'} />
              <InfoRow
                label="DATE"
                value={event?.date
                  ? new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
                    })
                  : 'TBA'}
              />
              <div style={{ marginBottom: '14px' }} />
              <SectionTitle>VENUE INFORMATION</SectionTitle>
              <InfoRow
                label="LOCATION"
                value={event?.location || 'TBA'}
                link={event?.location_url}
              />
            </div>

            {/* COL 3: Ownership */}
            <div style={{ padding: '24px 20px', borderRight: '1px solid #1a1a1a' }}>
              <SectionTitle>OWNERSHIP DETAILS</SectionTitle>
              <InfoRow label="HOLDER NAME" value={ticket?.holder_name || '-'} />
              {ticket?.holder_phone && (
                <InfoRow label="PHONE NUMBER" value={ticket.holder_phone} />
              )}
              {ticket?.holder_instagram && (
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ color: '#555', fontSize: '9px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 3px' }}>
                    SOCIAL MEDIA
                  </p>
                  <a
                    href={ticket.holder_instagram}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#e1306c', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Instagram Profile ↗
                  </a>
                </div>
              )}
            </div>

            {/* COL 4: QR Code */}
            <div style={{
              padding: '24px 28px 24px 20px', minWidth: '200px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'space-between',
            }}>
              {/* Type badge above QR */}
              <div style={{
                backgroundColor: `${accentColor}15`,
                border: `1px solid ${accentColor}40`,
                borderRadius: '8px', padding: '5px 16px', marginBottom: '12px',
                color: accentColor, fontSize: '11px', fontWeight: 900, letterSpacing: '3px',
                textAlign: 'center', width: '100%', boxSizing: 'border-box' as const,
              }}>
                {isCheckedIn ? '⛔ USED' : typeLabel}
              </div>

              {/* QR */}
              {isCheckedIn ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <div style={{ opacity: 0.08, filter: 'grayscale(100%)' }}>
                    <QRCode
                      value={`https://gravixegypt.online/ticket/${ticket.qr_code}`}
                      size={130} bgColor="transparent" fgColor="#ffffff"
                    />
                  </div>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '60px', color: '#ef4444', lineHeight: 1, opacity: 0.9 }}>✕</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#fff', borderRadius: '12px', padding: '12px',
                  border: `3px solid ${accentColor}`,
                  boxShadow: `0 0 24px ${accentColor}30`,
                }}>
                  <QRCode
                    value={`https://gravixegypt.online/ticket/${ticket.qr_code}`}
                    size={130} fgColor="#000" bgColor="#fff" level="H"
                  />
                </div>
              )}

              {/* Status badge below QR */}
              {isCheckedIn ? (
                <div style={{
                  marginTop: '12px',
                  color: '#ef4444', fontSize: '10px', fontWeight: 900,
                  letterSpacing: '2px', textAlign: 'center',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '999px', padding: '4px 14px',
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
                  marginTop: '12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: '#10b981', fontSize: '10px', fontWeight: 900,
                  letterSpacing: '2px', textAlign: 'center',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: '999px', padding: '4px 14px',
                }}>
                  <span style={{
                    width: '6px', height: '6px', backgroundColor: '#10b981',
                    borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite',
                  }} />
                  VALID ✓
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            borderTop: '1px solid #1a1a1a', padding: '14px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#0a0a0a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '16px', letterSpacing: '6px' }}>
                GRAVIX
              </span>
              <span style={{ color: '#1c1c1c', fontSize: '12px' }}>|</span>
              <span style={{ color: '#333', fontSize: '10px', letterSpacing: '2px' }}>
                ELECTRONIC TICKET
              </span>
            </div>
            <p style={{
              color: '#222', fontSize: '9px', fontFamily: 'monospace',
              letterSpacing: '2px', margin: 0, wordBreak: 'break-all' as const,
              maxWidth: '340px', textAlign: 'center' as const,
            }}>
              {ticket.qr_code}
            </p>
            <span style={{ color: '#222', fontSize: '10px', letterSpacing: '2px' }}>
              gravixegypt.online
            </span>
          </div>
        </div>

        {/* ── PDF Download Button ── */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            marginTop: '16px', width: '100%', borderRadius: '999px',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff', padding: '12px 16px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '3px',
            border: 'none', cursor: downloading ? 'default' : 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {downloading ? 'GENERATING PDF...' : 'DOWNLOAD TICKET PDF'}
        </button>

        {/* Legal note */}
        <p style={{
          color: '#1c1c1c', fontSize: '11px', textAlign: 'center',
          marginTop: '16px', lineHeight: 1.7,
        }}>
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
