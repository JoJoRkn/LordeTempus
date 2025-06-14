// ==================== CONFIGURAÇÃO SEGURA LORDE TEMPUS ==================== //
// IMPORTANTE: Este arquivo deve ser protegido em produção
// As informações sensíveis não devem estar acessíveis pelo console

// ⚠️ AVISO DE SEGURANÇA ⚠️
// As configurações abaixo são mantidas para funcionamento do site
// Em um ambiente de produção real, essas informações devem ser:
// 1. Armazenadas no servidor backend
// 2. Acessadas via API autenticada
// 3. Nunca expostas no código frontend

// 🔒 SEGURANÇA: As chaves do Firebase são configuradas diretamente
// A chave de API do Firebase pode ser exposta no frontend pois não é secreta

class SecureConfig {
    constructor() {
        this._isSecure = true;
        this._accessLog = [];
    }

    // Método para obter configuração do Firebase
    getFirebaseConfig() {
        return {
            apiKey: "AIzaSyA5TCpAxv9MAtozIDSnP1MnL21MWX9si8c",
            authDomain: "lordetempus-3be20.firebaseapp.com",
            projectId: "lordetempus-3be20",
            storageBucket: "lordetempus-3be20.appspot.com",
            messagingSenderId: "759824598929",
            appId: "1:759824598929:web:995369b4c7cdab2d777c30",
            measurementId: "G-R710NDR809"
        };
    }

    // Verificação de emails administrativos
    isAdminEmail(email) {
        if (!email) return false;
        const adminEmails = [
            "raiokan3223br@gmail.com",
            "alef.midrei@gmail.com", 
            "guigaxpxp@gmail.com",
            "suporte@lordetempus.com"
        ];
        return adminEmails.includes(email.toLowerCase());
    }

    // Verificação de email especial
    isSpecialEmail(email) {
        if (!email) return false;
        return email.toLowerCase() === "baneagorarito@gmail.com";
    }

    // Método para obter configurações de pagamento (placeholder)
    getPaymentConfig() {
        return {
            mercadoPago: {
                publicKey: "TEST-your-public-key-here",
                accessToken: "TEST-your-access-token-here"
            },
            stripe: {
                publicKey: "pk_test_your-stripe-public-key-here"
            }
        };
    }

    // Método para obter configurações de email (placeholder)
    getEmailConfig() {
        return {
            emailJS: {
                serviceId: "your-emailjs-service-id",
                templateId: "your-emailjs-template-id",
                publicKey: "your-emailjs-public-key"
            }
        };
    }

    // Método para obter configurações de analytics (placeholder)
    getAnalyticsConfig() {
        return {
            googleAnalytics: {
                measurementId: "G-R710NDR809"
            }
        };
    }

    // Método para verificar se está em modo de desenvolvimento
    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('github.io');
    }

    // Método para obter URL base da API
    getApiBaseUrl() {
        return this.isDevelopment() 
            ? 'http://localhost:3000/api'
            : 'https://api.lordetempus.com';
    }
}

// Instância única da configuração segura
const secureConfig = new SecureConfig();

// Configurações públicas (podem ficar expostas)
export const PUBLIC_CONFIG = {
    projectName: "Lorde Tempus",
    supportEmail: "contato@lordetempus.com",
    discordInvite: "https://discord.gg/BHgQ2XZ89Y",
    version: "2.0.0",
    features: {
        authentication: true,
        campaigns: true,
        profiles: true,
        messaging: true
    }
};

// Exportações principais
export const getFirebaseConfig = () => secureConfig.getFirebaseConfig();
export const isAdminEmail = (email) => secureConfig.isAdminEmail(email);
export const isSpecialEmail = (email) => secureConfig.isSpecialEmail(email);
export const getPaymentConfig = () => secureConfig.getPaymentConfig();
export const getEmailConfig = () => secureConfig.getEmailConfig();
export const getAnalyticsConfig = () => secureConfig.getAnalyticsConfig();
export const isDevelopment = () => secureConfig.isDevelopment();
export const getApiBaseUrl = () => secureConfig.getApiBaseUrl();

console.log("🔒 Configuração segura carregada - Versão " + PUBLIC_CONFIG.version); 