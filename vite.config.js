import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'


const firebaseConfig = {
  apiKey: "AIzaSyA5TCpAxv9MAtozIDSnP1MnL21MWX9si8c",
  authDomain: "lordetempus-3be20.firebaseapp.com",
  projectId: "lordetempus-3be20",
  storageBucket: "lordetempus-3be20.appspot.com",
  messagingSenderId: "759824598929",
  appId: "1:759824598929:web:995369b4c7cdab2d777c30",
  measurementId: "G-R710NDR809"
};


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
  }
})



