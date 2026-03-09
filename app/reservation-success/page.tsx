import Link from 'next/link'

export default function ReservationSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>

        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 32px' }}>
          🎟️
        </div>

        <p style={{ color: '#dc2626', fontSize: '11px', letterSpacing: '4px', fontWeight: 700, marginBottom: '12px' }}>● BOOKING RECEIVED</p>
        <h1 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px' }}>You're In!</h1>
        <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.8, marginBottom: '40px' }}>
          Your booking request has been submitted successfully.<br />
          Check your profile to track the status of your reservation.
        </p>

        <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', marginBottom: '32px', textAlign: 'left' }}>
          <p style={{ color: '#444', fontSize: '11px', letterSpacing: '3px', fontWeight: 700, marginBottom: '16px' }}>WHAT HAPPENS NEXT?</p>
          {[
            { step: '01', text: 'Your booking is now under review' },
            { step: '02', text: 'Login and check My Profile to see your status' },
            { step: '03', text: 'Once confirmed, you\'ll receive your entry code' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span style={{ color: '#dc2626', fontWeight: 900, fontSize: '13px', letterSpacing: '1px', minWidth: '28px' }}>{item.step}</span>
              <span style={{ color: '#666', fontSize: '14px', lineHeight: 1.6 }}>{item.text}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/profile" style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            color: '#fff', textDecoration: 'none',
            padding: '14px 32px', borderRadius: '12px',
            fontWeight: 700, fontSize: '14px', letterSpacing: '1px'
          }}>
            VIEW MY PROFILE →
          </Link>
          <Link href="/events" style={{
            backgroundColor: 'transparent', color: '#555',
            textDecoration: 'none', padding: '14px 32px',
            borderRadius: '12px', fontWeight: 700,
            fontSize: '14px', border: '1px solid #1a1a1a'
          }}>
            MORE EVENTS
          </Link>
        </div>
      </div>
    </main>
  )
}
