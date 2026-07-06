import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is too new for Turbopack's built-in externals list; without
  // this it tries to bundle it and crashes with "require is not defined".
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
