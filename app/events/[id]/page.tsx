'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
}

export default function EventPage() {
  const { id } = useParams()
  const router = useRouter()
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

  // ---------- WAVE LOGIC (1 → 2 → 3) ----------
  const wave1Available =
    !event.wave_1_sold_out && event.wave_1_price != null

  const wave2Available =
    event.wave_1_sold_out &&
    !event.wave_2_sold_out &&
    event.wave_2_price != null

  const wave3Available =
    event.wave_1_sold_out &&
    !!event.wave_2_sold_out &&
    !event.wave_3_sold_out &&
    event.wave_3_price != null

  let currentPrice: number | null = null
  let currentWaveLabel = ''
  let isSoldOut = false

  if (wave1Available) {
    currentPrice = event.wave_1_price as number
    currentWaveLabel = 'WAVE 1'
  } else if (wave2Available) {
    currentPrice = event.wave_2_price as number
    currentWaveLabel = 'WAVE 2'
  } else if (wave3Available) {
    currentPrice = event.wave_3_price as number
    currentWaveLabel = 'WAVE 3'
  } else {
    currentPrice = null
    isSoldOut = true
  }

  // لو الإيفنت نفسه منتهي اعتبره Sold out حتى لو في Waves
  if (event.is_finished) {
    isSoldOut = true
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Hero Image */}
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
        {/* Back */}
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

        {/* Title */}
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

          {isSoldOut && !event.is_finished && (
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

          {/* Date & Location */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Date */}
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

            {/* Location + Get Directions */}
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

        {/* Price + Wave */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                color: '#333',
                fontSize: '10px',
                letterSpacing: '3px',
                fontWeight: 700,
                margin: '0 0 6px',
              }}
            >
              TICKET PRICE
            </p>
            {currentPrice !== null ? (
              <p
                style={{
                  color: '#dc2626',
                  fontSize: '32px',
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                {currentPrice}{' '}
                <span
                  style={{
                    color: '#444',
                    fontSize: '16px',
                    fontWeight: 400,
                  }}
                >
                  EGP / person
                </span>
              </p>
            ) : (
              <p
                style={{
                  color: '#ef4444',
                  fontSize: '20px',
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                SOLD OUT
              </p>
            )}
          </div>

          {currentPrice !== null && (
            <div
              style={{
                backgroundColor:
                  currentWaveLabel === 'WAVE 1'
                    ? 'rgba(34,197,94,0.08)'
                    : currentWaveLabel === 'WAVE 2'
                    ? 'rgba(234,179,8,0.08)'
                    : 'rgba(59,130,246,0.08)',
                border: `1px solid ${
                  currentWaveLabel === 'WAVE 1'
                    ? 'rgba(34,197,94,0.4)'
                    : currentWaveLabel === 'WAVE 2'
                    ? 'rgba(234,179,8,0.4)'
                    : 'rgba(59,130,246,0.4)'
                }`,
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '2px',
                color:
                  currentWaveLabel === 'WAVE 1'
                    ? '#22c55e'
                    : currentWaveLabel === 'WAVE 2'
                    ? '#eab308'
                    : '#3b82f6',
              }}
            >
              {currentWaveLabel === 'WAVE 1'
                ? 'WAVE 1 — EARLY BIRD'
                : currentWaveLabel === 'WAVE 2'
                ? 'WAVE 2 — REGULAR PRICE'
                : 'WAVE 3 — LAST WAVE'}
            </div>
          )}
        </div>

        {/* Description */}
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

        {/* CTA */}
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
        ) : isSoldOut ? (
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
              ALL WAVES ARE SOLD OUT
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
            {currentWaveLabel
              ? `BOOK MY SPOT — ${currentWaveLabel} →`
              : 'BOOK MY SPOT →'}
          </Link>
        )}
      </div>
    </main>
  )
}
