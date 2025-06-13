// ===================================== //
//         MAIN.JS - LORDE TEMPUS       //
//     Funcionalidades Principais       //
// ===================================== //

// Estado global
let notifications = [];
let lastScrollTop = 0;

// ==================== INICIALIZAÇÃO ==================== //
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando Lorde Tempus...');
    
    // Aguardar carregamento do theme manager
    if (window.themeManager) {
        initializePage();
    } else {
        // Aguardar um pouco caso o theme manager ainda não tenha carregado
        setTimeout(initializePage, 100);
    }
});

function initializePage() {
    // Configurar elementos do DOM
    setupDOMElements();
    
    // Configurar navegação
    setupNavigation();
    
    // Configurar scroll effects
    setupScrollEffects();
    
    // Configurar animações
    setupAnimations();
    
    // Configurar outros components
    setupOtherComponents();
    
    // Ativar proteção de elementos importantes
    protectImportantElements();
    
    console.log('✅ Lorde Tempus inicializado com sucesso!');
}

// ==================== ELEMENTOS DOM ==================== //
function setupDOMElements() {
    // Elementos principais
    window.navbar = document.getElementById('navbar');
    window.mobileMenuBtn = document.getElementById('mobileMenuBtn');
    window.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    window.closeMobileMenu = document.getElementById('closeMobileMenu');
    window.backToTopBtn = document.getElementById('backToTop');
    
    console.log('📋 Elementos DOM configurados');
}

// ==================== NAVEGAÇÃO ==================== //
function setupNavigation() {
    // Menu Mobile
    setupMobileMenu();
    
    // Navegação suave
    setupSmoothScrolling();
    
    // Scroll spy
    setupScrollSpy();
    
    console.log('🧭 Navegação configurada');
}

function setupMobileMenu() {
    function toggleMobileMenu() {
        if (window.mobileMenuOverlay) {
            window.mobileMenuOverlay.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // Animar hamburguer
            if (window.mobileMenuBtn) {
                window.mobileMenuBtn.classList.toggle('active');
            }
        }
    }

    function closeMobileMenuFunc() {
        if (window.mobileMenuOverlay) {
            window.mobileMenuOverlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
        if (window.mobileMenuBtn) {
            window.mobileMenuBtn.classList.remove('active');
        }
    }

    // Event listeners do menu mobile
    window.mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    window.closeMobileMenu?.addEventListener('click', closeMobileMenuFunc);

    // Fechar menu ao clicar nos links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenuFunc);
    });

    // Fechar menu ao clicar no overlay
    window.mobileMenuOverlay?.addEventListener('click', function(e) {
        if (e.target === window.mobileMenuOverlay) {
            closeMobileMenuFunc();
        }
    });
}

function setupSmoothScrolling() {
    // Links de navegação suave
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#top') return;
            
        e.preventDefault();
            const target = document.querySelector(href);
            
        if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
            });
        }
    });
});
}

function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    function updateActiveNav() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNav);
}

// ==================== SCROLL EFFECTS ==================== //
function setupScrollEffects() {
    window.addEventListener('scroll', handleScroll);
    
    // Back to top button
    window.backToTopBtn?.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Navbar hide/show
    if (window.navbar) {
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            window.navbar.style.transform = 'translateY(-100%)';
        } else {
            window.navbar.style.transform = 'translateY(0)';
        }
        
        // Navbar background
        if (scrollTop > 50) {
            window.navbar.classList.add('scrolled');
        } else {
            window.navbar.classList.remove('scrolled');
        }
    }

    // Back to top button
    if (window.backToTopBtn) {
        if (scrollTop > 500) {
            window.backToTopBtn.classList.add('visible');
        } else {
            window.backToTopBtn.classList.remove('visible');
        }
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

// ==================== ANIMAÇÕES ==================== //
function setupAnimations() {
    // Intersection Observer para animações
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

    // Observar elementos com animações
    document.querySelectorAll('.animate-fadeInUp, .animate-slideInLeft, .animate-slideInRight, .plan-card').forEach(el => {
        observer.observe(el);
});

    console.log('🎬 Animações configuradas');
}

// ==================== OUTROS COMPONENTES ==================== //
function setupOtherComponents() {
    // Tooltips
    setupTooltips();
    
    // Loading states
    setupLoadingStates();
    
    // Form enhancements
    setupFormEnhancements();
    
    console.log('🔧 Componentes adicionais configurados');
}

function setupTooltips() {
    // Implementação básica de tooltips
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip absolute bg-gray-800 text-white px-2 py-1 rounded text-sm z-50';
            tooltip.textContent = this.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
        });
        
        element.addEventListener('mouseleave', function() {
            document.querySelectorAll('.tooltip').forEach(tooltip => tooltip.remove());
        });
    });
}

