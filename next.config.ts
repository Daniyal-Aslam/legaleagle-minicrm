import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a verification build (e.g. NEXT_DIST_DIR=.next-verify) run beside `next dev`
  // without the two processes overwriting each other's output.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Keep the dev-only Next.js badge off the sidebar account menu.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
