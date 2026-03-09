export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/generate-trip', '/api/'],
    },
    sitemap: 'https://triptailor.org/sitemap.xml',
  };
}