/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["geist"],
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  },
};

export default nextConfig;
