'use client'

import { useEffect, useState, use } from 'react'
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
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!qr_code) return

    const run = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`*, events(title, date, location, image_url)`)
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

    run()

    const channel = supabase
      .channel(`ticket-${qr_code}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `qr_code=eq.${qr_code}`,
      }, (payload) => {
        setTicket((prev: any) => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qr_code])

  // ─── LOADING
  if (loading) {
    return (
      <main style={S.page}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px', border: '2px solid #1a1a1a',
            borderTop: '2px solid #dc2626', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
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

  return (
    <main style={S.page}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        animation: 'fadeIn 0.4s ease',
      }}>

        {/* ── TOP CARD ── */}
        <div style={{
          backgroundColor: '#0a0a0a',
          borderRadius: '24px 24px 0 0',
          border: `1px solid ${accentColor}30`,
          borderBottom: 'none',
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* Gradient accent bar top */}
          <div style={{
            height: '3px',
            background: isCheckedIn
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : isBackstage
              ? 'linear-gradient(90deg, #a855f7, #7c3aed)'
              : 'linear-gradient(90deg, #10b981, #059669)',
          }} />

          {/* Event image */}
          {event?.image_url ? (
            <div style={{ position: 'relative' }}>
              <img
                src={event.image_url}
                alt={event?.title}
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  display: 'block',
                  filter: isCheckedIn ? 'grayscale(80%) brightness(0.5)' : 'brightness(0.75)',
                  transition: 'all 0.6s ease',
                }}
              />
              {/* Overlay gradient */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 30%, #0a0a0a 100%)',
              }} />

              {/* GRAVIX logo over image */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '0',
                right: '0',
                textAlign: 'center',
              }}>
                <span style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(220,38,38,0.5)',
                  color: '#dc2626',
                  fontSize: '10px',
                  letterSpacing: '6px',
                  fontWeight: 900,
                  padding: '5px 16px',
                  borderRadius: '999px',
                }}>
                  ● GRAVIX
                </span>
              </div>

              {/* Event title over image */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '20px',
                right: '20px',
              }}>
                <h1 style={{
                  color: '#fff',
                  fontSize: '26px',
                  fontWeight: 900,
                  margin: '0 0 8px',
                  letterSpacing: '-0.5px',
                  textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                  lineHeight: 1.2,
                }}>
                  {event?.title}
                </h1>
              </div>
            </div>
          ) : (
            // No image fallback
            <div style={{ padding: '32px 24px 16px', textAlign: 'center' }}>
              <p style={{ color: '#dc2626', fontSize: '10px', letterSpacing: '6px', fontWeight: 900, margin: '0 0 12px' }}>● GRAVIX</p>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, margin: 0 }}>{event?.title}</h1>
            </div>
          )}

          {/* Holder info */}
          <div style={{ padding: '24px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <p style={{ color: '#444', fontSize: '9px', letterSpacing: '3px', margin: '0 0 5px' }}>TICKET HOLDER</p>
                <p style={{
                  color: isCheckedIn ? '#555' : '#fff',
                  fontSize: '20px',
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: '-0.3px',
                  transition: 'color 0.5s',
                }}>
                  {ticket?.holder_name}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#444', fontSize: '9px', letterSpacing: '3px', margin: '0 0 5px' }}>TICKET NO.</p>
                <p style={{ color: '#fff', fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', margin: 0 }}>
                  #{String(ticket?.ticket_number).padStart(3, '0')}
                </p>
              </div>
            </div>

            {/* Ticket type badge */}
            <div style={{ marginTop: '16px' }}>
              <span style={{
                background: isBackstage
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.1))'
                  : 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
                border: `1px solid ${isBackstage ? 'rgba(168,85,247,0.5)' : 'rgba(16,185,129,0.5)'}`,
                color: isBackstage ? '#a855f7' : '#10b981',
                padding: '6px 18px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '3px',
              }}>
                {isBackstage ? '🎭 BACKSTAGE' : '🎵 STANDING'}
              </span>
            </div>
          </div>
        </div>

        {/* ── PERFORATED DIVIDER ── */}
        <div style={{
          position: 'relative',
          height: '24px',
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Left circle */}
          <div style={{
            position: 'absolute', left: '-16px',
            width: '32px', height: '32px',
            backgroundColor: '#050505',
            borderRadius: '50%',
            border: `1px solid ${accentColor}20`,
          }} />
          {/* Right circle */}
          <div style={{
            position: 'absolute', right: '-16px',
            width: '32px', height: '32px',
            backgroundColor: '#050505',
            borderRadius: '50%',
            border: `1px solid ${accentColor}20`,
          }} />
          {/* Dashed line */}
          <div style={{
            width: '100%',
            borderTop: `2px dashed ${accentColor}20`,
          }} />
        </div>

        {/* ── BOTTOM CARD (EVENT DETAILS + QR) ── */}
        <div style={{
          backgroundColor: '#0a0a0a',
          borderRadius: '0 0 24px 24px',
          border: `1px solid ${accentColor}30`,
          borderTop: 'none',
          padding: '24px',
        }}>

          {/* ── EVENT DETAILS GRID ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '24px',
          }}>
            {/* Date */}
            <div style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <p style={{
                color: '#333',
                fontSize: '9px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: '0 0 6px',
              }}>
                📅 DATE
              </p>
              <p style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {event?.date
                  ? new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })
                  : 'N/A'}
              </p>
            </div>

            {/* Time */}
            <div style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <p style={{
                color: '#333',
                fontSize: '9px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: '0 0 6px',
              }}>
                🕐 TIME
              </p>
              <p style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {event?.date
                  ? new Date(event.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </p>
            </div>

            {/* Venue */}
            <div style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <p style={{
                color: '#333',
                fontSize: '9px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: '0 0 6px',
              }}>
                📍 VENUE
              </p>
              <p style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {event?.location || 'N/A'}
              </p>
            </div>

            {/* Type */}
            <div style={{
              backgroundColor: '#111',
              border: '1px solid #1a1a1a',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <p style={{
                color: '#333',
                fontSize: '9px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: '0 0 6px',
              }}>
                {isBackstage ? '🎭' : '🎵'} TYPE
              </p>
              <p style={{
                color: isBackstage ? '#a855f7' : '#10b981',
                fontSize: '12px',
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.4,
                textTransform: 'uppercase',
              }}>
                {ticket?.ticket_type || 'N/A'}
              </p>
            </div>
          </div>

          {/* ── QR CODE SECTION ── */}
          <div style={{ textAlign: 'center' }}>

            {isCheckedIn ? (
              <>
                {/* QR with X */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                  <div style={{ opacity: 0.08, filter: 'grayscale(100%)' }}>
                    <QRCode
                      value={`https://gravixegypt.online/ticket/${ticket.qr_code}`}
                      size={160}
                      bgColor="transparent"
                      fgColor="#ffffff"
                    />
                  </div>
                  {/* X overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      fontSize: '72px',
                      color: '#ef4444',
                      lineHeight: 1,
                      opacity: 0.9,
                    }}>✕</div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}>
                  <p style={{ color: '#ef4444', fontSize: '15px', fontWeight: 900, letterSpacing: '2px', margin: '0 0 6px' }}>
                    ALREADY CHECKED IN
                  </p>
                  <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                    Entered at{' '}
                    <span style={{ color: '#888', fontWeight: 700, fontFamily: 'monospace' }}>
                      {ticket.checked_in_at
                        ? new Date(ticket.checked_in_at).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit',
                          })
                        : 'N/A'}
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: '#333', fontSize: '9px', letterSpacing: '3px', margin: '0 0 16px' }}>
                  SCAN AT ENTRANCE
                </p>

                {/* QR with glow */}
                <div style={{
                  display: 'inline-block',
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  padding: '16px',
                  boxShadow: isBackstage
                    ? '0 0 40px rgba(168,85,247,0.2), 0 0 80px rgba(168,85,247,0.1)'
                    : '0 0 40px rgba(16,185,129,0.2), 0 0 80px rgba(16,185,129,0.1)',
                  marginBottom: '20px',
                }}>
                  <QRCode
                    value={`https://gravixegypt.online/ticket/${ticket.qr_code}`}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                {/* Valid badge */}
                <div style={{
                  background: isBackstage
                    ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.05))'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))',
                  border: `1px solid ${isBackstage ? 'rgba(168,85,247,0.4)' : 'rgba(16,185,129,0.4)'}`,
                  borderRadius: '12px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    width: '8px', height: '8px',
                    backgroundColor: accentColor,
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{
                    color: accentColor,
                    fontSize: '13px',
                    fontWeight: 900,
                    letterSpacing: '3px',
                  }}>
                    VALID TICKET
                  </span>
                </div>
              </>
            )}

            {/* Footer */}
            <p style={{
              color: '#1c1c1c',
              fontSize: '9px',
              textAlign: 'center',
              marginTop: '20px',
              letterSpacing: '3px',
            }}>
              GRAVIX © 2025 — DO NOT SHARE
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#050505',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: 'Inter, sans-serif',
  },
  ticket: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '24px',
    width: '100%',
    maxWidth: '420px',
  },
}
