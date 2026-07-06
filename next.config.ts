import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @afipsdk/afip.js is only imported dynamically when ARCA credentials are
  // present (env vars ARCA_CUIT + ARCA_CERT + ARCA_KEY). Marking it external
  // stops Turbopack from trying to bundle it at build time.
  serverExternalPackages: ['@afipsdk/afip.js'],
};

export default nextConfig;
