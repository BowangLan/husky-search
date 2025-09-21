import { MetadataRoute } from 'next'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all programs for dynamic routes
  const programs = await fetchQuery(api.myplan1.subjectAreas.listShort, {})

  const baseUrl = 'https://huskysearch.fyi'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/majors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Dynamic major routes
  const majorRoutes: MetadataRoute.Sitemap = []

  programs.data.forEach((program) => {
    // Main major page
    majorRoutes.push({
      url: `${baseUrl}/majors/${program.code}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    })

    // Easiest courses page
    majorRoutes.push({
      url: `${baseUrl}/majors/${program.code}/easiest`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })

    // Toughest courses page
    majorRoutes.push({
      url: `${baseUrl}/majors/${program.code}/toughest`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  })

  return [...staticRoutes, ...majorRoutes]
}