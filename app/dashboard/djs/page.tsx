'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type DJ = {
  id: string
  name: string
  bio?: string
  image_url?: string
  whatsapp_number?: string
  instagram_url?: string
  spotify_url?: string
  soundcloud_url?: string
  created_at?: string
}

type Mode = 'list' | 'add' | 'edit'

export default function ManageDJsPage() {
  const router = useRouter()
  const [djs, setDjs] = useState<DJ[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('list')
  const [selected, setSelected] = useState<DJ | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', bio: '', image_url: '', whatsapp_number: '',
    instagram_url: '', spotify_url: '', soundcloud_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') !== 'true') {
      router.push('/dashboard/login')
      return
    }
    fetchDJs()
  }, [])

  const fetchDJs = async () => {
    setLoading(true)
    const { data } = await supabase.from('djs').select('*').order('created_at', { ascending: false })
    setDjs((data as DJ[]) || [])
    setLoading(false)
  }

  const openAdd = () => {
    setForm({ name: '', bio: '', image_url: '', whatsapp_number: '', instagram_url: '', spotify_url: '', soundcloud_url: '' })
    setImageFile(null)
    setImagePreview('')
    setSelected(null)
    setMode('add')
  }

  const openEdit = (dj: DJ) => {
    setForm({
      name: dj.name,
      bio: dj.bio || '',
      image_url: dj.image_url || '',
      whatsapp_number: dj.whatsapp_number || '',
      instagram_url: dj.instagram_url || '',
      spotify_url: dj.spotify_url || '',
      soundcloud_url: dj.soundcloud_url || '',
    })
    setImageFile(null)
    setImagePreview(dj.image_url || '')
    setSelected(dj)
    setMode('edit')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null
    const ext = imageFile.name.split('.').pop()
    const path = `djs/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, imageFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const imageUrl = await uploadImage()

    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      image_url: imageUrl,
      whatsapp_number: form.whatsapp_number.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      spotify_url: form.spotify_url.trim() || null,
      soundcloud_url: form.soundcloud_url.trim() || null,
    }

    if (mode === 'add') {
      await supabase.from('djs').insert(payload)
    } else if (mode === 'edit' && selected) {
      await supabase.from('djs').update(payload).eq('id', selected.id)
    }

    setSaving(false)
    setSuccessMsg(mode === 'add' ? 'DJ ADDED SUCCESSFULLY!' : 'DJ UPDATED SUCCESSFULLY!')
    setTimeout(() => setSuccessMsg(''), 3000)
    setMode('list')
    fetchDJs()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this DJ?')) return
    setDeleting(id)
    await supabase.from('djs').delete().eq('id', id)
    setDeleting(null)
    fetchDJs()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    color: '#555',
    fontSize: '10px',
    letterSpacing: '2px',
    fontWeight: 700,
    marginBottom: '8px',
    display: 'block',
  }

  // ─── FORM VIEW ───────────────────────────────────────────
  if (mode === 'add' || mode === 'edit') {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          <button
            onClick={() => setMode('list')}
            style={{ background: 'none', border: 'none', color: '#444', fontSize: '12px', letterSpacing: '2px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '32px', padding: 0 }}
          >
            ← BACK
          </button>

          <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>
            ● {mode === 'add' ? 'NEW DJ' : 'EDIT DJ'}
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: '0 0 40px' }}>
            {mode === 'add' ? 'ADD DJ' : `EDIT — ${selected?.name}`}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Image Upload */}
            <div>
              <label style={labelStyle}>DJ PHOTO</label>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px', border: '1px solid #1a1a1a' }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ ...inputStyle, padding: '10px' }}
              />
            </div>

            {/* Name */}
            <div>
              <label style={labelStyle}>DJ NAME *</label>
              <input
                type="text"
                placeholder="e.g. DJ Khaled"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>BIO</label>
              <textarea
                placeholder="Short bio about the DJ..."
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label style={labelStyle}>WHATSAPP NUMBER</label>
              <input
                type="text"
                placeholder="e.g. 201012345678"
                value={form.whatsapp_number}
                onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
                onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
              />
              <p style={{ color: '#333', fontSize: '11px', marginTop: '6px' }}>بدون + أو مسافات — مثال: 201093379437</p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '8px' }}>
              <p style={{ color: '#333', fontSize: '10px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 20px' }}>
                ● SOCIAL & MUSIC LINKS — OPTIONAL
              </p>

              {/* Instagram */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>📸 INSTAGRAM URL</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/djname"
                  value={form.instagram_url}
                  onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
                />
              </div>

              {/* Spotify */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>🎵 SPOTIFY PLAYLIST URL</label>
                <input
                  type="text"
                  placeholder="https://open.spotify.com/playlist/..."
                  value={form.spotify_url}
                  onChange={e => setForm(f => ({ ...f, spotify_url: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1db954')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
                />
              </div>

              {/* SoundCloud */}
              <div>
                <label style={labelStyle}>☁️ SOUNDCLOUD PLAYLIST URL</label>
                <input
                  type="text"
                  placeholder="https://soundcloud.com/djname/sets/..."
                  value={form.soundcloud_url}
                  onChange={e => setForm(f => ({ ...f, soundcloud_url: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#ff5500')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#1a1a1a')}
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{
                background: saving || !form.name.trim() ? '#1a1a1a' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: saving || !form.name.trim() ? '#444' : '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '2px',
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'SAVING...' : mode === 'add' ? 'ADD DJ' : 'SAVE CHANGES'}
            </button>

          </div>
        </div>
      </main>
    )
  }

  // ─── LIST VIEW ───────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Link href="/dashboard" style={{ color: '#444', fontSize: '11px', letterSpacing: '2px', fontWeight: 700, textDecoration: 'none', display: 'block', marginBottom: '16px' }}>
              ← DASHBOARD
            </Link>
            <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>● ADMIN</p>
            <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>
              MANAGE DJs <span style={{ color: '#333', fontSize: '20px' }}>({djs.length})</span>
            </h1>
          </div>
          <button
            onClick={openAdd}
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '12px 24px', fontSize: '13px', fontWeight: 700,
              letterSpacing: '2px', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 0 24px rgba(220,38,38,0.2)',
            }}
          >
            + ADD NEW DJ
          </button>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px 20px', marginBottom: '24px', color: '#10b981', fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>
            ✓ {successMsg}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#333' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎧</div>
            <p style={{ letterSpacing: '2px', fontSize: '12px' }}>LOADING...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && djs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#333', border: '1px dashed #1a1a1a', borderRadius: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎧</div>
            <p style={{ letterSpacing: '2px', fontSize: '13px', marginBottom: '24px' }}>NO DJs YET</p>
            <button
              onClick={openAdd}
              style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              + ADD FIRST DJ
            </button>
          </div>
        )}

        {/* DJs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {djs.map(dj => (
            <div
              key={dj.id}
              style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}
            >
              {/* Avatar */}
              {dj.image_url ? (
                <img src={dj.image_url} alt={dj.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#1a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🎧</div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: '180px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{dj.name}</h3>
                {dj.bio && (
                  <p style={{ color: '#444', fontSize: '12px', margin: '0 0 6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '400px' }}>
                    {dj.bio}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {dj.whatsapp_number && <span style={{ color: '#10b981', fontSize: '11px' }}>💬 WhatsApp</span>}
                  {dj.instagram_url && <span style={{ color: '#dc2626', fontSize: '11px' }}>📸 Instagram</span>}
                  {dj.spotify_url && <span style={{ color: '#1db954', fontSize: '11px' }}>🎵 Spotify</span>}
                  {dj.soundcloud_url && <span style={{ color: '#ff5500', fontSize: '11px' }}>☁️ SoundCloud</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Link
                  href={`/djs/${dj.id}`}
                  target="_blank"
                  style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', color: '#888', padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textDecoration: 'none' }}
                >
                  👁 VIEW
                </Link>
                <button
                  onClick={() => openEdit(dj)}
                  style={{ backgroundColor: '#111', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  ✏️ EDIT
                </button>
                <button
                  onClick={() => handleDelete(dj.id)}
                  disabled={deleting === dj.id}
                  style={{ backgroundColor: '#111', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', padding: '8px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', cursor: deleting === dj.id ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  {deleting === dj.id ? '...' : '🗑 DELETE'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
