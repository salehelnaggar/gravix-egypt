import type { Metadata } from 'next'

type Props = {
  params: { username: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username

  const title = `${username?.toString().toUpperCase() || 'DJ'} — GRAVIX EGYPT`
  const description =
    'Discover featured DJs and artists on GRAVIX EGYPT. Book talent for your next event and explore their profiles, links, and mixes.'
  const image = 'https://gravixegypt.online/og-default.jpg'
  const url = `https://gravixegypt.online/djs/${username}`

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
          alt: title,
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
