// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { email, name, entry_code, event_title, event_date, event_location } = await req.json()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GRAVIX <onboarding@resend.dev>',
      to: email,
      subject: `✅ Booking Confirmed — ${event_title}`,
      html: `
        <div style="background:#050505;color:#fff;font-family:Inter,sans-serif;padding:48px 32px;max-width:580px;margin:0 auto;">
          <h1 style="color:#dc2626;font-size:28px;letter-spacing:8px;margin:0 0 6px;font-weight:900;">GRAVIX</h1>
          <p style="color:#333;font-size:10px;letter-spacing:4px;margin:0 0 48px;">YOUR BOOKING IS CONFIRMED</p>
          <p style="color:#888;font-size:16px;margin:0 0 8px;">Hey <strong style="color:#fff;">${name}</strong>,</p>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 40px;">
            You're all set! Your spot has been confirmed. Show the entry code below at the door.
          </p>
          <div style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:14px;padding:24px;margin-bottom:20px;">
            <p style="color:#333;font-size:10px;letter-spacing:3px;margin:0 0 10px;font-weight:700;">EVENT DETAILS</p>
            <p style="color:#fff;font-size:20px;font-weight:900;margin:0 0 10px;">${event_title}</p>
            <p style="color:#555;font-size:13px;margin:0 0 4px;">📅 ${event_date}</p>
            <p style="color:#555;font-size:13px;margin:0;">📍 ${event_location}</p>
          </div>
          <div style="background:#0d0d0d;border:1px solid rgba(16,185,129,0.4);border-radius:14px;padding:36px 24px;text-align:center;margin-bottom:40px;">
            <p style="color:#444;font-size:10px;letter-spacing:4px;margin:0 0 16px;font-weight:700;">YOUR ENTRY CODE</p>
            <p style="color:#10b981;font-size:52px;font-weight:900;letter-spacing:14px;font-family:monospace;margin:0;">${entry_code}</p>
          </div>
          <p style="color:#333;font-size:12px;text-align:center;line-height:1.8;">
            Present this code at the entrance on the day of the event.<br/>See you there! 🔴
          </p>
          <div style="border-top:1px solid #111;margin-top:40px;padding-top:20px;text-align:center;">
            <p style="color:#222;font-size:11px;margin:0;">© GRAVIX — All rights reserved</p>
          </div>
        </div>
      `
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
