import { defineConfig } from 'vite'

export default defineConfig({
  // Pour GitHub Pages, remplacez par le nom de votre repo :
  // base: '/nom-du-repo/',
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
})
