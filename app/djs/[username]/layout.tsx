import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'

type Props = {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: dj } = await supabase
    .from('djs')
    .select('name, bio, image_url, username')
    .or(`username.eq.${params.username},id.eq.${params.username}`)
    .single()

  if (!dj) {
    return {
      title: 'DJ Not Found — GRAVIX EGYPT',
    }
  }

  const title = `${dj.name} — GRAVIX EGYPT`
  const description = dj.bio
    ? dj.bio.slice(0, 160)
    : `${dj.name} is a featured DJ on GRAVIX EGYPT.`
  const image = dj.image_url || 'https://gravixegypt.online/og-default.jpg'
  const url = `https://gravixegypt.online/djs/${dj.username || params.username}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'GRAVIX EGYPT',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: dj.name,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default function DJLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
