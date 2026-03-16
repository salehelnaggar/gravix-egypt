'use client'

import { useState, useEffect, useMemo, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

type TicketType = 'standing' | 'backstage'

type PersonMini = {
  name: string
  phone: string
  instagram: string
  ticket_type: TicketType
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

  let price: number | null = null
  let label = ''
  let key = ''
  let soldOut = false

  if (wave1Available) {
    price = wave_1_price as number
    label = 'WAVE 1 — EARLY BIRD'
    key = 'wave_1'
  } else if (wave2Available) {
    price = wave_2_price as number
    label = 'WAVE 2 — REGULAR PRICE'
    key = 'wave_2'
  } else if (wave3Available) {
    price = wave_3_price as number
    label = 'WAVE 3 — LAST WAVE'
    key = 'wave_3'
  } else {
    price = null
    label = 'SOLD OUT'
    key = ''
    soldOut = true
  }

  if (is_finished) soldOut = true

  return { price, label, key, soldOut }
}

const isValidInstagramUrl = (url: string) => {
  if (!url) return false
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    return (
      (host === 'instagram.com' || host === 'www.instagram.com') &&
      u.pathname.length > 1
    )
  } catch {
    return false
  }
}

export default function ReservePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [event, setEvent] = useState<EventType | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')

  const [standingCount, setStandingCount] = useState(0)
  const [backstageCount, setBackstageCount] = useState(0)
  const [people, setPeople] = useState<PersonMini[]>([])

  const [standingOpen, setStandingOpen] = useState(false)
  const [backstageOpen, setBackstageOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setEvent(data as EventType | null))
  }, [id])

  const standing = useMemo(
    () =>
      getWaveInfo({
        wave_1_price: event?.standing_wave_1_price,
        wave_1_sold_out: event?.standing_wave_1_sold_out,
        wave_2_price: event?.standing_wave_2_price,
        wave_2_sold_out: event?.standing_wave_2_sold_out,
        wave_3_price: event?.standing_wave_3_price,
        wave_3_sold_out: event?.standing_wave_3_sold_out,
        is_finished: event?.is_finished ?? false,
      }),
    [event],
  )

  const backstage = useMemo(
    () =>
      getWaveInfo({
        wave_1_price: event?.backstage_wave_1_price,
        wave_1_sold_out: event?.backstage_wave_1_sold_out,
        wave_2_price: event?.backstage_wave_2_price,
        wave_2_sold_out: event?.backstage_wave_2_sold_out,
        wave_3_price: event?.backstage_wave_3_price,
        wave_3_sold_out: event?.backstage_wave_3_sold_out,
        is_finished: event?.is_finished ?? false,
      }),
    [event],
  )

  const allStandingUnavailable = standing.price == null || standing.soldOut
  const allBackstageUnavailable = backstage.price == null || backstage.soldOut

  const totalPeople = standingCount + backstageCount

  let mainTicketType: TicketType | null = null
  if (standingCount > 0) mainTicketType = 'standing'
  else if (backstageCount > 0) mainTicketType = 'backstage'

  const syncPeople = (newStandingCount: number, newBackstageCount: number) => {
    const newTotal = newStandingCount + newBackstageCount
    const safeTotal = Math.max(1, Math.min(10, newTotal || 0))
    const extrasNeeded = Math.max(0, safeTotal - 1)
    const extraStanding =
      newStandingCount > 0 ? Math.max(0, newStandingCount - 1) : 0
    const extraBackstage = newBackstageCount
    const arr: PersonMini[] = []

    for (let i = 0; i < extrasNeeded; i++) {
      const old = people[i]
      let ticket_type: TicketType
      if (i < extraStanding) ticket_type = 'standing'
      else if (i < extraStanding + extraBackstage) ticket_type = 'backstage'
      else ticket_type = 'standing'
      arr.push(
        old
          ? { ...old, ticket_type }
          : { name: '', phone: '', instagram: '', ticket_type },
      )
    }
    setPeople(arr)
  }

  const handleNumChange = (type: TicketType, n: number) => {
    const safe = Math.max(0, Math.min(10, n || 0))
    if (type === 'standing') {
      setStandingCount(safe)
      syncPeople(safe, backstageCount)
    } else {
      setBackstageCount(safe)
      syncPeople(standingCount, safe)
    }
  }

  const updatePerson = (i: number, field: keyof PersonMini, value: string) => {
    setPeople(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p))
  }

  const getSubtotal = () =>
    (standing.price ?? 0) * standingCount + (backstage.price ?? 0) * backstageCount
  const getTax = () => Math.round(getSubtotal() * 0.14)
  const getTotal = () => getSubtotal() + getTax()

  const allSoldOut =
    (standing.soldOut || standing.price == null) &&
    (backstage.soldOut || backstage.price == null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!event) { setError('Event not found.'); return }
    if (event.is_finished) { setError('This event has ended.'); return }
    if (standingCount === 0 && backstageCount === 0) {
      setError('Select at least one ticket (Standing or Backstage).')
      return
    }
    if (!mainTicketType) { setError('Please select ticket type first.'); return }
    if (
      (standingCount > 0 && allStandingUnavailable) ||
      (backstageCount > 0 && allBackstageUnavailable)
    ) {
      setError('Current wave is closed, please check with dashboard.')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (!name || !phone || !email || !instagram) {
      setError('Please fill main guest details.')
      return
    }
    if (!isValidInstagramUrl(instagram)) {
      setError('Please enter a valid Instagram URL for main guest.')
      return
    }
    for (const p of people) {
      if (!p.name || !p.phone || !p.instagram) {
        setError('Please fill all details for each guest.')
        return
      }
      if (!isValidInstagramUrl(p.instagram)) {
        setError('Please enter a valid Instagram URL for all guests.')
        return
      }
    }

    setLoading(true)

    const subtotal = getSubtotal()
    const tax = getTax()
    const total = getTotal()
    const mainPerson: PersonMini = { name, phone, instagram, ticket_type: mainTicketType }
    const peopleDetails: PersonMini[] = [mainPerson, ...people]

    const { error: insertError } = await supabase.from('reservations').insert({
      event_id: id,
      user_id: user.id,
      name, phone, email, instagram,
      num_people: totalPeople,
      people_details: peopleDetails,
      standing_count: standingCount,
      standing_price_per_person: standing.price ?? 0,
      standing_wave_label: standing.key,
      backstage_count: backstageCount,
      backstage_price_per_person: backstage.price ?? 0,
      backstage_wave_label: backstage.key,
      subtotal_price: subtotal,
      tax_amount: tax,
      total_price: total,
      status: 'pending',
    })

    if (insertError) {
      console.error(insertError)
      setError('Something went wrong, please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccessMsg(
      'Reservation created successfully. Please check your profile on the website to follow booking steps, complete payment, and get your entry code.',
    )
    setStandingCount(0)
    setBackstageCount(0)
    setPeople([])
    setName('')
    setPhone('')
    setEmail('')
    setInstagram('')
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
  }

  const labelStyle: React.CSSProperties = {
    color: '#444',
    fontSize: '10px',
    letterSpacing: '2px',
    fontWeight: 700,
    display: 'block',
    marginBottom: '8px',
  }

  // ✅ Custom Dropdown Component
  const TicketDropdown = ({
    value,
    onChange,
    disabled,
    isOpen,
    setIsOpen,
  }: {
    value: number
    onChange: (n: number) => void
    disabled?: boolean
    isOpen: boolean
    setIsOpen: (v: boolean) => void
  }) => (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          backgroundColor: '#0d0d0d',
          border: '1px solid #1a1a1a',
          borderRadius: '10px',
          padding: '14px 16px',
          color: disabled ? '#333' : '#fff',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span>{value} ticket{value !== 1 ? 's' : ''}</span>
        <span style={{ color: '#555', fontSize: 10 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#111',
            border: '1px solid #222',
            borderRadius: '10px',
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              onClick={() => { onChange(i); setIsOpen(false) }}
              style={{
                padding: '12px 16px',
                color: value === i ? '#fff' : '#888',
                backgroundColor: value === i ? '#dc2626' : 'transparent',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                borderBottom: i < 10 ? '1px solid #1a1a1a' : 'none',
              }}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor =
                  value === i ? '#dc2626' : '#1a1a1a')
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor =
                  value === i ? '#dc2626' : 'transparent')
              }
            >
              {i}
            </div>
          ))}
        </div>
      )}
    </div>
  )

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
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '32px', letterSpacing: '8px' }}>
              GRAVIX
            </span>
          </Link>
          <p style={{ color: '#333', fontSize: '11px', letterSpacing: '4px', marginTop: '8px' }}>
            BOOK YOUR SPOT
          </p>
        </div>

        {/* EVENT INFO */}
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
              <p style={{ color: '#fff', fontSize: '16px', fontWeight: 900, margin: '0 0 4px' }}>
                {event.title}
              </p>
              <p style={{ color: '#444', fontSize: '12px', margin: 0 }}>
                📅{' '}
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
                })}{' '}
                · 📍 {event.location}
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#ccc' }}>
              <div>
                Standing:{' '}
                {standing.price != null && !standing.soldOut
                  ? `${standing.price} EGP` : 'SOLD OUT'}
              </div>
              <div>
                Backstage:{' '}
                {backstage.price != null && !backstage.soldOut
                  ? `${backstage.price} EGP` : 'SOLD OUT'}
              </div>
            </div>
          </div>
        )}

        {event && allSoldOut && (
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
            <p style={{ color: '#ef4444', fontSize: '13px', letterSpacing: '2px', fontWeight: 700, margin: 0 }}>
              {event.is_finished ? 'THIS EVENT HAS ENDED' : 'ALL STANDING & BACKSTAGE ARE SOLD OUT'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: SELECT TICKETS */}
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            <p style={{ color: '#555', fontSize: '10px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 16px' }}>
              STEP 1 · SELECT TICKETS
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>STANDING TICKETS</label>
                <TicketDropdown
                  value={standingCount}
                  disabled={allStandingUnavailable}
                  isOpen={standingOpen}
                  setIsOpen={(v) => { setStandingOpen(v); if (v) setBackstageOpen(false) }}
                  onChange={n => handleNumChange('standing', n)}
                />
              </div>
              <div>
                <label style={labelStyle}>BACKSTAGE TICKETS</label>
                <TicketDropdown
                  value={backstageCount}
                  disabled={allBackstageUnavailable}
                  isOpen={backstageOpen}
                  setIsOpen={(v) => { setBackstageOpen(v); if (v) setStandingOpen(false) }}
                  onChange={n => handleNumChange('backstage', n)}
                />
              </div>
            </div>

            <p style={{ color: '#555', fontSize: '11px', marginTop: 10 }}>
              Choose how many Standing and Backstage tickets you want. Guest details will appear in the next step.
            </p>
          </div>

          {/* STEP 2: GUEST DETAILS */}
          {totalPeople > 0 && (
            <>
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '16px',
                }}
              >
                <p style={{ color: '#555', fontSize: '10px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 8px' }}>
                  STEP 2 · MAIN GUEST DETAILS
                </p>
                <p style={{ color: '#888', fontSize: '11px', margin: '0 0 16px' }}>
                  Ticket type:{' '}
                  <span style={{ color: '#f97316', fontWeight: 700 }}>
                    {mainTicketType
                      ? mainTicketType === 'standing' ? 'STANDING' : 'BACKSTAGE'
                      : 'Select tickets first'}
                  </span>
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>FULL NAME</label>
                  <input style={inputStyle} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>PHONE NUMBER</label>
                  <input style={inputStyle} placeholder="01XXXXXXXXX" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>EMAIL</label>
                  <input style={inputStyle} placeholder="your@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <label style={labelStyle}>INSTAGRAM URL</label>
                  <input style={inputStyle} type="url" placeholder="https://instagram.com/username" value={instagram} onChange={e => setInstagram(e.target.value)} />
                </div>
              </div>

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
                  <p style={{ color: '#555', fontSize: '10px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 8px' }}>
                    GUEST {i + 2} DETAILS ({p.ticket_type === 'standing' ? 'STANDING' : 'BACKSTAGE'})
                  </p>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>FULL NAME</label>
                    <input style={inputStyle} placeholder="Full name" value={p.name} onChange={e => updatePerson(i, 'name', e.target.value)} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>PHONE NUMBER</label>
                    <input style={inputStyle} placeholder="01XXXXXXXXX" type="tel" value={p.phone} onChange={e => updatePerson(i, 'phone', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>INSTAGRAM URL</label>
                    <input style={inputStyle} type="url" placeholder="https://instagram.com/username" value={p.instagram} onChange={e => updatePerson(i, 'instagram', e.target.value)} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* TOTAL */}
          {!allSoldOut && event && (
            <div
              style={{
                backgroundColor: '#0d0d0d',
                border: '1px solid #1a1a1a',
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#666', fontSize: 12 }}>Standing ({standingCount}x)</span>
                <span style={{ color: '#ccc', fontSize: 13 }}>{(standing.price ?? 0) * standingCount} EGP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#666', fontSize: 12 }}>Backstage ({backstageCount}x)</span>
                <span style={{ color: '#ccc', fontSize: 13 }}>{(backstage.price ?? 0) * backstageCount} EGP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ color: '#888', fontSize: 12 }}>SUBTOTAL</span>
                <span style={{ color: '#eee', fontSize: 14 }}>{getSubtotal()} EGP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#888', fontSize: 12 }}>TAX (14%)</span>
                <span style={{ color: '#eee', fontSize: 14 }}>{getTax()} EGP</span>
              </div>
              <div
                style={{
                  borderTop: '1px solid #1a1a1a',
                  marginTop: 10,
                  paddingTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>TOTAL</span>
                <span style={{ color: '#dc2626', fontSize: 22, fontWeight: 900 }}>{getTotal()} EGP</span>
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

          {successMsg && (
            <div
              style={{
                backgroundColor: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#22c55e',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || allSoldOut || getSubtotal() <= 0 || totalPeople === 0}
            style={{
              width: '100%',
              backgroundColor:
                loading || allSoldOut || getSubtotal() <= 0 || totalPeople === 0
                  ? '#1a1a1a' : '#dc2626',
              color:
                loading || allSoldOut || getSubtotal() <= 0 || totalPeople === 0
                  ? '#333' : '#fff',
              border: 'none',
              padding: '18px',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '15px',
              letterSpacing: '3px',
              cursor:
                loading || allSoldOut || getSubtotal() <= 0 || totalPeople === 0
                  ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading
              ? 'SUBMITTING...'
              : allSoldOut || getSubtotal() <= 0 || totalPeople === 0
              ? 'UNAVAILABLE'
              : 'SUBMIT BOOKING →'}
          </button>

          <p style={{ color: '#333', fontSize: '12px', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
            After submitting, go to your profile on the website to follow the booking steps, complete payment, and get your entry QR code.
          </p>
        </form>
      </div>
    </main>
  )
}
