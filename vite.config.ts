import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.API_URL': JSON.stringify(
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:8788'
        : 'https://qwen-rag-pipeline.pages.dev'
    ),
  },
  plugins: [react(), tsconfigPaths()],
})
