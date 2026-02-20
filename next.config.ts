import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    allowedDevOrigins: [
        "http://localhost:3000",
        "http://192.168.1.6:3000",
    ],
};

export default nextConfig;
