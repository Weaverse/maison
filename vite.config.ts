import { reactRouter } from "@react-router/dev/vite";
import { hydrogen } from "@shopify/hydrogen/vite";
import { oxygen } from "@shopify/mini-oxygen/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const SSR_STUBBED_MODULES = new Set(["react-player"]);

function ssrStubClientOnlyModules(): Plugin {
  return {
    name: "ssr-stub-client-only-modules",
    enforce: "pre",
    resolveId(id, _importer, options) {
      if (options?.ssr && SSR_STUBBED_MODULES.has(id)) {
        return fileURLToPath(
          new URL("./app/utils/ssr-client-only-stub.ts", import.meta.url),
        );
      }
      return null;
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    hydrogen(),
    oxygen(),
    reactRouter(),
    tailwindcss(),
    ssrStubClientOnlyModules(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    assetsInlineLimit: 0,
    ...(!isSsrBuild && {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("swiper")) return "vendor-media";
            if (id.includes("react-share")) return "vendor-social";
            if (id.includes("@phosphor-icons")) return "vendor-icons";
            if (id.includes("@radix-ui")) return "vendor-radix";
          },
        },
      },
    }),
  },
  server: {
    warmup: {
      clientFiles: [
        "./app/routes/**/*",
        "./app/sections/**/*",
        "./app/components/**/*",
      ],
    },
    allowedHosts: true,
    hmr: process.env.HMR !== "false",
  },
  ssr: {
    optimizeDeps: {
      include: [
        "@radix-ui/react-primitive",
        "jsonp",
        "classnames",
        "react-share",
      ],
    },
  },
}));
