import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'build',
    },
    resolve: {
      alias: {
        // Add any path aliases you might have been using
      },
    },
    define: {
      'process.env.VITE_DEV_API_URL': JSON.stringify(env.VITE_DEV_API_URL),
      'process.env.VITE_PROD_API_URL': JSON.stringify(env.VITE_PROD_API_URL),
      'process.env.VITE_SERVER_DEV_URL': JSON.stringify(env.VITE_SERVER_DEV_URL),
      'process.env.VITE_SERVER_PROD_URL': JSON.stringify(env.VITE_SERVER_PROD_URL),
      'process.env.VITE_NODE_ENV': JSON.stringify(env.VITE_NODE_ENV),
    },
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      // loader: "tsx",
      // include: /src\/.*\.[tj]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
  }
})