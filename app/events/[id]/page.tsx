'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type EventType = {
  id: string
  title: string
  date: string
  location: string
  location_url?: string
  description?: string
  image_url?: string
  is_active: boolean
  is_finished: boolean
  price?: number
  wave_1_price?: number | null
  wave_1_sold_out?: boolean | null
  wave_2_price?: number | null
  wave_2_sold_out?: boolean | null
  wave_3_price?: number | null
  wave_3_sold_out?: boolean | null

  standing_wave_1_price?: number | null
  standing_wave_1_sold_out?: boolean | null
  standing_wave_2_price?: number | null
  standing_wave_2_sold_out?: boolean | null
  standing_wave_3_price?: number | null
  standing_wave_3_sold_out?: boolean | null

  backstage_wave_1_price?: number | null
  backstage_wave_1_sold_out?: boolean | null
  backstage_wave_2_price?: number | null
  backstage_wave_2_sold_out?: boolean | null
  backstage_wave_3_price?: number | null
  backstage_wave_3_sold_out?: boolean | null
}

function getWaveInfo(opts: {
  wave_1_price?: number | null
  wave_1_sold_out?: boolean | null
  wave_2_price?: number | null
  wave_2_sold_out?: boolean | null
  wave_3_price?: number | null
  wave_3_sold_out?: boolean | null
  is_finished: boolean
}) {
  const {
    wave_1_price,
    wave_1_sold_out,
    wave_2_price,
    wave_2_sold_out,
    wave_3_price,
    wave_3_sold_out,
    is_finished,
  } = opts

  const wave1Available = !wave_1_sold_out && wave_1_price != null
  const wave2Available =
    wave_1_sold_out && !wave_2_sold_out && wave_2_price != null
  const wave3Available =
    wave_1_sold_out &&
    !!wave_2_sold_out &&
    !wave_3_sold_out &&
    wave_3_price != null

  let currentPrice: number | null = null
  let currentWaveLabel = ''
  let soldOut = false

  if (wave1Available) {
    currentPrice = wave_1_price as number
    currentWaveLabel = 'WAVE 1'
  } else if (wave2Available) {
    currentPrice = wave_2_price as number
    currentWaveLabel = 'WAVE 2'
  } else if (wave3Available) {
    currentPrice = wave_3_price as number
    currentWaveLabel = 'WAVE 3'
  } else {
    currentPrice = null
    soldOut = true
  }

  if (is_finished) {
    soldOut = true
  }

  return { currentPrice, currentWaveLabel, soldOut }
}

