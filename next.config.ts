import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Public Crossmint CLIENT key (ck_). Client keys are exposed in the browser by
  // design — their security comes from the allowed-origins allowlist in the
  // Crossmint console (keep it limited to localhost + your deployed domain), NOT
  // from secrecy. Never put a server key (sk_) here. Other NEXT_PUBLIC_* values
  // fall back to the correct Stellar testnet defaults in code.
  env: {
    NEXT_PUBLIC_CROSSMINT_API_KEY:
      "ck_production_35MBXWWABDyFJoc9ujpYpMjTRMf6xiFFzKAmLgp3E9sUfyxnvMsepnjeceJRT2zmMPbrg6mKQHeEuwkHkgXeEhjZBRFQSh2jJhLKzq4j2fubLG6dQ5MYD1KVU75W75mi3MejbAsPU8FSqF5owACEfDy2NLr7nL4HZxJqYJQUr16A98T6XQakag8ggMve3gvQdvumMn7rBTLfZNtVCZ7Y1eU",
  },
};

export default nextConfig;
