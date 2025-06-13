// ===================================== //
//      THEME MANAGER - LORDE TEMPUS    //
//    Sistema de Tema Claro/Escuro      //
// ===================================== //

class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.currentTheme = null;
        this.storageKey = 'lorde-tempus-theme';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.init();
    }

    init() {
        // Carregar tema salvo ou detectar preferência do sistema
        this.loadTheme();
        
        // Configurar listeners
        this.setupEventListeners();
        
        // Observar mudanças na preferência do sistema
        this.mediaQuery.addListener(() => this.handleSystemThemeChange());
        
        console.log('🎨 Theme Manager inicializado:', this.currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            // Detectar preferência do sistema
            this.currentTheme = this.mediaQuery.matches ? 'dark' : 'light';
        }
        
        this.applyTheme(this.currentTheme);
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            this.html.classList.add('dark');
            this.currentTheme = 'dark';
        } else {
            this.html.classList.remove('dark');
            this.currentTheme = 'light';
        }
        
        // Salvar preferência
        localStorage.setItem(this.storageKey, this.currentTheme);
        
        // Atualizar ícones
        this.updateThemeIcons();
        
        // Disparar evento customizado
        this.dispatchThemeChangeEvent();
        
        console.log('🎨 Tema aplicado:', this.currentTheme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        
        // Adicionar classe de animação aos botões
        const themeButtons = document.querySelectorAll('#themeToggle, #themeToggleMobile, [data-theme-toggle]');
        themeButtons.forEach(button => {
            button.classList.add('toggling');
            setTimeout(() => button.classList.remove('toggling'), 600);
        });
        
        // Mostrar notificação visual
        this.showThemeChangeNotification(newTheme);
        
        this.applyTheme(newTheme);
    }

    updateThemeIcons() {
        // Ícones no desktop
        const moonIcons = document.querySelectorAll('.theme-icon-moon');
        const sunIcons = document.querySelectorAll('.theme-icon-sun');
        
        moonIcons.forEach(icon => {
            if (this.currentTheme === 'dark') {
                icon.classList.add('hidden');
            } else {
                icon.classList.remove('hidden');
            }
        });
        
        sunIcons.forEach(icon => {
            if (this.currentTheme === 'dark') {
                icon.classList.remove('hidden');
            } else {
                icon.classList.add('hidden');
            }
        });

        // Ícones alternativos (sem classes específicas)
        const themeButtons = document.querySelectorAll('[data-theme-toggle]');
        themeButtons.forEach(button => {
            const moonIcon = button.querySelector('.fa-moon');
            const sunIcon = button.querySelector('.fa-sun');
            
            if (moonIcon && sunIcon) {
                if (this.currentTheme === 'dark') {
                    moonIcon.classList.add('hidden');
                    sunIcon.classList.remove('hidden');
                } else {
                    moonIcon.classList.remove('hidden');
                    sunIcon.classList.add('hidden');
                }
            }
        });

        // Atualizar texto dos botões mobile
        const mobileThemeButtons = document.querySelectorAll('#themeToggleMobile, .mobile-theme-toggle');
        mobileThemeButtons.forEach(button => {
            const textSpan = button.querySelector('.theme-text');
            const indicator = button.querySelector('.theme-indicator');
            
            if (textSpan) {
                textSpan.textContent = this.currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
            }
            
            if (indicator) {
                indicator.textContent = this.currentTheme === 'dark' ? 'ON' : 'OFF';
                indicator.style.background = this.currentTheme === 'dark' ? 'var(--primary)' : '#6b7280';
            }
        });
    }

    setupEventListeners() {
        // Botões de toggle de tema
        const themeToggleButtons = document.querySelectorAll(
            '#themeToggle, #themeToggleMobile, [data-theme-toggle]'
        );
        
        themeToggleButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleTheme();
                });
            }
        });

        // Atalho de teclado (Ctrl + Shift + D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
                this.showThemeNotification();
            }
        });
    }

    handleSystemThemeChange() {
        // Só muda automaticamente se o usuário não tem preferência salva
        const savedTheme = localStorage.getItem(this.storageKey);
        if (!savedTheme) {
            const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
            this.applyTheme(systemTheme);
        }
    }

    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        });
        document.dispatchEvent(event);
    }

    showThemeNotification() {
        const themeName = this.currentTheme === 'dark' ? 'Escuro' : 'Claro';
        const message = `Tema ${themeName} ativado`;
        
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, 'info');
        } else {
            this.createSimpleNotification(message);
        }
    }

    showThemeChangeNotification(newTheme) {
        const themeName = newTheme === 'dark' ? 'Escuro' : 'Claro';
        const icon = newTheme === 'dark' ? '🌙' : '☀️';
        const message = `${icon} Tema ${themeName} ativado`;
        
        if (window.showNotification && typeof window.showNotification === 'function') {
            window.showNotification(message, 'info');
        } else {
            this.createSimpleNotification(message);
        }
    }

    createSimpleNotification(message) {
        // Remover notificação anterior se existir
        const existingNotification = document.querySelector('.theme-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'theme-notification fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300';
        notification.textContent = message;
        notification.style.transform = 'translateX(100%)';
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remover após 2 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Métodos públicos para integração
    getTheme() {
        return this.currentTheme;
    }

    setTheme(theme) {
        if (theme === 'dark' || theme === 'light') {
            this.applyTheme(theme);
        }
    }

    isDark() {
        return this.currentTheme === 'dark';
    }

    isLight() {
        return this.currentTheme === 'light';
    }

    // Método para reset (voltar para preferência do sistema)
    resetToSystem() {
        localStorage.removeItem(this.storageKey);
        const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
        this.applyTheme(systemTheme);
        this.showThemeNotification();
    }
}

// Inicializar gerenciador de tema
const themeManager = new ThemeManager();

// Disponibilizar globalmente
window.themeManager = themeManager;

// Para compatibilidade com código existente
window.toggleTheme = () => themeManager.toggleTheme();

console.log('🎨 Theme Manager do Lorde Tempus carregado com sucesso!'); 