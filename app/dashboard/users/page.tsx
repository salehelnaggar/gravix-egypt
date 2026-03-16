'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const roles = ['superadmin', 'admin', 'door']

const roleColors: Record<string, string> = {
  superadmin: '#dc2626',
  admin:      '#8b5cf6',
  door:       '#10b981',
}

const roleDesc: Record<string, string> = {
  superadmin: 'Full access — all pages + users + revenue',
  admin:      'Reservations + verify entry',
  door:       'Verify entry only',
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' })
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('admin_auth') !== 'true') { router.push('/dashboard/login'); return }
      if (localStorage.getItem('admin_role') !== 'superadmin') { router.push('/dashboard'); return }
      setCurrentUser(localStorage.getItem('admin_username') || '')
    }
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('id, username, role, created_at')
      .order('created_at')
    setUsers(data || [])
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('admin_users').insert({
      username: form.username.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    })

    if (insertError) {
      setError(insertError.message.includes('unique') ? 'Username already exists.' : insertError.message)
      setLoading(false)
      return
    }

    setForm({ username: '', password: '', role: 'admin' })
    setShowForm(false)
    await load()
    setLoading(false)
  }

  const handleDelete = async (id: string, uname: string) => {
    if (uname === currentUser) { alert("You can't delete your own account."); return }
    if (!confirm(`Delete user "${uname}"?`)) return
    await supabase.from('admin_users').delete().eq('id', id)
    await load()
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    await supabase.from('admin_users').update({ role: newRole }).eq('id', id)
    await load()
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: '1px solid #1a1a1a', color: '#555', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif', marginBottom: '32px' }}>
          ← BACK
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: '0 0 8px' }}>● SUPERADMIN</p>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-1px' }}>MANAGE USERS</h1>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError('') }}
            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            {showForm ? '✕ CANCEL' : '+ ADD USER'}
          </button>
        </div>

        {/* Role legend — 3 بس */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {roles.map(r => (
            <div key={r} style={{ backgroundColor: '#0d0d0d', border: `1px solid ${roleColors[r]}25`, borderRadius: '10px', padding: '12px 14px' }}>
              <span style={{ backgroundColor: `${roleColors[r]}18`, border: `1px solid ${roleColors[r]}40`, color: roleColors[r], fontSize: '9px', fontWeight: 700, letterSpacing: '2px', padding: '2px 8px', borderRadius: '999px', display: 'inline-block', marginBottom: '6px' }}>
                {r.toUpperCase()}
              </span>
              <p style={{ color: '#444', fontSize: '10px', margin: 0, lineHeight: 1.5 }}>{roleDesc[r]}</p>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd}
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#555', fontSize: '10px', letterSpacing: '3px', fontWeight: 700, margin: 0 }}>NEW USER</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 6px' }}>USERNAME</p>
                <input
                  type="text" required value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. ahmed"
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 6px' }}>PASSWORD</p>
                <input
                  type="text" required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Set a password"
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 6px' }}>ROLE</p>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 14px', color: '#fff', fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>⚠ {error}</p>
            )}

            <button type="submit" disabled={loading}
              style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '11px', fontWeight: 700, letterSpacing: '2px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'Inter, sans-serif', alignSelf: 'flex-start' }}>
              {loading ? 'SAVING...' : 'CREATE USER'}
            </button>
          </form>
        )}

        {/* Users list */}
        <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid #1a1a1a', gap: '12px' }}>
            {['USERNAME', 'ROLE', 'CREATED', ''].map(h => (
              <span key={h} style={{ color: '#333', fontSize: '10px', letterSpacing: '2px', fontWeight: 700 }}>{h}</span>
            ))}
          </div>

          {users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#333' }}>
              <p style={{ fontSize: '12px', letterSpacing: '3px' }}>NO USERS FOUND</p>
            </div>
          )}

          {users.map((u, i) => (
            <div key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', padding: '16px 20px', borderBottom: i < users.length - 1 ? '1px solid #111' : 'none', alignItems: 'center', gap: '12px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{u.username}</span>
                {u.username === currentUser && (
                  <span style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', padding: '2px 6px', borderRadius: '999px' }}>YOU</span>
                )}
              </div>

              <select
                value={u.role}
                onChange={e => handleRoleChange(u.id, e.target.value)}
                disabled={u.username === currentUser}
                style={{ backgroundColor: `${roleColors[u.role] || '#555'}12`, border: `1px solid ${roleColors[u.role] || '#555'}35`, color: roleColors[u.role] || '#555', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 700, fontFamily: 'Inter, sans-serif', outline: 'none', cursor: u.username === currentUser ? 'not-allowed' : 'pointer' }}>
                {roles.map(r => (
                  <option key={r} value={r} style={{ backgroundColor: '#111', color: '#fff' }}>{r}</option>
                ))}
              </select>

              <span style={{ color: '#444', fontSize: '12px' }}>
                {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>

              <button
                onClick={() => handleDelete(u.id, u.username)}
                disabled={u.username === currentUser}
                style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '8px', padding: '7px 14px', fontSize: '11px', fontWeight: 700, cursor: u.username === currentUser ? 'not-allowed' : 'pointer', opacity: u.username === currentUser ? 0.3 : 1, fontFamily: 'Inter, sans-serif', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                DELETE
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
