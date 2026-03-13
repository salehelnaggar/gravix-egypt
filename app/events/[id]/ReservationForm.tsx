'use client'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Person {
  name: string
  instagram: string
  phone: string
}

type EventForReservation = {
  id: string
  title: string
  is_finished?: boolean | null

  // Standing waves
  standing_wave_1_price?: number | null
  standing_wave_1_sold_out?: boolean | null
  standing_wave_2_price?: number | null
  standing_wave_2_sold_out?: boolean | null
  standing_wave_3_price?: number | null
  standing_wave_3_sold_out?: boolean | null

  // Backstage waves
  backstage_wave_1_price?: number | null
  backstage_wave_1_sold_out?: boolean | null
  backstage_wave_2_price?: number | null
  backstage_wave_2_sold_out?: boolean | null
  backstage_wave_3_price?: number | null
  backstage_wave_3_sold_out?: boolean | null
}

type Props = { event: EventForReservation }

// نفس الدالة اللي في صفحة الحدث
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

export default function ReservationForm({ event }: Props) {
  const router = useRouter()

  // عدد الأشخاص لكل نوع
  const [standingCount, setStandingCount] = useState(0)
  const [backstageCount, setBackstageCount] = useState(0)

  const [mainPerson, setMainPerson] = useState<Person>({
    name: '',
    instagram: '',
    phone: '',
  })
  const [extraPeople, setExtraPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // حساب Waves من نفس أعمدة Standing / Backstage
  const standing = useMemo(
    () =>
      getWaveInfo({
        wave_1_price: event.standing_wave_1_price,
        wave_1_sold_out: event.standing_wave_1_sold_out,
        wave_2_price: event.standing_wave_2_price,
        wave_2_sold_out: event.standing_wave_2_sold_out,
        wave_3_price: event.standing_wave_3_price,
        wave_3_sold_out: event.standing_wave_3_sold_out,
        is_finished: !!event.is_finished,
      }),
    [event],
  )

  const backstage = useMemo(
    () =>
      getWaveInfo({
        wave_1_price: event.backstage_wave_1_price,
        wave_1_sold_out: event.backstage_wave_1_sold_out,
        wave_2_price: event.backstage_wave_2_price,
        wave_2_sold_out: event.backstage_wave_2_sold_out,
        wave_3_price: event.backstage_wave_3_price,
        wave_3_sold_out: event.backstage_wave_3_sold_out,
        is_finished: !!event.is_finished,
      }),
    [event],
  )

  const allStandingUnavailable =
    standing.currentPrice == null || standing.soldOut
  const allBackstageUnavailable =
    backstage.currentPrice == null || backstage.soldOut

  const totalPeople = standingCount + backstageCount

  const handleCountsChange = (type: 'standing' | 'backstage', value: number) => {
    const safe = Math.max(0, Math.min(10, value || 0))
    if (type === 'standing') {
      setStandingCount(safe)
      syncExtraPeople(safe + backstageCount)
    } else {
      setBackstageCount(safe)
      syncExtraPeople(standingCount + safe)
    }
  }

  const syncExtraPeople = (newTotalPeople: number) => {
    const safeTotal = Math.max(1, Math.min(10, newTotalPeople || 0))
    const extrasNeeded = Math.max(0, safeTotal - 1)
    const extras = Array.from({ length: extrasNeeded }, (_, i) =>
      extraPeople[i] || { name: '', instagram: '', phone: '' },
    )
    setExtraPeople(extras)
  }

  const updateExtra = (i: number, field: keyof Person, value: string) => {
    const updated = [...extraPeople]
    updated[i] = { ...updated[i], [field]: value }
    setExtraPeople(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (event.is_finished) {
      setError('الإيفنت ده خلص بالفعل، مفيش حجز متاح.')
      return
    }

    if (standingCount === 0 && backstageCount === 0) {
      setError('لازم تختار على الأقل تذكرة واحدة (Standing أو Backstage).')
      return
    }

    if (
      (standingCount > 0 && allStandingUnavailable) ||
      (backstageCount > 0 && allBackstageUnavailable)
    ) {
      setError('في Wave مقفولة حاليًا، راجع الأسعار المتاحة وجرّب تاني.')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push(
        '/auth/login?redirect=' + encodeURIComponent(window.location.pathname),
      )
      return
    }

    const standingPrice = standing.currentPrice ?? 0
    const backstagePrice = backstage.currentPrice ?? 0

    const standingSubtotal = standingPrice * standingCount
    const backstageSubtotal = backstagePrice * backstageCount
    const subtotal = standingSubtotal + backstageSubtotal

    const taxRate = 0.14
    const taxAmount = Math.round(subtotal * taxRate)
    const totalPrice = subtotal + taxAmount

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        event_id: event.id,
        user_id: user.id,

        name: mainPerson.name,
        instagram: mainPerson.instagram,
        phone: mainPerson.phone,

        num_people: totalPeople,
        people_details: extraPeople,
        status: 'pending',

        standing_count: standingCount,
        standing_price_per_person: standingPrice,
        standing_wave_label: standing.currentWaveLabel,

        backstage_count: backstageCount,
        backstage_price_per_person: backstagePrice,
        backstage_wave_label: backstage.currentWaveLabel,

        subtotal_price: subtotal,
        tax_amount: taxAmount,
        total_price: totalPrice,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setError('حدث خطأ أثناء إنشاء الحجز، حاول تاني.')
      setLoading(false)
      return
    }

    router.push(`/reservation-success?id=${data.id}`)
  }

  const standingSubtotal =
    standing.currentPrice != null ? standing.currentPrice * standingCount : 0
  const backstageSubtotal =
    backstage.currentPrice != null ? backstage.currentPrice * backstageCount : 0
  const subtotal = standingSubtotal + backstageSubtotal
  const tax = Math.round(subtotal * 0.14)
  const total = subtotal + tax

  const allSoldOut =
    (allStandingUnavailable || standingCount === 0) &&
    (allBackstageUnavailable || backstageCount === 0)

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 rounded-2xl p-6 space-y-4"
    >
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">
        احجز مكانك 🎟️
      </h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {event.is_finished ? (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-center p-4 rounded-xl font-bold">
          الإيفنت ده خلص، مفيش حجز متاح حاليًا ❌
        </div>
      ) : allSoldOut ? (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-center p-4 rounded-xl font-bold">
          كل التذاكر المتاحة للStanding و Backstage خلصت ❌
        </div>
      ) : (
        <>
          {/* اختيار عدد التذاكر لكل نوع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standing */}
            <div className="border border-yellow-400/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-yellow-400 font-bold text-sm">
                  Standing
                </span>
                {standing.currentPrice != null && !standing.soldOut ? (
                  <span className="text-xs text-yellow-300">
                    {standing.currentWaveLabel || 'CURRENT WAVE'} ·{' '}
                    {standing.currentPrice} جنيه
                  </span>
                ) : (
                  <span className="text-xs text-red-300">SOLD OUT</span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={10}
                disabled={standing.soldOut || standing.currentPrice == null}
                className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none disabled:opacity-40"
                value={standingCount}
                onChange={e =>
                  handleCountsChange('standing', parseInt(e.target.value) || 0)
                }
              />
              <p className="text-xs text-gray-400">
                عدد تذاكر الStanding اللي عايز تحجزها.
              </p>
            </div>

            {/* Backstage */}
            <div className="border border-purple-400/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-300 font-bold text-sm">
                  Backstage
                </span>
                {backstage.currentPrice != null && !backstage.soldOut ? (
                  <span className="text-xs text-purple-200">
                    {backstage.currentWaveLabel || 'CURRENT WAVE'} ·{' '}
                    {backstage.currentPrice} جنيه
                  </span>
                ) : (
                  <span className="text-xs text-red-300">SOLD OUT</span>
                )}
              </div>
              <input
                type="number"
                min={0}
                max={10}
                disabled={backstage.soldOut || backstage.currentPrice == null}
                className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-purple-400 outline-none disabled:opacity-40"
                value={backstageCount}
                onChange={e =>
                  handleCountsChange(
                    'backstage',
                    parseInt(e.target.value) || 0,
                  )
                }
              />
              <p className="text-xs text-gray-400">
                عدد تذاكر الBackstage اللي عايز تحجزها.
              </p>
            </div>
          </div>

          {/* بيانات الشخص الأول */}
          <div className="border border-yellow-400/30 rounded-xl p-4 space-y-3">
            <h3 className="text-yellow-400 font-bold text-sm">👤 بياناتك</h3>
            <input
              type="text"
              placeholder="اسمك الكامل"
              required
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
              value={mainPerson.name}
              onChange={e =>
                setMainPerson({ ...mainPerson, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="حساب الانستجرام @"
              required
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
              value={mainPerson.instagram}
              onChange={e =>
                setMainPerson({ ...mainPerson, instagram: e.target.value })
              }
            />
            <input
              type="tel"
              placeholder="رقم التليفون"
              required
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
              value={mainPerson.phone}
              onChange={e =>
                setMainPerson({ ...mainPerson, phone: e.target.value })
              }
            />
          </div>

          {/* بيانات باقي الأشخاص */}
          {extraPeople.map((person, i) => (
            <div
              key={i}
              className="border border-gray-600 rounded-xl p-4 space-y-3"
            >
              <h3 className="text-gray-400 font-bold text-sm">
                👤 الشخص {i + 2}
              </h3>
              <input
                type="text"
                placeholder="الاسم الكامل"
                required
                className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
                value={person.name}
                onChange={e => updateExtra(i, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="حساب الانستجرام @"
                required
                className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
                value={person.instagram}
                onChange={e =>
                  updateExtra(i, 'instagram', e.target.value)
                }
              />
              <input
                type="tel"
                placeholder="رقم التليفون"
                required
                className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
                value={person.phone}
                onChange={e => updateExtra(i, 'phone', e.target.value)}
              />
            </div>
          ))}

          {/* السعر والإجمالي */}
          <div className="bg-gray-800 rounded-xl p-4 text-yellow-400 font-bold flex flex-col gap-1 text-sm">
            <p>
              Standing: {standingCount} × {standing.currentPrice ?? 0} ={' '}
              {standingSubtotal} جنيه
            </p>
            <p>
              Backstage: {backstageCount} × {backstage.currentPrice ?? 0} ={' '}
              {backstageSubtotal} جنيه
            </p>
            <p>Subtotal: {subtotal} جنيه</p>
            <p>Tax (14%): {tax} جنيه</p>
            <p className="text-lg mt-1">الإجمالي: {total} جنيه</p>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              event.is_finished ||
              totalPeople <= 0 ||
              subtotal <= 0
            }
            className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all disabled:opacity-50"
          >
            {loading ? 'جاري الحجز...' : 'تأكيد الحجز 🎉'}
          </button>
        </>
      )}
    </form>
  )
}
