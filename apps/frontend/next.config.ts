import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@custom-website-builder/node-registry"],
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
};

export default nextConfig;
