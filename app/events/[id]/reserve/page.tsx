'use client'
import { useState, use, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type EventWithWaves = {
  id: string
  title: string
  date: string
  location: string
  location_url?: string
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

export default function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<EventWithWaves | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [numPeople, setNumPeople] = useState(1)
  const [people, setPeople] = useState<{ name: string; phone: string; instagram: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setEvent(data as EventWithWaves | null))
  }, [id])

  const handleNumChange = (n: number) => {
    const safe = Math.max(1, Math.min(10, n || 1))
    setNumPeople(safe)
    const extras = safe - 1
    setPeople(
      Array.from({ length: extras }, (_, i) => people[i] || { name: '', phone: '', instagram: '' })
    )
  }

  const updatePerson = (i: number, field: string, value: string) => {
    setPeople(prev => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  }

  // ---------- WAVE LOGIC (1 → 2 → 3) ----------
  const getWaveInfo = () => {
    if (!event) {
      return {
        price: null as number | null,
        label: '',
        key: '',
        isSoldOut: false,
      }
    }

    if (event.is_finished) {
      return {
        price: null,
        label: 'EVENT ENDED',
        key: '',
        isSoldOut: true,
      }
    }

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

    let price: number | null = null
    let label = ''
    let key = ''
    let isSoldOut = false

    if (wave1Available) {
      price = event.wave_1_price as number
      label = 'WAVE 1 — EARLY BIRD'
      key = 'wave_1'
    } else if (wave2Available) {
      price = event.wave_2_price as number
      label = 'WAVE 2 — REGULAR PRICE'
      key = 'wave_2'
    } else if (wave3Available) {
      price = event.wave_3_price as number
      label = 'WAVE 3 — LAST WAVE'
      key = 'wave_3'
    } else {
      price = null
      label = 'SOLD OUT'
      key = ''
      isSoldOut = true
    }

    return { price, label, key, isSoldOut }
  }

  const { price: currentPrice, label: currentWaveLabel, key: currentWaveKey, isSoldOut } =
    getWaveInfo()

  const getSubtotal = (n: number) => (currentPrice ? currentPrice * n : 0)
  const getTax = (n: number) => (currentPrice ? Math.ceil(currentPrice * n * 0.14) : 0)
  const getTotal = (n: number) => (currentPrice ? Math.ceil(currentPrice * n * 1.14) : 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    if (!event || !currentPrice || isSoldOut) {
      setError('This event is sold out.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('reservations').insert({
      event_id: id,
      user_id: user.id,
      name,
      phone,
      email,
      instagram,
      num_people: numPeople,
      people_details: people,
      unit_price: currentPrice,
      total_price: getTotal(numPeople),
      wave_used: currentWaveKey, // wave_1 / wave_2 / wave_3
      status: 'pending',
    })

    if (insertError) {
      console.error(insertError)
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/reservation-success')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#0d0d0d',
    border: '1px solid #1a1a1a',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    color: '#444',
    fontSize: '10px',
    letterSpacing: '2px',
    fontWeight: 700,
    display: 'block',
    marginBottom: '8px',
  }

  const waveBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2px',
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        padding: '60px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span
              style={{
                color: '#dc2626',
                fontWeight: 900,
                fontSize: '32px',
                letterSpacing: '8px',
              }}
            >
              GRAVIX
            </span>
          </Link>
          <p
            style={{
              color: '#333',
              fontSize: '11px',
              letterSpacing: '4px',
              marginTop: '8px',
            }}
          >
            BOOK YOUR SPOT
          </p>
        </div>

        {/* Event Info */}
        {event && (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <p
                style={{
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 900,
                  margin: '0 0 4px',
                }}
              >
                {event.title}
              </p>
              <p
                style={{
                  color: '#444',
                  fontSize: '12px',
                  margin: 0,
                }}
              >
                📅{' '}
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                    timeZone: 'UTC',

                })}{' '}
                · 📍 {event.location}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
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
              <p
                style={{
                  color: currentPrice ? '#dc2626' : '#ef4444',
                  fontSize: '20px',
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                {currentPrice ?? 'SOLD OUT'}{' '}
                {currentPrice && (
                  <span
                    style={{
                      color: '#444',
                      fontSize: '12px',
                      fontWeight: 400,
                    }}
                  >
                    EGP
                  </span>
                )}
              </p>

              {currentPrice && (
                <div style={{ marginTop: '6px' }}>
                  <span
                    style={{
                      ...waveBadgeStyle,
                      backgroundColor: currentWaveKey === 'wave_1'
                        ? 'rgba(34,197,94,0.1)'
                        : currentWaveKey === 'wave_2'
                        ? 'rgba(234,179,8,0.1)'
                        : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${
                        currentWaveKey === 'wave_1'
                          ? 'rgba(34,197,94,0.4)'
                          : currentWaveKey === 'wave_2'
                          ? 'rgba(234,179,8,0.4)'
                          : 'rgba(59,130,246,0.4)'
                      }`,
                      color: currentWaveKey === 'wave_1'
                        ? '#22c55e'
                        : currentWaveKey === 'wave_2'
                        ? '#eab308'
                        : '#3b82f6',
                    }}
                  >
                    {currentWaveLabel}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* لو Sold out بالكامل */}
        {event && (!currentPrice || isSoldOut) && (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '32px', margin: '0 0 8px' }}>❌</p>
            <p
              style={{
                color: '#ef4444',
                fontSize: '13px',
                letterSpacing: '2px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {event.is_finished ? 'THIS EVENT HAS ENDED' : 'THIS EVENT IS SOLD OUT'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Main Guest */}
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                color: '#555',
                fontSize: '10px',
                letterSpacing: '3px',
                fontWeight: 700,
                margin: '0 0 20px',
              }}
            >
              YOUR DETAILS
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>FULL NAME</label>
              <input
                style={inputStyle}
                placeholder="Your full name"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={e => (e.target.style.borderColor = '#dc2626')}
                onBlur={e => (e.target.style.borderColor = '#1a1a1a')}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>PHONE NUMBER</label>
              <input
                style={inputStyle}
                placeholder="01XXXXXXXXX"
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onFocus={e => (e.target.style.borderColor = '#dc2626')}
                onBlur={e => (e.target.style.borderColor = '#1a1a1a')}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>EMAIL</label>
              <input
                style={inputStyle}
                placeholder="your@email.com"
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => (e.target.style.borderColor = '#dc2626')}
                onBlur={e => (e.target.style.borderColor = '#1a1a1a')}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>INSTAGRAM</label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    color: '#444',
                    padding: '14px 0 14px 16px',
                    fontSize: '14px',
                  }}
                >
                  @
                </span>
                <input
                  style={{
                    ...inputStyle,
                    border: 'none',
                    borderRadius: 0,
                    paddingLeft: '6px',
                  }}
                  placeholder="username"
                  required
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>NUMBER OF TICKETS</label>
              <select
                value={numPeople}
                onChange={e => handleNumChange(Number(e.target.value))}
                style={{ ...inputStyle, cursor: 'pointer' }}
                disabled={!currentPrice || isSoldOut}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option
                    key={n}
                    value={n}
                    style={{ backgroundColor: '#0d0d0d' }}
                  >
                    {n} {n === 1 ? 'person' : 'people'}
                    {currentPrice ? ` — ${getTotal(n)} EGP` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Guests */}
          {people.map((p, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
              }}
            >
              <p
                style={{
                  color: '#555',
                  fontSize: '10px',
                  letterSpacing: '3px',
                  fontWeight: 700,
                  margin: '0 0 20px',
                }}
              >
                GUEST {i + 2} DETAILS
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>FULL NAME</label>
                <input
                  style={inputStyle}
                  placeholder="Full name"
                  required
                  value={p.name}
                  onChange={e => updatePerson(i, 'name', e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#dc2626')}
                  onBlur={e => (e.target.style.borderColor = '#1a1a1a')}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>PHONE NUMBER</label>
                <input
                  style={inputStyle}
                  placeholder="01XXXXXXXXX"
                  required
                  type="tel"
                  value={p.phone}
                  onChange={e => updatePerson(i, 'phone', e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#dc2626')}
                  onBlur={e => (e.target.style.borderColor = '#1a1a1a')}
                />
              </div>
              <div>
                <label style={labelStyle}>INSTAGRAM</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#0d0d0d',
                    border: '1px solid #1a1a1a',
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      color: '#444',
                      padding: '14px 0 14px 16px',
                      fontSize: '14px',
                    }}
                  >
                    @
                  </span>
                  <input
                    style={{
                      ...inputStyle,
                      border: 'none',
                      borderRadius: 0,
                      paddingLeft: '6px',
                    }}
                    placeholder="username"
                    required
                    value={p.instagram}
                    onChange={e =>
                      updatePerson(i, 'instagram', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          {event && currentPrice && !isSoldOut && (
            <div
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <p
                  style={{
                    color: '#444',
                    fontSize: '12px',
                    letterSpacing: '2px',
                    margin: 0,
                  }}
                >
                  SUBTOTAL ({numPeople}x)
                </p>
                <p
                  style={{
                    color: '#666',
                    fontSize: '15px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {getSubtotal(numPeople)} EGP
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}
              >
                <p
                  style={{
                    color: '#444',
                    fontSize: '12px',
                    letterSpacing: '2px',
                    margin: 0,
                  }}
                >
                  TAX (14%)
                </p>
                <p
                  style={{
                    color: '#666',
                    fontSize: '15px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  {getTax(numPeople)} EGP
                </p>
              </div>
              <div
                style={{
                  borderTop: '1px solid #1a1a1a',
                  paddingTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p
                    style={{
                      color: '#fff',
                      fontSize: '12px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    TOTAL
                  </p>
                  <p
                    style={{
                      color: '#444',
                      fontSize: '11px',
                      margin: '4px 0 0',
                    }}
                  >
                    {currentWaveLabel}
                  </p>
                </div>
                <p
                  style={{
                    color: '#dc2626',
                    fontSize: '24px',
                    fontWeight: 900,
                    margin: 0,
                  }}
                >
                  {getTotal(numPeople)}{' '}
                  <span
                    style={{
                      color: '#444',
                      fontSize: '13px',
                      fontWeight: 400,
                    }}
                  >
                    EGP
                  </span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !currentPrice || isSoldOut}
            style={{
              width: '100%',
              backgroundColor:
                loading || !currentPrice || isSoldOut ? '#1a1a1a' : '#dc2626',
              color:
                loading || !currentPrice || isSoldOut ? '#333' : '#fff',
              border: 'none',
              padding: '18px',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '3px',
              cursor:
                loading || !currentPrice || isSoldOut
                  ? 'not-allowed'
                  : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading
              ? 'SUBMITTING...'
              : !currentPrice || isSoldOut
              ? 'SOLD OUT'
              : 'SUBMIT BOOKING →'}
          </button>

          <p
            style={{
              color: '#333',
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '16px',
              lineHeight: 1.6,
            }}
          >
            After confirming, you'll receive your entry code via email.
          </p>
        </form>
      </div>
    </main>
  )
}
