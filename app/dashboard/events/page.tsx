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
  // Wave 1 هو الأساسي
  wave_1_price: '',
  image_url: '',
  is_active: true,
  wave_2_price: '',
  wave_3_price: '',
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

  // لإدخال سعر Wave 2 + Wave 3
  const [wave2Inputs, setWave2Inputs] = useState<Record<string, string>>({})
  const [wave3Inputs, setWave3Inputs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
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

      // wave fields
      wave_1_price: Number(form.wave_1_price),
      wave_1_sold_out: form.wave_1_sold_out ?? false,

      wave_2_price: form.wave_2_price ? Number(form.wave_2_price) : null,
      wave_2_sold_out: form.wave_2_sold_out ?? false,

      wave_3_price: form.wave_3_price ? Number(form.wave_3_price) : null,
      wave_3_sold_out: form.wave_3_sold_out ?? false,

      // عشان constraint بتاع price (يكون = Wave 1)
      price: Number(form.wave_1_price),
    }

    if (!payload.wave_1_price || isNaN(payload.wave_1_price)) {
      alert('Wave 1 price is required and must be a number.')
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
      ...event,
      date: event.date?.slice(0, 16),
      wave_1_price: event.wave_1_price ?? '',
      wave_2_price: event.wave_2_price ?? '',
      wave_3_price: event.wave_3_price ?? '',
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

  // Mark Wave 1 sold out
  const markWave1SoldOut = async (event: any) => {
    if (!confirm('Mark WAVE 1 as SOLD OUT for this event?')) return
    const { error } = await supabase
      .from('events')
      .update({ wave_1_sold_out: true })
      .eq('id', event.id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
  }

  // Save Wave 2 price & open Wave 2
  const saveWave2Price = async (event: any) => {
    const value = wave2Inputs[event.id]
    const price = Number(value)
    if (!price || isNaN(price)) {
      alert('Enter a valid Wave 2 price.')
      return
    }

    const { error } = await supabase
      .from('events')
      .update({
        wave_2_price: price,
        wave_2_sold_out: false,
      })
      .eq('id', event.id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
    setWave2Inputs(prev => {
      const copy = { ...prev }
      delete copy[event.id]
      return copy
    })
  }

  // Mark Wave 2 sold out
  const markWave2SoldOut = async (event: any) => {
    if (!confirm('Mark WAVE 2 as SOLD OUT for this event?')) return
    const { error } = await supabase
      .from('events')
      .update({ wave_2_sold_out: true })
      .eq('id', event.id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
  }

  // Save Wave 3 price & open Wave 3
  const saveWave3Price = async (event: any) => {
    const value = wave3Inputs[event.id]
    const price = Number(value)
    if (!price || isNaN(price)) {
      alert('Enter a valid Wave 3 price.')
      return
    }

    const { error } = await supabase
      .from('events')
      .update({
        wave_3_price: price,
        wave_3_sold_out: false,
      })
      .eq('id', event.id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
    setWave3Inputs(prev => {
      const copy = { ...prev }
      delete copy[event.id]
      return copy
    })
  }

  // Mark Wave 3 sold out
  const markWave3SoldOut = async (event: any) => {
    if (!confirm('Mark WAVE 3 as SOLD OUT for this event?')) return
    const { error } = await supabase
      .from('events')
      .update({ wave_3_sold_out: true })
      .eq('id', event.id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    await load()
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
                          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>
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

              {/* Fields */}
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
                  placeholder="Wave 1 Price (EGP) *"
                  required
                  value={form.wave_1_price}
                  onChange={e =>
                    setForm({ ...form, wave_1_price: e.target.value })
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
            const wave1Price = event.wave_1_price
            const wave2Price = event.wave_2_price
            const wave3Price = event.wave_3_price
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
                    })}{' '}
                    · 📍 {event.location}
                  </p>

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

                  <div style={{ marginTop: '6px' }}>
                    <p
                      style={{
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Wave 1: {wave1Price ?? '-'} EGP
                    </p>
                    <p
                      style={{
                        color: wave2Price ? '#f59e0b' : '#444',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 0',
                      }}
                    >
                      Wave 2:{' '}
                      {wave2Price != null ? `${wave2Price} EGP` : 'Not set'}
                    </p>
                    <p
                      style={{
                        color: wave3Price ? '#22c55e' : '#444',
                        fontSize: '12px',
                        fontWeight: 600,
                        margin: '2px 0 0',
                      }}
                    >
                      Wave 3:{' '}
                      {wave3Price != null ? `${wave3Price} EGP` : 'Not set'}
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
                  {/* Wave buttons */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginBottom: '4px',
                    }}
                  >
                    {!event.wave_1_sold_out && !event.is_finished && (
                      <button
                        onClick={() => markWave1SoldOut(event)}
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.4)',
                          color: '#ef4444',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          letterSpacing: '1px',
                        }}
                      >
                        MARK WAVE 1 SOLD OUT
                      </button>
                    )}

                    {event.wave_1_sold_out &&
                      !event.wave_2_price &&
                      !event.is_finished && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="number"
                            placeholder="Wave 2 price"
                            value={wave2Inputs[event.id] ?? ''}
                            onChange={e =>
                              setWave2Inputs(prev => ({
                                ...prev,
                                [event.id]: e.target.value,
                              }))
                            }
                            style={{
                              ...inputStyle,
                              padding: '8px 10px',
                              fontSize: '12px',
                              width: '110px',
                            }}
                          />
                          <button
                            onClick={() => saveWave2Price(event)}
                            style={{
                              backgroundColor: 'rgba(234,179,8,0.15)',
                              border: '1px solid rgba(234,179,8,0.5)',
                              color: '#eab308',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '1px',
                            }}
                          >
                            SAVE WAVE 2
                          </button>
                        </div>
                      )}

                    {event.wave_2_price &&
                      !event.wave_2_sold_out &&
                      !event.is_finished && (
                        <button
                          onClick={() => markWave2SoldOut(event)}
                          style={{
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            color: '#ef4444',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '1px',
                          }}
                        >
                          MARK WAVE 2 SOLD OUT
                        </button>
                      )}

                    {event.wave_2_sold_out &&
                      !event.wave_3_price &&
                      !event.is_finished && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="number"
                            placeholder="Wave 3 price"
                            value={wave3Inputs[event.id] ?? ''}
                            onChange={e =>
                              setWave3Inputs(prev => ({
                                ...prev,
                                [event.id]: e.target.value,
                              }))
                            }
                            style={{
                              ...inputStyle,
                              padding: '8px 10px',
                              fontSize: '12px',
                              width: '110px',
                            }}
                          />
                          <button
                            onClick={() => saveWave3Price(event)}
                            style={{
                              backgroundColor: 'rgba(34,197,94,0.15)',
                              border: '1px solid rgba(34,197,94,0.5)',
                              color: '#22c55e',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '1px',
                            }}
                          >
                            SAVE WAVE 3
                          </button>
                        </div>
                      )}

                    {event.wave_3_price &&
                      !event.wave_3_sold_out &&
                      !event.is_finished && (
                        <button
                          onClick={() => markWave3SoldOut(event)}
                          style={{
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.4)',
                            color: '#ef4444',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            letterSpacing: '1px',
                          }}
                        >
                          MARK WAVE 3 SOLD OUT
                        </button>
                      )}
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
                        color: event.is_finished ? '#555' : '#10b981',
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
                      onClick={() => handleEdit(event)}
                      style={{
                        backgroundColor: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.3)',
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
                        border: '1px solid rgba(239,68,68,0.3)',
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
