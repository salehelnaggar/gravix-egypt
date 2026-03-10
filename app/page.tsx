'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type EventWithWaves = {
  id: string
  title: string
  description?: string
  date: string
  location: string
  location_url?: string
  image_url?: string
  is_active: boolean
  is_finished?: boolean
  wave_1_price?: number | null
  wave_1_sold_out?: boolean | null
  wave_2_price?: number | null
  wave_2_sold_out?: boolean | null
  wave_3_price?: number | null
  wave_3_sold_out?: boolean | null
}

export default function HomePage() {
  const [events, setEvents] = useState<EventWithWaves[]>([])

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date')
      .limit(3)
      .then(({ data }) => setEvents((data as EventWithWaves[]) || []))
  }, [])

  const getCurrentPriceAndWave = (event: EventWithWaves) => {
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
      event.wave_2_sold_out &&
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

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth <= 640

  return (
    <main
      style={{
        backgroundColor: '#050505',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* HERO */}
      <section
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #050505 0%, #110000 50%, #050505 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: isMobile ? '420px' : '700px',
            height: isMobile ? '420px' : '700px',
            background:
              'radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#dc2626',
            fontSize: '10px',
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: '999px',
            marginBottom: '24px',
            letterSpacing: '3px',
            backgroundColor: 'rgba(220,38,38,0.05)',
          }}
        >
          ● LIVE EVENTS — EGYPT
        </div>

        <h1
          style={{
            fontSize: 'clamp(40px, 14vw, 96px)',
            fontWeight: 900,
            lineHeight: 1,
            margin: '0 0 8px',
            letterSpacing: '-3px',
            color: '#fff',
          }}
        >
          GRAVIX
        </h1>

        <div
          style={{
            width: '70px',
            height: '3px',
            background: 'linear-gradient(90deg, #dc2626, #ff6b6b)',
            borderRadius: '2px',
            margin: '0 auto 20px',
          }}
        />

        <p
          style={{
            color: '#666',
            fontSize: '15px',
            maxWidth: '420px',
            lineHeight: 1.7,
            marginBottom: '32px',
            fontWeight: 400,
          }}
        >
          Egypt&apos;s #1 platform for booking the hottest live events &
          concerts
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '420px',
          }}
        >
          <a
            href="#events"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              letterSpacing: '1px',
              boxShadow: '0 0 30px rgba(220,38,38,0.25)',
              fontFamily: 'Inter, sans-serif',
              width: isMobile ? '100%' : 'auto',
              textAlign: 'center',
            }}
          >
            EXPLORE EVENTS →
          </a>
          <Link
            href="/auth/register"
            style={{
              background: 'transparent',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              fontFamily: 'Inter, sans-serif',
              width: isMobile ? '100%' : 'auto',
              textAlign: 'center',
            }}
          >
            SIGN UP FREE
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section
        style={{
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #111',
          borderBottom: '1px solid #111',
          padding: '40px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {[
            { icon: '🎉', title: 'EXCLUSIVE EVENTS', sub: 'Every month' },
            { icon: '⚡', title: 'INSTANT BOOKING', sub: 'No hassle' },
            { icon: '🔐', title: 'SECURE PAYMENT', sub: '100% guaranteed' },
          ].map((s) => (
            <div
              key={s.title}
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px solid #1a1a1a',
                borderRadius: '16px',
                backgroundColor: '#0d0d0d',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                {s.icon}
              </div>
              <div
                style={{
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '1px',
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  color: '#444',
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS SECTION */}
      <section
        id="events"
        style={{
          padding: '56px 16px',
          backgroundColor: '#050505',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '12px' : 0,
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'flex-end',
              marginBottom: '32px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: isMobile ? '26px' : '36px',
                  fontWeight: 900,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-1px',
                }}
              >
                EVENTS
              </h2>
            </div>
            <Link
              href="/events"
              style={{
                color: '#dc2626',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '2px',
                border: '1px solid rgba(220,38,38,0.3)',
                padding: '8px 16px',
                borderRadius: '10px',
                alignSelf: isMobile ? 'stretch' : 'auto',
                textAlign: 'center',
              }}
            >
              VIEW ALL →
            </Link>
          </div>

          {events.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: isMobile ? '40px 16px' : '80px',
                color: '#333',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎭</div>
              <p
                style={{
                  letterSpacing: '2px',
                  fontSize: '13px',
                }}
              >
                NO EVENTS YET
              </p>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {events.map((event) => {
              const { price, label, subtitle, color, soldOut } =
                getCurrentPriceAndWave(event)

              return (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: '#0d0d0d',
                    border: '1px solid #1a1a1a',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = '#dc2626'
                    el.style.transform = 'translateY(-6px)'
                    el.style.boxShadow =
                      '0 24px 48px rgba(220,38,38,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = '#1a1a1a'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '200px',
                        background:
                          'linear-gradient(135deg, #1a0000, #0d0d0d)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                      }}
                    >
                      🎶
                    </div>
                  )}
                  <div style={{ padding: '20px' }}>
                    <div
                      style={{
                        color: '#dc2626',
                        fontSize: '11px',
                        letterSpacing: '2px',
                        marginBottom: '8px',
                        fontWeight: 700,
                      }}
                    >
                      {new Date(event.date)
                        .toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                           timeZone: 'UTC',

                        })
                        .toUpperCase()}
                    </div>
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        color: '#fff',
                        marginBottom: '6px',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      {event.title}
                    </h3>
                    
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '8px' : 0,
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <span
                        style={{
                          color: '#555',
                          fontSize: '13px',
                        }}
                      >
                        📍 {event.location}
                      </span>

                      {price === null ? (
                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              color: '#ef4444',
                              fontWeight: 800,
                              fontSize: '15px',
                              margin: 0,
                            }}
                          >
                            {event.is_finished ? 'EVENT ENDED' : 'SOLD OUT'}
                          </p>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'right' }}>
                          <p
                            style={{
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: '17px',
                              margin: 0,
                            }}
                          >
                            {price}{' '}
                            <span
                              style={{
                                color: '#555',
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
                              margin: '4px 0 0',
                            }}
                          >
                            {label}
                            {subtitle && ` — ${subtitle}`}
                          </p>
                        </div>
                      )}
                    </div>

                    {soldOut || event.is_finished ? (
                      <div
                        style={{
                          display: 'block',
                          width: '100%',
                          backgroundColor: '#111',
                          border: '1px solid #1a1a1a',
                          color: '#ef4444',
                          textAlign: 'center',
                          padding: '12px',
                          borderRadius: '12px',
                          fontSize: '13px',
                          letterSpacing: '2px',
                          fontWeight: 700,
                          boxSizing: 'border-box',
                        }}
                      >
                        {event.is_finished ? 'EVENT ENDED' : 'SOLD OUT'}
                      </div>
                    ) : (
                      <Link
                        href={`/events/${event.id}`}
                        style={{
                          display: 'block',
                          width: '100%',
                          background:
                            'linear-gradient(135deg, #dc2626, #b91c1c)',
                          color: '#fff',
                          textAlign: 'center',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          fontSize: '14px',
                          letterSpacing: '1px',
                        }}
                      >
                        BOOK NOW →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        style={{
          padding: '72px 16px',
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #111',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#dc2626',
              fontSize: '11px',
              letterSpacing: '4px',
              fontWeight: 700,
              margin: '0 0 12px',
            }}
          >
            ● ABOUT US
          </p>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 20px',
              letterSpacing: '-1px',
            }}
          >
            WHO WE ARE
          </h2>
          <div
            style={{
              width: '60px',
              height: '3px',
              background: 'linear-gradient(90deg, #dc2626, transparent)',
              borderRadius: '2px',
              margin: '0 auto 28px',
            }}
          />
          <p
            style={{
              color: '#555',
              fontSize: '15px',
              lineHeight: 1.9,
              margin: '0 0 16px',
            }}
          >
            GRAVIX is Egypt&apos;s premier live events platform. We connect music
            lovers, culture seekers, and night-life enthusiasts with the most
            exclusive events across the country.
          </p>
          <p
            style={{
              color: '#444',
              fontSize: '14px',
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            From intimate underground concerts to large-scale festivals — we
            handle bookings, payments, and entry management so you can focus on
            the experience.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        style={{
          padding: '72px 16px',
          backgroundColor: '#050505',
          borderTop: '1px solid #111',
        }}
      >
        <div
          style={{
            maxWidth: '700px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: '#dc2626',
              fontSize: '11px',
              letterSpacing: '4px',
              fontWeight: 700,
              margin: '0 0 14px',
            }}
          >
            ● GET IN TOUCH
          </p>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#fff',
              margin: '0 0 16px',
              letterSpacing: '-1px',
            }}
          >
            CONTACT US
          </h2>
          <div
            style={{
              width: '60px',
              height: '3px',
              background: 'linear-gradient(90deg, #dc2626, transparent)',
              borderRadius: '2px',
              margin: '0 auto 40px',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            <a
              href="https://instagram.com/gravix_eg"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = '#dc2626')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = '#1a1a1a')
                }
              >
                <p
                  style={{
                    fontSize: '32px',
                    margin: '0 0 12px',
                  }}
                >
                  📸
                </p>
                <p
                  style={{
                    color: '#444',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 8px',
                  }}
                >
                  INSTAGRAM
                </p>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  @gravix_eg
                </p>
              </div>
            </a>

            <a
              href="https://wa.me/201093379437"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = '#10b981')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = '#1a1a1a')
                }
              >
                <p
                  style={{
                    fontSize: '32px',
                    margin: '0 0 12px',
                  }}
                >
                  💬
                </p>
                <p
                  style={{
                    color: '#444',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 8px',
                  }}
                >
                  WHATSAPP
                </p>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  +20 1093379437
                </p>
              </div>
            </a>

            <a
              href="mailto:gravixegypt@gmail.com"
              style={{ textDecoration: 'none' }}
            >
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = '#3b82f6')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = '#1a1a1a')
                }
              >
                <p
                  style={{
                    fontSize: '32px',
                    margin: '0 0 12px',
                  }}
                >
                  ✉️
                </p>
                <p
                  style={{
                    color: '#444',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 8px',
                  }}
                >
                  EMAIL
                </p>
                <p
                  style={{
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  gravixegypt@gmail.com
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: '1px solid #111',
          padding: '32px 16px',
          textAlign: 'center',
          backgroundColor: '#050505',
        }}
      >
        <div
          style={{
            color: '#dc2626',
            fontWeight: 900,
            fontSize: '22px',
            letterSpacing: '2px',
            marginBottom: '12px',
          }}
        >
          GRAVIX
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <a
            href="https://instagram.com/gravix_eg"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#333',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '1px',
            }}
          >
            INSTAGRAM
          </a>
          <a
            href="https://wa.me/201093379437"
            target="_blank"
            rel="noreferrer"
            style={{
              color: '#333',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '1px',
            }}
          >
            WHATSAPP
          </a>
          <a
            href="mailto:gravixegypt@gmail.com"
            style={{
              color: '#333',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '1px',
            }}
          >
            EMAIL
          </a>
          <Link
            href="/events"
            style={{
              color: '#333',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '1px',
            }}
          >
            EVENTS
          </Link>
        </div>
        <p
          style={{
            color: '#222',
            fontSize: '10px',
            letterSpacing: '1.6px',
            margin: 0,
          }}
        >
          © 2026 GRAVIX EGYPT. ALL RIGHTS RESERVED. DESIGNED BY SALEH ELNAGGAR.
        </p>
      </footer>
    </main>
  )
}
