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

  // STANDING
  standing_wave_1_price?: number | null
  standing_wave_1_sold_out?: boolean | null
  standing_wave_2_price?: number | null
  standing_wave_2_sold_out?: boolean | null
  standing_wave_3_price?: number | null
  standing_wave_3_sold_out?: boolean | null

  // BACKSTAGE
  backstage_wave_1_price?: number | null
  backstage_wave_1_sold_out?: boolean | null
  backstage_wave_2_price?: number | null
  backstage_wave_2_sold_out?: boolean | null
  backstage_wave_3_price?: number | null
  backstage_wave_3_sold_out?: boolean | null
}

type DJ = {
  id: string
  name: string
  bio?: string
  image_url?: string
  whatsapp_number?: string
  username?: string
}

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  instagram_url?: string | null
  is_exclusive: boolean
  priority: number | null
}

export default function HomePage() {
  const [events, setEvents] = useState<EventWithWaves[]>([])
  const [djs, setDjs] = useState<DJ[]>([])
  const [partners, setPartners] = useState<Partner[]>([])

  const isMobile =
    typeof window !== 'undefined' && window.innerWidth <= 640

  useEffect(() => {
    // Events
    supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .limit(10)
      .then(({ data }) => {
        if (!data) return
        const sorted = [...data].sort((a: any, b: any) => {
          if (a.is_finished && !b.is_finished) return 1
          if (!a.is_finished && b.is_finished) return -1
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        })
        setEvents(sorted as EventWithWaves[])
      })

    // DJs
    supabase
      .from('djs')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(10)
      .then(({ data }) => setDjs((data as DJ[]) || []))

    // Exclusive partners (مرتبة بالـ priority)
    
    supabase
      .from('partners')
      .select('*')
      .eq('is_exclusive', true)
      .order('priority', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (!data) return
        setPartners(data as Partner[])
      })
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

    // كل standing خلص؟
    const standingAllSold =
      (!!event.standing_wave_1_sold_out ||
        event.standing_wave_1_price == null) &&
      (!!event.standing_wave_2_sold_out ||
        event.standing_wave_2_price == null) &&
      (!!event.standing_wave_3_sold_out ||
        event.standing_wave_3_price == null)

    // كل backstage خلص؟
    const backstageAllSold =
      (!!event.backstage_wave_1_sold_out ||
        event.backstage_wave_1_price == null) &&
      (!!event.backstage_wave_2_sold_out ||
        event.backstage_wave_2_price == null) &&
      (!!event.backstage_wave_3_sold_out ||
        event.backstage_wave_3_price == null)

    if (standingAllSold && backstageAllSold) {
      return {
        price: null,
        label: 'SOLD OUT',
        subtitle: '',
        color: '#ef4444',
        soldOut: true,
      }
    }

    type Option = {
      price: number
      label: string
      subtitle: string
      color: string
    }

    const options: Option[] = []

    // Standing
    if (
      !event.standing_wave_1_sold_out &&
      event.standing_wave_1_price != null
    ) {
      options.push({
        price: event.standing_wave_1_price,
        label: 'STANDING · W1',
        subtitle: 'EARLY BIRD',
        color: '#22c55e',
      })
    }
    if (
      event.standing_wave_1_sold_out &&
      !event.standing_wave_2_sold_out &&
      event.standing_wave_2_price != null
    ) {
      options.push({
        price: event.standing_wave_2_price,
        label: 'STANDING · W2',
        subtitle: 'REGULAR',
        color: '#eab308',
      })
    }
    if (
      event.standing_wave_1_sold_out &&
      event.standing_wave_2_sold_out &&
      !event.standing_wave_3_sold_out &&
      event.standing_wave_3_price != null
    ) {
      options.push({
        price: event.standing_wave_3_price,
        label: 'STANDING · W3',
        subtitle: 'LAST WAVE',
        color: '#3b82f6',
      })
    }

    // Backstage
    if (
      !event.backstage_wave_1_sold_out &&
      event.backstage_wave_1_price != null
    ) {
      options.push({
        price: event.backstage_wave_1_price,
        label: 'BACKSTAGE · W1',
        subtitle: 'EARLY BIRD',
        color: '#f97316',
      })
    }
    if (
      event.backstage_wave_1_sold_out &&
      !event.backstage_wave_2_sold_out &&
      event.backstage_wave_2_price != null
    ) {
      options.push({
        price: event.backstage_wave_2_price,
        label: 'BACKSTAGE · W2',
        subtitle: 'REGULAR',
        color: '#facc15',
      })
    }
    if (
      event.backstage_wave_1_sold_out &&
      event.backstage_wave_2_sold_out &&
      !event.backstage_wave_3_sold_out &&
      event.backstage_wave_3_price != null
    ) {
      options.push({
        price: event.backstage_wave_3_price,
        label: 'BACKSTAGE · W3',
        subtitle: 'LAST WAVE',
        color: '#a855f7',
      })
    }

    if (options.length === 0) {
      return {
        price: null,
        label: 'SOLD OUT',
        subtitle: '',
        color: '#ef4444',
        soldOut: true,
      }
    }

    const best = options.sort((a, b) => a.price - b.price)[0]

    return {
      price: best.price,
      label: best.label,
      subtitle: best.subtitle,
      color: best.color,
      soldOut: false,
    }
  }

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
          Egypt&apos;s #1 platform for booking the hottest live events
          &amp; concerts
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '480px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() =>
              document
                .getElementById('events')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            style={{
              background:
                'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              letterSpacing: '1px',
              boxShadow: '0 0 30px rgba(220,38,38,0.25)',
              fontFamily: 'Inter, sans-serif',
              width: isMobile ? '100%' : 'auto',
              textAlign: 'center',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            EXPLORE EVENTS
          </button>

          <button
            onClick={() =>
              document
                .getElementById('djs')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            style={{
              background: 'transparent',
              color: '#fff',
              padding: '14px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              border: '1px solid rgba(255,255,255,0.15)',
              fontFamily: 'Inter, sans-serif',
              width: isMobile ? '100%' : 'auto',
              textAlign: 'center',
              cursor: 'pointer',
              flex: 1,
              letterSpacing: '1px',
            }}
          >
            EXPLORE DJs
          </button>
        </div>

        <Link
          href="/auth/register"
          style={{
            color: '#444',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '2px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.color = '#dc2626')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.color = '#444')
          }
        >
          SIGN UP FREE
        </Link>
      </section>

      {/* EXCLUSIVE PARTNER */}
    {partners.length > 0 && (
  <section
    id="partners"
    style={{
      borderTop: '1px solid #111',

            backgroundColor: '#050505',
            padding: '24px 16px',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: '#dc2626',
                fontSize: 10,
                letterSpacing: '3px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              ● EXCLUSIVE PARTNER
            </p>

            <h2
              style={{
                fontSize: isMobile ? 18 : 20,
                fontWeight: 800,
                color: '#fff',
                margin: '4px 0 4px',
                letterSpacing: '-0.3px',
              }}
            >
              BRAND LOCKED IN WITH GRAVIX
            </h2>

            <p
              style={{
                color: '#777',
                fontSize: 12,
                margin: '0 0 16px',
                lineHeight: 1.6,
              }}
            >
              Official partner powering upcoming GRAVIX nights and
              experiences.
            </p>

            {/* كارت بارتنر واحد في النص */}
            {(() => {
              const main = partners[0]
              if (!main) return null

              return (
                <div
                  key={main.id}
                  style={{
                    margin: '0 auto',
                    maxWidth: 320,
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: '1px solid #1a1a1a',
                    background:
                      'radial-gradient(circle at top, #111 0%, #020617 70%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    transition:
                      'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = '#dc2626'
                    el.style.transform = 'translateY(-3px)'
                    el.style.boxShadow =
                      '0 16px 35px rgba(220,38,38,0.18)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = '#1a1a1a'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {/* اللوجو */}
                  <div
                    style={{
                      height: 80,
                      width: 80,
                      borderRadius: '999px',
                      backgroundColor: '#020617',
                      border: '1px solid rgba(148,163,184,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {main.logo_url ? (
                      <img
                        src={main.logo_url}
                        alt={main.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          color: '#6b7280',
                          fontSize: 11,
                          letterSpacing: '2px',
                        }}
                      >
                        LOGO
                      </span>
                    )}
                  </div>

                  {/* الاسم + الأزرار */}
                  <div>
                    <p
                      style={{
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {main.name}
                    </p>
                  </div>

                  {/* Buttons: website + instagram */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      justifyContent: 'center',
                      marginTop: 4,
                    }}
                  >
                    {main.website && (
                      <a
                        href={main.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 11,
                          padding: '6px 12px',
                          borderRadius: 999,
                          border:
                            '1px solid rgba(248,250,252,0.12)',
                          background:
                            'linear-gradient(135deg, rgba(248,250,252,0.08), rgba(15,23,42,0.9))',
                          color: '#f9fafb',
                          textDecoration: 'none',
                          letterSpacing: '1.3px',
                          fontWeight: 700,
                        }}
                      >
                        OFFICIAL WEBSITE
                      </a>
                    )}

                    {main.instagram_url && (
                      <a
                        href={main.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 11,
                          padding: '6px 12px',
                          borderRadius: 999,
                          border:
                            '1px solid rgba(220,38,38,0.5)',
                          backgroundColor:
                            'rgba(220,38,38,0.12)',
                          color: '#fecaca',
                          textDecoration: 'none',
                          letterSpacing: '1.3px',
                          fontWeight: 700,
                        }}
                      >
                        INSTAGRAM
                      </a>
                    )}
                  </div>

                  {/* badge صغير */}
                  <span
                    style={{
                      fontSize: 9,
                      color: '#f97316',
                      backgroundColor: 'rgba(248,113,113,0.06)',
                      border:
                        '1px solid rgba(248,113,113,0.4)',
                      padding: '2px 10px',
                      borderRadius: 999,
                      letterSpacing: '1.5px',
                      fontWeight: 700,
                    }}
                  >
                    EXCLUSIVE PARTNER
                  </span>
                </div>
              )
            })()}
          </div>
        </section>
      )}

      {/* DJs SECTION — مرفوع فوق EVENTS */}
      <section
        id="djs"
        style={{
          padding: '56px 16px',
          backgroundColor: '#0a0a0a',
          borderTop: '1px solid #111',
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
              <p
                style={{
                  color: '#dc2626',
                  fontSize: '11px',
                  letterSpacing: '4px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                ● FEATURED
              </p>
              <h2
                style={{
                  fontSize: isMobile ? '26px' : '36px',
                  fontWeight: 900,
                  color: '#fff',
                  margin: 0,
                  letterSpacing: '-1px',
                }}
              >
                DJs
              </h2>
            </div>
            <Link
              href="/djs"
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
              VIEW ALL DJs
            </Link>
          </div>

          {djs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px',
                color: '#333',
              }}
            >
              <div
                style={{ fontSize: '48px', marginBottom: '12px' }}
              >
                🎧
              </div>
              <p
                style={{
                  letterSpacing: '2px',
                  fontSize: '13px',
                }}
              >
                NO DJs YET
              </p>
            </div>
          ) : (
            <div
              style={{ overflowX: 'auto', paddingBottom: '8px' }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${djs.length}, minmax(220px, 1fr))`,
                  gap: '20px',
                  minWidth:
                    djs.length > 4
                      ? `${djs.length * 240}px`
                      : 'auto',
                }}
              >
                {djs.map(dj => (
                  <div
                    key={dj.id}
                    style={{
                      backgroundColor: '#0d0d0d',
                      border: '1px solid #1a1a1a',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      transition: 'all 0.3s',
                    }}
                    onMouseEnter={e => {
                      const el =
                        e.currentTarget as HTMLDivElement
                      el.style.borderColor = '#dc2626'
                      el.style.transform = 'translateY(-6px)'
                      el.style.boxShadow =
                        '0 24px 48px rgba(220,38,38,0.1)'
                    }}
                    onMouseLeave={e => {
                      const el =
                        e.currentTarget as HTMLDivElement
                      el.style.borderColor = '#1a1a1a'
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    {dj.image_url ? (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          overflow: 'hidden',
                          backgroundColor: '#000',
                        }}
                      >
                        <img
                          src={dj.image_url}
                          alt={dj.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          background:
                            'linear-gradient(135deg, #1a0000, #0d0d0d)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '64px',
                        }}
                      >
                        🎧
                      </div>
                    )}

                    <div style={{ padding: '20px' }}>
                      <p
                        style={{
                          color: '#dc2626',
                          fontSize: '10px',
                          letterSpacing: '2px',
                          fontWeight: 700,
                          margin: '0 0 6px',
                        }}
                      >
                        ● DJ
                      </p>
                      <h3
                        style={{
                          fontSize: '20px',
                          fontWeight: 900,
                          color: '#fff',
                          margin: '0 0 8px',
                          letterSpacing: '-0.5px',
                        }}
                      >
                        {dj.name}
                      </h3>
                      {dj.bio && (
                        <p
                          style={{
                            color: '#555',
                            fontSize: '12px',
                            lineHeight: 1.6,
                            margin: '0 0 16px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {dj.bio}
                        </p>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <Link
                          href={`/djs/${dj.username || dj.id}`}
                          style={{
                            display: 'block',
                            textAlign: 'center',
                            background:
                              'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff',
                            padding: '10px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontSize: '13px',
                            letterSpacing: '1px',
                          }}
                        >
                          VIEW PROFILE
                        </Link>
                        {dj.whatsapp_number && (
                          <a
                            href={`https://wa.me/${dj.whatsapp_number}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              backgroundColor: 'transparent',
                              border:
                                '1px solid rgba(16,185,129,0.4)',
                              color: '#10b981',
                              padding: '10px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontSize: '13px',
                              letterSpacing: '1px',
                            }}
                          >
                            CONTACT NOW
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* EVENTS SECTION — بعد DJs */}
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
              <p
                style={{
                  color: '#dc2626',
                  fontSize: '11px',
                  letterSpacing: '4px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                ● UPCOMING
              </p>
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
              VIEW ALL
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
              <div
                style={{ fontSize: '48px', marginBottom: '12px' }}
              >
                🎭
              </div>
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
            style={{ overflowX: 'auto', paddingBottom: '8px' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${events.length}, minmax(260px, 1fr))`,
                gap: '20px',
                minWidth:
                  events.length > 3
                    ? `${events.length * 280}px`
                    : 'auto',
              }}
            >
              {events.map(event => {
                const { soldOut } = getCurrentPriceAndWave(event)

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
                    onMouseEnter={e => {
                      const el =
                        e.currentTarget as HTMLDivElement
                      el.style.borderColor = '#dc2626'
                      el.style.transform = 'translateY(-6px)'
                      el.style.boxShadow =
                        '0 24px 48px rgba(220,38,38,0.1)'
                    }}
                    onMouseLeave={e => {
                      const el =
                        e.currentTarget as HTMLDivElement
                      el.style.borderColor = '#1a1a1a'
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'none'
                    }}
                  >
                    {event.image_url ? (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
                          overflow: 'hidden',
                          backgroundColor: '#000',
                        }}
                      >
                        <img
                          src={event.image_url}
                          alt={event.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '3/4',
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
                        {new Date(
                          event.date,
                        )
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
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                          flexWrap: 'wrap',
                          gap: '8px',
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
                        <div style={{ flex: 1 }} />
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
                          {event.is_finished
                            ? 'EVENT ENDED'
                            : 'SOLD OUT'}
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
                          BOOK NOW
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
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
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {[
            { icon: '🎉', title: 'EXCLUSIVE EVENTS', sub: 'Every month' },
            { icon: '⚡', title: 'INSTANT BOOKING', sub: 'No hassle' },
            {
              icon: '🔐',
              title: 'SECURE PAYMENT',
              sub: '100% guaranteed',
            },
          ].map(s => (
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
              <div
                style={{ fontSize: '32px', marginBottom: '10px' }}
              >
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

      {/* ABOUT */}
      <section
        id="about"
        style={{
          padding: '72px 16px',
          backgroundColor: '#050505',
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
              background:
                'linear-gradient(90deg, #dc2626, transparent)',
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
            GRAVIX is Egypt&apos;s premier live events platform. We
            connect music lovers, culture seekers, and night-life
            enthusiasts with the most exclusive events across the
            country.
          </p>
          <p
            style={{
              color: '#444',
              fontSize: '14px',
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            From intimate underground concerts to large-scale
            festivals — we handle bookings, payments, and entry
            management so you can focus on the experience.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        style={{
          padding: '72px 16px',
          backgroundColor: '#0a0a0a',
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
              background:
                'linear-gradient(90deg, #dc2626, transparent)',
              borderRadius: '2px',
              margin: '0 auto 40px',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {[
              {
                href: 'https://instagram.com/gravix_eg',
                icon: '📸',
                label: 'INSTAGRAM',
                value: '@gravix_eg',
                hover: '#dc2626',
                external: true,
              },
              {
                href: 'https://wa.me/201093379437',
                icon: '💬',
                label: 'WHATSAPP',
                value: '+20 1093379437',
                hover: '#10b981',
                external: true,
              },
              {
                href: 'mailto:gravixegypt@gmail.com',
                icon: '✉️',
                label: 'EMAIL',
                value: 'gravixegypt@gmail.com',
                hover: '#3b82f6',
                external: false,
              },
            ].map(c => (
              <a
                key={c.label}
                href={c.href}
                target={c.external ? '_blank' : undefined}
                rel={c.external ? 'noreferrer' : undefined}
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
                  onMouseEnter={e =>
                    (e.currentTarget.style.borderColor = c.hover)
                  }
                  onMouseLeave={e =>
                    (e.currentTarget.style.borderColor = '#1a1a1a')
                  }
                >
                  <p
                    style={{
                      fontSize: '32px',
                      margin: '0 0 12px',
                    }}
                  >
                    {c.icon}
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
                    {c.label}
                  </p>
                  <p
                    style={{
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {c.value}
                  </p>
                </div>
              </a>
            ))}
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
          <Link
            href="/djs"
            style={{
              color: '#333',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '1px',
            }}
          >
            DJs
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
          © {new Date().getFullYear()} GRAVIX. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </main>
  )
}
