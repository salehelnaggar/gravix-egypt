import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase-server'

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params

  const supabase = createServerSupabase()

  // حاول الأول بالـ username
  const { data: byUsername, error } = await supabase
    .from('djs')
    .select('name, bio, image_url, username')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return {
      title: 'DJ — GRAVIX EGYPT',
      description:
        'Discover featured DJs on GRAVIX EGYPT. Book artists and explore their profiles.',
    }
  }

  const dj = byUsername

  if (!dj) {
    return {
      title: 'DJ — GRAVIX EGYPT',
      description:
        'Discover featured DJs on GRAVIX EGYPT. Book artists and explore their profiles.',
    }
  }

  const title = `${dj.name} — GRAVIX EGYPT`
  const description = dj.bio
    ? dj.bio.slice(0, 160)
    : `${dj.name} is a featured DJ on GRAVIX EGYPT.`
  const image = dj.image_url || 'https://gravixegypt.online/og-default.jpg'
  const url = `https://gravixegypt.online/djs/${dj.username || username}`

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
