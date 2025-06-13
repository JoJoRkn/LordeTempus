import { defineConfig } from 'vite'


import.meta.env.VITE_FIREBASE_API_KEY


export default defineConfig({
  base: '/SiteLordeTempus/', // Base URL para o GitHub Pages
  
  root: '.', // ou o diretório onde está seu index.html
  
  // Configuração para carregar variáveis de ambiente
  envPrefix: 'VITE_',
  
  // Configuração para garantir que o arquivo .env seja carregado
  envDir: '.',
  
  // Configuração para desenvolvimento
  server: {
    port: 3000,
    open: true
  }
})



