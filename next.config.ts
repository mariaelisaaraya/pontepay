import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @afipsdk/afip.js is only imported dynamically when ARCA credentials are
  // present (env vars ARCA_CUIT + ARCA_CERT + ARCA_KEY). Marking it external
  // stops Turbopack from trying to bundle it at build time.
  serverExternalPackages: ['@afipsdk/afip.js'],
  env: {
    NEXT_PUBLIC_CROSSMINT_API_KEY:
      "ck_staging_5MwoQSikyguRgnHXQGNm2khXk73gYR7YiHRZHA5apxWCyxcBJmi5mPiQSbCss3wSUQqTSchWEVcW3pDqRK8P38pZgDhFeiVZQftUazAKQgSKSQ6Vi1wK1W5oD1cfCrpJYGHmKjUt9ELHUPNsVEN5enUMRKYjwQ7XJC81QQjSBa2gSPyN5LZCMRVZabJiGt3p6oFEbqtm7uBvdpBhdJkfDhAo",
  },
};

export default nextConfig;