function setupLoadingStates() {
    // Adicionar estados de loading para botões
    document.querySelectorAll('[data-loading]').forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('loading')) return;
            
            this.classList.add('loading');
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Carregando...';
            
            // Remover loading após tempo determinado ou quando necessário
            setTimeout(() => {
                this.classList.remove('loading');
                this.innerHTML = originalText;
            }, 2000);
        });
    });
}

function setupFormEnhancements() {
    // Melhorias para formulários
    document.querySelectorAll('input, textarea, select').forEach(field => {
        // Adicionar classes de foco
        field.addEventListener('focus', function() {
            this.closest('.form-group')?.classList.add('focused');
        });
        
        field.addEventListener('blur', function() {
            this.closest('.form-group')?.classList.remove('focused');
            });
        
        // Validação visual básica
        field.addEventListener('input', function() {
            if (this.validity.valid) {
                this.classList.remove('error');
                this.classList.add('valid');
            } else {
                this.classList.remove('valid');
                this.classList.add('error');
        }
        });
    });
}

// ==================== SISTEMA DE NOTIFICAÇÕES ==================== //
function showNotification(message, type = 'info') {
    const notification = createNotificationElement(message, type);
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remover
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
            notifications = notifications.filter(n => n !== notification);
        }, 300);
    }, 5000);
    
    // Adicionar à lista
    notifications.push(notification);

    // Limitar número de notificações
    if (notifications.length > 3) {
        const oldest = notifications.shift();
        oldest?.remove();
    }
}

function createNotificationElement(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="notification-icon ${iconMap[type] || iconMap.info}"></i>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close" aria-label="Fechar notificação">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Fechar ao clicar no X
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 300);
    });
    
    return notification;
}

// ==================== UTILITÁRIOS ==================== //
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==================== DISPONIBILIZAR GLOBALMENTE ==================== //
window.showNotification = showNotification;
window.safeAnimateNumber = safeAnimateNumber;
window.protectImportantElements = protectImportantElements;
window.debounce = debounce;
window.throttle = throttle;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.isValidEmail = isValidEmail;

// ==================== LISTENER PARA TEMA ==================== //
document.addEventListener('themeChanged', function(e) {
    console.log('🎨 Tema alterado para:', e.detail.theme);

    // Aqui você pode adicionar lógica específica quando o tema muda
    // Por exemplo, atualizar gráficos, mapas, etc.
});

console.log('🚀 Main.js do Lorde Tempus carregado com sucesso!');

// ==================== FUNÇÃO SEGURA DE ANIMAÇÃO DE NÚMEROS ==================== //
function safeAnimateNumber(element, targetValue, options = {}) {
    if (!element) return;
    
    const {
        duration = 2000,
        preserveFormat = true,
        onlyNumbers = false
    } = options;
    
    const originalText = element.textContent.trim();
    
    // Se preserveFormat for true, verificar se é seguro animar
    if (preserveFormat) {
        // Não animar se contém caracteres especiais que não sejam números, + ou espaços
        if (!/^[\d\s\+]*$/.test(originalText)) {
            console.log('🛡️ Proteção: Elemento com formatação especial não será animado:', originalText);
        return;
    }
    }
    
    const currentValue = parseInt(originalText.replace(/\D/g, '')) || 0;
    const target = parseInt(targetValue) || 0;
    
    if (isNaN(target) || target === currentValue) return;
    
    const startTime = Date.now();
    const increment = target > currentValue ? 1 : -1;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentDisplay = Math.round(currentValue + (target - currentValue) * progress);
        
        // Preservar formato original se necessário
        if (originalText.includes('+')) {
            element.textContent = currentDisplay + '+';
        } else {
            element.textContent = currentDisplay.toString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Proteção global contra alteração indevida de elementos importantes
function protectImportantElements() {
    const protectedSelectors = [
        '.hero-title',
        '.hero-subtitle', 
        '.section-title',
        '.section-subtitle',
        '.text-gradient',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ];
    
    protectedSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            const originalContent = element.textContent;
            
            // Criar um MutationObserver para cada elemento protegido
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // Se o conteúdo foi alterado de forma suspeita
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const newContent = element.textContent;
                        
                        // Se virou vazio ou só números quando antes tinha texto
                        if ((!newContent.trim() || /^\d+$/.test(newContent.trim())) && 
                            originalContent.trim() && 
                            !/^\d+$/.test(originalContent.trim())) {
                            
                            console.log('🛡️ Proteção: Restaurando conteúdo de elemento importante:', selector);
                            element.textContent = originalContent;
            }
        }
    });
            });
            
            observer.observe(element, {
                childList: true,
                characterData: true,
                subtree: true
            });
        });
    });
} 