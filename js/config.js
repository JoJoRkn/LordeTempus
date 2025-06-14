// ==================== CONFIGURAÇÃO LORDE TEMPUS ==================== //
// IMPORTANTE: Este arquivo contém configurações do Firebase
// A chave de API do Firebase pode ser exposta no frontend pois não é secreta

// Configuração Firebase
export const firebaseConfig = {
    apiKey: "AIzaSyA5TCpAxv9MAtozIDSnP1MnL21MWX9si8c",
    authDomain: "lordetempus-3be20.firebaseapp.com",
    projectId: "lordetempus-3be20",
    storageBucket: "lordetempus-3be20.appspot.com",
    messagingSenderId: "759824598929",
    appId: "1:759824598929:web:995369b4c7cdab2d777c30",
    measurementId: "G-R710NDR809"
};

// Configurações de planos
export const PLANOS_CONFIG = {
    gratis: { nome: 'Gratuito', preco: 0, cor: '#6b7280' },
    minuta: { nome: 'Minuta', preco: 29.99, cor: '#3b82f6' },
    minutos: { nome: 'Minutos', preco: 49.99, cor: '#8b5cf6' },
    relogio: { nome: 'Relógio', preco: 79.99, cor: '#10b981', popular: true },
    lorde: { nome: 'Lorde', preco: 119.99, cor: '#f59e0b' },
    familiareal: { nome: 'Família Real', preco: 399.99, cor: '#ec4899' },
    pracadotempo: { nome: 'Praça do Tempo', preco: 599.99, cor: '#ec4899' },
    atemporal: { nome: 'Atemporal', preco: 999.99, cor: '#6366f1' },
    cronomante: { nome: 'Cronomante', preco: 1999.99, cor: '#8b5cf6' },
    administrador: { nome: 'Administrador', preco: 0, cor: '#ef4444' }
};

// URLs importantes
export const URLS = {
    discord: "https://discord.gg/BHgQ2XZ89Y",
    youtube: "https://youtube.com/@lordetempus",
    tiktok: "https://tiktok.com/@lordetempus",
    twitter: "https://twitter.com/lordetempus",
    suporte: "mailto:contato@lordetempus.com"
};

// Função para obter configuração do Firebase
export function getFirebaseConfig() {
    return firebaseConfig;
}

console.log("🔧 Sistema de configuração carregado"); 