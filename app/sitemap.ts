import { MetadataRoute } from 'next'

const URL = 'https://notifesport.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${URL}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Ajoutez d'autres URLs importantes
  ]
}