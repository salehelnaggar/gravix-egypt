'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const roleAccess: Record<string, string[]> = {
  superadmin: ['events', 'reservations', 'verify', 'djs', 'users'],
  admin:      ['reservations', 'verify'],
  door:       ['verify'],
}

export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [username, setUsername] = useState('')
  const [stats, setStats] = useState({
    total: 0, pending: 0, confirmed: 0, rejected: 0,
    awaiting: 0, review: 0, tickets: 0, revenue: 0, tax: 0, totalDjs: 0,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('admin_auth') !== 'true') {
        router.push('/dashboard/login')
        return
      }
      setRole(localStorage.getItem('admin_role') || 'door')
      setUsername(localStorage.getItem('admin_username') || 'Admin')
    }
    loadStats()
  }, [])

  const loadStats = async () => {
    const [{ data }, { count: djCount }] = await Promise.all([
      supabase.from('reservations').select('*, events(price)'),
      supabase.from('djs').select('*', { count: 'exact', head: true }),
    ])

    if (!data) return
    const confirmed = data.filter(r => r.status === 'confirmed')
    const totalRevenue = confirmed.reduce((sum, r) => sum + (r.total_price || 0), 0)
    const TAX_RATE = 0.14
    const revenueBeforeTax = Math.round(totalRevenue / (1 + TAX_RATE))

    setStats({
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      confirmed: confirmed.length,
      rejected: data.filter(r => r.status === 'rejected').length,
      awaiting: data.filter(r => r.status === 'awaiting_payment').length,
      review: data.filter(r => r.status === 'payment_review').length,
      tickets: confirmed.reduce((sum, r) => sum + (r.num_people || 0), 0),
      revenue: revenueBeforeTax,
      tax: totalRevenue - revenueBeforeTax,
      totalDjs: djCount || 0,
    })
  }

  const logout = () => {
    localStorage.removeItem('admin_auth')
    localStorage.removeItem('admin_role')
    localStorage.removeItem('admin_username')
    localStorage.removeItem('admin_id')
    router.push('/dashboard/login')
  }

  const can = (page: string) => (roleAccess[role] || []).includes(page)

  const roleBadgeColor: Record<string, string> = {
    superadmin: '#dc2626',
    admin:      '#8b5cf6',
    door:       '#10b981',
  }

  const allNavCards = [
    { key: 'events',       href: '/dashboard/events',       icon: '🎉', title: 'MANAGE EVENTS',  sub: 'Add, edit & delete events' },
    { key: 'reservations', href: '/dashboard/reservations', icon: '📋', title: 'RESERVATIONS',   sub: 'View & manage all bookings' },
    { key: 'verify',       href: '/dashboard/verify',       icon: '🔍', title: 'VERIFY ENTRY',   sub: 'Scan entry codes at the door' },
    { key: 'djs',          href: '/dashboard/djs',          icon: '🎧', title: 'MANAGE DJs',     sub: `${stats.totalDjs} DJ${stats.totalDjs !== 1 ? 's' : ''} on the roster`, highlight: true },
    { key: 'users',        href: '/dashboard/users',        icon: '👥', title: 'MANAGE USERS',   sub: 'Add & control admin access' },
  ]

  const visibleCards = allNavCards.filter(c => can(c.key))

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', padding: '60px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, margin: 0 }}>● ADMIN</p>
              {role && (
                <span style={{ backgroundColor: `${roleBadgeColor[role] || '#555'}18`, border: `1px solid ${roleBadgeColor[role] || '#555'}40`, color: roleBadgeColor[role] || '#555', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', padding: '3px 10px', borderRadius: '999px' }}>
                  {role.toUpperCase()}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>DASHBOARD</h1>
            <p style={{ color: '#333', fontSize: '12px', margin: '6px 0 0' }}>Welcome back, {username}</p>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #1a1a1a', color: '#444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', letterSpacing: '2px', fontFamily: 'Inter, sans-serif' }}>
            LOG OUT
          </button>
        </div>

        {/* Stats — admin و superadmin بس */}
        {(role === 'superadmin' || role === 'admin') && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              {[
                { label: 'TOTAL BOOKINGS',   value: stats.total,     color: '#fff'    },
                { label: 'PENDING',          value: stats.pending,   color: '#f59e0b' },
                { label: 'CONFIRMED',        value: stats.confirmed, color: '#10b981' },
                { label: 'AWAITING PAYMENT', value: stats.awaiting,  color: '#3b82f6' },
                { label: 'PAYMENT REVIEW',   value: stats.review,    color: '#8b5cf6' },
                { label: 'REJECTED',         value: stats.rejected,  color: '#ef4444' },
              ].map(c => (
                <div key={c.label} style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px' }}>
                  <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 12px' }}>{c.label}</p>
                  <p style={{ color: c.color, fontSize: '36px', fontWeight: 900, margin: 0 }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Revenue — superadmin بس */}
            {role === 'superadmin' && (
              <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '32px', marginBottom: '32px' }}>
                <p style={{ color: '#555', fontSize: '11px', letterSpacing: '3px', fontWeight: 700, margin: '0 0 24px' }}>
                  REVENUE SUMMARY — CONFIRMED BOOKINGS ONLY
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '24px' }}>
                    <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>🎟️ TICKETS SOLD</p>
                    <p style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: 0 }}>{stats.tickets}</p>
                  </div>
                  <div style={{ backgroundColor: '#111', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '24px' }}>
                    <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>💰 REVENUE (BEFORE TAX)</p>
                    <p style={{ color: '#10b981', fontSize: '32px', fontWeight: 900, margin: 0 }}>
                      {stats.revenue.toLocaleString()} <span style={{ color: '#444', fontSize: '14px', fontWeight: 400 }}>EGP</span>
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#111', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '14px', padding: '24px' }}>
                    <p style={{ color: '#444', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, margin: '0 0 8px' }}>🏛️ VAT COLLECTED (14%)</p>
                    <p style={{ color: '#dc2626', fontSize: '32px', fontWeight: 900, margin: 0 }}>
                      {stats.tax.toLocaleString()} <span style={{ color: '#444', fontSize: '14px', fontWeight: 400 }}>EGP</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Navigation Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: visibleCards.length === 1 ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
          {visibleCards.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{ backgroundColor: '#0d0d0d', border: `1px solid ${'highlight' in item && item.highlight ? 'rgba(220,38,38,0.25)' : '#1a1a1a'}`, borderRadius: '20px', padding: '40px 32px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s, transform 0.2s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = '#dc2626'; el.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'highlight' in item && item.highlight ? 'rgba(220,38,38,0.25)' : '#1a1a1a'; el.style.transform = 'translateY(0)' }}
            >
              {'highlight' in item && item.highlight && (
                <span style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', padding: '4px 10px', borderRadius: '999px' }}>NEW</span>
              )}
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{item.icon}</div>
              <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '2px', margin: '0 0 8px' }}>{item.title}</h2>
              <p style={{ color: '#444', fontSize: '13px', margin: 0 }}>{item.sub}</p>
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
