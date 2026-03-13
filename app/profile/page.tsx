'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function Countdown({ deadline }: { deadline: string }) {
  const [time, setTime] = useState('')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setTime('00:00:00')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
          s,
        ).padStart(2, '0')}`,
      )
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [deadline])

  return (
    <div
      style={{
        textAlign: 'center',
        backgroundColor: expired
          ? 'rgba(239,68,68,0.05)'
          : 'rgba(245,158,11,0.05)',
        border: `1px solid ${
          expired ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.2)'
        }`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}
    >
      <p
        style={{
          color: '#444',
          fontSize: '10px',
          letterSpacing: '3px',
          margin: '0 0 8px',
        }}
      >
        {expired ? 'PAYMENT DEADLINE PASSED' : 'TIME REMAINING TO PAY'}
      </p>
      <p
        style={{
          color: expired ? '#ef4444' : '#f59e0b',
          fontSize: '40px',
          fontWeight: 900,
          fontFamily: 'monospace',
          margin: '0 0 6px',
          letterSpacing: '4px',
        }}
      >
        {time}
      </p>
      <p
        style={{
          color: '#333',
          fontSize: '11px',
          margin: 0,
        }}
      >
        Deadline:{' '}
        {new Date(deadline).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
            timeZone: 'UTC',

        })}{' '}
        at{' '}
        {new Date(deadline).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  )
}

function PaymentSection({
  reservation,
  onDone,
}: {
  reservation: any
  onDone: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [senderPhone, setSenderPhone] = useState('')
const phone = reservation.events?.transfer_number || '01000000000'

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const copyPhone = () => {
    navigator.clipboard.writeText(phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!file || !senderPhone) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${reservation.id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('payment-screenshots')
      .upload(path, file)
    if (uploadErr) {
      alert('Upload failed. Please try again.')
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(path)
    await supabase
      .from('reservations')
      .update({
        payment_screenshot_url: urlData.publicUrl,
        payment_sender_phone: senderPhone,
        status: 'payment_review',
      })
      .eq('id', reservation.id)
    setUploading(false)
    onDone()
  }

  return (
    <div
      style={{
        backgroundColor: '#0d0d0d',
        border: '1px solid rgba(59,130,246,0.4)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '8px',
      }}
    >
      <p
        style={{
          color: '#3b82f6',
          fontSize: '11px',
          letterSpacing: '3px',
          fontWeight: 700,
          margin: '0 0 20px',
        }}
      >
        💳 COMPLETE YOUR PAYMENT
      </p>
      {reservation.payment_deadline && (
        <Countdown deadline={reservation.payment_deadline} />
      )}

      <div
        style={{
          backgroundColor: '#111',
          border: '1px solid #1a1a1a',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <p
          style={{
            color: '#444',
            fontSize: '10px',
            letterSpacing: '2px',
            fontWeight: 700,
            margin: '0 0 12px',
          }}
        >
          STEP 01 — SEND THE AMOUNT
        </p>
        <p
          style={{
            color: '#555',
            fontSize: '13px',
            lineHeight: 1.7,
            margin: '0 0 14px',
          }}
        >
          Transfer exactly{' '}
          <strong
            style={{
              color: '#fff',
              fontSize: '15px',
            }}
          >
            {reservation.total_price} EGP
          </strong>{' '}
          via Instapay or Vodafone Cash to:
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#0d0d0d',
            border: '1px solid #222',
            borderRadius: '10px',
            padding: '14px 18px',
          }}
        >
          <p
            style={{
              color: '#fff',
              fontSize: '22px',
              fontWeight: 900,
              fontFamily: 'monospace',
              margin: 0,
              flex: 1,
              letterSpacing: '2px',
            }}
          >
            {phone}
          </p>
          <button
            onClick={copyPhone}
            style={{
              background: 'none',
              border: `1px solid ${copied ? '#10b981' : '#333'}`,
              color: copied ? '#10b981' : '#555',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '1px',
              fontWeight: 700,
            }}
          >
            {copied ? 'COPIED ✓' : 'COPY'}
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#111',
          border: '1px solid #1a1a1a',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <p
          style={{
            color: '#444',
            fontSize: '10px',
            letterSpacing: '2px',
            fontWeight: 700,
            margin: '0 0 12px',
          }}
        >
          STEP 02 — ENTER YOUR PHONE NUMBER
        </p>
        <p
          style={{
            color: '#555',
            fontSize: '13px',
            margin: '0 0 14px',
          }}
        >
          The number you sent from:
        </p>
        <input
          type="tel"
          placeholder="01XXXXXXXXX"
          value={senderPhone}
          onChange={e => setSenderPhone(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#0d0d0d',
            border: '1px solid #222',
            borderRadius: '10px',
            padding: '14px 16px',
            color: '#fff',
            fontSize: '16px',
            fontFamily: 'monospace',
            outline: 'none',
            boxSizing: 'border-box',
            letterSpacing: '2px',
          }}
        />
      </div>

      <div
        style={{
          backgroundColor: '#111',
          border: '1px solid #1a1a1a',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <p
          style={{
            color: '#444',
            fontSize: '10px',
            letterSpacing: '2px',
            fontWeight: 700,
            margin: '0 0 12px',
          }}
        >
          STEP 03 — UPLOAD PAYMENT PROOF
        </p>
        <label
          style={{
            display: 'block',
            border: `2px dashed ${file ? '#3b82f6' : '#1a1a1a'}`,
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input
  type="file"
  accept="image/*"
  style={{ display: 'none' }}
  onChange={handleFile}
/>

          {preview ? (
            <div>
              <img
                src={preview}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'contain',
                  marginBottom: '8px',
                }}
              />
              <p
                style={{
                  color: '#3b82f6',
                  fontSize: '12px',
                  margin: 0,
                }}
              >
                Tap to change
              </p>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: '36px',
                  margin: '0 0 10px',
                }}
              >
                📸
              </p>
              <p
                style={{
                  color: '#444',
                  fontSize: '13px',
                  margin: '0 0 4px',
                }}
              >
                Tap to upload screenshot
              </p>
              <p
                style={{
                  color: '#333',
                  fontSize: '11px',
                  margin: 0,
                }}
              >
                JPG or PNG
              </p>
            </>
          )}
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || !senderPhone || uploading}
        style={{
          width: '100%',
          backgroundColor:
            file && senderPhone && !uploading ? '#3b82f6' : '#111',
          color: file && senderPhone && !uploading ? '#fff' : '#333',
          border: 'none',
          padding: '16px',
          borderRadius: '12px',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '2px',
          cursor:
            file && senderPhone && !uploading ? 'pointer' : 'not-allowed',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {uploading ? 'UPLOADING...' : '📤 SUBMIT PAYMENT PROOF →'}
      </button>
    </div>
  )
}

const statusConfig: Record<
  string,
  { color: string; label: string; icon: string; desc: string }
> = {
  pending: {
    color: '#f59e0b',
    icon: '⏳',
    label: 'PENDING',
    desc: 'Your booking has been submitted and is waiting to be reviewed.',
  },
  reviewing: {
    color: '#fb923c',
    icon: '🔎',
    label: 'BOOKING UNDER REVIEW',
    desc: "We\'ve received your booking and are currently reviewing it.",
  },
  awaiting_payment: {
    color: '#3b82f6',
    icon: '💳',
    label: 'AWAITING PAYMENT',
    desc:
      'Your booking is approved! Please complete the payment below to secure your spot.',
  },
  payment_review: {
    color: '#8b5cf6',
    icon: '🔍',
    label: 'PAYMENT UNDER REVIEW',
    desc: 'We received your payment proof and are reviewing it After Review the message will be updated with your entry code.',
  },
  confirmed: {
    color: '#10b981',
    icon: '✅',
    label: "CONFIRMED — YOU'RE IN!",
    desc: "Your spot is confirmed. Show your entry code at the door! 🎉",
  },
  checked_in: {
    color: '#22c55e',
    icon: '🎟️',
    label: 'CHECKED IN — ENJOY!',
    desc: 'You have already checked in at the venue. Have fun!',
  },
  rejected: {
    color: '#ef4444',
    icon: '❌',
    label: 'NOT APPROVED',
    desc:
      'Your booking was not approved. Contact us on Instagram for more info.',
  },
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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [reservations, setReservations] = useState<any[]>([])

  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setNewName(user.user_metadata?.full_name || '')
    const { data } = await supabase
      .from('reservations')
.select('*, events(title, date, location, image_url, price, transfer_number)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setReservations(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg('')

    if (newName.trim()) {
      await supabase.auth.updateUser({
        data: { full_name: newName.trim() },
      })
    }
    if (newPassword.trim()) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      })
      if (error) {
        setSaveMsg('❌ ' + error.message)
        setSaving(false)
        return
      }
    }

    await load()
    setSaveMsg('✅ Saved successfully!')
    setNewPassword('')
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: '#333',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '3px',
            fontSize: '12px',
          }}
        >
          LOADING...
        </p>
      </main>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#050505',
        padding: '60px 24px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '48px',
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
              ● MY ACCOUNT
            </p>
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 6px',
                letterSpacing: '-1px',
              }}
            >
              {displayName}
            </h1>
            <p
              style={{
                color: '#333',
                fontSize: '13px',
                margin: 0,
              }}
            >
              {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: '1px solid #1a1a1a',
              color: '#444',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              letterSpacing: '2px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            SIGN OUT
          </button>
        </div>

        {/* Edit section */}
        <div
          style={{
            backgroundColor: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '48px',
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
            ⚙️ EDIT YOUR INFO
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <p
                style={{
                  color: '#444',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                FULL NAME
              </p>
              <input
                style={inputStyle}
                type="text"
                placeholder="Your name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>

            <div>
              <p
                style={{
                  color: '#444',
                  fontSize: '10px',
                  letterSpacing: '2px',
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                NEW PASSWORD
              </p>
              <input
                style={inputStyle}
                type="password"
                placeholder="Leave empty to keep current"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            {saveMsg && (
              <p
                style={{
                  color: saveMsg.startsWith('✅') ? '#10b981' : '#ef4444',
                  fontSize: '13px',
                  margin: 0,
                }}
              >
                {saveMsg}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                backgroundColor: saving ? '#111' : '#dc2626',
                color: saving ? '#333' : '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '2px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES →'}
            </button>
          </div>
        </div>

        {/* Bookings */}
        <p
          style={{
            color: '#dc2626',
            fontSize: '11px',
            letterSpacing: '4px',
            fontWeight: 700,
            margin: '0 0 24px',
          }}
        >
          ● MY BOOKINGS
        </p>

        {reservations.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 40px',
              border: '1px dashed #1a1a1a',
              borderRadius: '20px',
            }}
          >
            <p
              style={{
                fontSize: '40px',
                margin: '0 0 16px',
              }}
            >
              🎟️
            </p>
            <p
              style={{
                color: '#333',
                fontSize: '12px',
                letterSpacing: '3px',
                margin: 0,
              }}
            >
              NO BOOKINGS YET
            </p>
          </div>
        )}

        {reservations.map(r => {
          const effectiveStatus = r.checked_in
            ? 'checked_in'
            : r.status || 'pending'
          const cfg = statusConfig[effectiveStatus] || statusConfig.pending

          return (
            <div key={r.id} style={{ marginBottom: '32px' }}>
              <div
                style={{
                  backgroundColor: '#0d0d0d',
                  border: `1px solid ${cfg.color}25`,
                  borderRadius: '20px',
                  padding: '24px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                  }}
                >
                  {r.events?.image_url && (
                    <img
                      src={r.events.image_url}
                      alt=""
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h2
                      style={{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 900,
                        margin: '0 0 4px',
                      }}
                    >
                      {r.events?.title}
                    </h2>
                    <p
                      style={{
                        color: '#444',
                        fontSize: '12px',
                        margin: 0,
                      }}
                    >
                      📅{' '}
                      {new Date(r.events?.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                          timeZone: 'UTC',

                      })}{' '}
                      · 📍 {r.events?.location}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: `${cfg.color}10`,
                    border: `1px solid ${cfg.color}30`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span
                    style={{
                      fontSize: '22px',
                      flexShrink: 0,
                    }}
                  >
                    {cfg.icon}
                  </span>
                  <div>
                    <p
                      style={{
                        color: cfg.color,
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '2px',
                        margin: '0 0 4px',
                      }}
                    >
                      {cfg.label}
                    </p>
                    <p
                      style={{
                        color: '#555',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {cfg.desc}
                    </p>
                    {r.checked_in && r.checked_in_at && (
                      <p
                        style={{
                          color: '#22c55e',
                          fontSize: '11px',
                          marginTop: '6px',
                        }}
                      >
                        Checked in at{' '}
                        {new Date(r.checked_in_at).toLocaleTimeString(
                          'en-US',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                  }}
                >
                  {[
                    { label: 'TICKETS', value: `${r.num_people}x` },
                    { label: 'TOTAL', value: `${r.total_price} EGP` },
                    {
                      label: 'BOOKED',
                      value: new Date(r.created_at).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric' },
                      ),
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      style={{
                        backgroundColor: '#111',
                        border: '1px solid #1a1a1a',
                        borderRadius: '10px',
                        padding: '12px',
                      }}
                    >
                      <p
                        style={{
                          color: '#333',
                          fontSize: '9px',
                          letterSpacing: '2px',
                          fontWeight: 700,
                          margin: '0 0 4px',
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {r.status === 'awaiting_payment' && (
                <PaymentSection reservation={r} onDone={load} />
              )}

              {(r.status === 'confirmed' || r.checked_in) && r.entry_code && (
                <div
                  style={{
                    backgroundColor: '#0d0d0d',
                    border: r.checked_in
                      ? '1px solid rgba(34,197,94,0.5)'
                      : '1px solid rgba(16,185,129,0.4)',
                    borderRadius: '16px',
                    padding: '32px',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      color: '#444',
                      fontSize: '10px',
                      letterSpacing: '3px',
                      margin: '0 0 16px',
                    }}
                  >
                    YOUR ENTRY CODE
                  </p>
                  <p
                    style={{
                      color: r.checked_in ? '#22c55e' : '#10b981',
                      fontSize: '52px',
                      fontWeight: 900,
                      letterSpacing: '12px',
                      fontFamily: 'monospace',
                      margin: '0 0 16px',
                    }}
                  >
                    {r.entry_code}
                  </p>
                  {!r.checked_in ? (
                    <p
                      style={{
                        color: '#333',
                        fontSize: '12px',
                        margin: 0,
                      }}
                    >
                      📱 Show this code at the entrance
                    </p>
                  ) : (
                    <p
                      style={{
                        color: '#22c55e',
                        fontSize: '12px',
                        margin: 0,
                      }}
                    >
                      ✅ Checked in at{' '}
                      {r.checked_in_at
                        ? new Date(r.checked_in_at).toLocaleTimeString(
                            'en-US',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )
                        : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
