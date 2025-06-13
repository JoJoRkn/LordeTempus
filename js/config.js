// ==================== CONFIGURAÇÃO LORDE TEMPUS ==================== //
// IMPORTANTE: Este arquivo contém configurações sensíveis
// Em produção, essas informações devem vir de variáveis de ambiente

// Configuração Firebase
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "lordetempus-3be20.firebaseapp.com",
    projectId: "lordetempus-3be20",
    storageBucket: "lordetempus-3be20.firebasestorage.app",
    messagingSenderId: "759824598929",
    appId: "1:759824598929:web:995369b4c76dab2d777c30",
    measurementId: "G-R710NDR8Q9"
};

// Emails de administradores (remover daqui e usar variáveis de ambiente)
export const ADMIN_CONFIG = {
    emails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [
        "admin1@empresa.com", 
        "admin2@empresa.com", 
        "admin3@empresa.com"
    ]
};

// Email especial (remover daqui e usar variável de ambiente)
export const SPECIAL_CONFIG = {
    specialEmail: process.env.SPECIAL_EMAIL || "special@empresa.com"
};

// Função para verificar se o usuário é administrador
export function isAdminEmail(email) {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_CONFIG.emails.some(adminEmail => 
        adminEmail.toLowerCase().trim() === normalizedEmail
    );
}

// Função para obter configuração do Firebase
export function getFirebaseConfig() {
    // Em produção, verificar se todas as configurações necessárias estão presentes
    if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY_HERE") {
        console.warn("⚠️ Configuração do Firebase não definida corretamente. Verifique as variáveis de ambiente.");
    }
    return firebaseConfig;
}

// ❌ FUNÇÃO REMOVIDA POR SEGURANÇA: getAdminEmails
// Esta função foi removida para evitar exposição dos emails de admin
// Use isAdminEmail(email) para verificar se um email específico é admin

// Função para obter email especial
export function getSpecialEmail() {
    return SPECIAL_CONFIG.specialEmail;
}

// Configurações públicas (podem ficar expostas)
export const PUBLIC_CONFIG = {
    projectName: "Lorde Tempus",
    supportEmail: "contato@lordetempus.com",
    discordInvite: "https://discord.gg/BHgQ2XZ89Y",
    version: "2.0.0"
};

console.log("🔧 Sistema de configuração carregado"); 