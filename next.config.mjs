/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The LiveKit agent worker (./agent) is a separate Node process started via
  // `npm run agent:dev` / `npm run agent:start` — it is intentionally NOT
  // bundled by Next.js. Keep it out of the app/ tree so Next never tries to
  // pull it into a client or server bundle.
  eslint: {
    dirs: ["app", "components", "lib", "types"],
  },
};

export default nextConfig;
