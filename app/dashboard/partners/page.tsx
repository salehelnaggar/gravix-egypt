'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { CSSProperties } from 'react'

type Partner = {
  id: string
  name: string
  logo_url: string | null
  website: string | null
  instagram_url: string | null
  is_exclusive: boolean
  priority: number | null
}

const inputStyle: CSSProperties = {
  width: '100%',
  backgroundColor: '#111',
  border: '1px solid #1a1a1a',
  borderRadius: '10px',
  padding: '12px 14px',
  color: '#fff',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  color: '#444',
  fontSize: '10px',
  letterSpacing: '2px',
  fontWeight: 700,
  margin: '0 0 6px',
  display: 'block',
}

export default function ManagePartnersPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Create form
  const [form, setForm] = useState({
    name: '',
    website: '',
    instagram: '',
    isExclusive: true,
    priority: 1,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Edit modal
  const [editPartner, setEditPartner] = useState<Partner | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    instagram: '',
    isExclusive: true,
    priority: 1,
  })
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('admin_auth') !== 'true') {
        router.push('/dashboard/login')
        return
      }
      const role = localStorage.getItem('admin_role') || 'door'
      if (role !== 'superadmin') {
        router.push('/dashboard')
        return
      }
    }
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('priority', { ascending: true })

    if (error) {
      console.error(error)
      setError('Failed to load partners.')
    } else {
      setPartners(data || [])
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Partner name is required.')
      return
    }
    if (!logoFile) {
      setError('Please upload a logo.')
      return
    }

    setSaving(true)
    try {
      const fileExt = logoFile.name.split('.').pop()
      const filePath = `${Date.now()}-${form.name.replace(/\s+/g, '-').toLowerCase()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(filePath, logoFile)

      if (uploadError) {
        setError('Failed to upload logo.')
        setSaving(false)
        return
      }

      const { data: publicData } = supabase.storage
        .from('partner-logos')
        .getPublicUrl(filePath)

      const logoUrl = publicData?.publicUrl || ''

      const { error: insertError } = await supabase
        .from('partners')
        .insert({
          name: form.name.trim(),
          website: form.website.trim() || null,
          instagram_url: form.instagram.trim() || null,
          is_exclusive: form.isExclusive,
          priority: form.priority || 1,
          logo_url: logoUrl,
        })

      if (insertError) {
        setError(insertError.message || 'Failed to create partner.')
        setSaving(false)
        return
      }

      setForm({ name: '', website: '', instagram: '', isExclusive: true, priority: 1 })
      setLogoFile(null)
      await loadPartners()
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (p: Partner) => {
    setEditPartner(p)
    setEditForm({
      name: p.name,
      website: p.website || '',
      instagram: p.instagram_url || '',
      isExclusive: p.is_exclusive,
      priority: p.priority ?? 1,
    })
    setEditLogoFile(null)
    setError('')
  }

  const closeEdit = () => {
    setEditPartner(null)
    setEditLogoFile(null)
    setError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPartner) return
    setError('')

    if (!editForm.name.trim()) {
      setError('Partner name is required.')
      return
    }

    setEditSaving(true)
    try {
      let logoUrl = editPartner.logo_url

      // لو رفع لوجو جديد
      if (editLogoFile) {
        const fileExt = editLogoFile.name.split('.').pop()
        const filePath = `${Date.now()}-${editForm.name.replace(/\s+/g, '-').toLowerCase()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('partner-logos')
          .upload(filePath, editLogoFile)

        if (uploadError) {
          setError('Failed to upload new logo.')
          setEditSaving(false)
          return
        }

        const { data: publicData } = supabase.storage
          .from('partner-logos')
          .getPublicUrl(filePath)

        logoUrl = publicData?.publicUrl || logoUrl
      }

      const { error: updateError } = await supabase
        .from('partners')
        .update({
          name: editForm.name.trim(),
          website: editForm.website.trim() || null,
          instagram_url: editForm.instagram.trim() || null,
          is_exclusive: editForm.isExclusive,
          priority: editForm.priority || 1,
          logo_url: logoUrl,
        })
        .eq('id', editPartner.id)

      if (updateError) {
        setError(updateError.message || 'Failed to update partner.')
        setEditSaving(false)
        return
      }

      closeEdit()
      await loadPartners()
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return
    const { error } = await supabase.from('partners').delete().eq('id', id)
    if (error) {
      setError('Failed to delete partner.')
      return
    }
    setPartners(prev => prev.filter(p => p.id !== id))
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
      {/* EDIT MODAL */}
      {editPartner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={e => {
            if (e.target === e.currentTarget) closeEdit()
          }}
        >
          <div
            style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1a1a1a',
              borderRadius: '20px',
              padding: '28px 24px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div>
                <p
                  style={{
                    color: '#dc2626',
                    fontSize: '10px',
                    letterSpacing: '3px',
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  ● EDIT PARTNER
                </p>
                <h2
                  style={{
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 900,
                    margin: '4px 0 0',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {editPartner.name}
                </h2>
              </div>
              <button
                onClick={closeEdit}
                style={{
                  background: 'none',
                  border: '1px solid #1a1a1a',
                  color: '#666',
                  fontSize: '18px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ef4444',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleEdit}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Name */}
              <div>
                <p style={labelStyle}>PARTNER NAME</p>
                <input
                  style={inputStyle}
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>

              {/* Website */}
              <div>
                <p style={labelStyle}>WEBSITE (OPTIONAL)</p>
                <input
                  style={inputStyle}
                  type="url"
                  placeholder="https://partner.com"
                  value={editForm.website}
                  onChange={e =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                />
              </div>

              {/* Instagram */}
              <div>
                <p style={labelStyle}>INSTAGRAM (OPTIONAL)</p>
                <input
                  style={inputStyle}
                  type="url"
                  placeholder="https://instagram.com/partner"
                  value={editForm.instagram}
                  onChange={e =>
                    setEditForm({ ...editForm, instagram: e.target.value })
                  }
                />
              </div>

              {/* Priority */}
              <div>
                <p style={labelStyle}>PRIORITY</p>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  value={editForm.priority}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      priority: Number(e.target.value) || 1,
                    })
                  }
                />
              </div>

              {/* New Logo (optional) */}
              <div>
                <p style={labelStyle}>NEW LOGO (OPTIONAL — اتركه فاضي لو مش عايز تغييره)</p>
                {/* Preview current logo */}
                {editPartner.logo_url && (
                  <div
                    style={{
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '999px',
                        backgroundColor: '#020617',
                        border: '1px solid #1a1a1a',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={editPartner.logo_url}
                        alt=""
                        style={{
                          maxWidth: '36px',
                          maxHeight: '36px',
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                    <span
                      style={{ color: '#555', fontSize: '11px' }}
                    >
                      Current logo
                    </span>
                  </div>
                )}
                <input
                  style={{
                    ...inputStyle,
                    padding: '8px',
                    fontSize: '12px',
                    backgroundColor: '#050505',
                  }}
                  type="file"
                  accept="image/*"
                  onChange={e =>
                    setEditLogoFile(e.target.files?.[0] || null)
                  }
                />
              </div>

              {/* Exclusive checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="edit-exclusive"
                  type="checkbox"
                  checked={editForm.isExclusive}
                  onChange={e =>
                    setEditForm({
                      ...editForm,
                      isExclusive: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="edit-exclusive"
                  style={{ color: '#aaa', fontSize: '12px' }}
                >
                  Exclusive partner with GRAVIX
                </label>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end',
                  marginTop: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={closeEdit}
                  style={{
                    background: 'none',
                    border: '1px solid #1a1a1a',
                    color: '#666',
                    padding: '11px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  style={{
                    backgroundColor: editSaving ? '#1a1a1a' : '#dc2626',
                    color: editSaving ? '#666' : '#fff',
                    border: 'none',
                    padding: '11px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '2px',
                    cursor: editSaving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {editSaving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '32px',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p
              style={{
                color: '#dc2626',
                fontSize: '11px',
                letterSpacing: '4px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              ● ADMIN / MANAGE PARTNERS
            </p>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.5px',
                margin: '8px 0 0',
              }}
            >
              EXCLUSIVE PARTNERS
            </h1>
            <p style={{ color: '#333', fontSize: '12px', margin: '6px 0 0' }}>
              Add and manage brands that are exclusively partnering with GRAVIX.
            </p>
          </div>
        </div>

        {/* Error (outside modal) */}
        {error && !editPartner && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#ef4444',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {/* Create form */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '20px',
            padding: '28px 24px',
            marginBottom: '32px',
          }}
        >
          <p
            style={{
              color: '#555',
              fontSize: '11px',
              letterSpacing: '3px',
              fontWeight: 700,
              margin: '0 0 18px',
            }}
          >
            NEW EXCLUSIVE PARTNER
          </p>

          <form
            onSubmit={handleCreate}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1.5fr 1fr',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <p style={labelStyle}>PARTNER NAME</p>
              <input
                style={inputStyle}
                type="text"
                placeholder="Partner brand name"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <p style={labelStyle}>WEBSITE (OPTIONAL)</p>
              <input
                style={inputStyle}
                type="url"
                placeholder="https://partner.com"
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div>
              <p style={labelStyle}>PRIORITY</p>
              <input
                style={inputStyle}
                type="number"
                min={1}
                value={form.priority}
                onChange={e =>
                  setForm({ ...form, priority: Number(e.target.value) || 1 })
                }
              />
            </div>

            <div>
              <p style={labelStyle}>INSTAGRAM (OPTIONAL)</p>
              <input
                style={inputStyle}
                type="url"
                placeholder="https://instagram.com/partner"
                value={form.instagram}
                onChange={e =>
                  setForm({ ...form, instagram: e.target.value })
                }
              />
            </div>

            <div>
              <p style={labelStyle}>LOGO (PNG with transparent background)</p>
              <input
                style={{
                  ...inputStyle,
                  padding: '8px',
                  fontSize: '12px',
                  backgroundColor: '#050505',
                }}
                type="file"
                accept="image/*"
                onChange={e => setLogoFile(e.target.files?.[0] || null)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="exclusive"
                  type="checkbox"
                  checked={form.isExclusive}
                  onChange={e =>
                    setForm({ ...form, isExclusive: e.target.checked })
                  }
                />
                <label htmlFor="exclusive" style={{ color: '#aaa', fontSize: '12px' }}>
                  Exclusive partner with GRAVIX
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? '#1a1a1a' : '#dc2626',
                    color: saving ? '#666' : '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '12px',
                    letterSpacing: '2px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {saving ? 'SAVING...' : 'ADD PARTNER'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Partners list */}
        <div
          style={{
            backgroundColor: '#050505',
            borderRadius: '16px',
            border: '1px solid #111',
            padding: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 8px 16px',
            }}
          >
            <p
              style={{
                color: '#555',
                fontSize: '11px',
                letterSpacing: '3px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              CURRENT PARTNERS
            </p>
            {loading && (
              <span style={{ color: '#444', fontSize: '11px' }}>Loading...</span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '12px',
              padding: '8px',
            }}
          >
            {partners.map(p => (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #1a1a1a',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        height: '40px',
                        width: '40px',
                        borderRadius: '999px',
                        backgroundColor: '#050505',
                        border: '1px solid #1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {p.logo_url ? (
                        <img
                          src={p.logo_url}
                          alt={p.name}
                          style={{
                            maxHeight: '32px',
                            maxWidth: '32px',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '18px' }}>🏷️</span>
                      )}
                    </div>

                    <div>
                      <p
                        style={{
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {p.name}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 5,
                          marginTop: 5,
                        }}
                      >
                        {p.website && (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: 999,
                              border: '1px solid rgba(148,163,184,0.35)',
                              color: '#e5e7eb',
                              textDecoration: 'none',
                              letterSpacing: '1px',
                            }}
                          >
                            WEBSITE
                          </a>
                        )}
                        {p.instagram_url && (
                          <a
                            href={p.instagram_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: 999,
                              border: '1px solid rgba(220,38,38,0.45)',
                              backgroundColor: 'rgba(220,38,38,0.08)',
                              color: '#fecaca',
                              textDecoration: 'none',
                              letterSpacing: '1px',
                            }}
                          >
                            INSTAGRAM
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={() => openEdit(p)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(220,38,38,0.35)',
                        color: '#dc2626',
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 700,
                        letterSpacing: '1px',
                      }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: 'none',
                        border: '1px solid #1f2933',
                        color: '#555',
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: p.is_exclusive ? '#dc2626' : '#666',
                      backgroundColor: p.is_exclusive
                        ? 'rgba(220,38,38,0.15)'
                        : 'rgba(148,163,184,0.1)',
                      border: p.is_exclusive
                        ? '1px solid rgba(220,38,38,0.4)'
                        : '1px solid rgba(148,163,184,0.2)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.is_exclusive ? 'EXCLUSIVE PARTNER' : 'PARTNER'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#555' }}>
                    Priority {p.priority ?? 1}
                  </span>
                </div>
              </div>
            ))}

            {!loading && partners.length === 0 && (
              <p
                style={{
                  color: '#444',
                  fontSize: '12px',
                  padding: '8px 12px 16px',
                }}
              >
                No partners yet. Add your first exclusive partner above.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
