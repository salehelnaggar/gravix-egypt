'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        .nav-desktop { display: flex; }
        .nav-mobile { display: none; }

        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }
      `}</style>

      <nav
        style={{
          background: 'rgba(5, 8, 18, 0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(0,229,255,0.12)',
          padding: '12px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          fontFamily: 'Inter, sans-serif',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00E5FF, #1565FF)',
                boxShadow: '0 0 12px rgba(0,229,255,0.8)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                color: '#00E5FF',
                fontWeight: 900,
                fontSize: '20px',
                letterSpacing: '3px',
                textShadow: '0 0 12px rgba(0,229,255,0.25)',
              }}
            >
              GRAVIX
            </span>
            <span
              style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '2px',
              }}
            >
              EGYPT
            </span>
          </Link>

          {/* Desktop */}
          <div
            className="nav-desktop"
            style={{
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                color: '#6b7280',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '3px',
              }}
            >
              NEW UPDATE
            </span>

            <Link
              href="/"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #00E5FF, #1565FF)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '1px',
                boxShadow: '0 0 20px rgba(0,229,255,0.18)',
              }}
            >
              BACK TO HOME
            </Link>
          </div>

          {/* Mobile */}
          <div
            className="nav-mobile"
            style={{
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(0,229,255,0.14)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="1" y1="1" x2="15" y2="15" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
                  <line x1="15" y1="1" x2="1" y2="15" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <rect width="20" height="2" rx="1" fill="#ffffff" />
                  <rect y="6" width="20" height="2" rx="1" fill="#ffffff" />
                  <rect y="12" width="20" height="2" rx="1" fill="#ffffff" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div
            style={{
              marginTop: '12px',
              borderTop: '1px solid rgba(0,229,255,0.1)',
              paddingTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxWidth: '1200px',
              marginInline: 'auto',
            }}
          >
            <div
              style={{
                color: '#6b7280',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '3px',
                padding: '4px 2px',
              }}
            >
              NEW UPDATE
            </div>

            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              style={{
                background: 'linear-gradient(135deg, #00E5FF, #1565FF)',
                color: '#fff',
                padding: '12px 0',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '13px',
                textDecoration: 'none',
                letterSpacing: '1px',
                textAlign: 'center',
                display: 'block',
                boxShadow: '0 0 20px rgba(0,229,255,0.18)',
              }}
            >
              BACK TO HOME
            </Link>
          </div>
        )}
      </nav>
    </>
  )
            }
