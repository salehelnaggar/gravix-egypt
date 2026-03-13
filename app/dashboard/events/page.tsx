'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const empty = {
  title: '',
  description: '',
  date: '',
  location: '',
  location_url: '',
  transfer_number: '',
  image_url: '',
  is_active: true,

  // Standing
  standing_wave_1_price: '',
  standing_wave_2_price: '',
  standing_wave_3_price: '',

  // Backstage
  backstage_wave_1_price: '',
  backstage_wave_2_price: '',
  backstage_wave_3_price: '',
}

export default function DashboardEvents() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [form, setForm] = useState<any>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('admin_auth') !== 'true'
    ) {
      router.push('/dashboard/login')
      return
    }
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
    setEvents(data || [])
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setImagePreview(URL.createObjectURL(file))
    const ext = file.name.split('.').pop()
    const path = `event-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('event-images')
      .upload(path, file, { upsert: true })
    if (error) {
      alert('Image upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl(path)
    setForm((prev: any) => ({ ...prev, image_url: urlData.publicUrl }))
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload: any = {
      title: form.title,
      description: form.description,
      date: form.date,
      location: form.location,
      location_url: form.location_url || null,
      image_url: form.image_url || null,
      is_active: !!form.is_active,
      transfer_number: form.transfer_number || null,

      // STANDING
      standing_wave_1_price: Number(form.standing_wave_1_price),
      standing_wave_1_sold_out: form.standing_wave_1_sold_out ?? false,

      standing_wave_2_price: form.standing_wave_2_price
        ? Number(form.standing_wave_2_price)
        : null,
      standing_wave_2_sold_out: form.standing_wave_2_sold_out ?? false,

      standing_wave_3_price: form.standing_wave_3_price
        ? Number(form.standing_wave_3_price)
        : null,
      standing_wave_3_sold_out: form.standing_wave_3_sold_out ?? false,

      // BACKSTAGE
      backstage_wave_1_price: form.backstage_wave_1_price
        ? Number(form.backstage_wave_1_price)
        : null,
      backstage_wave_1_sold_out: form.backstage_wave_1_sold_out ?? false,

      backstage_wave_2_price: form.backstage_wave_2_price
        ? Number(form.backstage_wave_2_price)
        : null,
      backstage_wave_2_sold_out: form.backstage_wave_2_sold_out ?? false,

      backstage_wave_3_price: form.backstage_wave_3_price
        ? Number(form.backstage_wave_3_price)
        : null,
      backstage_wave_3_sold_out: form.backstage_wave_3_sold_out ?? false,

      // reference price
      price: form.standing_wave_1_price
        ? Number(form.standing_wave_1_price)
        : null,
    }

    if (
      !payload.standing_wave_1_price ||
      isNaN(payload.standing_wave_1_price)
    ) {
      alert('Standing Wave 1 price is required and must be a number.')
      setLoading(false)
      return
    }

    if (editing) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', editing)
      if (error) {
        alert('Update error: ' + error.message)
        setLoading(false)
        return
      }
      setMsg('✅ Event updated successfully!')
    } else {
      const { error } = await supabase.from('events').insert(payload)
      if (error) {
        alert('Insert error: ' + error.message)
        setLoading(false)
        return
      }
      setMsg('✅ Event created successfully!')
    }

    await load()
    setForm(empty)
    setEditing(null)
    setShowForm(false)
    setImagePreview(null)
    setLoading(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const handleEdit = (event: any) => {
    setForm({
      ...empty,
      ...event,
      date: event.date?.slice(0, 16),
      standing_wave_1_price: event.standing_wave_1_price ?? '',
      standing_wave_2_price: event.standing_wave_2_price ?? '',
      standing_wave_3_price: event.standing_wave_3_price ?? '',
      backstage_wave_1_price: event.backstage_wave_1_price ?? '',
      backstage_wave_2_price: event.backstage_wave_2_price ?? '',
      backstage_wave_3_price: event.backstage_wave_3_price ?? '',
      transfer_number: event.transfer_number ?? '',
    })
    setEditing(event.id)
    setShowForm(true)
    setImagePreview(event.image_url || null)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      alert('Delete error: ' + error.message)
      return
    }
    await load()
  }

  const handleFinish = async (id: string, current: boolean) => {
    if (!current && !confirm('Mark this event as finished?')) return
    const { error } = await supabase
      .from('events')
      .update({ is_finished: !current })
      .eq('id', id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
  }

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: !current })
      .eq('id', id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
  }

  // STANDING WAVES CONTROL
  const handleStandingWaveAction = async (event: any) => {
    // W1 مفتوحة
    if (!event.standing_wave_1_sold_out && event.standing_wave_1_price != null) {
      if (!confirm('Mark STANDING WAVE 1 as SOLD OUT and open WAVE 2?')) return
      const priceStr = prompt(
        'Enter STANDING WAVE 2 price (EGP):',
        event.standing_wave_2_price ? String(event.standing_wave_2_price) : ''
      )
      const price = priceStr ? Number(priceStr) : NaN
      if (!price || isNaN(price)) {
        alert('Invalid price. Action cancelled.')
        return
      }
      const { error } = await supabase
        .from('events')
        .update({
          standing_wave_1_sold_out: true,
          standing_wave_2_price: price,
          standing_wave_2_sold_out: false,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    // W2 مفتوحة
    if (
      event.standing_wave_1_sold_out &&
      !event.standing_wave_2_sold_out &&
      event.standing_wave_2_price != null
    ) {
      if (!confirm('Mark STANDING WAVE 2 as SOLD OUT and open WAVE 3?')) return
      const priceStr = prompt(
        'Enter STANDING WAVE 3 price (EGP):',
        event.standing_wave_3_price ? String(event.standing_wave_3_price) : ''
      )
      const price = priceStr ? Number(priceStr) : NaN
      if (!price || isNaN(price)) {
        alert('Invalid price. Action cancelled.')
        return
      }
      const { error } = await supabase
        .from('events')
        .update({
          standing_wave_2_sold_out: true,
          standing_wave_3_price: price,
          standing_wave_3_sold_out: false,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    // W3 مفتوحة
    if (
      event.standing_wave_1_sold_out &&
      event.standing_wave_2_sold_out &&
      !event.standing_wave_3_sold_out &&
      event.standing_wave_3_price != null
    ) {
      if (!confirm('Mark STANDING WAVE 3 as SOLD OUT (no more standing)?'))
        return
      const { error } = await supabase
        .from('events')
        .update({
          standing_wave_3_sold_out: true,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    alert('All STANDING waves are already SOLD OUT for this event, or missing base price.')
  }

  // BACKSTAGE WAVES CONTROL
  const handleBackstageWaveAction = async (event: any) => {
    // لو مفيش أي سعر Backstage متسجل
    if (
      event.backstage_wave_1_price == null &&
      event.backstage_wave_2_price == null &&
      event.backstage_wave_3_price == null
    ) {
      if (!confirm('Set BACKSTAGE WAVE 1 price and open it?')) return
      const priceStr = prompt('Enter BACKSTAGE WAVE 1 price (EGP):', '')
      const price = priceStr ? Number(priceStr) : NaN
      if (!price || isNaN(price)) {
        alert('Invalid price. Action cancelled.')
        return
      }
      const { error } = await supabase
        .from('events')
        .update({
          backstage_wave_1_price: price,
          backstage_wave_1_sold_out: false,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    // W1 مفتوحة
    if (
      !event.backstage_wave_1_sold_out &&
      event.backstage_wave_1_price != null
    ) {
      if (!confirm('Mark BACKSTAGE WAVE 1 as SOLD OUT and open WAVE 2?')) return
      const priceStr = prompt(
        'Enter BACKSTAGE WAVE 2 price (EGP):',
        event.backstage_wave_2_price ? String(event.backstage_wave_2_price) : ''
      )
      const price = priceStr ? Number(priceStr) : NaN
      if (!price || isNaN(price)) {
        alert('Invalid price. Action cancelled.')
        return
      }
      const { error } = await supabase
        .from('events')
        .update({
          backstage_wave_1_sold_out: true,
          backstage_wave_2_price: price,
          backstage_wave_2_sold_out: false,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    // W2 مفتوحة
    if (
      event.backstage_wave_1_sold_out &&
      !event.backstage_wave_2_sold_out &&
      event.backstage_wave_2_price != null
    ) {
      if (!confirm('Mark BACKSTAGE WAVE 2 as SOLD OUT and open WAVE 3?')) return
      const priceStr = prompt(
        'Enter BACKSTAGE WAVE 3 price (EGP):',
        event.backstage_wave_3_price ? String(event.backstage_wave_3_price) : ''
      )
      const price = priceStr ? Number(priceStr) : NaN
      if (!price || isNaN(price)) {
        alert('Invalid price. Action cancelled.')
        return
      }
      const { error } = await supabase
        .from('events')
        .update({
          backstage_wave_2_sold_out: true,
          backstage_wave_3_price: price,
          backstage_wave_3_sold_out: false,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    // W3 مفتوحة
    if (
      event.backstage_wave_1_sold_out &&
      event.backstage_wave_2_sold_out &&
      !event.backstage_wave_3_sold_out &&
      event.backstage_wave_3_price != null
    ) {
      if (!confirm('Mark BACKSTAGE WAVE 3 as SOLD OUT (no more backstage)?'))
        return
      const { error } = await supabase
        .from('events')
        .update({
          backstage_wave_3_sold_out: true,
        })
        .eq('id', event.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
      await load()
      return
    }

    alert('All BACKSTAGE waves are already SOLD OUT for this event.')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '16px',
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
              ● ADMIN
            </p>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 900,
                color: '#fff',
                margin: 0,
                letterSpacing: '-1px',
              }}
            >
              EVENTS
            </h1>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm)
              setForm(empty)
              setEditing(null)
              setImagePreview(null)
            }}
            style={{
              backgroundColor: showForm ? '#111' : '#dc2626',
              color: '#fff',
              border: showForm ? '1px solid #333' : 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              letterSpacing: '1px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {showForm ? 'CANCEL' : '+ NEW EVENT'}
          </button>
        </div>

        {/* Message */}
        {msg && (
          <div
            style={{
              backgroundColor: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: '10px',
              padding: '12px 20px',
              color: '#10b981',
              fontSize: '14px',
              marginBottom: '24px',
            }}
          >
            {msg}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #dc2626',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '32px',
            }}
          >
            <p
              style={{
                color: '#dc2626',
                fontSize: '11px',
                letterSpacing: '3px',
                fontWeight: 700,
                margin: '0 0 24px',
              }}
            >
              {editing ? '✏️ EDIT EVENT' : '➕ NEW EVENT'}
            </p>
            <form onSubmit={handleSubmit}>
              {/* Image Upload */}
              <div style={{ marginBottom: '20px' }}>
                <p
                  style={{
                    color: '#444',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    margin: '0 0 12px',
                  }}
                >
                  EVENT IMAGE
                </p>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${
                      imagePreview ? '#dc2626' : '#1a1a1a'
                    }`,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: '#111',
                    minHeight: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <img
                        src={imagePreview}
                        alt="preview"
                        style={{
                          width: '100%',
                          maxHeight: '260px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px' }}>
                      {uploading ? (
                        <p
                          style={{
                            color: '#f59e0b',
                            fontSize: '13px',
                            letterSpacing: '2px',
                            margin: 0,
                          }}
                        >
                          ⏳ UPLOADING...
                        </p>
                      ) : (
                        <>
                          <p
                            style={{
                              fontSize: '32px',
                              margin: '0 0 8px',
                            }}
                          >
                            🖼️
                          </p>
                          <p
                            style={{
                              color: '#444',
                              fontSize: '13px',
                              margin: '0 0 4px',
                            }}
                          >
                            Click to upload image
                          </p>
                          <p
                            style={{
                              color: '#333',
                              fontSize: '11px',
                              margin: 0,
                            }}
                          >
                            JPG, PNG, WEBP
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                {uploading && (
                  <p
                    style={{
                      color: '#f59e0b',
                      fontSize: '11px',
                      marginTop: '8px',
                      letterSpacing: '1px',
                    }}
                  >
                    ⏳ Please wait for image to finish uploading...
                  </p>
                )}
              </div>

              {/* Basic + Standing W1 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <input
                  style={inputStyle}
                  placeholder="Event title *"
                  required
                  value={form.title}
                  onChange={e =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
                <input
                  style={inputStyle}
                  placeholder="Location (text) *"
                  required
                  value={form.location}
                  onChange={e =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
                <input
                  style={inputStyle}
                  type="datetime-local"
                  required
                  value={form.date}
                  onChange={e =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Standing — Wave 1 Price (EGP) *"
                  required
                  value={form.standing_wave_1_price}
                  onChange={e =>
                    setForm({
                      ...form,
                      standing_wave_1_price: e.target.value,
                    })
                  }
                />
              </div>

              {/* Standing W2/W3 + Backstage W1 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Standing — Wave 2 (optional)"
                  value={form.standing_wave_2_price}
                  onChange={e =>
                    setForm({
                      ...form,
                      standing_wave_2_price: e.target.value,
                    })
                  }
                />
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Standing — Wave 3 (optional)"
                  value={form.standing_wave_3_price}
                  onChange={e =>
                    setForm({
                      ...form,
                      standing_wave_3_price: e.target.value,
                    })
                  }
                />
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Backstage — Wave 1 (optional)"
                  value={form.backstage_wave_1_price}
                  onChange={e =>
                    setForm({
                      ...form,
                      backstage_wave_1_price: e.target.value,
                    })
                  }
                />
              </div>

              {/* Backstage W2/W3 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Backstage — Wave 2 (optional)"
                  value={form.backstage_wave_2_price}
                  onChange={e =>
                    setForm({
                      ...form,
                      backstage_wave_2_price: e.target.value,
                    })
                  }
                />
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Backstage — Wave 3 (optional)"
                  value={form.backstage_wave_3_price}
                  onChange={e =>
                    setForm({
                      ...form,
                      backstage_wave_3_price: e.target.value,
                    })
                  }
                />
              </div>

              <input
                style={{ ...inputStyle, marginBottom: '16px' }}
                placeholder="📍 Google Maps link (optional)"
                value={form.location_url}
                onChange={e =>
                  setForm({ ...form, location_url: e.target.value })
                }
              />

              <input
                style={{ ...inputStyle, marginBottom: '16px' }}
                placeholder="💳 Transfer Number — رقم التحويل لهذا الإيفنت"
                value={form.transfer_number}
                onChange={e =>
                  setForm({
                    ...form,
                    transfer_number: e.target.value,
                  })
                }
              />

              <textarea
                style={{
                  ...inputStyle,
                  minHeight: '100px',
                  resize: 'vertical',
                  marginBottom: '16px',
                }}
                placeholder="Description *"
                required
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <input
                  type="checkbox"
                  id="active"
                  checked={form.is_active}
                  onChange={e =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <label
                  htmlFor="active"
                  style={{
                    color: '#555',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Visible to public
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || uploading}
                style={{
                  backgroundColor:
                    loading || uploading ? '#1a1a1a' : '#dc2626',
                  color: loading || uploading ? '#333' : '#fff',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor:
                    loading || uploading ? 'not-allowed' : 'pointer',
                  letterSpacing: '1px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading
                  ? 'SAVING...'
                  : uploading
                  ? 'WAIT — IMAGE UPLOADING...'
                  : editing
                  ? 'SAVE CHANGES →'
                  : 'CREATE EVENT →'}
              </button>
            </form>
          </div>
        )}

        {/* Events List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {events.map(event => {
            return (
              <div
                key={event.id}
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  opacity: event.is_finished ? 0.65 : 1,
                }}
              >
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      flexShrink: 0,
                      filter: event.is_finished
                        ? 'grayscale(80%)'
                        : 'none',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '12px',
                      background: '#111',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      flexShrink: 0,
                    }}
                  >
                    🎶
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h3
                      style={{
                        color: event.is_finished ? '#444' : '#fff',
                        fontSize: '16px',
                        fontWeight: 900,
                        margin: 0,
                      }}
                    >
                      {event.title}
                    </h3>
                    <span
                      style={{
                        backgroundColor: event.is_finished
                          ? 'rgba(100,100,100,0.15)'
                          : event.is_active
                          ? 'rgba(16,185,129,0.1)'
                          : 'rgba(100,100,100,0.1)',
                        border: `1px solid ${
                          event.is_finished
                            ? '#222'
                            : event.is_active
                            ? 'rgba(16,185,129,0.3)'
                            : '#222'
                        }`,
                        color: event.is_finished
                          ? '#444'
                          : event.is_active
                          ? '#10b981'
                          : '#444',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}
                    >
                      {event.is_finished
                        ? '🏁 FINISHED'
                        : event.is_active
                        ? 'LIVE'
                        : 'HIDDEN'}
                    </span>
                  </div>

                  <p
                    style={{
                      color: '#444',
                      fontSize: '13px',
                      margin: '0 0 4px',
                    }}
                  >
                    📅{' '}
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}{' '}
                    · 📍 {event.location}
                  </p>

                  {event.transfer_number && (
                    <p
                      style={{
                        color: '#f59e0b',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 4px',
                      }}
                    >
                      💳 Transfer: {event.transfer_number}
                    </p>
                  )}

                  {event.location_url && (
                    <a
                      href={event.location_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#3b82f6',
                        fontSize: '11px',
                        textDecoration: 'none',
                        letterSpacing: '1px',
                        fontWeight: 600,
                      }}
                    >
                      📍 View on Maps →
                    </a>
                  )}

                  {/* Prices display */}
                  <div style={{ marginTop: '6px' }}>
                    <p
                      style={{
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Standing W1:{' '}
                      {event.standing_wave_1_price ?? '-'} EGP
                    </p>
                    <p
                      style={{
                        color: '#f59e0b',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 0',
                      }}
                    >
                      Standing W2:{' '}
                      {event.standing_wave_2_price ?? 'Not set'}
                    </p>
                    <p
                      style={{
                        color: '#22c55e',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 0',
                      }}
                    >
                      Standing W3:{' '}
                      {event.standing_wave_3_price ?? 'Not set'}
                    </p>

                    <p
                      style={{
                        color: '#3b82f6',
                        fontSize: '12px',
                        fontWeight: 700,
                        margin: '6px 0 0',
                      }}
                    >
                      Backstage W1:{' '}
                      {event.backstage_wave_1_price ?? 'Not set'}
                    </p>
                    <p
                      style={{
                        color: '#60a5fa',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 0',
                      }}
                    >
                      Backstage W2:{' '}
                      {event.backstage_wave_2_price ?? 'Not set'}
                    </p>
                    <p
                      style={{
                        color: '#93c5fd',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 0',
                      }}
                    >
                      Backstage W3:{' '}
                      {event.backstage_wave_3_price ?? 'Not set'}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flexWrap: 'wrap',
                    minWidth: '220px',
                  }}
                >
                  {/* Wave buttons (Standing / Backstage) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    <button
                      onClick={() => handleStandingWaveAction(event)}
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        color: '#ef4444',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                      }}
                    >
                      STANDING — NEXT WAVE / SOLD OUT
                    </button>

                    <button
                      onClick={() => handleBackstageWaveAction(event)}
                      style={{
                        backgroundColor: 'rgba(147,51,234,0.12)',
                        border: '1px solid rgba(147,51,234,0.5)',
                        color: '#a855f7',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                      }}
                    >
                      BACKSTAGE — NEXT WAVE / SOLD OUT
                    </button>
                  </div>

                  {/* Base actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                    }}
                  >
                    <button
                      onClick={() =>
                        handleFinish(event.id, event.is_finished)
                      }
                      style={{
                        backgroundColor: event.is_finished
                          ? 'rgba(100,100,100,0.1)'
                          : 'rgba(16,185,129,0.1)',
                        border: `1px solid ${
                          event.is_finished
                            ? '#333'
                            : 'rgba(16,185,129,0.3)'
                        }`,
                        color: event.is_finished
                          ? '#555'
                          : '#10b981',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                      }}
                    >
                      {event.is_finished ? 'UNFINISH' : '🏁 FINISH'}
                    </button>

                    {!event.is_finished && (
                      <button
                        onClick={() =>
                          toggleActive(event.id, event.is_active)
                        }
                        style={{
                          backgroundColor: '#111',
                          border: '1px solid #222',
                          color: '#555',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          letterSpacing: '1px',
                        }}
                      >
                        {event.is_active ? 'HIDE' : 'SHOW'}
                      </button>
                    )}

                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/events/${event.id}/summary`,
                        )
                      }
                      style={{
                        backgroundColor: 'rgba(234,179,8,0.1)',
                        border:
                          '1px solid rgba(234,179,8,0.4)',
                        color: '#eab308',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                      }}
                    >
                      SUMMARY
                    </button>

                    <button
                      onClick={() => handleEdit(event)}
                      style={{
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        border:
                          '1px solid rgba(59,130,246,0.3)',
                        color: '#3b82f6',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                      }}
                    >
                      EDIT
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        border:
                          '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '1px',
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {events.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '80px',
                color: '#333',
                border: '1px dashed #1a1a1a',
                borderRadius: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '12px',
                  letterSpacing: '3px',
                }}
              >
                NO EVENTS YET — CREATE YOUR FIRST EVENT
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
