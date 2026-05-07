import type { NextConfig } from "next";

const frameAncestors =
    process.env.NEXT_PUBLIC_FRAME_ANCESTORS ||
    process.env.NEXT_PUBLIC_FRAME_ANCESTOR_ORIGIN ||
    "'self' https://*.livecactusstudio.tech";

const nextConfig: NextConfig = {
    // Production
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,

    // Better deployments
    output: "standalone",
    // Pin tracing root to this project (avoids wrong root when multiple lockfiles exist)
    outputFileTracingRoot: __dirname,

    // Images
    images: {
        unoptimized: false,

        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },

    // Experimental optimizations
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "@mui/material",
            "lodash",
            "date-fns",
        ],
    },

    // Next.js 16 uses Turbopack by default.
    // Keep this explicit while retaining webpack config for webpack mode.
    turbopack: {},

    // Webpack optimizations
    webpack: (config: { resolve: { fallback?: Record<string, boolean> } }, { isServer }: { isServer: boolean }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                net: false,
                tls: false,
            };
        }

        return config;
    },

    // Headers
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `frame-ancestors ${frameAncestors}`,
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },

};

module.exports = nextConfig;