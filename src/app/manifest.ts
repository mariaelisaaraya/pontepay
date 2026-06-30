import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PontePay',
    short_name: 'PontePay',
    description: 'Earn Global, Spend Local - Trustless ramp for the borderless economy.',
    start_url: '/',
    display: 'standalone',
    background_color: '#014A2D',
    theme_color: '#014A2D',
    icons: [
      {
        src: '/pontepay-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
