import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// During development the React app runs on :5173 and the FastAPI backend on
// :8000. We proxy any request starting with /api to the backend so the
// frontend can just call fetch("/api/...") with no CORS headaches.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
