'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type EventWithWaves = {
  id: string
  title: string
  date: string
  location: string
  description?: string
  image_url?: string
  is_active: boolean
  is_finished: boolean
  price?: number | null
  wave_1_price?: number | null
  wave_1_sold_out?: boolean | null
  wave_2_price?: number | null
  wave_2_sold_out?: boolean | null
  wave_3_price?: number | null
  wave_3_sold_out?: boolean | null
}

function getCurrentPriceAndWave(event: EventWithWaves) {
  if (event.is_finished) {
    return {
      price: null,
      label: 'FINISHED',
      subtitle: '',
      color: '#555',
      soldOut: true,
    }
  }

  if (!event.wave_1_sold_out && event.wave_1_price != null) {
    return {
      price: event.wave_1_price as number,
      label: 'WAVE 1',
      subtitle: 'EARLY BIRD',
      color: '#22c55e',
      soldOut: false,
    }
  }

  if (
    event.wave_1_sold_out &&
    !event.wave_2_sold_out &&
    event.wave_2_price != null
  ) {
    return {
      price: event.wave_2_price as number,
      label: 'WAVE 2',
      subtitle: 'REGULAR PRICE',
      color: '#eab308',
      soldOut: false,
    }
  }

  if (
    event.wave_1_sold_out &&
    !!event.wave_2_sold_out &&
    !event.wave_3_sold_out &&
    event.wave_3_price != null
  ) {
    return {
      price: event.wave_3_price as number,
      label: 'WAVE 3',
      subtitle: 'LAST WAVE',
      color: '#3b82f6',
      soldOut: false,
    }
  }

  return {
    price: null,
    label: 'SOLD OUT',
    subtitle: '',
    color: '#ef4444',
    soldOut: true,
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithWaves[]>([])

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .or('is_active.eq.true,is_finished.eq.true')
      .order('date', { ascending: true })
      .then(({ data }) => setEvents((data as EventWithWaves[]) || []))
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        fontFamily: 'Inter, sans-serif',
        padding: '60px 24px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '56px' }}>
          <p
            style={{
              color: '#dc2626',
              fontSize: '11px',
              letterSpacing: '4px',
              fontWeight: 700,
              margin: '0 0 12px',
            }}
          >
          </p>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 16px',
              letterSpacing: '-2px',
            }}
          >
            EVENTS
          </h1>
          <div
            style={{
              width: '60px',
              height: '3px',
              background: 'linear-gradient(90deg, #dc2626, transparent)',
              borderRadius: '2px',
            }}
          />
        </div>

        {events.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '120px 24px',
              color: '#222',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎭</div>
            <p
              style={{
                fontSize: '12px',
                letterSpacing: '4px',
                fontWeight: 700,
              }}
            >
              NO EVENTS YET
            </p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '24px',
          }}
        >
          {events.map(event => {
            const { price, label, subtitle, color, soldOut } =
              getCurrentPriceAndWave(event)

            return (
              <div
                key={event.id}
                style={{
                  backgroundColor: '#0d0d0d',
                  border: `1px solid ${
                    event.is_finished ? '#151515' : '#1a1a1a'
                  }`,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  opacity: event.is_finished ? 0.65 : 1,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = event.is_finished ? '#222' : '#dc2626'
                  el.style.transform = 'translateY(-6px)'
                  el.style.boxShadow = event.is_finished
                    ? 'none'
                    : '0 24px 48px rgba(220,38,38,0.08)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = event.is_finished
                    ? '#151515'
                    : '#1a1a1a'
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = 'none'
                }}
              >
                {/* Image */}
                {event.image_url ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '220px',
                        objectFit: 'cover',
                        display: 'block',
                        filter: event.is_finished
                          ? 'grayscale(80%) brightness(0.5)'
                          : 'none',
                      }}
                    />
                    {event.is_finished && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: '1px solid #333',
                            color: '#555',
                            padding: '8px 20px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '3px',
                          }}
                        >
                          🏁 EVENT ENDED
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '220px',
                      background:
                        'linear-gradient(135deg, #1a0000 0%, #0d0d0d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                      filter: event.is_finished ? 'grayscale(80%)' : 'none',
                    }}
                  >
                    🎶
                  </div>
                )}

                <div style={{ padding: '28px' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      backgroundColor: event.is_finished
                        ? 'rgba(100,100,100,0.1)'
                        : 'rgba(220,38,38,0.1)',
                      border: `1px solid ${
                        event.is_finished ? '#222' : 'rgba(220,38,38,0.2)'
                      }`,
                      color: event.is_finished ? '#444' : '#dc2626',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      padding: '4px 12px',
                      borderRadius: '999px',
                      marginBottom: '14px',
                    }}
                  >
                    {event.is_finished ? '🏁 ENDED · ' : ''}
                    {new Date(event.date)
                      .toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      .toUpperCase()}
                  </div>

                  <h2
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: event.is_finished ? '#444' : '#fff',
                      margin: '0 0 8px',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {event.title}
                  </h2>
                  <p
                    style={{
                      color: '#333',
                      fontSize: '13px',
                      lineHeight: 1.8,
                      margin: '0 0 20px',
                    }}
                  >
                    {event.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '24px',
                    }}
                  >
                    <span style={{ color: '#444', fontSize: '13px' }}>
                      📍 {event.location}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: '#333',
                          fontSize: '10px',
                          letterSpacing: '2px',
                          margin: '0 0 2px',
                        }}
                      >
                        PRICE / PERSON
                      </p>
                      {price === null ? (
                        <p
                          style={{
                            color: event.is_finished ? '#444' : '#ef4444',
                            fontSize: '18px',
                            fontWeight: 800,
                            margin: 0,
                          }}
                        >
                          {event.is_finished ? 'EVENT ENDED' : 'SOLD OUT'}
                        </p>
                      ) : (
                        <>
                          <p
                            style={{
                              color: event.is_finished ? '#444' : '#fff',
                              fontSize: '22px',
                              fontWeight: 900,
                              margin: 0,
                            }}
                          >
                            {price}{' '}
                            <span
                              style={{
                                color: '#333',
                                fontSize: '12px',
                                fontWeight: 400,
                              }}
                            >
                              EGP
                            </span>
                          </p>
                          <p
                            style={{
                              color,
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '2px',
                              marginTop: '4px',
                            }}
                          >
                            {label}
                            {subtitle && ` — ${subtitle}`}
                          </p>
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    {event.is_finished || soldOut ? (
                      <Link
                        href={`/events/${event.id}`}
                        style={{
                          backgroundColor: '#111',
                          border: '1px solid #1a1a1a',
                          color: '#444',
                          textDecoration: 'none',
                          padding: '12px 20px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '12px',
                          letterSpacing: '1px',
                        }}
                      >
                        VIEW DETAILS
                      </Link>
                    ) : (
                      <Link
                        href={`/events/${event.id}`}
                        style={{
                          background:
                            'linear-gradient(135deg, #dc2626, #b91c1c)',
                          color: '#fff',
                          textDecoration: 'none',
                          padding: '12px 24px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '13px',
                          letterSpacing: '1px',
                          boxShadow: '0 8px 24px rgba(220,38,38,0.2)',
                        }}
                      >
                        BOOK NOW →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
