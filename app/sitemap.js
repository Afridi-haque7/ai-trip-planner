export default function sitemap() {
  const baseUrl = 'https://triptailor.org';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/generate-trip`,
      priority: 0.9,
    },
  ];
}