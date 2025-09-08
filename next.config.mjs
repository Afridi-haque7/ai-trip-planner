/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "lh3.googleusercontent.com"],
    // remotePatterns: [new URL("https://lh3.googleusercontent.com/*")],
  },
};

export default nextConfig;
