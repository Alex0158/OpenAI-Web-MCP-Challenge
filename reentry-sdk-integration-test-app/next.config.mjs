const nextConfig = {
  turbopack: {
    root: new URL(".", import.meta.url).pathname,
  },
  transpilePackages: ["@4xeoz/re-entry-sdk"],
};

export default nextConfig;
