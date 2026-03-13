'use client'

import { useState, useEffect, useMemo } from 'react'
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

type PersonMini = { name: string; phone: string; instagram: string }

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

  if (is_finished) {
    soldOut = true
  }

  return { price, label, key, soldOut }
}

export default function ReserveClient({ id }: { id: string }) {
  const router = useRouter()

  const [event, setEvent] = useState<EventType | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')

  const [standingCount, setStandingCount] = useState(0)
  const [backstageCount, setBackstageCount] = useState(0)
  const [people, setPeople] = useState<PersonMini[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const allStandingUnavailable =
    standing.price == null || standing.soldOut
  const allBackstageUnavailable =
    backstage.price == null || backstage.soldOut

  const totalPeople = standingCount + backstageCount

  const syncPeople = (newTotal: number) => {
    const safeTotal = Math.max(1, Math.min(10, newTotal || 0))
    const extrasNeeded = Math.max(0, safeTotal - 1)
    const arr = Array.from({ length: extrasNeeded }, (_, i) =>
      people[i] || { name: '', phone: '', instagram: '' },
    )
    setPeople(arr)
  }

  const handleNumChange = (type: 'standing' | 'backstage', n: number) => {
    const safe = Math.max(0, Math.min(10, n || 0))
    if (type === 'standing') {
      setStandingCount(safe)
      syncPeople(safe + backstageCount)
    } else {
      setBackstageCount(safe)
      syncPeople(standingCount + safe)
    }
  }

  const updatePerson = (i: number, field: keyof PersonMini, value: string) => {
    setPeople(prev =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    )
  }

  const getSubtotal = () => {
    const s = (standing.price ?? 0) * standingCount
    const b = (backstage.price ?? 0) * backstageCount
    return s + b
  }
  const getTax = () => Math.ceil(getSubtotal() * 0.14)
  const getTotal = () => getSubtotal() + getTax()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!event) {
      setError('Event not found.')
      setLoading(false)
      return
    }

    if (event.is_finished) {
      setError('This event has ended.')
      setLoading(false)
      return
    }

    if (standingCount === 0 && backstageCount === 0) {
      setError('اختر على الأقل تذكرة واحدة (Standing أو Backstage).')
      setLoading(false)
      return
    }

    if (
      (standingCount > 0 && allStandingUnavailable) ||
      (backstageCount > 0 && allBackstageUnavailable)
    ) {
      setError('الـ wave الحالي مقفول، راجع الداشبورد.')
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/login')
      return
    }

    const subtotal = getSubtotal()
    const tax = getTax()
    const total = getTotal()

    const { error: insertError } = await supabase.from('reservations').insert({
      event_id: id,
      user_id: user.id,
      name,
      phone,
      email,
      instagram,
      num_people: totalPeople,
      people_details: people,
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
  }

  const labelStyle: React.CSSProperties = {
    color: '#444',
    fontSize: '10px',
    letterSpacing: '2px',
    fontWeight: 700,
    display: 'block',
    marginBottom: '8px',
  }

  const waveBadgeBase: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2px',
  }

  const renderWaveBadge = (key: string, label: string) => {
    if (!key || !label || label === 'SOLD OUT') return null
    const bg =
      key === 'wave_1'
        ? 'rgba(34,197,94,0.1)'
        : key === 'wave_2'
        ? 'rgba(234,179,8,0.1)'
        : 'rgba(59,130,246,0.1)'
    const border =
      key === 'wave_1'
        ? 'rgba(34,197,94,0.4)'
        : key === 'wave_2'
        ? 'rgba(234,179,8,0.4)'
        : 'rgba(59,130,246,0.4)'
    const color =
      key === 'wave_1'
        ? '#22c55e'
        : key === 'wave_2'
        ? '#eab308'
        : '#3b82f6'

    return (
      <span
        style={{
          ...waveBadgeBase,
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color,
        }}
      >
        {label}
      </span>
    )
  }

  const allSoldOut =
    (allStandingUnavailable && allBackstageUnavailable) ||
    !!event?.is_finished

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        padding: '60px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* باقي JSX هو نفس اللي بعتّهولك قبل كده في الكومبوننت، ما يحتاجش تغيير */}
      {/* تقدر تنسخ من النسخة اللي فاتت من أول <div style={{ maxWidth ... }}> لحد آخر الكود */}
    </main>
  )
}
