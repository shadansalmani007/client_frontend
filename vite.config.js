import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:5000";
  const proxyTargetOrigin = new URL(proxyTarget).origin;
  const devServerPort = Number(env.PORT || 5173);

  return {
    plugins: [react()],
    server: {
      port: Number.isFinite(devServerPort) ? devServerPort : 5173,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              // Keep local dev requests same-origin from the browser's point of view
              // and avoid forwarding an Origin header the backend rejects.
              proxyReq.removeHeader("origin");
              proxyReq.setHeader("origin", proxyTargetOrigin);
            });
          },
        },
      },
    },
  };
});