export default function EventPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<EventType | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setEvent(eventData as EventType | null)
      setUser(user)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: '#333',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '3px',
            fontSize: '12px',
          }}
        >
          LOADING...
        </p>
      </main>
    )
  }

  if (!event) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: '#333',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '3px',
            fontSize: '12px',
          }}
        >
          EVENT NOT FOUND
        </p>
      </main>
    )
  }

  const standing = getWaveInfo({
    wave_1_price: event.standing_wave_1_price,
    wave_1_sold_out: event.standing_wave_1_sold_out,
    wave_2_price: event.standing_wave_2_price,
    wave_2_sold_out: event.standing_wave_2_sold_out,
    wave_3_price: event.standing_wave_3_price,
    wave_3_sold_out: event.standing_wave_3_sold_out,
    is_finished: event.is_finished,
  })

  const backstage = getWaveInfo({
    wave_1_price: event.backstage_wave_1_price,
    wave_1_sold_out: event.backstage_wave_1_sold_out,
    wave_2_price: event.backstage_wave_2_price,
    wave_2_sold_out: event.backstage_wave_2_sold_out,
    wave_3_price: event.backstage_wave_3_price,
    wave_3_sold_out: event.backstage_wave_3_sold_out,
    is_finished: event.is_finished,
  })

  const noStanding =
    !event.standing_wave_1_price &&
    !event.standing_wave_2_price &&
    !event.standing_wave_3_price

  const noBackstage =
    !event.backstage_wave_1_price &&
    !event.backstage_wave_2_price &&
    !event.backstage_wave_3_price

  const allSoldOut =
    (noStanding || standing.soldOut) && (noBackstage || backstage.soldOut)

  const renderWaveBadge = (waveLabel: string) => {
    if (!waveLabel) return null
    const colorBg =
      waveLabel === 'WAVE 1'
        ? 'rgba(34,197,94,0.08)'
        : waveLabel === 'WAVE 2'
        ? 'rgba(234,179,8,0.08)'
        : 'rgba(59,130,246,0.08)'
    const borderColor =
      waveLabel === 'WAVE 1'
        ? 'rgba(34,197,94,0.4)'
        : waveLabel === 'WAVE 2'
        ? 'rgba(234,179,8,0.4)'
        : 'rgba(59,130,246,0.4)'
    const textColor =
      waveLabel === 'WAVE 1'
        ? '#22c55e'
        : waveLabel === 'WAVE 2'
        ? '#eab308'
        : '#3b82f6'

  const labelText =
      waveLabel === 'WAVE 1'
        ? 'EARLY BIRD'
        : waveLabel === 'WAVE 2'
        ? 'REGULAR PRICE'
        : 'LAST WAVE'

    return (
      <div
        style={{
          backgroundColor: colorBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '999px',
          padding: '6px 16px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '2px',
          color: textColor,
          display: 'inline-block',
        }}
      >
        {waveLabel} — {labelText}
      </div>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {event.image_url ? (
        <div
          style={{
            width: '100%',
            height: '460px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={event.image_url}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.4)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, transparent 40%, #050505 100%)',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '200px',
            background: 'linear-gradient(135deg, #1a0000, #050505)',
          }}
        />
      )}

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px 80px',
          marginTop: event.image_url ? '-120px' : '0',
          position: 'relative',
        }}
      >
        <Link
          href="/events"
          style={{
            color: '#444',
            fontSize: '12px',
            letterSpacing: '2px',
            textDecoration: 'none',
            display: 'inline-block',
            marginBottom: '32px',
          }}
        >
          ← BACK TO EVENTS
        </Link>

        <div style={{ marginBottom: '32px' }}>
          {event.is_finished && (
            <span
              style={{
                backgroundColor: 'rgba(100,100,100,0.2)',
                border: '1px solid #222',
                color: '#555',
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '2px',
                display: 'inline-block',
                marginBottom: '12px',
              }}
            >
              🏁 EVENT ENDED
            </span>
          )}

          {allSoldOut && !event.is_finished && (
            <span
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.5)',
                color: '#ef4444',
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '2px',
                display: 'inline-block',
                marginLeft: event.is_finished ? '8px' : 0,
                marginBottom: '12px',
              }}
            >
              SOLD OUT
            </span>
          )}

          <h1
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 20px',
              letterSpacing: '-2px',
              lineHeight: 1.1,
            }}
          >
            {event.title}
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span style={{ fontSize: '16px' }}>📅</span>
              <p
                style={{
                  color: '#666',
                  fontSize: '15px',
                  margin: 0,
                }}
              >
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                ·{' '}
                {new Date(event.date).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '16px' }}>📍</span>
              <p
                style={{
                  color: '#666',
                  fontSize: '15px',
                  margin: 0,
                }}
              >
                {event.location}
              </p>
              {event.location_url && (
                <a
                  href={event.location_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    color: '#3b82f6',
                    textDecoration: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                  }}
                >
                  GET DIRECTIONS →
                </a>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {!noStanding && (
            <div
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <p
                style={{
                  color: '#444',
                  fontSize: '11px',
                  letterSpacing: '3px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                STANDING
              </p>
              {standing.currentPrice != null && !standing.soldOut ? (
                <>
                  <p
                    style={{
                      color: '#dc2626',
                      fontSize: '26px',
                      fontWeight: 900,
                      margin: 0,
                    }}
                  >
                    {standing.currentPrice}{' '}
                    <span
                      style={{
                        color: '#444',
                        fontSize: '14px',
                        fontWeight: 400,
                      }}
                    >
                      EGP / person
                    </span>
                  </p>
                  <div style={{ marginTop: '10px' }}>
                    {renderWaveBadge(standing.currentWaveLabel)}
                  </div>
                </>
              ) : (
                <p
                  style={{
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  SOLD OUT
                </p>
              )}
            </div>
          )}

          {!noBackstage && (
            <div
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '16px',
                padding: '20px',
              }}
            >
              <p
                style={{
                  color: '#444',
                  fontSize: '11px',
                  letterSpacing: '3px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                BACKSTAGE
              </p>
              {backstage.currentPrice != null && !backstage.soldOut ? (
                <>
                  <p
                    style={{
                      color: '#dc2626',
                      fontSize: '26px',
                      fontWeight: 900,
                      margin: 0,
                    }}
                  >
                    {backstage.currentPrice}{' '}
                    <span
                      style={{
                        color: '#444',
                        fontSize: '14px',
                        fontWeight: 400,
                      }}
                    >
                      EGP / person
                    </span>
                  </p>
                  <div style={{ marginTop: '10px' }}>
                    {renderWaveBadge(backstage.currentWaveLabel)}
                  </div>
                </>
              ) : (
                <p
                  style={{
                    color: '#ef4444',
                    fontSize: '16px',
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  SOLD OUT
                </p>
              )}
            </div>
          )}
        </div>

        {event.description && (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px',
            }}
          >
            <p
              style={{
                color: '#333',
                fontSize: '10px',
                letterSpacing: '3px',
                fontWeight: 700,
                margin: '0 0 16px',
              }}
            >
              ABOUT THIS EVENT
            </p>
            <p
              style={{
                color: '#666',
                fontSize: '15px',
                lineHeight: 1.8,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {event.description}
            </p>
          </div>
        )}

        {event.is_finished ? (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '36px', margin: '0 0 12px' }}>🏁</p>
            <p
              style={{
                color: '#444',
                fontSize: '14px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              THIS EVENT HAS ENDED
            </p>
          </div>
        ) : !event.is_active ? (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#333',
                fontSize: '13px',
                letterSpacing: '2px',
                margin: 0,
              }}
            >
              BOOKINGS NOT OPEN YET
            </p>
          </div>
        ) : allSoldOut ? (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '36px', margin: '0 0 12px' }}>❌</p>
            <p
              style={{
                color: '#ef4444',
                fontSize: '14px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              ALL TICKETS ARE SOLD OUT
            </p>
          </div>
        ) : !user ? (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#555',
                fontSize: '14px',
                margin: '0 0 20px',
              }}
            >
              You need to be logged in to book a ticket.
            </p>
            <Link
              href={`/auth/login?redirect=/events/${event.id}`}
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                textDecoration: 'none',
                padding: '14px 32px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '2px',
              }}
            >
              LOGIN TO BOOK →
            </Link>
          </div>
        ) : (
          <Link
            href={`/events/${event.id}/reserve`}
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              textDecoration: 'none',
              padding: '20px',
              borderRadius: '16px',
              fontWeight: 900,
              fontSize: '16px',
              letterSpacing: '3px',
            }}
          >
            BOOK MY SPOT →
          </Link>
        )}
      </div>
    </main>
  )
}
