import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    cacheDir: ".vite_cache",
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:5000",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path,
                configure: (proxy) => {
                    proxy.on("error", (err) => {
                        console.log("[proxy error] backend may not be running:", err.message);
                    });
                    proxy.on("proxyReq", (_, req) => {
                        console.log("[proxy]", req.method, req.url);
                    });
                },
            },
        },
    },
});