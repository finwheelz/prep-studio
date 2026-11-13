/** @type {import('next').NextConfig} */
// Static hosting (GitHub Pages): STATIC_EXPORT=1 writes a plain site to ./out.
// NEXT_PUBLIC_BASE_PATH is the sub-path the site is served from, e.g. "/prep-studio".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const nextConfig = {
  reactStrictMode: true,
  ...(process.env.STATIC_EXPORT ? { output: "export", trailingSlash: true } : {}),
  basePath,
  // PGlite (Postgres in WASM) is browser-only here; keep it out of the server bundle.
  experimental: { serverComponentsExternalPackages: ["@electric-sql/pglite"] },
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      // PGlite has a Node code path behind a runtime check that imports `node:fs`, `node:module`…
      // Strip the scheme and stub those modules so the browser bundle resolves.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, path: false, crypto: false, module: false, url: false, os: false, stream: false, zlib: false, util: false, worker_threads: false, child_process: false,
      };
    }
    return config;
  },
};
export default nextConfig;
