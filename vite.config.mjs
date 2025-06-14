import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/LordeTempus/', // Base URL para o GitHub Pages
  
  root: '.', // ou o diretório onde está seu index.html
  
  // Configuração para carregar variáveis de ambiente
  envPrefix: 'VITE_',
  
  // Configuração para garantir que o arquivo .env seja carregado
  envDir: '.',
  
  // Configuração para desenvolvimento
  server: {
    port: 3000,
    open: true
  },

  // Configuração para build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: true
  },

  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'campanhas.html', dest: '.' },
        { src: 'perfil.html', dest: '.' }
      ]
    })
  ]
})



