import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public Crossmint CLIENT key (ck_), STAGING = Stellar testnet (matches the
  // deployed p2p contract). Client keys are exposed in the browser by design —
  // their security is the allowed-origins allowlist in the Crossmint console
  // (keep it limited to localhost + the deployed domain), NOT secrecy. Never put
  // a server key (sk_) here.
  env: {
    NEXT_PUBLIC_CROSSMINT_API_KEY:
      "ck_staging_5MwoQSikyguRgnHXQGNm2khXk73gYR7YiHRZHA5apxWCyxcBJmi5mPiQSbCss3wSUQqTSchWEVcW3pDqRK8P38pZgDhFeiVZQftUazAKQgSKSQ6Vi1wK1W5oD1cfCrpJYGHmKjUt9ELHUPNsVEN5enUMRKYjwQ7XJC81QQjSBa2gSPyN5LZCMRVZabJiGt3p6oFEbqtm7uBvdpBhdJkfDhAo",
  },
};

export default nextConfig;
