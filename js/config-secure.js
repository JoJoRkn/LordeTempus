// ==================== CONFIGURAÇÃO SEGURA LORDE TEMPUS ==================== //
// IMPORTANTE: Este arquivo deve ser protegido em produção
// As informações sensíveis não devem estar acessíveis pelo console

// ⚠️ AVISO DE SEGURANÇA ⚠️
// As configurações abaixo são mantidas para funcionamento do site
// Em um ambiente de produção real, essas informações devem ser:
// 1. Armazenadas no servidor backend
// 2. Acessadas via API autenticada
// 3. Nunca expostas no código frontend

// 🔒 SEGURANÇA: As chaves do Firebase são carregadas via variáveis de ambiente
// Elas devem ser definidas no arquivo .env e nunca logadas no console

const env = import.meta.env;

class SecureConfig {
    constructor() {
        this._isSecure = true;
        this._accessLog = [];
        this._useFallbackConfig = false;
        this._validateEnvironment();
    }

    _validateEnvironment() {
        const requiredVars = [
            'VITE_FIREBASE_API_KEY',
            'VITE_FIREBASE_AUTH_DOMAIN',
            'VITE_FIREBASE_PROJECT_ID',
            'VITE_FIREBASE_STORAGE_BUCKET',
            'VITE_FIREBASE_MESSAGING_SENDER_ID',
            'VITE_FIREBASE_APP_ID',
            'VITE_FIREBASE_MEASUREMENT_ID'
        ];
        const missing = requiredVars.filter(varName => !env[varName]);
        if (missing.length > 0) {
            // Nunca logar valores, apenas avisar o nome das variáveis faltantes
            console.warn('⚠️ Variáveis de ambiente obrigatórias não encontradas:', missing);
            this._useFallbackConfig = true;
        } else {
            this._useFallbackConfig = false;
        }
    }

    // Método para obter configuração do Firebase
    getFirebaseConfig() {
        if (this._useFallbackConfig) {
            throw new Error('Variáveis de ambiente do Firebase não configuradas corretamente.');
        }
        return {
            apiKey: env.VITE_FIREBASE_API_KEY,
            authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: env.VITE_FIREBASE_APP_ID,
            measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
        };
    }

    // Método para verificar se usuário é admin sem expor lista
    isAdminEmail(email) {
        if (!email) return false;
        this._logAccess('isAdminEmail', email);
        const normalizedEmail = email.toLowerCase().trim();
        // ⚠️ TEMPORÁRIO: Lista hardcoded para manter funcionamento
        // TODO: Mover para API backend segura
        const adminEmails = [
            "raiokan3223br@gmail.com",
            "alef.midrei@gmail.com",
            "guigaxpxp@gmail.com",
            "suporte@lordetempus.com"
        ];
        return adminEmails.some(adminEmail =>
            adminEmail.toLowerCase().trim() === normalizedEmail
        );
    }

    // Método para verificar email especial sem expor
    isSpecialEmail(email) {
        if (!email) return false;
        this._logAccess('isSpecialEmail', email);
        const normalizedEmail = email.toLowerCase().trim();
        // ⚠️ TEMPORÁRIO: Email hardcoded para manter funcionamento
        // TODO: Mover para API backend segura
        const specialEmail = "baneagorarito@gmail.com";
        return normalizedEmail === specialEmail.toLowerCase().trim();
    }

    // Método para log de acessos (auditoria)
    _logAccess(method, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            method,
            data: data ? '[PROTEGIDO]' : null,
            stack: new Error().stack.split('\n')[2]?.trim()
        };
        this._accessLog.push(logEntry);
        if (this._accessLog.length > 100) {
            this._accessLog = this._accessLog.slice(-100);
        }
        // Em desenvolvimento, log no console (sem dados sensíveis)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🔍 Acesso à configuração:', method);
        }
    }

    getAccessStats() {
        return {
            totalAccesses: this._accessLog.length,
            lastAccess: this._accessLog[this._accessLog.length - 1]?.timestamp,
            uniqueMethods: [...new Set(this._accessLog.map(log => log.method))]
        };
    }
}

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

// Instância singleton da configuração segura
const secureConfig = new SecureConfig();

// Exportar apenas métodos seguros
export const isAdminEmail = (email) => secureConfig.isAdminEmail(email);
export const getFirebaseConfig = () => secureConfig.getFirebaseConfig();
export const isSpecialEmail = (email) => secureConfig.isSpecialEmail(email);
export const getAccessStats = () => secureConfig.getAccessStats();

console.log("🔒 Configuração segura carregada - Versão " + PUBLIC_CONFIG.version); 