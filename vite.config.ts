import { reactRouter } from "@react-router/dev/vite";
import { hydrogen } from "@shopify/hydrogen/vite";
// import { oxygen } from "@shopify/mini-oxygen/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    hydrogen(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      debug: "debug/src/browser.js",
    },
  },
  build: {
    assetsInlineLimit: 0,
    ...(!isSsrBuild && {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("react-player")) return "vendor-media";
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
        "deepmerge",
        "@radix-ui/react-primitive",
        "jsonp",
        "classnames",
        "typographic-trademark",
        "typographic-single-spaces",
        "typographic-registered-trademark",
        "typographic-math-symbols",
        "typographic-en-dashes",
        "typographic-em-dashes",
        "typographic-ellipses",
        "typographic-currency",
        "typographic-copyright",
        "typographic-apostrophes-for-possessive-plurals",
        "typographic-quotes",
        "typographic-apostrophes",
        "textr",
      ],
    },
  },
}));
