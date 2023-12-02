import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    aalias: {
      '/src/worklets': new URL('src/worklets', import.meta.url).pathname,
    },
    extensions: ['.js'], // Add any other extensions that your modules might use
  },
});