'use client'

import { use } from 'react'

export default function AdminTicketPage({
  params,
}: {
  params: Promise<{ qr_code: string }>
}) {
  const { qr_code } = use(params)

  return (
    <main style={{ color: '#fff', backgroundColor: '#000', minHeight: '100vh' }}>
      <h1>ADMIN TICKET PAGE</h1>
      <p>QR: {qr_code}</p>
    </main>
  )
}
