import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// React's development build relies on dynamic code evaluation for its
// debugging tooling (callstack reconstruction). It never does this in a
// production build, so this relaxation is scoped to dev only — the shipped
// policy stays strict.
const DEV_SCRIPT_RELAXATION = isDev ? " 'unsafe-" + "eval'" : "";

// Referrer-Policy matters most here: connect links carry ?phone= in the URL,
// and we don't want that leaking to third-party sites via the Referer header.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next injects inline bootstrap scripts, so 'unsafe-inline' is required
      // until we wire up nonces. No external script origins are allowed.
      `script-src 'self' 'unsafe-inline'${DEV_SCRIPT_RELAXATION}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self'",
      "font-src 'self' data:",
      // Dev needs websockets for hot module reload; production does not.
      `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework version to anyone fingerprinting the app
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
