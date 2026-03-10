'use client'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Person { name: string; instagram: string; phone: string }

type EventWithWaves = {
  id: string
  title: string
  price?: number | null
  wave_1_price?: number | null
  wave_1_sold_out?: boolean | null
  wave_2_price?: number | null
  wave_2_sold_out?: boolean | null
  wave_3_price?: number | null
  wave_3_sold_out?: boolean | null
  is_finished?: boolean | null
}

export default function ReservationForm({ event }: { event: EventWithWaves }) {
  const router = useRouter()
  const [numPeople, setNumPeople] = useState(1)
  const [mainPerson, setMainPerson] = useState<Person>({ name: '', instagram: '', phone: '' })
  const [extraPeople, setExtraPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ---------- WAVE LOGIC (نفس منطق صفحة الحدث) ----------
  const { currentPrice, currentWaveLabel, isSoldOut } = useMemo(() => {
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
    let soldOut = false

    if (wave1Available) {
      price = event.wave_1_price as number
      label = 'WAVE 1'
    } else if (wave2Available) {
      price = event.wave_2_price as number
      label = 'WAVE 2'
    } else if (wave3Available) {
      price = event.wave_3_price as number
      label = 'WAVE 3'
    } else {
      price = null
      soldOut = true
    }

    if (event.is_finished) {
      soldOut = true
    }

    return {
      currentPrice: price,
      currentWaveLabel: label,
      isSoldOut: soldOut,
    }
  }, [event])

  const handleNumChange = (n: number) => {
    const safe = Math.max(1, Math.min(10, n || 1))
    setNumPeople(safe)
    const extras = Array.from({ length: safe - 1 }, (_, i) =>
      extraPeople[i] || { name: '', instagram: '', phone: '' }
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

    if (isSoldOut || currentPrice == null) {
      setError('للأسف كل الwaves خلصت، مفيش حجز متاح دلوقتي.')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    const totalPrice = currentPrice * numPeople

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        event_id: event.id,
        user_id: user.id,
        name: mainPerson.name,
        instagram: mainPerson.instagram,
        phone: mainPerson.phone,
        num_people: numPeople,
        people_details: extraPeople,
        status: 'pending',
        price_per_person: currentPrice,   // لو العمود موجود
        total_price: totalPrice,          // لو العمود موجود
        wave_label: currentWaveLabel,     // لو عايز تعرف الحجز كان على أنهي Wave
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      setError('حدث خطأ، حاول تاني')
      setLoading(false)
      return
    }

    router.push(`/reservation-success?id=${data.id}`)
  }

  const total = currentPrice != null ? currentPrice * numPeople : 0

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">احجز مكانك 🎟️</h2>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* لو Sold out، نظهر رسالة ونقفل الفورم */}
      {isSoldOut ? (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 text-center p-4 rounded-xl font-bold">
          كل الwaves خلصت، مفيش حجز متاح حاليًا ❌
        </div>
      ) : (
        <>
          {/* عدد الأشخاص */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">عدد الأشخاص</label>
            <input
              type="number"
              min={1}
              max={10}
              required
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
              value={numPeople}
              onChange={e => handleNumChange(parseInt(e.target.value) || 1)}
            />
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
              onChange={e => setMainPerson({ ...mainPerson, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="حساب الانستجرام @"
              required
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
              value={mainPerson.instagram}
              onChange={e => setMainPerson({ ...mainPerson, instagram: e.target.value })}
            />
            <input
              type="tel"
              placeholder="رقم التليفون"
              required
              className="w-full bg-gray-800 text-white p-3 rounded-xl border border-gray-700 focus:border-yellow-400 outline-none"
              value={mainPerson.phone}
              onChange={e => setMainPerson({ ...mainPerson, phone: e.target.value })}
            />
          </div>

          {/* بيانات باقي الأشخاص */}
          {extraPeople.map((person, i) => (
            <div key={i} className="border border-gray-600 rounded-xl p-4 space-y-3">
              <h3 className="text-gray-400 font-bold text-sm">👤 الشخص {i + 2}</h3>
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
                onChange={e => updateExtra(i, 'instagram', e.target.value)}
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
          <div className="bg-gray-800 rounded-xl p-4 text-yellow-400 font-bold text-lg flex flex-col gap-1">
            {currentPrice != null ? (
              <>
                <p>سعر الفرد الحالي ({currentWaveLabel || 'CURRENT WAVE'}): {currentPrice} جنيه</p>
                <p>الإجمالي: {total} جنيه</p>
              </>
            ) : (
              <p>لا يوجد Wave متاح حاليًا</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isSoldOut || currentPrice == null}
            className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all disabled:opacity-50"
          >
            {loading ? 'جاري الحجز...' : 'تأكيد الحجز 🎉'}
          </button>
        </>
      )}
    </form>
  )
}
