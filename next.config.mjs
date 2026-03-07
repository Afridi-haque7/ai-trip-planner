/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "lh3.googleusercontent.com",
      "dynamic-media-cdn.tripadvisor.com",
      "upload.wikimedia.org",
      "www.allrecipes.com",
      "www.foodandwine.com",
      "www.thespruceeats.com",
      "assets.bonappetit.com",
      "s3-media0.fl.yelpcdn.com",
      "www.jetsetter.com",
      "media.architecturaldigest.com",
    ],
  },
  // Add security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
